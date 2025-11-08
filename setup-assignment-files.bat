@echo off
echo Setting up assignment storage and sample files...

echo.
echo Step 1: Creating storage bucket...
echo Please run the following SQL in your Supabase dashboard:
echo.
echo -- Run setup-assignment-storage.sql
echo.
echo Step 2: Creating sample assignment files...
echo.

REM Create the content directory if it doesn't exist
if not exist "public\uploads\content" mkdir "public\uploads\content"

REM Create sample case study file
echo Creating sample case study file...
(
echo # ABC Bakery - Small Business Case Study
echo.
echo ## Business Overview
echo ABC Bakery is a small family-owned business that has been operating for 3 years.
echo.
echo ## Assignment Questions
echo 1. Identify the business type and main activities of ABC Bakery.
echo 2. List all assets, liabilities, and equity items mentioned.
echo 3. Analyze the revenue and expense transactions.
echo 4. Prepare a simple income statement.
echo 5. Calculate financial ratios.
echo 6. Provide recommendations for better record keeping.
echo.
echo Note: This is a sample case study for testing purposes.
) > "public\uploads\content\abc-bakery-case-study.pdf"

REM Create sample analysis worksheet
echo Creating sample analysis worksheet...
(
echo Assignment Analysis Worksheet
echo.
echo Business Name: ________________
echo Business Type: ________________
echo.
echo Assets:
echo - Cash: $______
echo - Accounts Receivable: $______
echo - Inventory: $______
echo - Equipment: $______
echo.
echo Liabilities:
echo - Accounts Payable: $______
echo - Bank Loan: $______
echo.
echo Equity:
echo - Owner's Equity: $______
echo.
echo Financial Ratios:
echo - Current Ratio: ________________
echo - Debt-to-Equity Ratio: ________________
) > "public\uploads\content\analysis-worksheet.xlsx"

REM Create sample XYZ company data
echo Creating sample XYZ company data...
(
echo XYZ Company Financial Data
echo.
echo Assets: $500,000
echo Liabilities: $200,000
echo Equity: $300,000
echo.
echo Revenue: $1,000,000
echo Expenses: $800,000
echo Net Income: $200,000
echo.
echo This is sample data for assignment purposes.
) > "public\uploads\content\xyz-company-data.pdf"

echo.
echo Sample files created in public\uploads\content\
echo.
echo Files created:
echo - abc-bakery-case-study.pdf
echo - analysis-worksheet.xlsx
echo - xyz-company-data.pdf
echo.
echo Next steps:
echo 1. Run setup-assignment-storage.sql in Supabase
echo 2. Upload these files to your Supabase storage bucket
echo 3. Update assignment URLs in the database
echo.
pause











