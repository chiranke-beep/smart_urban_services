const Admin = require('../models/Admin');
const { sendNotification } = require('./notificationsController');

// @desc    Get admin dashboard overview stats
// @route   GET /api/admin/dashboard
// @access  Private - admin
const getDashboard = async (req, res) => {
  try {
    const stats = await Admin.getDashboardStats();
    res.status(200).json({ success: true, data: stats });
  } catch (err) {
    console.error('getDashboard error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Get incidents broken down by category
// @route   GET /api/admin/incidents/by-category
// @access  Private - admin
const getIncidentsByCategory = async (req, res) => {
  try {
    const data = await Admin.getIncidentsByCategory();
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('getIncidentsByCategory error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Get daily incident count trend
// @route   GET /api/admin/incidents/trend?days=30
// @access  Private - admin
const getIncidentsTrend = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const data = await Admin.getIncidentsTrend(Math.min(parseInt(days), 90));
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('getIncidentsTrend error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Get top service providers by resolution rate
// @route   GET /api/admin/providers/top
// @access  Private - admin
const getTopProviders = async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const data = await Admin.getTopProviders(parseInt(limit));
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('getTopProviders error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Get recent activity feed
// @route   GET /api/admin/activity
// @access  Private - admin
const getRecentActivity = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const data = await Admin.getRecentActivity(Math.min(parseInt(limit), 50));
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('getRecentActivity error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Assign incident to a service provider
// @route   POST /api/admin/incidents/:id/assign
// @access  Private - admin
const assignIncident = async (req, res) => {
  try {
    const { provider_id } = req.body;
    if (!provider_id) {
      return res.status(400).json({ success: false, message: 'provider_id is required.' });
    }

    const updated = await Admin.assignIncident(req.params.id, provider_id);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Incident not found.' });
    }

    const io = req.app.get('io');

    // Notify the assigned provider
    await sendNotification(io, {
      user_id:     provider_id,
      type:        'assignment',
      title:       'New Incident Assigned',
      message:     `You have been assigned to incident #${updated.id}: "${updated.title}"`,
      incident_id: updated.id,
    });

    // Notify the reporter
    await sendNotification(io, {
      user_id:     updated.reported_by,
      type:        'status_update',
      title:       'Your Incident Has Been Assigned',
      message:     `Incident #${updated.id} has been assigned to a service provider.`,
      incident_id: updated.id,
    });

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error('assignIncident error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  getDashboard,
  getIncidentsByCategory,
  getIncidentsTrend,
  getTopProviders,
  getRecentActivity,
  assignIncident,
};
