const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    description: String,
    questions: [{
      question: String,
      options: [String],
      correctAnswer: Number,
      category: {
        type: String,
        enum: ['interest', 'strength', 'personality']
      }
    }],
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

const Quiz = mongoose.model('Quiz', quizSchema);

module.exports = Quiz;