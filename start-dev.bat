@echo off
echo 🚀 Starting Local Events Development Server...
echo.

REM Kill any existing processes on port 5000
echo Checking for existing processes on port 5000...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5000" ^| find "LISTENING"') do (
    echo Killing process %%a
    taskkill /f /pid %%a >nul 2>&1
)

REM Clear Next.js cache for fresh start
echo Clearing Next.js cache...
if exist ".next" rmdir /s /q .next

REM Install dependencies if needed
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
)

REM Push database schema if needed
echo Ensuring database is up to date...
npx prisma db push --accept-data-loss

REM Start the development server
echo.
echo 🎯 Starting server on http://localhost:5000
echo    - Homepage: http://localhost:5000
echo    - Events: http://localhost:5000/events  
echo    - Sign In: http://localhost:5000/auth/signin
echo.
echo Press Ctrl+C to stop the server
echo.

npm run dev