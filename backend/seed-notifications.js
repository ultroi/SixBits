const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Notification = require('./models/Notification');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/Zariya';

const sampleNotifications = [
  {
    title: 'JEE Main 2024 Registration Open',
    message: 'Registration for JEE Main 2024 has started. Complete your registration by December 31st.',
    type: 'exam',
    actionUrl: '/timeline',
  },
  {
    title: 'New Scholarship Available',
    message: 'A new merit-based scholarship for engineering students has been announced. Check eligibility.',
    type: 'scholarship',
    actionUrl: '/colleges',
  },
  {
    title: 'Your Quiz Results',
    message: 'Your aptitude quiz results are ready! You scored 92% and matched with 5 career paths.',
    type: 'quiz',
    actionUrl: '/quiz',
  },
  {
    title: 'Application Deadline Reminder',
    message: 'Applications for Delhi University BCA program close in 3 days. Don\'t miss out!',
    type: 'admission',
    actionUrl: '/colleges',
  },
  {
    title: 'Course Recommendation',
    message: 'Based on your profile, we recommend "Introduction to Data Science" course from Coursera.',
    type: 'course',
    actionUrl: '/courses',
  },
  {
    title: 'College Fair Registration',
    message: 'Online college fair happening this weekend. Register to talk with admissions officers.',
    type: 'college',
    actionUrl: '/colleges',
  },
  {
    title: 'Career Roadmap Updated',
    message: 'Your personalized career roadmap has been updated based on your latest assessment.',
    type: 'general',
    actionUrl: '/dashboard',
  },
];

async function seedNotifications() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Get all users
    const User = require('./models/User');
    const users = await User.find().limit(5);

    if (users.length === 0) {
      console.log('No users found. Please create some users first.');
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log(`Found ${users.length} users. Creating notifications...`);

    // Create notifications for each user
    for (const user of users) {
      for (const notificationData of sampleNotifications) {
        const notification = new Notification({
          userId: user._id,
          ...notificationData,
          read: Math.random() > 0.5,
        });

        await notification.save();
      }

      console.log(`✓ Created ${sampleNotifications.length} notifications for user ${user.email}`);
    }

    console.log('✓ Notifications seeded successfully!');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding notifications:', error);
    process.exit(1);
  }
}

// Run the seed
seedNotifications();
