@echo off
echo Setting up Supabase Storage for lesson content...
echo.

echo Please run the following SQL script in your Supabase SQL Editor:
echo.
echo File: setup-supabase-storage.sql
echo.
echo This will:
echo 1. Create a 'lesson-content' storage bucket
echo 2. Set it as public (files can be accessed directly)
echo 3. Configure file size limit (50MB)
echo 4. Allow common file types (PDF, DOC, images, videos, audio)
echo 5. Set up RLS policies for access control
echo.

echo After running the SQL script:
echo 1. Go to your Supabase dashboard
echo 2. Navigate to Storage section
echo 3. You should see the 'lesson-content' bucket
echo 4. Test file upload in the admin panel
echo.

pause











