require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createServer } = require('http');
const { Server } = require('socket.io');

const pool = require('./src/config/database');
const User = require('./src/models/User');
const Incident = require('./src/models/Incident');
const Notification = require('./src/models/Notification');

// Routes
const authRoutes = require('./src/routes/auth');
const usersRoutes = require('./src/routes/users');
const incidentsRoutes = require('./src/routes/incidents');
const notificationsRoutes = require('./src/routes/notifications');
const adminRoutes = require('./src/routes/admin');
const analyticsRoutes = require('./src/routes/analytics');

// App & HTTP server
const app = express();
const httpServer = createServer(app);

// Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log(`📡 WebSocket client connected: ${socket.id}`);

  // Client joins their user room
  socket.on('join', (userId) => {
    socket.join(`user:${userId}`);
  });

  // Client joins specific job chat room
  socket.on('join_job', (jobId) => {
    socket.join(`job:${jobId}`);
    console.log(`🔗 Socket ${socket.id} joined job room: job:${jobId}`);
  });

  // Real-time Chat message — broadcast to ALL in the job room (including sender for cross-tab support)
  socket.on('send_message', (data) => {
    const roomId = `job:${data.jobId}`;
    // Emit to everyone in the job room EXCEPT the sender (they already added it optimistically)
    socket.to(roomId).emit('new_message', data);
    // Also global broadcast for any listener not in the room (fallback)
    socket.broadcast.emit('new_message', data);
    console.log(`💬 Message in room ${roomId}: "${data.text?.slice(0, 40)}"`);
  });

  // New Citizen Job Request Dispatch
  socket.on('dispatch_job', (jobData) => {
    console.log(`🚨 New Job Dispatched: ${jobData.title || jobData.id}`);
    socket.broadcast.emit('incoming_job_broadcast', jobData);
  });

  // Job Stage Status Update (EN_ROUTE, IN_PROGRESS, COMPLETED)
  socket.on('update_stage', async (data) => {
    console.log(`📍 Job ${data.jobId} advanced to ${data.stage}`);
    io.emit('job_stage_changed', data);
    try {
      const rawId = String(data.jobId || '').replace(/\D/g, '');
      if (rawId) {
        const dbStatus = data.stage === 'COMPLETED' ? 'resolved' : data.stage === 'CANCELLED' ? 'rejected' : 'in_progress';
        await pool.query(
          `UPDATE incidents SET stage = $1, status = $2, updated_at = NOW() WHERE id = $3`,
          [String(data.stage), String(dbStatus), Number(rawId)]
        );
      }
    } catch (e) {
      console.warn('Socket stage DB sync notice:', e.message);
    }
  });

  // Quotation Price Update / Renegotiation
  socket.on('update_quotation', async (data) => {
    console.log(`🏷️ Quotation for Job ${data.jobId} updated to Rs. ${data.amountLKR}`);
    io.emit('quotation_updated', data);
    try {
      const rawId = String(data.jobId || '').replace(/\D/g, '');
      if (rawId && data.amountLKR) {
        await pool.query(
          `UPDATE incidents SET cost_lkr = $1, stage = 'QUOTED', updated_at = NOW() WHERE id = $2`,
          [Number(data.amountLKR), rawId]
        );
      }
    } catch (e) {
      console.warn('Socket quote DB sync notice:', e.message);
    }
  });

  // Live GPS Telemetry for moving worker on map
  socket.on('worker_gps_move', (gpsData) => {
    io.emit('gps_telemetry_stream', gpsData);
  });

  socket.on('disconnect', () => {
    console.log(`📡 WebSocket client disconnected: ${socket.id}`);
  });
});

// Attach io instance to app for use in controllers
app.set('io', io);

const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// User Profile Retrieval API (Public/Direct by user ID)
app.get('/api/users/profile/:id', async (req, res) => {
  try {
    const rawId = String(req.params.id || '').replace(/\D/g, '');
    if (!rawId) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }
    const { rows } = await pool.query(`
      SELECT 
        u.id, u.name AS "fullName", u.email, u.phone, u.role,
        u.profile_picture AS "profilePicture",
        u.home_address AS "homeAddress",
        u.saved_lat AS "savedLat",
        u.saved_lng AS "savedLng",
        u.birthday, u.gender,
        COALESCE(u.language, 'English') AS language,
        u.locality,
        u.district,
        pp.trade, pp.daily_rate AS "dailyRate", pp.hourly_rate AS "hourlyRate",
        pp.experience_years AS "experienceYears", pp.vehicle_type AS "vehicleType",
        pp.plate_number AS "plateNumber",
        COALESCE(pp.verified, false) AS "verified",
        COALESCE(pp.verification_status, 'PENDING') AS "verificationStatus",
        pp.nic_number AS "nicNumber",
        pp.rejection_reason AS "rejectionReason"
      FROM users u
      LEFT JOIN provider_profiles pp ON u.id = pp.user_id
      WHERE u.id = $1
    `, [rawId]);

    if (!rows[0]) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// User Profile Update API
app.patch('/api/users/profile/:id', async (req, res) => {
  try {
    const rawId = String(req.params.id || '').replace(/\D/g, '');
    const {
      fullName, phone, profilePicture, homeAddress,
      savedLat, savedLng, birthday, gender, language,
      locality, district, trade, dailyRate, hourlyRate, vehicleType, plateNumber,
      nicNumber, nicDocumentUrl, experienceYears
    } = req.body;

    let finalProfilePic = null;
    let shouldUpdatePhoto = false;

    if (profilePicture !== undefined) {
      shouldUpdatePhoto = true;
      if (profilePicture && typeof profilePicture === 'string' && profilePicture.startsWith('data:image/')) {
        const matches = profilePicture.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const rawExt = matches[1].split('/')[1] || 'jpg';
          const ext = rawExt.includes('png') ? 'png' : rawExt.includes('webp') ? 'webp' : 'jpg';
          const buffer = Buffer.from(matches[2], 'base64');
          const filename = `avatar-${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
          const filePath = path.join(uploadsDir, filename);
          fs.writeFileSync(filePath, buffer);
          finalProfilePic = `${req.protocol}://${req.get('host')}/uploads/${filename}`;
        }
      } else if (profilePicture && typeof profilePicture === 'string' && profilePicture.trim() !== '') {
        finalProfilePic = profilePicture.trim();
      } else {
        finalProfilePic = null;
      }
    }

    await pool.query(`
      UPDATE users SET
        name = COALESCE($1, name),
        phone = COALESCE($2, phone),
        profile_picture = CASE WHEN $13::boolean THEN $3 ELSE profile_picture END,
        home_address = COALESCE($4, home_address),
        saved_lat = COALESCE($5, saved_lat),
        saved_lng = COALESCE($6, saved_lng),
        birthday = COALESCE($7, birthday),
        gender = COALESCE($8, gender),
        language = COALESCE($9, language),
        locality = COALESCE($10, locality),
        district = COALESCE($11, district),
        updated_at = NOW()
      WHERE id = $12
    `, [
      fullName || null, phone || null, finalProfilePic, homeAddress || null,
      savedLat || null, savedLng || null, birthday || null, gender || null,
      language || null, locality || null, district || null, rawId, shouldUpdatePhoto
    ]);

    let finalNicDoc = nicDocumentUrl || null;
    if (nicDocumentUrl && typeof nicDocumentUrl === 'string' && nicDocumentUrl.startsWith('data:image/')) {
      const matches = nicDocumentUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const rawExt = matches[1].split('/')[1] || 'jpg';
        const ext = rawExt.includes('png') ? 'png' : rawExt.includes('webp') ? 'webp' : 'jpg';
        const buffer = Buffer.from(matches[2], 'base64');
        const filename = `nic-${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
        const filePath = path.join(uploadsDir, filename);
        fs.writeFileSync(filePath, buffer);
        finalNicDoc = `${req.protocol}://${req.get('host')}/uploads/${filename}`;
      }
    }

    if (trade || dailyRate || hourlyRate || vehicleType || plateNumber || nicNumber || finalNicDoc) {
      await pool.query(`
        INSERT INTO provider_profiles (user_id, trade, daily_rate, hourly_rate, vehicle_type, plate_number, nic_number, nic_document_url, experience_years)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (user_id) DO UPDATE SET
          trade = COALESCE($2, provider_profiles.trade),
          daily_rate = COALESCE($3, provider_profiles.daily_rate),
          hourly_rate = COALESCE($4, provider_profiles.hourly_rate),
          vehicle_type = COALESCE($5, provider_profiles.vehicle_type),
          plate_number = COALESCE($6, provider_profiles.plate_number),
          nic_number = COALESCE($7, provider_profiles.nic_number),
          nic_document_url = COALESCE($8, provider_profiles.nic_document_url),
          experience_years = COALESCE($9, provider_profiles.experience_years)
      `, [
        rawId,
        trade || 'Technician',
        dailyRate || 3500,
        hourlyRate || 600,
        vehicleType || 'Service Vehicle',
        plateNumber || 'WP-CAB-8821',
        nicNumber || null,
        finalNicDoc || null,
        experienceYears || 5
      ]);
    }

    res.json({ success: true, profilePicture: finalProfilePic, message: 'Profile updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── ADMIN LIVE WORKER VERIFICATION, HAZARDS & ANALYTICS APIs ────────────
app.get('/api/admin/workers', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        u.id,
        u.name AS "fullName",
        u.email,
        u.phone,
        u.locality,
        u.district,
        u.created_at AS "submittedAt",
        pp.trade,
        pp.experience_years AS "experienceYears",
        pp.daily_rate AS "dailyRate",
        pp.hourly_rate AS "hourlyRate",
        pp.vehicle_type AS "vehicleType",
        pp.plate_number AS "plateNumber",
        pp.nic_number AS "nicNumber",
        pp.nic_document_url AS "nicFrontUrl",
        COALESCE(pp.verification_status, CASE WHEN pp.verified = true THEN 'APPROVED' ELSE 'PENDING' END) AS status,
        pp.rejection_reason AS "rejectionReason"
      FROM users u
      LEFT JOIN provider_profiles pp ON u.id = pp.user_id
      WHERE u.role = 'service_provider'
      ORDER BY u.created_at DESC
    `);

    const mapped = rows.map((r) => ({
      id: `APP-${r.id}`,
      workerId: `W-${r.id}`,
      fullName: r.fullName,
      trade: r.trade || 'Verified Specialist',
      category: (r.trade?.toLowerCase().includes('paint') ? 'painting' : r.trade?.toLowerCase().includes('tree') ? 'tree-cutting' : r.trade?.toLowerCase().includes('plumb') ? 'plumbing' : 'odd_jobs'),
      district: r.district || 'Colombo',
      locality: r.locality || 'Colombo Urban',
      experienceYears: Number(r.experienceYears || 5),
      phone: r.phone || 'N/A',
      vehicleType: r.vehicleType,
      plateNumber: r.plateNumber,
      nicNumber: r.nicNumber || 'N/A',
      nicFrontUrl: r.nicFrontUrl || null,
      status: r.status || 'PENDING',
      submittedAt: r.submittedAt || new Date().toISOString(),
      rejectionReason: r.rejectionReason,
    }));

    res.json({ success: true, data: mapped });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.patch('/api/admin/workers/:id/verify', async (req, res) => {
  try {
    const rawId = String(req.params.id || '').replace(/\D/g, '');
    const { status, rejectionReason } = req.body;
    const isApproved = status === 'APPROVED';

    const { rows: existing } = await pool.query('SELECT id FROM provider_profiles WHERE user_id = $1', [rawId]);
    if (existing.length > 0) {
      await pool.query(`
        UPDATE provider_profiles SET
          verified = $1,
          verification_status = $2,
          rejection_reason = $3
        WHERE user_id = $4
      `, [isApproved, status, rejectionReason || null, rawId]);
    } else {
      await pool.query(`
        INSERT INTO provider_profiles (user_id, verified, verification_status, rejection_reason, trade, experience_years, daily_rate, hourly_rate)
        VALUES ($1, $2, $3, $4, 'Verified Specialist', 5, 3500, 583)
      `, [rawId, isApproved, status, rejectionReason || null]);
    }

    io.emit('worker_verification_updated', {
      userId: rawId,
      verified: isApproved,
      status,
      rejectionReason: rejectionReason || null,
    });

    res.json({ success: true, message: `Worker application ${status.toLowerCase()} successfully.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/admin/hazards', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        i.id,
        'HAZ-' || i.id AS "hazardId",
        i.title,
        i.category,
        i.description,
        i.priority,
        i.status,
        i.location_text,
        i.latitude,
        i.longitude,
        i.created_at AS "reportedAt",
        COALESCE(u.name, 'Citizen') AS "reporterName"
      FROM incidents i
      LEFT JOIN users u ON i.reported_by = u.id
      WHERE i.stage != 'CANCELLED' AND i.status != 'rejected'
      ORDER BY i.created_at DESC
    `);

    const mapped = rows.map((r) => ({
      id: `HAZ-${r.id}`,
      title: r.title,
      category: r.category === 'waste' ? 'Garbage Overflow & Waste Dump' : r.category === 'water' ? 'Broken Pipe & Main Flooding' : r.category === 'electricity' ? 'Dangling Live Wire & Sparking' : r.category === 'road' ? 'Road Craters & Manhole Collapse' : r.title,
      district: r.location_text?.split(',')?.[1]?.trim() || 'Colombo',
      locality: r.location_text?.split(',')?.[0]?.trim() || 'Colombo Urban',
      urgency: r.priority === 'critical' ? 'CRITICAL' : r.priority === 'high' ? 'HIGH' : 'MEDIUM',
      reportedBy: r.reporterName,
      reportedAt: r.reportedAt || new Date().toISOString(),
      status: r.status === 'resolved' ? 'RESOLVED' : r.status === 'in_progress' ? 'DISPATCHED' : 'OPEN',
      description: r.description || 'Civic infrastructure anomaly reported by citizen.',
    }));

    res.json({ success: true, data: mapped });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/admin/analytics', async (req, res) => {
  try {
    const { rows: distRows } = await pool.query(`
      SELECT
        COALESCE(NULLIF(SPLIT_PART(location_text, ',', 2), ''), 'Colombo') AS district,
        COUNT(*) AS "totalIncidents",
        COUNT(*) FILTER (WHERE status != 'resolved' AND status != 'rejected' AND stage != 'CANCELLED') AS "activeJobs",
        COUNT(*) FILTER (WHERE status = 'resolved') AS "resolvedJobs"
      FROM incidents
      WHERE stage != 'CANCELLED' AND status != 'rejected'
      GROUP BY SPLIT_PART(location_text, ',', 2)
    `);

    const { rows: workerDistRows } = await pool.query(`
      SELECT
        COALESCE(u.district, 'Colombo') AS district,
        COUNT(*) FILTER (WHERE pp.verified = true) AS "verifiedWorkers",
        COUNT(*) AS "totalWorkers"
      FROM users u
      JOIN provider_profiles pp ON u.id = pp.user_id
      GROUP BY u.district
    `);

    const defaultDistricts = [
      { district: "Colombo", province: "Western" },
      { district: "Kandy", province: "Central" },
      { district: "Gampaha", province: "Western" },
      { district: "Galle", province: "Southern" },
      { district: "Kurunegala", province: "North Western" },
      { district: "Matara", province: "Southern" },
      { district: "Kalutara", province: "Western" },
      { district: "Jaffna", province: "Northern" }
    ];

    const result = defaultDistricts.map((d) => {
      const inc = distRows.find((r) => r.district.trim().toLowerCase() === d.district.toLowerCase()) || {};
      const wrk = workerDistRows.find((r) => r.district.trim().toLowerCase() === d.district.toLowerCase()) || {};
      const active = Number(inc.activeJobs || 0);
      const resolved = Number(inc.resolvedJobs || 0);
      const total = active + resolved;
      const rate = total > 0 ? Number(((resolved / total) * 100).toFixed(1)) : 100.0;

      return {
        district: d.district,
        province: d.province,
        activeJobs: active,
        verifiedWorkers: Number(wrk.verifiedWorkers || 0),
        totalSettledLKR: resolved * 3500,
        avgResponseMins: 15,
        hazardResolutionRate: rate,
      };
    });

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/analytics/platform-stats', async (req, res) => {
  try {
    const { rows: userCounts } = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE role = 'citizen') AS "totalCitizens",
        COUNT(*) FILTER (WHERE role = 'service_provider') AS "totalWorkers",
        COUNT(*) FILTER (WHERE role = 'service_provider' AND id IN (SELECT user_id FROM provider_profiles WHERE verified = true)) AS "verifiedWorkers"
      FROM users
    `);

    const { rows: incidentCounts } = await pool.query(`
      SELECT
        COUNT(*) AS "totalIncidents",
        COUNT(*) FILTER (WHERE status = 'resolved') AS "totalCompletedJobs",
        COUNT(*) FILTER (WHERE status != 'resolved' AND status != 'rejected') AS "activeJobs"
      FROM incidents
    `);

    const { rows: reviewCounts } = await pool.query(`
      SELECT
        COUNT(*) AS "totalReviews",
        COALESCE(AVG(rating), 5.0) AS "avgRating"
      FROM reviews
    `);

    const totalCitizens = Number(userCounts[0]?.totalCitizens || 0);
    const totalWorkers = Number(userCounts[0]?.totalWorkers || 0);
    const totalCompletedJobs = Number(incidentCounts[0]?.totalCompletedJobs || 0);
    const totalReviews = Number(reviewCounts[0]?.totalReviews || 0);
    const totalPaymentsLKR = totalCompletedJobs * 3500;

    res.json({
      success: true,
      data: {
        totalCitizens,
        totalWorkers,
        totalCompletedJobs,
        totalReviews,
        totalPaymentsLKR,
        avgRating: Number(Number(reviewCounts[0]?.avgRating || 5).toFixed(1)),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── AI GEO-DISPATCH SPATIAL PROXIMITY & COMPOSITE RANKING API ────────────
app.post('/api/ai/geo-dispatch', async (req, res) => {
  try {
    const { incident_lat = 7.2906, incident_lng = 80.6337, required_category = 'tree-cutting', max_radius_km = 35.0 } = req.body;

    const { rows: providers } = await pool.query(`
      SELECT 
        u.id, 
        u.name, 
        u.phone,
        u.locality, 
        u.district,
        pp.trade,
        COALESCE(pp.daily_rate, 3500) AS "dailyRate",
        COALESCE(pp.verified, true) AS verified,
        COALESCE(
          (SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews r WHERE r.worker_id = u.id OR r.incident_id IN (SELECT id FROM incidents WHERE assigned_to = u.id)),
          5.0
        ) AS rating
      FROM users u
      LEFT JOIN provider_profiles pp ON u.id = pp.user_id
      WHERE u.role = 'service_provider'
    `);

    // Coordinate mapping for Sri Lankan localities & districts
    const SL_COORDS = {
      'Heerassagala': { lat: 7.2715, lng: 80.6120 },
      'Kandy': { lat: 7.2906, lng: 80.6337 },
      'Kandy twown': { lat: 7.2906, lng: 80.6337 },
      'Kandy Town': { lat: 7.2906, lng: 80.6337 },
      'Kadugannawa': { lat: 7.2562, lng: 80.5218 },
      'Peradeniya': { lat: 7.2600, lng: 80.5950 },
      'Katugastota': { lat: 7.3242, lng: 80.6200 },
      'Gampola': { lat: 7.1644, lng: 80.5764 },
      'Kundasale': { lat: 7.2880, lng: 80.6860 },
      'Matale': { lat: 7.4675, lng: 80.6234 },
      'Nuwara Eliya': { lat: 6.9497, lng: 80.7891 },
      'Colombo': { lat: 6.9271, lng: 79.8612 },
      'Maharagama': { lat: 6.8480, lng: 79.9260 },
      'Nugegoda': { lat: 6.8649, lng: 79.8997 },
      'Dehiwala': { lat: 6.8511, lng: 79.8659 },
      'Mount Lavinia': { lat: 6.8380, lng: 79.8650 },
      'Moratuwa': { lat: 6.7730, lng: 79.8816 },
      'Kottawa': { lat: 6.8410, lng: 79.9650 },
      'Homagama': { lat: 6.8420, lng: 80.0030 },
      'Battaramulla': { lat: 6.8980, lng: 79.9180 },
      'Gampaha': { lat: 7.0840, lng: 79.9943 },
      'Negombo': { lat: 7.2008, lng: 79.8736 },
      'Kelaniya': { lat: 6.9550, lng: 79.9220 },
      'Kalutara': { lat: 6.5854, lng: 79.9607 },
      'Panadura': { lat: 6.7130, lng: 79.9070 },
      'Galle': { lat: 6.0535, lng: 80.2210 },
      'Matara': { lat: 5.9549, lng: 80.5550 },
      'Kurunegala': { lat: 7.4863, lng: 80.3623 },
      'Anuradhapura': { lat: 8.3114, lng: 80.4037 },
      'Polonnaruwa': { lat: 7.9403, lng: 81.0188 },
      'Jaffna': { lat: 9.6615, lng: 80.0255 },
      'Badulla': { lat: 6.9934, lng: 81.0550 },
      'Ratnapura': { lat: 6.6828, lng: 80.3992 },
      'Kegalle': { lat: 7.2513, lng: 80.3464 },
    };

    const providerPayload = providers.map((p) => {
      const loc = (p.locality || p.district || 'Colombo').trim();
      const coord = SL_COORDS[loc] || SL_COORDS[p.district] || { lat: 6.9271, lng: 79.8612 };
      return {
        id: String(p.id),
        name: p.name,
        trade: p.trade || 'General Maintenance Specialist',
        phone: p.phone || 'N/A',
        locality: p.locality || p.district || 'Sri Lanka',
        district: p.district || 'Kandy',
        dailyRate: Number(p.dailyRate || 3500),
        lat: coord.lat + ((Math.random() - 0.5) * 0.005),
        lng: coord.lng + ((Math.random() - 0.5) * 0.005),
        rating: Number(p.rating || 5.0),
        verified: Boolean(p.verified),
      };
    });

    // 1. Try forwarding to FastAPI Python Engine (Port 8000)
    try {
      const aiRes = await fetch('http://localhost:8000/api/ai/recommend-dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incident_lat: Number(incident_lat),
          incident_lng: Number(incident_lng),
          required_category: String(required_category),
          max_radius_km: Number(max_radius_km),
          providers: providerPayload,
        }),
      });

      if (aiRes.ok) {
        const aiData = await aiRes.json();
        return res.json(aiData);
      }
    } catch (aiErr) {
      // Fall through to Node.js mathematical engine
    }

    // 2. High-performance Node.js Haversine & Multi-Criteria Ranking Fallback
    const R = 6371.0;
    const scored = [];

    for (const p of providerPayload) {
      const dlat = (p.lat - incident_lat) * (Math.PI / 180);
      const dlng = (p.lng - incident_lng) * (Math.PI / 180);
      const a =
        Math.sin(dlat / 2) * Math.sin(dlat / 2) +
        Math.cos(incident_lat * (Math.PI / 180)) *
        Math.cos(p.lat * (Math.PI / 180)) *
        Math.sin(dlng / 2) *
        Math.sin(dlng / 2);
      const dist_km = Number((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2));

      if (dist_km <= max_radius_km) {
        const catTokens = required_category.toLowerCase().split(/[-_ ]+/);
        const hasTradeMatch = catTokens.some((t) => p.trade.toLowerCase().includes(t));
        const trade_match = hasTradeMatch ? 1.0 : 0.4;
        const prox_score = Math.max(0.0, 1.0 - dist_km / max_radius_km);
        const rating_score = p.rating / 5.0;
        const verif_score = p.verified ? 1.0 : 0.5;

        const comp_score = trade_match * 0.35 + prox_score * 0.3 + rating_score * 0.2 + verif_score * 0.15;
        const eta_mins = Math.max(5, Math.round((dist_km / 25.0) * 60 + 5));

        scored.push({
          id: p.id,
          name: p.name,
          trade: p.trade,
          phone: p.phone,
          locality: p.locality,
          district: p.district,
          dailyRate: p.dailyRate,
          lat: p.lat,
          lng: p.lng,
          rating: p.rating,
          verified: p.verified,
          distance_km: dist_km,
          composite_score: Number((comp_score * 100).toFixed(1)),
          estimated_arrival_minutes: eta_mins,
        });
      }
    }

    scored.sort((a, b) => b.composite_score - a.composite_score);
    if (scored.length > 0) {
      scored[0].recommended = true;
    }

    res.json({
      success: true,
      total_evaluated: providerPayload.length,
      total_matching: scored.length,
      recommendations: scored,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── ADMIN DETAILED ANALYTICS (REAL DB CATEGORIES, DISPATCHES & ACTIVITIES) ───
app.get('/api/admin/detailed-analytics', async (req, res) => {
  try {
    // 1. Incidents breakdown by category
    const { rows: catRows } = await pool.query(`
      SELECT
        COALESCE(category, 'odd_jobs') AS category,
        COUNT(*) AS count
      FROM incidents
      WHERE stage != 'CANCELLED' AND status != 'rejected'
      GROUP BY category
    `);

    const totalIncidents = catRows.reduce((sum, r) => sum + Number(r.count), 0);
    const catMap = {
      'tree-cutting': { name: 'Tree & Yard Care', color: '#10b981' },
      'trees': { name: 'Tree & Yard Care', color: '#10b981' },
      'painting': { name: 'Painting & Decor', color: '#f59e0b' },
      'plumbing': { name: 'Plumbing & Tech', color: '#06b6d4' },
      'pc-repair': { name: 'Plumbing & Tech', color: '#06b6d4' },
      'cleaning': { name: 'Cleaning & Wash', color: '#8b5cf6' },
      'odd_jobs': { name: 'Cleaning & Odd Jobs', color: '#ec4899' },
      'road': { name: 'Roads & Infrastructure', color: '#ef4444' },
      'waste': { name: 'Waste Management', color: '#64748b' },
      'water': { name: 'Water & Utilities', color: '#0284c7' },
      'electricity': { name: 'Electricity & Grid', color: '#eab308' },
    };

    const categoryBreakdown = catRows.map((r) => {
      const info = catMap[r.category] || { name: r.category, color: '#06b6d4' };
      const pct = totalIncidents > 0 ? Math.round((Number(r.count) / totalIncidents) * 100) : 0;
      return {
        id: r.category,
        name: info.name,
        count: Number(r.count),
        percentage: pct,
        color: info.color,
      };
    });

    // 2. Aggregate metrics & Hazard vs Service breakdown
    const { rows: aggRows } = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE stage != 'CANCELLED' AND status != 'rejected') AS "totalOrders",
        COUNT(*) FILTER (WHERE status != 'resolved' AND status != 'rejected' AND stage != 'CANCELLED') AS "activeOrders",
        COUNT(*) FILTER (WHERE status = 'resolved') AS "completedOrders",
        COALESCE(SUM(cost_lkr) FILTER (WHERE status = 'resolved'), 0) AS "settledVolumeLKR",
        COUNT(*) FILTER (WHERE stage != 'CANCELLED' AND status != 'rejected' AND category IN ('tree-cutting', 'trees', 'road', 'water', 'electricity', 'waste')) AS "hazardJobsCount",
        COUNT(*) FILTER (WHERE stage != 'CANCELLED' AND status != 'rejected' AND (category NOT IN ('tree-cutting', 'trees', 'road', 'water', 'electricity', 'waste') OR category IS NULL)) AS "serviceJobsCount"
      FROM incidents
    `);

    const { rows: workerRows } = await pool.query(`
      SELECT COUNT(*) FILTER (WHERE verified = true) AS "verifiedCount" FROM provider_profiles
    `);

    const { rows: reviewRows } = await pool.query(`
      SELECT COALESCE(AVG(rating), 5.0) AS "avgRating", COUNT(*) AS "totalReviews" FROM reviews
    `);

    // 3. Real Live Service Dispatches Table (top 10 recent)
    const { rows: dispatchRows } = await pool.query(`
      SELECT
        i.id,
        COALESCE(i.location_text, 'Colombo Urban') AS locality,
        COALESCE(u.name, 'Unassigned / Open') AS provider,
        COALESCE(i.cost_lkr, 3500) AS cost,
        COALESCE(i.stage, 'REQUESTED') AS stage,
        i.status
      FROM incidents i
      LEFT JOIN users u ON i.assigned_to = u.id
      WHERE i.stage != 'CANCELLED' AND i.status != 'rejected'
      ORDER BY i.created_at DESC
      LIMIT 10
    `);

    const liveDispatches = dispatchRows.map((d) => {
      const isCompleted = d.status === 'resolved' || d.stage === 'COMPLETED';
      const isInProgress = d.stage === 'IN_PROGRESS';
      const isEnRoute = d.stage === 'EN_ROUTE';
      const isQuoted = d.stage === 'QUOTED';

      const statusLabel = isCompleted ? 'Completed' : isInProgress ? 'In Progress' : isEnRoute ? 'En Route' : isQuoted ? 'Quoted' : 'Requested';
      const color = isCompleted ? '#ec4899' : isInProgress ? '#10b981' : isEnRoute ? '#06b6d4' : isQuoted ? '#8b5cf6' : '#f59e0b';

      return {
        id: `#JOB-${d.id}`,
        area: d.locality.split(',')[0].trim(),
        worker: d.provider,
        price: `Rs. ${Number(d.cost).toLocaleString()}`,
        status: statusLabel,
        color,
      };
    });

    // 4. Real Recent Activity Feed
    const { rows: actRows } = await pool.query(`
      SELECT
        i.id,
        i.title,
        COALESCE(i.location_text, 'Colombo') AS locality,
        i.stage,
        i.created_at,
        COALESCE(u.name, 'Field Specialist') AS worker_name
      FROM incidents i
      LEFT JOIN users u ON i.assigned_to = u.id
      WHERE i.stage != 'CANCELLED' AND i.status != 'rejected'
      ORDER BY i.created_at DESC
      LIMIT 5
    `);

    const recentActivity = actRows.map((a) => {
      const isDone = a.stage === 'COMPLETED';
      const title = isDone ? 'Direct Settlement Completed' : 'Job Dispatched & Geofence Armed';
      const sub = `${a.worker_name} · ${a.title} (${a.locality.split(',')[0].trim()})`;
      const color = isDone ? '#ec4899' : '#10b981';

      return {
        title,
        sub,
        time: new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        color,
      };
    });

    const totalOrders = Number(aggRows[0]?.totalOrders || 0);
    const activeOrders = Number(aggRows[0]?.activeOrders || 0);
    const settledVolumeLKR = Number(aggRows[0]?.settledVolumeLKR || 0);
    const hazardJobsCount = Number(aggRows[0]?.hazardJobsCount || 0);
    const serviceJobsCount = Number(aggRows[0]?.serviceJobsCount || 0);
    const verifiedWorkers = Number(workerRows[0]?.verifiedCount || 0);
    const avgTrust = ((Number(reviewRows[0]?.avgRating || 5.0) / 5) * 100).toFixed(1);

    res.json({
      success: true,
      data: {
        totalOrders,
        activeOrders,
        settledVolumeLKR,
        hazardJobsCount,
        serviceJobsCount,
        verifiedWorkers,
        avgTrustScore: `${avgTrust}%`,
        arrivalVelocity: '~12 mins',
        categoryBreakdown,
        liveDispatches,
        recentActivity,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/incidents', incidentsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);



// Photo Upload API (converts uploaded file to accessible static URL)
app.post('/api/upload', upload.single('photo'), (req, res) => {
  try {
    if (req.file) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
      return res.json({ success: true, url: fileUrl });
    }

    if (req.body?.imageBase64) {
      const matches = req.body.imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const rawExt = matches[1].split('/')[1] || 'jpg';
        const ext = rawExt.includes('png') ? 'png' : rawExt.includes('webp') ? 'webp' : 'jpg';
        const buffer = Buffer.from(matches[2], 'base64');
        const filename = `avatar-${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
        const filePath = path.join(uploadsDir, filename);
        fs.writeFileSync(filePath, buffer);
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const fileUrl = `${baseUrl}/uploads/${filename}`;
        return res.json({ success: true, url: fileUrl });
      }
    }

    return res.status(400).json({ success: false, message: 'No file or valid base64 provided.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Shared Real-Time Chat API
app.get('/api/chat/:jobId', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, job_id, sender, sender_name, text, photo_url, created_at FROM messages WHERE job_id = $1 ORDER BY created_at ASC`,
      [req.params.jobId]
    );
    res.json({
      success: true,
      data: rows.map((r) => ({
        id: `M-${r.id}`,
        jobId: r.job_id,
        sender: r.sender,
        senderName: r.sender_name,
        text: r.text,
        photoUrl: r.photo_url,
        timestamp: r.created_at,
        read: true,
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/chat/:jobId', async (req, res) => {
  try {
    const { sender, senderName, text, photoUrl } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO messages (job_id, sender, sender_name, text, photo_url) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.params.jobId, sender || 'user', senderName || 'User', text || '', photoUrl || null]
    );
    const r = rows[0];
    const msg = {
      id: `M-${r.id}`,
      jobId: r.job_id,
      sender: r.sender,
      senderName: r.sender_name,
      text: r.text,
      photoUrl: r.photo_url,
      timestamp: r.created_at,
      read: true,
    };
    res.status(201).json({ success: true, data: msg });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Community Reviews API (Persists to PostgreSQL)
app.post('/api/reviews', async (req, res) => {
  try {
    const { jobId, rating, comment, reviewerId, workerId } = req.body;
    const rawId = String(jobId || '').replace(/\D/g, '');
    const numRating = Number(rating) || 5;

    let finalReviewerId = reviewerId || null;
    let finalWorkerId = workerId || null;

    if (rawId) {
      const incRes = await pool.query(
        'SELECT reported_by, assigned_to FROM incidents WHERE id = $1',
        [Number(rawId)]
      );
      if (incRes.rows.length > 0) {
        if (!finalReviewerId && incRes.rows[0].reported_by) {
          finalReviewerId = incRes.rows[0].reported_by;
        }
        if (!finalWorkerId && incRes.rows[0].assigned_to) {
          finalWorkerId = incRes.rows[0].assigned_to;
        }
      }

      await pool.query(
        `UPDATE incidents SET rating = $1, review_comment = $2, updated_at = NOW() WHERE id = $3`,
        [numRating, comment, rawId]
      );
    }

    const { rows } = await pool.query(
      `INSERT INTO reviews (job_id, incident_id, reviewer_id, worker_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [jobId, rawId ? Number(rawId) : null, finalReviewerId, finalWorkerId, numRating, comment]
    );

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/reviews', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        r.id,
        r.job_id,
        r.incident_id,
        r.rating,
        r.comment,
        r.created_at,
        COALESCE(u_rev.name, inc_reporter.name, 'Verified Resident') AS author,
        COALESCE(u_rev.locality, inc.location_text, 'Colombo') AS location,
        COALESCE(u_work.name, inc_worker.name, 'Verified Specialist') AS worker_name,
        COALESCE(inc.category, pp.trade, 'Home Service') AS category,
        COALESCE(inc.title, 'Community Urban Service') AS title,
        COALESCE(inc.cost_lkr, pp.daily_rate, 2800) AS cost_lkr,
        COALESCE(r.likes_count, 0) AS likes
      FROM reviews r
      LEFT JOIN incidents inc ON (r.incident_id = inc.id OR r.job_id = ('JOB-' || inc.id))
      LEFT JOIN users u_rev ON r.reviewer_id = u_rev.id
      LEFT JOIN users inc_reporter ON inc.reported_by = inc_reporter.id
      LEFT JOIN users u_work ON r.worker_id = u_work.id
      LEFT JOIN users inc_worker ON inc.assigned_to = inc_worker.id
      LEFT JOIN provider_profiles pp ON (u_work.id = pp.user_id OR inc_worker.id = pp.user_id)
      ORDER BY r.created_at DESC
      LIMIT 50
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    try {
      const fallback = await pool.query(`SELECT * FROM reviews ORDER BY created_at DESC LIMIT 50`);
      res.json({ success: true, data: fallback.rows });
    } catch (e2) {
      res.status(500).json({ success: false, message: e2.message });
    }
  }
});

// Payments & Receipts API (Persists to PostgreSQL)
app.post('/api/payments', async (req, res) => {
  try {
    const { jobId, amountLKR, paymentMethod, payerId, payeeId } = req.body;
    const rawId = String(jobId || '').replace(/\D/g, '');
    const { rows } = await pool.query(
      `INSERT INTO payments (job_id, incident_id, payer_id, payee_id, amount_lkr, payment_method, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'completed') RETURNING *`,
      [jobId, rawId ? Number(rawId) : null, payerId || null, payeeId || null, Number(amountLKR) || 3500, paymentMethod || 'Cash on Hand']
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/payments', async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM payments ORDER BY settled_at DESC LIMIT 100`);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Verified Service Providers Directory API (Real DB Query with live review aggregation)
app.get('/api/providers', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        u.id, 
        u.name AS "fullName", 
        u.email, 
        u.phone,
        COALESCE(pp.trade, 'Master Craftsman') AS trade,
        COALESCE(pp.daily_rate, 3500) AS "dailyRate",
        COALESCE(pp.hourly_rate, 600) AS "hourlyRate",
        COALESCE(pp.experience_years, 8) AS "experienceYears",
        COALESCE(
          (SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews r WHERE r.worker_id = u.id OR r.incident_id IN (SELECT id FROM incidents WHERE assigned_to = u.id)),
          5.0
        ) AS rating,
        COALESCE(
          (SELECT COUNT(*) FROM reviews r WHERE r.worker_id = u.id OR r.incident_id IN (SELECT id FROM incidents WHERE assigned_to = u.id)),
          1
        ) AS "reviewCount",
        COALESCE(pp.vehicle_type, 'Service Vehicle') AS "vehicleType",
        COALESCE(pp.plate_number, 'WP-CAB-8821') AS "plateNumber",
        COALESCE(pp.verified, true) AS "verifiedBadge",
        COALESCE(u.locality, 'Heerassagala') AS locality,
        COALESCE(u.district, 'Kandy') AS district
      FROM users u
      LEFT JOIN provider_profiles pp ON u.id = pp.user_id
      WHERE u.role = 'service_provider'
      ORDER BY u.id ASC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Single Provider Live Stats API (Real Calculations)
app.get('/api/providers/:id/stats', async (req, res) => {
  try {
    const rawId = String(req.params.id || '').replace(/\D/g, '');
    const userId = Number(rawId) || 1;

    const { rows } = await pool.query(`
      SELECT 
        u.id,
        u.name AS "fullName",
        COALESCE(
          (SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews r WHERE r.worker_id = u.id OR r.incident_id IN (SELECT id FROM incidents WHERE assigned_to = u.id)),
          5.0
        ) AS rating,
        COALESCE(
          (SELECT COUNT(*) FROM reviews r WHERE r.worker_id = u.id OR r.incident_id IN (SELECT id FROM incidents WHERE assigned_to = u.id)),
          0
        ) AS "reviewCount",
        COALESCE(
          (SELECT SUM(amount_lkr) FROM payments p WHERE p.payee_id = u.id OR p.incident_id IN (SELECT id FROM incidents WHERE assigned_to = u.id)),
          (SELECT SUM(cost_lkr) FROM incidents WHERE assigned_to = u.id AND stage = 'COMPLETED'),
          0
        ) AS "totalEarnings",
        COALESCE(
          (SELECT COUNT(*) FROM incidents WHERE assigned_to = u.id AND stage = 'COMPLETED'),
          0
        ) AS "completedJobsCount"
      FROM users u
      WHERE u.id = $1
    `, [userId]);

    res.json({ success: true, data: rows[0] || {} });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Platform-Wide Live Metrics API (Real counts from DB)
app.get('/api/analytics/platform-stats', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE role = 'service_provider') AS "totalWorkers",
        (SELECT COUNT(*) FROM users WHERE role = 'citizen') AS "totalCitizens",
        (SELECT COUNT(*) FROM incidents WHERE stage = 'COMPLETED' OR status = 'resolved') AS "totalCompletedJobs",
        (SELECT COUNT(*) FROM reviews) AS "totalReviews",
        COALESCE((SELECT SUM(amount_lkr) FROM payments), (SELECT SUM(cost_lkr) FROM incidents WHERE stage = 'COMPLETED'), 0) AS "totalPaymentsLKR"
    `);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});





// Review Likes API (Real Database Toggle)
app.post('/api/reviews/:id/like', async (req, res) => {
  try {
    const rawId = String(req.params.id || '').replace(/\D/g, '');
    const { userId } = req.body || {};
    const parsedUserId = userId ? Number(String(userId).replace(/\D/g, '')) : null;

    if (!rawId) {
      return res.status(400).json({ success: false, message: 'Invalid review ID' });
    }

    let isLiked = true;
    if (parsedUserId) {
      const existing = await pool.query(
        'SELECT id FROM review_likes WHERE review_id = $1 AND user_id = $2',
        [Number(rawId), parsedUserId]
      );
      if (existing.rows.length > 0) {
        await pool.query('DELETE FROM review_likes WHERE review_id = $1 AND user_id = $2', [Number(rawId), parsedUserId]);
        await pool.query('UPDATE reviews SET likes_count = GREATEST(0, COALESCE(likes_count, 1) - 1) WHERE id = $1', [Number(rawId)]);
        isLiked = false;
      } else {
        await pool.query('INSERT INTO review_likes (review_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [Number(rawId), parsedUserId]);
        await pool.query('UPDATE reviews SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = $1', [Number(rawId)]);
        isLiked = true;
      }
    } else {
      await pool.query('UPDATE reviews SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = $1', [Number(rawId)]);
    }

    const { rows } = await pool.query('SELECT COALESCE(likes_count, 0) AS likes FROM reviews WHERE id = $1', [Number(rawId)]);
    const currentLikes = rows.length > 0 ? Number(rows[0].likes) : 1;

    res.json({ success: true, likes: currentLikes, isLiked });
  } catch (err) {
    console.error('Like error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Smart Urban Services API is running', env: process.env.NODE_ENV });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error.',
  });
});

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Test DB connection
    const client = await pool.connect();
    client.release();
    console.log(`Database connected: ${process.env.DB_NAME}`);

    // Run table migrations & seed default roles
    await User.createTable();
    console.log('Users table ready');
    await Incident.createTable();
    console.log('Incidents table ready');
    await Notification.createTable();
    console.log('Notifications table ready');

    const runMigrations = require('./migrations');
    await runMigrations();

    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        job_id VARCHAR(50) NOT NULL,
        sender VARCHAR(50) NOT NULL,
        sender_name VARCHAR(100) NOT NULL,
        text TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_messages_job_id ON messages(job_id);
    `);
    console.log('Messages table ready');

    httpServer.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
};

startServer();
