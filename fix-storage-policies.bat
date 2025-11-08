@echo off
echo Fixing Supabase Storage RLS Policies for Assignment Attachments...
echo.

echo Please run the following SQL script in your Supabase SQL Editor:
echo.
echo 1. Go to your Supabase Dashboard
echo 2. Navigate to SQL Editor
echo 3. Copy and paste the contents of fix-assignment-storage-policies.sql
echo 4. Execute the script
echo.

echo The script will:
echo - Create the assignment-attachments storage bucket if it doesn't exist
echo - Set up proper RLS policies for file uploads
echo - Allow authenticated users to upload to content/ and submissions/ folders
echo - Allow public access to view files
echo.

echo After running the SQL script, try uploading assignment files again.
echo.

pause











