const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    degree: {
      type: String,
      enum: ['B.A.', 'B.Sc.', 'B.Com.', 'BBA', 'B.Tech', 'MBBS', 'LLB', 'Other'],
      required: true
    },
    stream: {
      type: String,
      enum: ['Arts', 'Science', 'Commerce', 'Engineering', 'Medical', 'Law', 'Business', 'Other'],
      required: true
    },
    duration: {
      type: Number,
      required: true
    },
    description: String,
    careerPaths: [{
      jobTitle: String,
      industry: String,
      averageSalary: Number,
      growthRate: Number,
      requiredSkills: [String]
    }],
    entranceExams: [{
      name: String,
      conductingBody: String,
      frequency: String,
      eligibility: String
    }],
    higherEducation: [{
      degree: String,
      specializations: [String]
    }],
    entrepreneurship: [{
      idea: String,
      requiredSkills: [String],
      potential: String
    }]
  },
  {
    timestamps: true
  }
);

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;