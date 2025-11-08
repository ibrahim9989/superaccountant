// Certificate Service
// This service handles certificate generation, storage, and verification

import { getSupabaseClient } from '@/lib/supabase/client';
import type { Certificate, CertificateVerificationResult } from '@/lib/types/grandtest';

export class CertificateService {
  // Generate PDF certificate
  static async generateCertificatePDF(certificate: Certificate): Promise<string> {
    try {
      // Get user and course information using API route or direct query with better error handling
      const supabase = getSupabaseClient();
      
      // Try to get user from profiles, but handle the case where profile might not exist
      let userName = 'Student';
      let userEmail = '';
      
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', certificate.user_id)
        .maybeSingle();

      if (user) {
        const firstName = user.first_name || '';
        const lastName = user.last_name || '';
        userName = `${firstName} ${lastName}`.trim() || userName;
        userEmail = user.email || '';
      } else if (userError && userError.code !== 'PGRST116') {
        console.warn('Error fetching user data (using defaults):', userError);
        // Continue with defaults
      }

      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('title, description')
        .eq('id', certificate.course_id)
        .maybeSingle();

      // Return API route URL (bypasses CSP issues and storage permissions)
      // The API route generates and serves the certificate HTML on-demand
      const apiUrl = `/api/certificates/${certificate.id}`;
      
      // If we're on the client side, return the full URL with origin
      if (typeof window !== 'undefined') {
        return `${window.location.origin}${apiUrl}`;
      }
      
      return apiUrl;

    } catch (error) {
      console.error('Error generating certificate PDF:', error);
      throw new Error('Failed to generate certificate');
    }
  }

  // Generate certificate HTML content
  private static generateCertificateHTML(data: {
    certificateNumber: string;
    userName: string;
    courseTitle: string;
    issuedDate: string;
    verificationCode: string;
  }): string {
    return `
<!DOCTYPE html>
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
        
        <div class="name">${data.userName}</div>
        
        <div class="award-text">
            has successfully completed the course
        </div>
        
        <div class="course">${data.courseTitle}</div>
        
        <div class="award-text">
            and passed the Final Grandtest with a score of 90% or higher.
        </div>
        
        <div class="date">
            Issued on ${data.issuedDate}
        </div>
        
        <div class="verification">
            <div class="verification-title">Certificate Verification</div>
            <div class="verification-code">
                Verification Code: ${data.verificationCode}
            </div>
        </div>
        
        <div class="certificate-number">
            Certificate #${data.certificateNumber}
        </div>
    </div>
</body>
</html>
    `;
  }

  // Verify certificate
  static async verifyCertificate(
    certificateNumber: string, 
    verificationCode: string
  ): Promise<CertificateVerificationResult> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('certificates')
        .select(`
          *,
          user:user_id (
            full_name,
            email
          ),
          course:course_id (
            title,
            description
          )
        `)
        .eq('certificate_number', certificateNumber)
        .eq('verification_code', verificationCode)
        .eq('is_valid', true)
        .single();

      if (error || !data) {
        return {
          is_valid: false,
          error_message: 'Certificate not found or invalid'
        };
      }

      return {
        is_valid: true,
        certificate: data,
        user_name: data.user?.full_name || 'Unknown',
        course_title: data.course?.title || 'Unknown Course',
        issued_date: data.issued_at
      };

    } catch (error) {
      console.error('Error verifying certificate:', error);
      return {
        is_valid: false,
        error_message: 'Error verifying certificate'
      };
    }
  }

  // Get user's certificates
  static async getUserCertificates(userId: string): Promise<Certificate[]> {
    // Try using API route first (bypasses RLS with service role)
    try {
      console.log('📡 Fetching certificates via API route...');
      const response = await fetch(`/api/certificates?user_id=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.data) {
          console.log(`✅ Fetched ${result.data.length} certificates via API`);
          return result.data;
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.warn('API route returned error:', errorData.error);
      }
    } catch (apiError) {
      console.warn('API route error (trying fallback):', apiError);
      // Fall through to direct database call
    }

    // Fallback to direct database call (might fail due to RLS)
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('user_id', userId)
        .eq('is_valid', true)
        .order('issued_at', { ascending: false });

      if (error) {
        console.error('Error fetching user certificates:', error);
        throw new Error('Failed to fetch certificates');
      }

      // Fetch course data separately if needed
      if (data && data.length > 0) {
        const courseIds = [...new Set(data.map(cert => cert.course_id))];
        const { data: courses } = await supabase
          .from('courses')
          .select('id, title, description')
          .in('id', courseIds);

        // Attach course data to certificates
        return (data || []).map(cert => ({
          ...cert,
          course: courses?.find(c => c.id === cert.course_id)
        })) as Certificate[];
      }

      return data || [];

    } catch (error) {
      console.error('Error getting user certificates:', error);
      throw new Error('Failed to get certificates');
    }
  }

  // Revoke certificate
  static async revokeCertificate(certificateId: string): Promise<void> {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('certificates')
        .update({ is_valid: false })
        .eq('id', certificateId);

      if (error) {
        console.error('Error revoking certificate:', error);
        throw new Error('Failed to revoke certificate');
      }

    } catch (error) {
      console.error('Error revoking certificate:', error);
      throw new Error('Failed to revoke certificate');
    }
  }

  // Get certificate statistics
  static async getCertificateStats(): Promise<{
    total_certificates: number;
    certificates_this_month: number;
    certificates_this_year: number;
    top_courses: Array<{
      course_id: string;
      course_title: string;
      certificate_count: number;
    }>;
  }> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('certificates')
        .select(`
          *,
          course:course_id (
            title
          )
        `)
        .eq('is_valid', true);

      if (error) {
        console.error('Error fetching certificate stats:', error);
        throw new Error('Failed to fetch certificate statistics');
      }

      const certificates = data || [];
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisYear = new Date(now.getFullYear(), 0, 1);

      const certificatesThisMonth = certificates.filter(
        cert => new Date(cert.issued_at) >= thisMonth
      ).length;

      const certificatesThisYear = certificates.filter(
        cert => new Date(cert.issued_at) >= thisYear
      ).length;

      // Group by course
      const courseGroups = certificates.reduce((groups, cert) => {
        const courseId = cert.course_id;
        if (!groups[courseId]) {
          groups[courseId] = {
            course_id: courseId,
            course_title: cert.course?.title || 'Unknown Course',
            certificate_count: 0
          };
        }
        groups[courseId].certificate_count++;
        return groups;
      }, {} as Record<string, any>);

      const topCourses = Object.values(courseGroups)
        .sort((a: any, b: any) => b.certificate_count - a.certificate_count)
        .slice(0, 5) as Array<{
          course_id: string;
          course_title: string;
          certificate_count: number;
        }>;

      return {
        total_certificates: certificates.length,
        certificates_this_month: certificatesThisMonth,
        certificates_this_year: certificatesThisYear,
        top_courses: topCourses
      };

    } catch (error) {
      console.error('Error getting certificate stats:', error);
      throw new Error('Failed to get certificate statistics');
    }
  }

  // Setup certificate storage bucket
  static async setupCertificateStorage(): Promise<void> {
    try {
      // Create storage bucket for certificates
      const supabase = getSupabaseClient();
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.error('Error listing buckets:', listError);
        throw new Error('Failed to list storage buckets');
      }

      const certificateBucket = buckets.find(bucket => bucket.name === 'certificates');
      
      if (!certificateBucket) {
        const { error: createError } = await getSupabaseClient().storage.createBucket('certificates', {
          public: true,
          fileSizeLimit: 10485760, // 10MB
          allowedMimeTypes: ['text/html', 'application/pdf']
        });

        if (createError) {
          console.error('Error creating certificate bucket:', createError);
          throw new Error('Failed to create certificate storage bucket');
        }
      }

    } catch (error) {
      console.error('Error setting up certificate storage:', error);
      throw new Error('Failed to setup certificate storage');
    }
  }
}