const express = require('express');
const router = express.Router();
const timelineController = require('../controllers/timelineController');

router.get('/user/:userId', timelineController.getUserTimeline);
router.get('/user/:userId/upcoming', timelineController.getUpcomingEvents);
router.post('/', timelineController.createTimelineEntry);
router.put('/:id', timelineController.updateTimelineEntry);
router.delete('/:id', timelineController.deleteTimelineEntry);

module.exports = router;