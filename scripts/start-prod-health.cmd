@echo off
setlocal
set PORT=3010
echo == Local Events: Build + Start + Health ==
where npm >nul 2>&1 || (echo npm not found & exit /b 1)

if exist package-lock.json (
  echo Installing deps (ci)...
  call npm ci
) else (
  echo Installing deps...
  call npm install
)

echo Prisma generate + db push...
call npm run db:generate || goto :error
call npm run db:push || goto :error
echo Seeding sample data...
call npm run db:seed

echo Building Next.js...
call npm run build || goto :error

echo Starting Next.js on http://localhost:%PORT%/admin/health
start "LocalEvents" cmd /c node node_modules/next/dist/bin/next start -p %PORT%
timeout /t 2 >nul
start "" http://localhost:%PORT%/admin/health
echo Launched. Press any key to exit this window.
pause >nul
exit /b 0

:error
echo Failed. Check logs above.
pause
exit /b 1

