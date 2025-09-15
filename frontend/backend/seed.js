const mongoose = require('mongoose');
const dotenv = require('dotenv');
const XLSX = require('xlsx');
const Quiz = require('./models/Quiz');
const Course = require('./models/Course');
const College = require('./models/College');
const Timeline = require('./models/Timeline');
const User = require('./models/User');

dotenv.config();

const sampleQuizzes = [
  {
    title: 'Career Aptitude Assessment',
    description: 'Comprehensive quiz to assess your interests, strengths, and personality traits',
    questions: [
      {
        question: 'Which subject interests you the most?',
        options: ['Mathematics and Physics', 'History and Literature', 'Business and Economics', 'Practical skills and technology'],
        correctAnswer: 0,
        category: 'interest'
      },
      {
        question: 'What type of books do you enjoy reading?',
        options: ['Science fiction and technical books', 'Novels and poetry', 'Business biographies', 'How-to guides and manuals'],
        correctAnswer: 0,
        category: 'interest'
      },
      {
        question: 'Which extracurricular activity appeals to you most?',
        options: ['Science club or robotics', 'Debate club or drama', 'Business club', 'Sports or technical workshops'],
        correctAnswer: 0,
        category: 'interest'
      },
      {
        question: 'What comes naturally to you?',
        options: ['Solving complex problems', 'Expressing ideas creatively', 'Managing people and resources', 'Building and fixing things'],
        correctAnswer: 0,
        category: 'strength'
      },
      {
        question: 'How do you prefer to learn?',
        options: ['Through experiments and analysis', 'Through discussion and expression', 'Through real-world application', 'Through structured planning'],
        correctAnswer: 0,
        category: 'strength'
      },
      {
        question: 'What type of projects excite you?',
        options: ['Research and innovation', 'Artistic and design projects', 'Community service initiatives', 'Technical and mechanical work'],
        correctAnswer: 0,
        category: 'strength'
      },
      {
        question: 'How do you handle challenges?',
        options: ['Analyze and find logical solutions', 'Think outside the box', 'Seek help from others', 'Take practical action'],
        correctAnswer: 0,
        category: 'personality'
      },
      {
        question: 'What motivates you most?',
        options: ['Intellectual growth', 'Self-expression', 'Helping others', 'Achieving tangible results'],
        correctAnswer: 0,
        category: 'personality'
      },
      {
        question: 'Your ideal work environment is:',
        options: ['Quiet lab or research facility', 'Creative studio or office', 'Collaborative team setting', 'Hands-on workshop or field'],
        correctAnswer: 0,
        category: 'personality'
      }
    ],
    isActive: true
  }
];

const sampleCourses = [
  {
    name: 'Bachelor of Technology (B.Tech)',
    degree: 'B.Tech',
    stream: 'Engineering',
    duration: 4,
    description: 'Comprehensive engineering program covering core concepts and practical applications.',
    careerPaths: [
      {
        jobTitle: 'Software Engineer',
        industry: 'Technology',
        averageSalary: 800000,
        growthRate: 15,
        requiredSkills: ['Programming', 'Data Structures', 'Algorithms']
      },
      {
        jobTitle: 'Mechanical Engineer',
        industry: 'Manufacturing',
        averageSalary: 600000,
        growthRate: 8,
        requiredSkills: ['CAD', 'Thermodynamics', 'Materials Science']
      }
    ],
    entranceExams: [
      {
        name: 'JEE Main',
        conductingBody: 'NTA',
        frequency: 'Twice a year',
        eligibility: '12th pass with PCM'
      },
      {
        name: 'JEE Advanced',
        conductingBody: 'IITs',
        frequency: 'Once a year',
        eligibility: 'JEE Main qualified'
      }
    ],
    higherEducation: [
      {
        degree: 'M.Tech',
        specializations: ['Computer Science', 'Mechanical', 'Electrical']
      },
      {
        degree: 'MBA',
        specializations: ['Technology Management', 'Operations']
      }
    ],
    entrepreneurship: [
      {
        idea: 'Tech Startup',
        requiredSkills: ['Programming', 'Business Development'],
        potential: 'High growth in software industry'
      }
    ]
  },
  {
    name: 'Bachelor of Science (B.Sc.)',
    degree: 'B.Sc.',
    stream: 'Science',
    duration: 3,
    description: 'Foundation in scientific principles with specialization options.',
    careerPaths: [
      {
        jobTitle: 'Research Scientist',
        industry: 'Research',
        averageSalary: 500000,
        growthRate: 10,
        requiredSkills: ['Research Methodology', 'Data Analysis']
      },
      {
        jobTitle: 'Data Analyst',
        industry: 'Technology',
        averageSalary: 600000,
        growthRate: 20,
        requiredSkills: ['Statistics', 'Python', 'SQL']
      }
    ],
    entranceExams: [
      {
        name: 'CUET',
        conductingBody: 'NTA',
        frequency: 'Once a year',
        eligibility: '12th pass'
      }
    ],
    higherEducation: [
      {
        degree: 'M.Sc',
        specializations: ['Physics', 'Chemistry', 'Mathematics']
      },
      {
        degree: 'MBA',
        specializations: ['Analytics', 'Consulting']
      }
    ],
    entrepreneurship: [
      {
        idea: 'Data Analytics Firm',
        requiredSkills: ['Analytics', 'Business Intelligence'],
        potential: 'Growing demand for data services'
      }
    ]
  },
  {
    name: 'Bachelor of Commerce (B.Com.)',
    degree: 'B.Com.',
    stream: 'Commerce',
    duration: 3,
    description: 'Comprehensive business education covering finance, accounting, and management.',
    careerPaths: [
      {
        jobTitle: 'Chartered Accountant',
        industry: 'Finance',
        averageSalary: 700000,
        growthRate: 12,
        requiredSkills: ['Accounting', 'Taxation', 'Audit']
      },
      {
        jobTitle: 'Financial Analyst',
        industry: 'Banking',
        averageSalary: 650000,
        growthRate: 14,
        requiredSkills: ['Financial Modeling', 'Excel', 'Analysis']
      }
    ],
    entranceExams: [
      {
        name: 'CUET',
        conductingBody: 'NTA',
        frequency: 'Once a year',
        eligibility: '12th pass with Commerce'
      }
    ],
    higherEducation: [
      {
        degree: 'M.Com',
        specializations: ['Finance', 'Accounting']
      },
      {
        degree: 'MBA',
        specializations: ['Finance', 'Marketing']
      }
    ],
    entrepreneurship: [
      {
        idea: 'Financial Consulting',
        requiredSkills: ['Financial Planning', 'Investment Advice'],
        potential: 'Stable demand in financial services'
      }
    ]
  },
  {
    name: 'Bachelor of Arts (B.A.)',
    degree: 'B.A.',
    stream: 'Arts',
    duration: 3,
    description: 'Liberal arts education fostering critical thinking and communication skills.',
    careerPaths: [
      {
        jobTitle: 'Content Writer',
        industry: 'Media',
        averageSalary: 400000,
        growthRate: 18,
        requiredSkills: ['Writing', 'Research', 'SEO']
      },
      {
        jobTitle: 'Teacher',
        industry: 'Education',
        averageSalary: 350000,
        growthRate: 6,
        requiredSkills: ['Communication', 'Subject Knowledge']
      }
    ],
    entranceExams: [
      {
        name: 'CUET',
        conductingBody: 'NTA',
        frequency: 'Once a year',
        eligibility: '12th pass'
      }
    ],
    higherEducation: [
      {
        degree: 'M.A.',
        specializations: ['English', 'History', 'Psychology']
      },
      {
        degree: 'MBA',
        specializations: ['HR', 'Marketing']
      }
    ],
    entrepreneurship: [
      {
        idea: 'Content Creation Agency',
        requiredSkills: ['Writing', 'Digital Marketing'],
        potential: 'Growing digital content market'
      }
    ]
  }
];

const sampleColleges = (() => {
  const workbook = XLSX.readFile('College-Affiliated College.xlsx');
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(sheet, {header: 1});
  
  // Skip first two rows (date and headers)
  const data = rawData.slice(2);
  
  return data.filter(row => row[1] && row[1] !== 'Name').map(row => {
    const management = row[8] || '';
    let type = 'Private';
    if (management.toLowerCase().includes('government') || 
        management.toLowerCase().includes('state') || 
        management.toLowerCase().includes('central') || 
        management.toLowerCase().includes('local body') ||
        management.toLowerCase().includes('university')) {
      type = 'Government';
    }
    return {
      name: row[1], // Name
      type: type,
      location: {
        city: row[3], // District
        state: row[2], // State
        address: `${row[1]}, ${row[3]}, ${row[2]}`,
        pincode: '',
        coordinates: { lat: 0, lng: 0 }
      },
      programs: [],
      facilities: {
        hostel: false,
        library: false,
        lab: false,
        internet: false,
        sports: false
      },
      contact: {
        website: row[4] || ''
      },
      rating: 0
    };
  });
})();

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: 'Zariya'
    });

    console.log('Connected to MongoDB');

    // Clear existing data
    await Quiz.deleteMany({});
    await Course.deleteMany({});
    await College.deleteMany({});
    await Timeline.deleteMany({});

    console.log('Cleared existing data');

    // Insert sample data
    await Quiz.insertMany(sampleQuizzes);
    console.log('Inserted quizzes');

    await Course.insertMany(sampleCourses);
    console.log('Inserted courses');

    await College.insertMany(sampleColleges);
    console.log('Inserted colleges');

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();