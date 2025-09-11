# Zariya - AI Career Counseling Platform

A comprehensive career guidance platform that helps students make informed decisions about their education and career paths through AI-powered recommendations, aptitude assessments, and personalized guidance.

## Features

### 🎯 Aptitude & Interest-Based Course Suggestion
- Comprehensive quiz assessing interests, strengths, and personality traits
- AI-driven course recommendations based on quiz results
- Career path comparisons and suggestions

### 📊 Course-to-Career Path Mapping
- Visual charts showing degree-to-career mappings
- Industry insights and job market trends
- Salary information and growth projections
- Required skills and certifications

### 🏛️ Nearby Government Colleges Directory
- Location-based college search
- Detailed college information including programs, cut-offs, facilities
- Contact information and application links
- Facility filters (hostel, library, labs, etc.)

### 📅 Timeline Tracker
- Personalized timeline management
- Important dates tracking (admissions, exams, scholarships)
- Notification system for upcoming deadlines
- Progress tracking and reminders

### 🎨 Customization and Personalization
- User profile creation with age, gender, class, interests
- AI-driven recommendations based on profile
- Personalized study materials and career suggestions
- Adaptive learning paths

### 💬 AI-Powered Career Counseling
- Interactive chat interface with Gemini AI
- Context-aware conversations using user profile
- Memory retention for consistent guidance
- Personalized recommendations integration

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Google Generative AI** for AI responses

### Frontend
- **React** with React Router
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Axios** for API calls
- **React Toastify** for notifications

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager
- Google AI API key for Gemini

## Installation

### 1. Clone the Repository
```bash
git clone https://github.com/ultroi/SixBits.git
cd SixBits
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Update .env with your configuration
MONGODB_URI=mongodb://localhost:27017/Zariya
JWT_SECRET=your_jwt_secret_here
GOOGLE_AI_API_KEY=your_google_ai_api_key
PORT=5000
```

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install
```

### 4. Database Setup

```bash
cd ../backend

# Seed the database with sample data
npm run seed
```

## Running the Application

### Development Mode

#### Backend
```bash
cd backend
npm run dev
```
Server will run on http://localhost:5000

#### Frontend
```bash
cd frontend
npm start
```
Application will run on http://localhost:3000

### Production Mode

#### Backend
```bash
cd backend
npm start
```

#### Frontend
```bash
cd frontend
npm run build
# Serve the build folder using any static server
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration with profile
- `POST /api/auth/login` - User login

### Quiz
- `GET /api/quiz` - Get all quizzes
- `GET /api/quiz/:id` - Get quiz by ID
- `POST /api/quiz/submit` - Submit quiz answers

### Courses
- `GET /api/courses` - Get courses (with filters)
- `GET /api/courses/:id` - Get course by ID
- `GET /api/courses/:id/career-paths` - Get career paths for course

### Colleges
- `GET /api/colleges` - Get colleges (with filters)
- `GET /api/colleges/location` - Get colleges by location
- `GET /api/colleges/:id` - Get college by ID

### Timeline
- `GET /api/timeline/:userId` - Get user timeline
- `POST /api/timeline` - Create timeline entry
- `PUT /api/timeline/:id` - Update timeline entry
- `DELETE /api/timeline/:id` - Delete timeline entry
- `GET /api/timeline/:userId/upcoming` - Get upcoming events

### Chat
- `POST /api/chat/message` - Send message to AI

## User Flow

1. **Landing Page** → Introduction to Zariya platform
2. **Signup/Login** → Create account with profile information
3. **Dashboard** → Central hub with personalized recommendations
4. **Aptitude Quiz** → Take comprehensive assessment
5. **Course Explorer** → Browse courses with career mappings
6. **College Directory** → Find nearby government colleges
7. **Timeline Manager** → Track important dates and deadlines
8. **AI Chat** → Get personalized career guidance

## Database Models

### User
- Personal information (name, email, age, gender, class)
- Academic interests
- Quiz results history
- Location coordinates

### Quiz
- Questions with multiple choice options
- Categories (interest, strength, personality)
- Scoring system

### Course
- Degree and stream information
- Career paths with salary data
- Entrance exams and eligibility
- Higher education options
- Entrepreneurship opportunities

### College
- Location and contact information
- Programs offered with cut-offs
- Facilities and ratings
- Government/Private classification

### Timeline
- User-specific events
- Types (exam, admission, scholarship, etc.)
- Priority levels and completion status
- Reminder system

## Features in Detail

### Aptitude Assessment
- 9 comprehensive questions across 3 categories
- Visual results with percentage breakdowns
- AI-powered course recommendations
- Results stored in user profile

### Course Recommendations
- Filter by stream, degree, duration
- Career path visualization with salary data
- Required skills and growth projections
- Entrance exam information

### College Search
- Location-based search (within 50km radius)
- Facility filters (hostel, library, labs, internet, sports)
- Program-specific search
- Direct application links and contact information

### Timeline Management
- Automated event creation from quiz/course selections
- Priority-based notifications (high/medium/low)
- Progress tracking and completion status
- Custom event addition with date reminders

### AI Personalization
- Context-aware conversations using user profile
- Quiz result integration for recommendations
- Personalized study plans and career advice
- Memory retention across sessions

## Project Structure

### Frontend
```
frontend/
  ├── public/
  ├── src/
  │   ├── components/    # Reusable UI components
  │   ├── context/       # React context for state management
  │   ├── pages/         # Page components (Dashboard, Quiz, Courses, etc.)
  │   ├── services/      # API service functions
  │   ├── App.js         # Main application component
  │   └── index.js       # Application entry point
  └── package.json
```

### Backend
```
backend/
  ├── controllers/       # Request handlers
  ├── middleware/        # Custom middleware functions
  ├── models/            # MongoDB models
  ├── routes/            # API routes
  ├── services/          # Business logic services
  ├── server.js          # Server entry point
  ├── seed.js            # Database seeding script
  └── package.json
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please contact the development team or create an issue in the repository.

---

**Made with ❤️ for career growth**
