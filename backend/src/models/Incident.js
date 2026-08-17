const pool = require('../config/database');

/**
 * Incident Model
 * Statuses:  pending | assigned | in_progress | resolved | closed | rejected
 * Priorities: low | medium | high | critical
 * Categories: road | water | electricity | waste | public_safety | other
 */

const Incident = {
  // ── Create table ─────────────────────────────────────────────────────────
  async createTable() {
    // Create the reusable trigger function first (if not already exists)
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS incidents (
        id              SERIAL PRIMARY KEY,
        title           VARCHAR(200)  NOT NULL,
        description     TEXT          NOT NULL,
        category        VARCHAR(50)   NOT NULL
                        CHECK (category IN ('road','water','electricity','waste','public_safety','other')),
        priority        VARCHAR(20)   NOT NULL DEFAULT 'medium'
                        CHECK (priority IN ('low','medium','high','critical')),
        status          VARCHAR(20)   NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','assigned','in_progress','resolved','closed','rejected')),
        location_text   VARCHAR(255)  NOT NULL,
        latitude        DECIMAL(10,8),
        longitude       DECIMAL(11,8),
        image_url       TEXT,
        reported_by     INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        assigned_to     INTEGER       REFERENCES users(id) ON DELETE SET NULL,
        resolved_at     TIMESTAMPTZ,
        created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
      );

      DROP TRIGGER IF EXISTS incidents_updated_at ON incidents;
      CREATE TRIGGER incidents_updated_at
        BEFORE UPDATE ON incidents
        FOR EACH ROW EXECUTE FUNCTION update_updated_at();

      CREATE INDEX IF NOT EXISTS idx_incidents_status   ON incidents(status);
      CREATE INDEX IF NOT EXISTS idx_incidents_category ON incidents(category);
      CREATE INDEX IF NOT EXISTS idx_incidents_reported ON incidents(reported_by);
      CREATE INDEX IF NOT EXISTS idx_incidents_assigned ON incidents(assigned_to);
    `);
  },

  // ── Create a new incident ────────────────────────────────────────────────
  async create({ title, description, category, priority = 'medium', location_text, latitude, longitude, image_url, reported_by }) {
    const { rows } = await pool.query(
      `INSERT INTO incidents
         (title, description, category, priority, location_text, latitude, longitude, image_url, reported_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [title, description, category, priority, location_text, latitude, longitude, image_url, reported_by]
    );
    return rows[0];
  },

  // ── Get all incidents with filters + pagination ──────────────────────────
  async findAll({ status, category, priority, reported_by, assigned_to, limit = 20, offset = 0 } = {}) {
    const conditions = [];
    const values = [];
    let idx = 1;

    if (status)      { conditions.push(`status = $${idx++}`);      values.push(status); }
    if (category)    { conditions.push(`category = $${idx++}`);    values.push(category); }
    if (priority)    { conditions.push(`priority = $${idx++}`);    values.push(priority); }
    if (reported_by) { conditions.push(`reported_by = $${idx++}`); values.push(reported_by); }
    if (assigned_to) { conditions.push(`assigned_to = $${idx++}`); values.push(assigned_to); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const countVals = [...values];
    values.push(limit, offset);

    const { rows } = await pool.query(
      `SELECT i.*,
              u.name AS reporter_name,
              sp.name AS assignee_name
       FROM incidents i
       LEFT JOIN users u  ON i.reported_by = u.id
       LEFT JOIN users sp ON i.assigned_to  = sp.id
       ${where}
       ORDER BY i.created_at DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
      values
    );

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM incidents ${where}`, countVals
    );

    return {
      incidents: rows,
      total: parseInt(countRes.rows[0].count, 10),
      limit,
      offset,
    };
  },

  // ── Get single incident by id ─────────────────────────────────────────────
  async findById(id) {
    const { rows } = await pool.query(
      `SELECT i.*,
              u.name  AS reporter_name,
              u.email AS reporter_email,
              sp.name AS assignee_name
       FROM incidents i
       LEFT JOIN users u  ON i.reported_by = u.id
       LEFT JOIN users sp ON i.assigned_to  = sp.id
       WHERE i.id = $1 LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  },

  // ── Update incident fields ────────────────────────────────────────────────
  async update(id, fields) {
    const allowed = ['title', 'description', 'category', 'priority', 'location_text', 'latitude', 'longitude', 'image_url'];
    const setClauses = [];
    const values = [];
    let idx = 1;

    for (const key of allowed) {
      if (fields[key] !== undefined) {
        setClauses.push(`${key} = $${idx++}`);
        values.push(fields[key]);
      }
    }
    if (setClauses.length === 0) return null;

    values.push(id);
    const { rows } = await pool.query(
      `UPDATE incidents SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return rows[0] || null;
  },

  // ── Update status (admin/service_provider) ───────────────────────────────
  async updateStatus(id, status, assigned_to = undefined) {
    const setClauses = ['status = $1'];
    const values = [status];
    let idx = 2;

    if (assigned_to !== undefined) {
      setClauses.push(`assigned_to = $${idx++}`);
      values.push(assigned_to);
    }
    if (status === 'resolved') {
      setClauses.push(`resolved_at = NOW()`);
    }

    values.push(id);
    const { rows } = await pool.query(
      `UPDATE incidents SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return rows[0] || null;
  },

  // ── Delete incident (admin or reporter) ──────────────────────────────────
  async delete(id) {
    await pool.query('DELETE FROM incidents WHERE id = $1', [id]);
  },

  // ── Stats for dashboard ───────────────────────────────────────────────────
  async getStats() {
    const { rows } = await pool.query(`
      SELECT
        COUNT(*)                                            AS total,
        COUNT(*) FILTER (WHERE status = 'pending')         AS pending,
        COUNT(*) FILTER (WHERE status = 'in_progress')     AS in_progress,
        COUNT(*) FILTER (WHERE status = 'resolved')        AS resolved,
        COUNT(*) FILTER (WHERE priority = 'critical')      AS critical,
        COUNT(*) FILTER (WHERE category = 'road')          AS road,
        COUNT(*) FILTER (WHERE category = 'water')         AS water,
        COUNT(*) FILTER (WHERE category = 'electricity')   AS electricity,
        COUNT(*) FILTER (WHERE category = 'waste')         AS waste,
        COUNT(*) FILTER (WHERE category = 'public_safety') AS public_safety
      FROM incidents
    `);
    return rows[0];
  },
};

module.exports = Incident;
