@echo off
echo Setting up Super Accountant Assessment Database...
echo.

echo Step 1: Creating database schema...
psql -h your-supabase-host -U postgres -d postgres -f mcq-database-schema.sql

echo.
echo Step 2: Setting up assessment questions...
psql -h your-supabase-host -U postgres -d postgres -f setup-assessment-database.sql

echo.
echo Step 3: Inserting answer options...
psql -h your-supabase-host -U postgres -d postgres -f insert-answer-options.sql

echo.
echo Step 4: Creating test rules...
psql -h your-supabase-host -U postgres -d postgres -f setup-complete-assessment.sql

echo.
echo Database setup complete!
echo You can now run the assessment system.
pause



