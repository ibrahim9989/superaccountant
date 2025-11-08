@echo off
echo ========================================
echo    GRANDTEST SYSTEM SETUP
echo ========================================
echo.

echo This script will guide you through setting up the complete Grandtest system.
echo.

echo STEP 1: Database Schema Setup
echo =============================
echo Please run the following SQL scripts in your Supabase SQL Editor:
echo.
echo 1. create-grandtest-schema.sql
echo    - Creates all Grandtest tables
echo    - Sets up RLS policies
echo    - Creates helper functions
echo.
echo 2. setup-certificate-storage.sql
echo    - Creates certificate storage bucket
echo    - Sets up storage policies
echo.

echo STEP 2: Sample Data Setup
echo ==========================
echo After running the schema scripts:
echo.
echo 1. Update setup-sample-grandtest-questions.sql:
echo    - Replace 'your-course-id' with actual course UUID
echo    - Run the script to create 60 sample questions
echo.

echo STEP 3: Component Integration
echo =============================
echo Add the following components to your application:
echo.
echo 1. Add GrandtestTrigger to your learning page:
echo    - Import: import GrandtestTrigger from '@/components/GrandtestTrigger'
echo    - Add component with courseId, enrollmentId, userId props
echo.
echo 2. Add AdminGrandtestManagement to your admin panel:
echo    - Import: import AdminGrandtestManagement from '@/components/admin/AdminGrandtestManagement'
echo    - Add to admin navigation
echo.

echo STEP 4: Service Integration
echo ===========================
echo The following services are ready to use:
echo.
echo - GrandtestService: Core Grandtest functionality
echo - CourseCompletionService: Course completion detection
echo - CertificateService: Certificate generation and verification
echo.

echo STEP 5: Testing
echo ===============
echo Test the system by:
echo.
echo 1. Creating a course with lessons and quizzes
echo 2. Completing all lessons and quizzes
echo 3. Taking the Grandtest
echo 4. Verifying certificate generation
echo.

echo GRANDTEST SYSTEM FEATURES:
echo ==========================
echo.
echo ✅ 60 questions (all types: multiple choice, essay, true/false, fill-in-blank)
echo ✅ 60-minute time limit (1 minute per question)
echo ✅ 90%% passing score requirement
echo ✅ 24-hour cooldown between attempts
echo ✅ Course completion detection
echo ✅ Automatic certificate generation
echo ✅ Digital certificate verification
echo ✅ Admin question management
echo ✅ Comprehensive statistics
echo.

echo IMPORTANT NOTES:
echo ================
echo.
echo 1. Make sure to replace 'your-course-id' in setup-sample-grandtest-questions.sql
echo 2. Test the system thoroughly before going live
echo 3. Monitor certificate storage usage
echo 4. Set up proper backup procedures
echo.

echo Setup complete! Your Grandtest system is ready to use.
echo.

pause


