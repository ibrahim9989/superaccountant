import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase environment variables');
}

// Admin client with service role (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl as string, serviceKey as string, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Certificate ID is required' },
        { status: 400 }
      );
    }

    console.log('📜 Fetching certificate:', id);

    // Fetch certificate using admin client (bypasses RLS)
    const { data: certificate, error: certError } = await supabaseAdmin
      .from('certificates')
      .select(`
        *,
        course:course_id (
          id,
          title,
          description
        )
      `)
      .eq('id', id)
      .eq('is_valid', true)
      .maybeSingle();

    if (certError || !certificate) {
      console.error('Error fetching certificate:', certError);
      return NextResponse.json(
        { error: 'Certificate not found' },
        { status: 404 }
      );
    }

    // Fetch user profile
    let userName = 'Student';
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', certificate.user_id)
      .maybeSingle();

    if (profile) {
      const firstName = profile.first_name || '';
      const lastName = profile.last_name || '';
      userName = `${firstName} ${lastName}`.trim() || 'Student';
    }

    const courseTitle = (certificate as any).course?.title || 'Course Certificate';
    const issuedDate = new Date(certificate.issued_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Generate certificate HTML
    const certificateHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Certificate of Completion</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            margin: 0;
            padding: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .certificate {
            background: white;
            padding: 60px;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 800px;
            width: 100%;
            position: relative;
            border: 8px solid #f8f9fa;
        }
        .certificate::before {
            content: '';
            position: absolute;
            top: 20px;
            left: 20px;
            right: 20px;
            bottom: 20px;
            border: 2px solid #667eea;
            border-radius: 10px;
            pointer-events: none;
        }
        .header {
            margin-bottom: 40px;
        }
        .title {
            font-size: 48px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
        }
        .subtitle {
            font-size: 24px;
            color: #7f8c8d;
            margin-bottom: 20px;
        }
        .award-text {
            font-size: 20px;
            color: #34495e;
            margin-bottom: 30px;
            line-height: 1.6;
        }
        .name {
            font-size: 36px;
            font-weight: bold;
            color: #667eea;
            margin: 30px 0;
            text-decoration: underline;
            text-decoration-color: #667eea;
            text-decoration-thickness: 3px;
        }
        .course {
            font-size: 28px;
            color: #2c3e50;
            margin: 20px 0;
            font-weight: 600;
        }
        .date {
            font-size: 18px;
            color: #7f8c8d;
            margin: 30px 0;
        }
        .verification {
            margin-top: 40px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 10px;
            border-left: 5px solid #667eea;
        }
        .verification-title {
            font-size: 16px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 10px;
        }
        .verification-code {
            font-family: 'Courier New', monospace;
            font-size: 14px;
            color: #667eea;
            background: white;
            padding: 10px;
            border-radius: 5px;
            border: 1px solid #dee2e6;
        }
        .certificate-number {
            position: absolute;
            bottom: 20px;
            right: 30px;
            font-size: 12px;
            color: #95a5a6;
        }
        .seal {
            position: absolute;
            top: 20px;
            right: 30px;
            width: 80px;
            height: 80px;
            border: 3px solid #667eea;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            color: #667eea;
            background: white;
        }
        @media print {
            body {
                background: white;
                padding: 0;
            }
            .certificate {
                box-shadow: none;
                border: 2px solid #000;
            }
        }
    </style>
</head>
<body>
    <div class="certificate">
        <div class="seal">🏆</div>
        <div class="header">
            <div class="title">CERTIFICATE</div>
            <div class="subtitle">OF COMPLETION</div>
        </div>
        
        <div class="award-text">
            This is to certify that
        </div>
        
        <div class="name">${userName}</div>
        
        <div class="award-text">
            has successfully completed the course
        </div>
        
        <div class="course">${courseTitle}</div>
        
        <div class="award-text">
            and passed the Final Grandtest with a score of 90% or higher.
        </div>
        
        <div class="date">
            Issued on ${issuedDate}
        </div>
        
        <div class="verification">
            <div class="verification-title">Certificate Verification</div>
            <div class="verification-code">
                Verification Code: ${certificate.verification_code}
            </div>
        </div>
        
        <div class="certificate-number">
            Certificate #${certificate.certificate_number}
        </div>
    </div>
</body>
</html>`;

    // Return HTML with proper headers (no CSP restrictions)
    return new NextResponse(certificateHTML, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
        // Allow inline styles for certificate
        'Content-Security-Policy': "default-src 'self'; style-src 'unsafe-inline'; font-src 'self' data:;",
      },
    });
  } catch (error) {
    console.error('Unexpected error in certificate API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

