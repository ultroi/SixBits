const College = require('../models/College');

// Get colleges by location
exports.getCollegesByLocation = async (req, res) => {
  try {
    const { lat, lng, radius = 50000 } = req.query; // radius in meters
    
    const colleges = await College.find({
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseInt(radius)
        }
      },
      type: 'Government'
    });
    
    res.json(colleges);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all colleges with filters
exports.getColleges = async (req, res) => {
  try {
    const { type, city, state, program } = req.query;
    let query = {};
    
    if (type) query.type = type;
    if (city) query['location.city'] = city;
    if (state) query['location.state'] = state;
    if (program) query['programs.name'] = { $regex: program, $options: 'i' };
    
    const colleges = await College.find(query);
    res.json(colleges);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get college by ID
exports.getCollegeById = async (req, res) => {
  try {
    const college = await College.findById(req.params.id);
    if (!college) return res.status(404).json({ message: 'College not found' });
    res.json(college);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};