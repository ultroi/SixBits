const express = global.express;
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  createNotification,
} = require('../controllers/notificationController');

// Protected routes (require authentication)
router.get('/', auth, getNotifications);
router.get('/unread/count', auth, getUnreadCount);
router.put('/:notificationId/read', auth, markAsRead);
router.put('/read/all', auth, markAllAsRead);
router.delete('/:notificationId', auth, deleteNotification);
router.delete('/all', auth, deleteAllNotifications);

// Admin route to create notifications
router.post('/', auth, createNotification);

module.exports = router;
