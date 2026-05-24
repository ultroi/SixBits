@echo off
REM Development Environment Switcher for Zariya
REM Usage: dev-switch.bat [local|vercel]

if "%1"=="local" goto local
if "%1"=="vercel" goto vercel
goto usage

:local
echo 🔧 Switching to LOCAL DEVELOPMENT mode...
echo REACT_APP_API_URL=http://localhost:5000/api > frontend\.env
echo MONGODB_URI=mongodb://127.0.0.1:27017/Zariya > backend\.env
echo JWT_SECRET=your_jwt_secret_key_here>> backend\.env
echo PORT=5000>> backend\.env
echo ✅ Frontend configured for local backend (http://localhost:5000/api)
echo ✅ Backend configured for local MongoDB (mongodb://127.0.0.1:27017/Zariya)
echo 🚀 Run 'npm start' to start both frontend and backend
goto end

:vercel
echo 🌐 Switching to VERCEL PRODUCTION mode...
echo # REACT_APP_API_URL=/api > frontend\.env
echo # MONGODB_URI=your_mongodb_connection_string > backend\.env
echo # JWT_SECRET=your_jwt_secret_key_here>> backend\.env
echo # PORT=5000>> backend\.env
echo ✅ Frontend configured for Vercel deployment (/api)
echo 🚀 Ready for Vercel deployment
goto end

:usage
echo ❌ Usage: dev-switch.bat [local^|vercel]
echo    local  - Configure for local development
echo    vercel - Configure for Vercel production
exit /b 1

:end
echo 🎉 Environment switched successfully!