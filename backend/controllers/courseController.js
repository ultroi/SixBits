const Course = require('../models/Course');

// Get all courses
exports.getCourses = async (req, res) => {
  try {
    const { stream, degree } = req.query;
    let query = {};
    
    if (stream) query.stream = stream;
    if (degree) query.degree = degree;
    
    const courses = await Course.find(query);
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get course by ID
exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get career paths for a course
exports.getCareerPaths = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    
    res.json({
      course: course.name,
      careerPaths: course.careerPaths,
      entranceExams: course.entranceExams,
      higherEducation: course.higherEducation,
      entrepreneurship: course.entrepreneurship
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};