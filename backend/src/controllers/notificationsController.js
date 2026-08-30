const Notification = require('../models/Notification');

// Helper - send a notification to a user and emit via Socket.io
const sendNotification = async (io, { user_id, type, title, message, incident_id }) => {
  const notif = await Notification.create({ user_id, type, title, message, incident_id });
  if (io) {
    // Emit to a room named after the user id so only they receive it
    io.to(`user:${user_id}`).emit('notification:new', notif);
  }
  return notif;
};

// @desc    Get notifications for logged-in user
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const { is_read, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const result = await Notification.findByUser(req.user.id, {
      is_read: is_read !== undefined ? is_read === 'true' : undefined,
      limit: parseInt(limit),
      offset,
    });

    const unread = await Notification.unreadCount(req.user.id);

    res.status(200).json({
      success: true,
      unread_count: unread,
      total: result.total,
      page: parseInt(page),
      limit: parseInt(limit),
      data: result.notifications,
    });
  } catch (err) {
    console.error('getNotifications error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.unreadCount(req.user.id);
    res.status(200).json({ success: true, unread_count: count });
  } catch (err) {
    console.error('getUnreadCount error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Mark specific notifications as read
// @route   PATCH /api/notifications/read
// @access  Private
const markRead = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Provide an array of notification IDs.' });
    }
    const updated = await Notification.markRead(ids, req.user.id);
    res.status(200).json({ success: true, updated: updated.length });
  } catch (err) {
    console.error('markRead error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
const markAllRead = async (req, res) => {
  try {
    await Notification.markAllRead(req.user.id);
    res.status(200).json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    console.error('markAllRead error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = async (req, res) => {
  try {
    await Notification.delete(req.params.id, req.user.id);
    res.status(200).json({ success: true, message: 'Notification deleted.' });
  } catch (err) {
    console.error('deleteNotification error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  sendNotification,
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
  deleteNotification,
};
