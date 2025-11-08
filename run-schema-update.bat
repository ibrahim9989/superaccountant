@echo off
echo Updating lesson_content schema to support file uploads...
echo.

REM You'll need to run this SQL script in your Supabase SQL editor or psql
echo Please run the following SQL script in your Supabase SQL editor:
echo.
echo File: update-lesson-content-schema.sql
echo.
echo This will add the following columns to lesson_content table:
echo - file_path: Path to uploaded file in storage
echo - file_name: Original filename of uploaded file  
echo - mime_type: MIME type of the content
echo - upload_source: Source of content (url, file_upload, embed)
echo.

pause











