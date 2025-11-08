@echo off
echo ========================================
echo  SUPER ACCOUNTANT GRANDTEST SETUP
echo ========================================
echo.

echo Setting up Grandtest for: Super Accountant Professional Certification
echo Course ID: 660e8400-e29b-41d4-a716-446655440001
echo.

echo STEP 1: Run Database Schema
echo ============================
echo Please run these SQL scripts in your Supabase SQL Editor:
echo.
echo 1. create-grandtest-schema.sql
echo 2. setup-certificate-storage.sql
echo.

echo STEP 2: Create Sample Questions
echo ================================
echo Run setup-sample-grandtest-questions.sql
echo This will create 60 accounting-focused questions:
echo - 20 Multiple Choice questions
echo - 20 True/False questions  
echo - 10 Fill-in-the-Blank questions
echo - 10 Essay questions
echo.

echo STEP 3: Verify Setup
echo ====================
echo After running the questions script, verify with:
echo.
echo SELECT COUNT(*) FROM grandtest_questions 
echo WHERE course_id = '660e8400-e29b-41d4-a716-446655440001';
echo.
echo Expected result: 60 questions
echo.

echo STEP 4: Test the System
echo =======================
echo 1. Complete all lessons and quizzes in the course
echo 2. The GrandtestTrigger component will appear
echo 3. Take the Grandtest (60 questions, 60 minutes)
echo 4. Pass with 90%% to get certificate
echo.

echo GRANDTEST DETAILS:
echo ==================
echo - 60 questions covering accounting fundamentals
echo - 60 minutes time limit (1 minute per question)
echo - 90%% passing score (54/60 correct)
echo - 24-hour cooldown between attempts
echo - Automatic certificate generation upon passing
echo.

echo Ready to set up your Super Accountant Grandtest!
echo.

pause


