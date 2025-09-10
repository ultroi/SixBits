# Zariya - AI Career Counseling Platform

Zariya is an AI-powered career counseling platform that provides personalized career guidance and advice using Google's Gemini 1.5 Flash model.

## Features

- Interactive landing page with modern design
- User authentication (signup and login)
- ChatGPT-like interface for career counseling
- AI-powered responses using Gemini 1.5 Flash
- Memory retention for consistent conversations
- Responsive design for all devices

## Tech Stack

### Frontend
- React.js
- Tailwind CSS
- React Router DOM
- Axios for API requests
- React Toastify for notifications
- React Icons

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- Google Generative AI (Gemini 1.5 Flash)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Google AI API key for Gemini

### ESLint Warnings

If you encounter ESLint warnings about anchor tags (`<a href="#">`), you can fix them by:

1. Replacing anchor tags with buttons:
   ```jsx
   // Instead of
   <a href="#" className="...">Text</a>
   
   // Use
   <button type="button" className="...">Text</button>
   ```

2. Or add proper routes/URLs to your anchor tags:
   ```jsx
   <Link to="/about" className="...">About</Link>
   ```

3. Or disable specific ESLint rules in the component:
   ```jsx
   // eslint-disable-next-line jsx-a11y/anchor-is-valid
   <a href="#" className="...">Text</a>
   ```

### Installation

1. Clone the repository
```
git clone <repository-url>
cd zariya
```

2. Install frontend dependencies
```
cd frontend
npm install
```

3. Install backend dependencies
```
cd ../backend
npm install
```

4. Configure environment variables
   - Create `.env` file in the backend folder
   - Add the following variables:
   ```
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   GEMINI_API_KEY=your_gemini_api_key
   ```

5. Run the application
   - Start the backend
   ```
   cd backend
   npm run dev
   ```
   - Start the frontend in a new terminal
   ```
   cd frontend
   npm start
   ```

6. Access the application at `http://localhost:3000`

## Project Structure

### Frontend
```
frontend/
  ├── public/
  ├── src/
  │   ├── components/    # Reusable UI components
  │   ├── context/       # React context for state management
  │   ├── pages/         # Page components
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
  └── package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Chat
- `POST /api/chat` - Send a message and get AI response
- `GET /api/chat/history` - Get user's chat history

## License

MIT

---

Created with ❤️ by [Your Name]
