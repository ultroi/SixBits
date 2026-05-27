const aiService = require('../services/aiService');

exports.getCareerMatches = async (req, res) => {
  try {
    const profile = req.body.profile || req.body || {};
    const matches = await aiService.getCareerMatchesGroq(profile);
    return res.json({ matches });
  } catch (err) {
    console.error('AI career matches error:', err);
    return res.status(500).json({ error: 'Failed to fetch AI career matches' });
  }
};
