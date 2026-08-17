const express = require('express');
const {
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
  deleteNotification,
} = require('../controllers/notificationsController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require login
router.use(protect);

// GET    /api/notifications               - list user notifications
router.get('/', getNotifications);

// GET    /api/notifications/unread-count  - get unread badge count
router.get('/unread-count', getUnreadCount);

// PATCH  /api/notifications/read          - mark specific IDs as read
router.patch('/read', markRead);

// PATCH  /api/notifications/read-all      - mark all as read
router.patch('/read-all', markAllRead);

// DELETE /api/notifications/:id           - delete one notification
router.delete('/:id', deleteNotification);

module.exports = router;
