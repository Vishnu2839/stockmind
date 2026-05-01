@echo off
echo Starting 100%% Free Cloud Deployment...
echo.

cd /d "c:\Users\LENOVO\OneDrive\Desktop\stockmind"

echo Adding all changes to GitHub...
git add .
git commit -m "Automated deployment update"

echo.
echo Pushing to GitHub...
git push origin main

echo.
echo ========================================================
echo Deployment Triggered Successfully!
echo ========================================================
echo 1. GitHub will now automatically deploy the Frontend to Vercel.
echo 2. GitHub Actions will push the Backend to Hugging Face Spaces.
echo.
echo You can check the progress on your GitHub repository.
echo ========================================================
pause
