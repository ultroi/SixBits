const Timeline = require('../models/Timeline');

// Get user's timeline
exports.getUserTimeline = async (req, res) => {
  try {
    const timelines = await Timeline.find({ userId: req.params.userId })
      .sort({ date: 1 });
    res.json(timelines);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create timeline entry
exports.createTimelineEntry = async (req, res) => {
  try {
    const timeline = new Timeline(req.body);
    await timeline.save();
    res.status(201).json(timeline);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update timeline entry
exports.updateTimelineEntry = async (req, res) => {
  try {
    const timeline = await Timeline.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!timeline) return res.status(404).json({ message: 'Timeline entry not found' });
    res.json(timeline);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete timeline entry
exports.deleteTimelineEntry = async (req, res) => {
  try {
    const timeline = await Timeline.findByIdAndDelete(req.params.id);
    if (!timeline) return res.status(404).json({ message: 'Timeline entry not found' });
    res.json({ message: 'Timeline entry deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get upcoming events
exports.getUpcomingEvents = async (req, res) => {
  try {
    const now = new Date();
    const upcoming = await Timeline.find({
      userId: req.params.userId,
      date: { $gte: now },
      isCompleted: false
    }).sort({ date: 1 });
    
    res.json(upcoming);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};