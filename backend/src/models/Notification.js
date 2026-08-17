const pool = require('../config/database');

/**
 * Notification Model
 * Types: incident_created | status_update | assignment | system
 */

const Notification = {
  // Create table
  async createTable() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id           SERIAL PRIMARY KEY,
        user_id      INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type         VARCHAR(50)  NOT NULL
                     CHECK (type IN ('incident_created','status_update','assignment','system')),
        title        VARCHAR(200) NOT NULL,
        message      TEXT         NOT NULL,
        incident_id  INTEGER      REFERENCES incidents(id) ON DELETE SET NULL,
        is_read      BOOLEAN      NOT NULL DEFAULT FALSE,
        created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_notif_user    ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notif_read    ON notifications(is_read);
      CREATE INDEX IF NOT EXISTS idx_notif_created ON notifications(created_at DESC);
    `);
  },

  // Create a notification
  async create({ user_id, type, title, message, incident_id = null }) {
    const { rows } = await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, incident_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [user_id, type, title, message, incident_id]
    );
    return rows[0];
  },

  // Bulk create (notify multiple users at once)
  async createBulk(notifications) {
    if (!notifications.length) return [];
    const values = [];
    const placeholders = notifications.map((n, i) => {
      const base = i * 5;
      values.push(n.user_id, n.type, n.title, n.message, n.incident_id || null);
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`;
    });
    const { rows } = await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, incident_id)
       VALUES ${placeholders.join(', ')} RETURNING *`,
      values
    );
    return rows;
  },

  // Get notifications for a user
  async findByUser(user_id, { is_read, limit = 20, offset = 0 } = {}) {
    const conditions = [`user_id = $1`];
    const values = [user_id];
    let idx = 2;

    if (is_read !== undefined) {
      conditions.push(`is_read = $${idx++}`);
      values.push(is_read);
    }

    values.push(limit, offset);
    const { rows } = await pool.query(
      `SELECT * FROM notifications
       WHERE ${conditions.join(' AND ')}
       ORDER BY created_at DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
      values
    );

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM notifications WHERE ${conditions.slice(0, -0).join(' AND ')}`,
      values.slice(0, -2)
    );

    return {
      notifications: rows,
      total: parseInt(countRes.rows[0].count, 10),
    };
  },

  // Unread count for a user
  async unreadCount(user_id) {
    const { rows } = await pool.query(
      `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE`,
      [user_id]
    );
    return parseInt(rows[0].count, 10);
  },

  // Mark notification(s) as read
  async markRead(ids, user_id) {
    const { rows } = await pool.query(
      `UPDATE notifications SET is_read = TRUE
       WHERE id = ANY($1::int[]) AND user_id = $2
       RETURNING *`,
      [ids, user_id]
    );
    return rows;
  },

  // Mark all as read for a user
  async markAllRead(user_id) {
    await pool.query(
      `UPDATE notifications SET is_read = TRUE WHERE user_id = $1`,
      [user_id]
    );
  },

  // Delete a notification
  async delete(id, user_id) {
    await pool.query(
      `DELETE FROM notifications WHERE id = $1 AND user_id = $2`,
      [id, user_id]
    );
  },
};

module.exports = Notification;
