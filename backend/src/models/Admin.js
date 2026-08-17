const pool = require('../config/database');

/**
 * Admin Model - aggregated queries for admin dashboard
 */

const Admin = {
  // Overview stats
  async getDashboardStats() {
    const { rows } = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users)                                    AS total_users,
        (SELECT COUNT(*) FROM users WHERE role = 'citizen')            AS total_citizens,
        (SELECT COUNT(*) FROM users WHERE role = 'service_provider')   AS total_providers,
        (SELECT COUNT(*) FROM users WHERE is_active = TRUE)            AS active_users,
        (SELECT COUNT(*) FROM incidents)                               AS total_incidents,
        (SELECT COUNT(*) FROM incidents WHERE status = 'pending')      AS pending_incidents,
        (SELECT COUNT(*) FROM incidents WHERE status = 'in_progress')  AS in_progress_incidents,
        (SELECT COUNT(*) FROM incidents WHERE status = 'resolved')     AS resolved_incidents,
        (SELECT COUNT(*) FROM incidents WHERE status = 'rejected')     AS rejected_incidents,
        (SELECT COUNT(*) FROM incidents WHERE priority = 'critical')   AS critical_incidents,
        (SELECT COUNT(*) FROM incidents
         WHERE created_at >= NOW() - INTERVAL '7 days')                AS incidents_this_week,
        (SELECT COUNT(*) FROM incidents
         WHERE created_at >= NOW() - INTERVAL '30 days')               AS incidents_this_month
    `);
    return rows[0];
  },

  // Incidents by category
  async getIncidentsByCategory() {
    const { rows } = await pool.query(`
      SELECT category, COUNT(*) AS count
      FROM incidents
      GROUP BY category
      ORDER BY count DESC
    `);
    return rows;
  },

  // Incidents trend (last N days, daily)
  async getIncidentsTrend(days = 30) {
    const { rows } = await pool.query(`
      SELECT
        DATE(created_at) AS date,
        COUNT(*)         AS count
      FROM incidents
      WHERE created_at >= NOW() - INTERVAL '${parseInt(days)} days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);
    return rows;
  },

  // Top service providers by resolved incidents
  async getTopProviders(limit = 5) {
    const { rows } = await pool.query(`
      SELECT
        u.id, u.name, u.email,
        COUNT(i.id)                                                AS total_assigned,
        COUNT(i.id) FILTER (WHERE i.status = 'resolved')          AS resolved,
        ROUND(
          COUNT(i.id) FILTER (WHERE i.status = 'resolved') * 100.0
          / NULLIF(COUNT(i.id), 0), 1
        )                                                         AS resolution_rate
      FROM users u
      LEFT JOIN incidents i ON i.assigned_to = u.id
      WHERE u.role = 'service_provider'
      GROUP BY u.id, u.name, u.email
      ORDER BY resolved DESC
      LIMIT $1
    `, [limit]);
    return rows;
  },

  // Recent activity feed
  async getRecentActivity(limit = 10) {
    const { rows } = await pool.query(`
      SELECT
        i.id, i.title, i.status, i.priority, i.category,
        i.updated_at,
        u.name AS reporter_name
      FROM incidents i
      JOIN users u ON i.reported_by = u.id
      ORDER BY i.updated_at DESC
      LIMIT $1
    `, [limit]);
    return rows;
  },

  // Assign incident to service provider
  async assignIncident(incident_id, provider_id) {
    const { rows } = await pool.query(`
      UPDATE incidents
      SET assigned_to = $1, status = 'assigned'
      WHERE id = $2
      RETURNING *
    `, [provider_id, incident_id]);
    return rows[0] || null;
  },
};

module.exports = Admin;
