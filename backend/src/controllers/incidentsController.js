const { validationResult } = require('express-validator');
const Incident = require('../models/Incident');

// ── @desc    Create a new incident report
// ── @route   POST /api/incidents
// ── @access  Private — citizen, service_provider, admin
const createIncident = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { title, description, category, priority, location_text, latitude, longitude } = req.body;

    // If image was uploaded, build the URL
    const image_url = req.file
      ? `/uploads/incidents/${req.file.filename}`
      : null;

    const incident = await Incident.create({
      title,
      description,
      category,
      priority,
      location_text,
      latitude: latitude || null,
      longitude: longitude || null,
      image_url,
      reported_by: req.user.id,
    });

    // Emit real-time event to admins
    const io = req.app.get('io');
    if (io) io.emit('incident:new', incident);

    res.status(201).json({ success: true, data: incident });
  } catch (err) {
    console.error('createIncident error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── @desc    Get all incidents (filterable)
// ── @route   GET /api/incidents
// ── @access  Private — all roles (filtered by role)
const getAllIncidents = async (req, res) => {
  try {
    const { status, category, priority, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Citizens only see their own incidents
    const filters = {
      status,
      category,
      priority,
      limit: parseInt(limit),
      offset,
    };

    if (req.user.role === 'citizen') {
      filters.reported_by = req.user.id;
    } else if (req.user.role === 'service_provider') {
      filters.assigned_to = req.user.id;
    }
    // admin sees all

    const result = await Incident.findAll(filters);

    res.status(200).json({
      success: true,
      total: result.total,
      page: parseInt(page),
      limit: parseInt(limit),
      data: result.incidents,
    });
  } catch (err) {
    console.error('getAllIncidents error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── @desc    Get single incident
// ── @route   GET /api/incidents/:id
// ── @access  Private — all roles
const getIncidentById = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found.' });
    }

    // Citizens can only see their own
    if (req.user.role === 'citizen' && incident.reported_by !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.status(200).json({ success: true, data: incident });
  } catch (err) {
    console.error('getIncidentById error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── @desc    Update incident details (reporter can edit before assigned)
// ── @route   PUT /api/incidents/:id
// ── @access  Private — reporter (if pending) or admin
const updateIncident = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found.' });
    }

    const isReporter = incident.reported_by === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isReporter && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Reporter can only edit while still pending
    if (isReporter && !isAdmin && incident.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'You can only edit an incident while it is pending.',
      });
    }

    const image_url = req.file
      ? `/uploads/incidents/${req.file.filename}`
      : undefined;

    const updated = await Incident.update(req.params.id, { ...req.body, image_url });
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error('updateIncident error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── @desc    Update incident status (admin/service_provider)
// ── @route   PATCH /api/incidents/:id/status
// ── @access  Private — admin, service_provider
const updateIncidentStatus = async (req, res) => {
  try {
    const { status, assigned_to } = req.body;

    const validStatuses = ['pending', 'assigned', 'in_progress', 'resolved', 'closed', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found.' });
    }

    // Service providers can only update incidents assigned to them
    if (req.user.role === 'service_provider' && incident.assigned_to !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only update incidents assigned to you.',
      });
    }

    const updated = await Incident.updateStatus(req.params.id, status, assigned_to);

    // Emit real-time status update
    const io = req.app.get('io');
    if (io) io.emit('incident:status_update', { id: updated.id, status: updated.status });

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error('updateIncidentStatus error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── @desc    Delete an incident
// ── @route   DELETE /api/incidents/:id
// ── @access  Private — reporter (if pending) or admin
const deleteIncident = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found.' });
    }

    const isReporter = incident.reported_by === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isReporter && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    if (isReporter && !isAdmin && incident.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'You can only delete an incident while it is pending.',
      });
    }

    await Incident.delete(req.params.id);
    res.status(200).json({ success: true, message: 'Incident deleted successfully.' });
  } catch (err) {
    console.error('deleteIncident error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── @desc    Get incident statistics
// ── @route   GET /api/incidents/stats
// ── @access  Private — admin
const getStats = async (req, res) => {
  try {
    const stats = await Incident.getStats();
    res.status(200).json({ success: true, data: stats });
  } catch (err) {
    console.error('getStats error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  createIncident,
  getAllIncidents,
  getIncidentById,
  updateIncident,
  updateIncidentStatus,
  deleteIncident,
  getStats,
};
