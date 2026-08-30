const pool = require('../config/database');

/**
 * Analytics Model
 * Powers charts, reports, and the AI predictive module
 */

const Analytics = {
  // Average resolution time per category
  async getResolutionTimes() {
    const { rows } = await pool.query(`
      SELECT
        category,
        COUNT(*)                                                      AS total_resolved,
        ROUND(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600), 2)
                                                                      AS avg_hours,
        ROUND(MIN(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600), 2)
                                                                      AS min_hours,
        ROUND(MAX(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600), 2)
                                                                      AS max_hours
      FROM incidents
      WHERE status = 'resolved' AND resolved_at IS NOT NULL
      GROUP BY category
      ORDER BY avg_hours ASC
    `);
    return rows;
  },

  // Monthly incident volume
  async getMonthlyVolume(months = 12) {
    const { rows } = await pool.query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
        COUNT(*)                                             AS total,
        COUNT(*) FILTER (WHERE status = 'resolved')         AS resolved,
        COUNT(*) FILTER (WHERE priority = 'critical')       AS critical
      FROM incidents
      WHERE created_at >= NOW() - INTERVAL '${parseInt(months)} months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month ASC
    `);
    return rows;
  },

  // Hot zones - locations with most incidents
  async getHotZones(limit = 10) {
    const { rows } = await pool.query(`
      SELECT
        location_text,
        COUNT(*)                                             AS incident_count,
        COUNT(*) FILTER (WHERE priority = 'critical')       AS critical_count,
        MODE() WITHIN GROUP (ORDER BY category)             AS most_common_category,
        AVG(latitude)                                        AS avg_lat,
        AVG(longitude)                                       AS avg_lng
      FROM incidents
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL
      GROUP BY location_text
      ORDER BY incident_count DESC
      LIMIT $1
    `, [limit]);
    return rows;
  },

  // Status funnel
  async getStatusFunnel() {
    const { rows } = await pool.query(`
      SELECT status, COUNT(*) AS count
      FROM incidents
      GROUP BY status
      ORDER BY
        CASE status
          WHEN 'pending'     THEN 1
          WHEN 'assigned'    THEN 2
          WHEN 'in_progress' THEN 3
          WHEN 'resolved'    THEN 4
          WHEN 'closed'      THEN 5
          WHEN 'rejected'    THEN 6
        END
    `);
    return rows;
  },

  // Priority distribution
  async getPriorityDistribution() {
    const { rows } = await pool.query(`
      SELECT
        priority,
        COUNT(*)                                            AS total,
        COUNT(*) FILTER (WHERE status = 'resolved')        AS resolved,
        ROUND(
          COUNT(*) FILTER (WHERE status = 'resolved') * 100.0
          / NULLIF(COUNT(*), 0), 1
        )                                                   AS resolution_rate
      FROM incidents
      GROUP BY priority
      ORDER BY
        CASE priority
          WHEN 'critical' THEN 1
          WHEN 'high'     THEN 2
          WHEN 'medium'   THEN 3
          WHEN 'low'      THEN 4
        END
    `);
    return rows;
  },

  // Recurring incident patterns (AI predictive input)
  async getRecurringPatterns(minCount = 2) {
    const { rows } = await pool.query(`
      SELECT
        location_text,
        category,
        COUNT(*)  AS occurrence_count,
        MAX(created_at) AS last_reported
      FROM incidents
      GROUP BY location_text, category
      HAVING COUNT(*) >= $1
      ORDER BY occurrence_count DESC
      LIMIT 20
    `, [minCount]);
    return rows;
  },

  // Category performance (for AI module input)
  async getCategoryPerformance() {
    const { rows } = await pool.query(`
      SELECT
        category,
        COUNT(*)                                                          AS total,
        COUNT(*) FILTER (WHERE status = 'resolved')                      AS resolved,
        COUNT(*) FILTER (WHERE status = 'pending')                       AS pending,
        COUNT(*) FILTER (WHERE status = 'rejected')                      AS rejected,
        ROUND(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600)
              FILTER (WHERE resolved_at IS NOT NULL), 2)                 AS avg_resolution_hours
      FROM incidents
      GROUP BY category
      ORDER BY total DESC
    `);
    return rows;
  },
};

module.exports = Analytics;
