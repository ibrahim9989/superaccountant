@echo off
echo Setting up Grandtest System...
echo.

echo Step 1: Creating Grandtest Database Schema...
echo Please run the following SQL script in your Supabase SQL Editor:
echo.
echo File: create-grandtest-schema.sql
echo.
echo This will create:
echo - grandtest_questions table
echo - grandtest_attempts table  
echo - grandtest_responses table
echo - certificates table
echo - course_completion_status table
echo - RLS policies and functions
echo.

echo Step 2: Setting up Sample Questions...
echo After running the schema, update the course_id in setup-sample-grandtest-questions.sql
echo and run it to create 60 sample questions.
echo.

echo Step 3: Next Steps...
echo 1. Replace 'your-course-id' with actual course UUID in setup-sample-grandtest-questions.sql
echo 2. Run the sample questions script
echo 3. Test the Grandtest system
echo.

echo IMPORTANT: Make sure to replace 'your-course-id' with your actual course UUID!
echo You can find your course ID by running: SELECT id, title FROM courses;
echo.

pause


