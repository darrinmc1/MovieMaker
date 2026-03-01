@echo off
cd /d C:\Users\Client\Desktop\MovieMaker
git add app\ components\ pipeline\ public\ .gitignore
git commit -m "session update %date% %time%"
git push origin feature/moviemaker-v2
echo.
echo Done! Changes pushed to GitHub.
pause
