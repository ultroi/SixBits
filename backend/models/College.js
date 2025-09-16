const mongoose = global.mongoose;

const collegeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    location: {
      address: String,
      city: String,
      state: String,
      pincode: String,
      coordinates: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point'
        },
        coordinates: {
          type: [Number],
          default: [0, 0]
        }
      }
    },
    type: {
      type: String,
      enum: ['Government', 'Private'],
      required: true
    },
    programs: [{
      name: String,
      degree: String,
      duration: Number,
      cutOff: Number,
      eligibility: String,
      medium: String,
      fees: Number
    }],
    facilities: {
      hostel: Boolean,
      library: Boolean,
      lab: Boolean,
      internet: Boolean,
      sports: Boolean
    },
    contact: {
      phone: String,
      email: String,
      website: String
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Index for location-based queries
collegeSchema.index({ 'location.coordinates': '2dsphere' });

const College = mongoose.model('College', collegeSchema);

module.exports = College;