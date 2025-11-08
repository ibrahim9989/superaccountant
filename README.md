# Super Accountant LMS

A comprehensive Learning Management System designed to train and certify individuals as "Super Accountants" through a rigorous 45-day course.

## Features

- **Google OAuth Authentication** through Supabase
- **Mandatory Profile Form** with comprehensive validation
- **Pre-enrollment Assessment System** (MCQ + AI Interview)
- **45-day Course Structure** with daily tests
- **Anti-cheating Measures** for certification exams
- **Admin Panel** for content and user management
- **Progress Tracking** and analytics

## Tech Stack

- **Frontend**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS
- **Backend & Database**: Supabase
- **Authentication**: Supabase Auth with Google OAuth
- **Form Validation**: React Hook Form + Zod
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Google OAuth credentials

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd superaccountant
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Go to Settings > API to get your project URL and anon key
   - Go to Authentication > Providers and enable Google OAuth
   - Configure Google OAuth with your Google Cloud Console credentials

4. **Environment Variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

5. **Database Setup**
   - Run the SQL commands from `supabase-schema.sql` in your Supabase SQL editor
   - This will create all necessary tables, RLS policies, and triggers

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Deploying to Vercel

1. Push the repository to GitHub (already configured).
2. In Vercel, import the GitHub repo `ibrahim9989/superaccountant`.
3. Set Environment Variables for all environments (Preview/Production):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (Server-side only)
4. Framework preset: Next.js (auto-detected). No custom build output directory needed.
5. Build & Install commands (auto or from `vercel.json`):
   - Install: `npm ci`
   - Build: `npm run build`
6. Start the first deployment. Subsequent pushes to `main` will auto-deploy.

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── auth/              # Authentication routes
│   ├── dashboard/         # User dashboard
│   ├── login/             # Login page
│   ├── profile/           # Profile completion page
│   └── layout.tsx         # Root layout with AuthProvider
├── components/            # Reusable React components
│   └── ProfileForm.tsx    # Comprehensive profile form
├── contexts/              # React contexts
│   └── AuthContext.tsx    # Authentication context
├── lib/                   # Utility libraries
│   ├── supabase/          # Supabase client configurations
│   └── validations/       # Zod validation schemas
└── middleware.ts          # Next.js middleware for auth
```

## Database Schema

The application uses the following main tables:

- **profiles**: User profile information
- **user_enrollment**: Enrollment status and assessment results
- **mcq_assessments**: Pre-enrollment MCQ test results
- **ai_interview_sessions**: AI interview data and analysis
- **course_progress**: Daily course progress tracking
- **daily_tests**: Daily test results
- **certification_tests**: Final certification exam results
- **certifications**: Issued certifications
- **admin_users**: Admin user management

## Authentication Flow

1. User visits the application
2. Redirected to login page if not authenticated
3. Google OAuth login through Supabase
4. Redirected to profile completion if profile is incomplete
5. Redirected to dashboard after profile completion

## Profile Form

The mandatory profile form includes:

- **Personal Information**: Name, email, phone, date of birth
- **Address Information**: Full address details
- **Professional Information**: Education, work experience, current occupation
- **Motivation & Goals**: Why they want to become a Super Accountant
- **Emergency Contact**: Contact information for emergencies

## Next Steps

This is the foundation of the Super Accountant LMS. Future development will include:

1. **Pre-enrollment Assessment System**
   - MCQ test with 50-60 questions
   - AI-powered interview system
   - Admin review and approval process

2. **Course Management System**
   - 45-day structured course
   - Video lectures and materials
   - Daily tests and progress tracking

3. **Certification System**
   - Final comprehensive exam
   - Anti-cheating measures
   - Certificate generation

4. **Admin Panel**
   - User management
   - Content management
   - Analytics and reporting

5. **Payment Integration**
   - Razorpay integration for course fees

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is proprietary software. All rights reserved.

## Support

For support and questions, please contact the development team.