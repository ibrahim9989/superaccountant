# PowerShell script to fix quiz questions and daily test functionality
# This script provides instructions for running the SQL fix

Write-Host "Super Accountant - Quiz Questions Fix" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""

Write-Host "This script will help you fix the missing 'Start Quiz' button issue." -ForegroundColor Yellow
Write-Host ""

Write-Host "To fix the issue, you need to run the SQL script in your Supabase dashboard:" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Open your Supabase project dashboard" -ForegroundColor White
Write-Host "2. Go to the SQL Editor" -ForegroundColor White
Write-Host "3. Copy and paste the contents of 'fix-quiz-questions-complete.sql'" -ForegroundColor White
Write-Host "4. Click 'Run' to execute the script" -ForegroundColor White
Write-Host ""

Write-Host "The script will:" -ForegroundColor Yellow
Write-Host "- Fix RLS (Row Level Security) policies for quiz tables" -ForegroundColor White
Write-Host "- Create sample quiz questions if they don't exist" -ForegroundColor White
Write-Host "- Create sample daily test configurations" -ForegroundColor White
Write-Host "- Link questions to daily tests" -ForegroundColor White
Write-Host ""

Write-Host "After running the SQL script:" -ForegroundColor Cyan
Write-Host "1. Start your development server: npm run dev" -ForegroundColor White
Write-Host "2. Go to http://localhost:3000/debug" -ForegroundColor White
Write-Host "3. Test the 'Quiz Questions Access' and 'Daily Test Config Access' buttons" -ForegroundColor White
Write-Host "4. Navigate to your course and check if the 'Start Quiz' button appears" -ForegroundColor White
Write-Host ""

Write-Host "If you need help accessing your Supabase dashboard:" -ForegroundColor Yellow
Write-Host "- Go to https://supabase.com/dashboard" -ForegroundColor White
Write-Host "- Select your project" -ForegroundColor White
Write-Host "- Click on 'SQL Editor' in the left sidebar" -ForegroundColor White
Write-Host ""

$response = Read-Host "Press Enter to continue or type 'exit' to quit"
if ($response -eq "exit") {
    Write-Host "Exiting..." -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "Opening the SQL fix file for you to copy..." -ForegroundColor Green
Write-Host ""

# Try to open the SQL file
$sqlFile = "fix-quiz-questions-complete.sql"
if (Test-Path $sqlFile) {
    try {
        Start-Process notepad.exe -ArgumentList $sqlFile
        Write-Host "SQL file opened in Notepad. Copy the contents and paste them into your Supabase SQL Editor." -ForegroundColor Green
    } catch {
        Write-Host "Could not open the file automatically. Please open 'fix-quiz-questions-complete.sql' manually." -ForegroundColor Yellow
    }
} else {
    Write-Host "SQL file not found. Please check that 'fix-quiz-questions-complete.sql' exists in the current directory." -ForegroundColor Red
}

Write-Host ""
Write-Host "After running the SQL script, test your application at:" -ForegroundColor Cyan
Write-Host "http://localhost:3000/debug" -ForegroundColor White
Write-Host ""
Write-Host "Good luck!" -ForegroundColor Green

