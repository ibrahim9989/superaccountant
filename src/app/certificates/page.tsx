'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CertificateService } from '@/lib/services/certificateService';
import type { Certificate } from '@/lib/types/grandtest';

export default function CertificatesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      loadCertificates();
    }
  }, [user, authLoading, router]);

  const loadCertificates = async () => {
    try {
      setLoading(true);
      setError(null);
      const certs = await CertificateService.getUserCertificates(user!.id);
      setCertificates(certs);
    } catch (err) {
      console.error('Error loading certificates:', err);
      setError('Failed to load certificates. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleDownloadCertificate = async (certificate: Certificate) => {
    try {
      // Generate and download certificate PDF
      const pdfUrl = await CertificateService.generateCertificatePDF(certificate);
      if (pdfUrl) {
        window.open(pdfUrl, '_blank');
      } else {
        // If PDF not available, show certificate details in a modal or alert
        showCertificateDetails(certificate);
      }
    } catch (err) {
      console.error('Error generating certificate PDF:', err);
      // Show certificate details as fallback
      showCertificateDetails(certificate);
    }
  };

  const showCertificateDetails = (certificate: Certificate) => {
    // Create a simple HTML certificate view
    const certificateHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Certificate ${certificate.certificate_number}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 40px; 
              max-width: 800px; 
              margin: 0 auto;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
            }
            .certificate {
              background: white;
              padding: 60px;
              border-radius: 10px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.2);
              text-align: center;
            }
            .certificate-header {
              border-bottom: 3px solid #667eea;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .certificate-title {
              font-size: 42px;
              font-weight: bold;
              color: #333;
              margin-bottom: 10px;
            }
            .certificate-subtitle {
              font-size: 18px;
              color: #666;
            }
            .certificate-body {
              margin: 40px 0;
            }
            .certificate-name {
              font-size: 36px;
              font-weight: bold;
              color: #667eea;
              margin: 20px 0;
            }
            .certificate-course {
              font-size: 24px;
              color: #333;
              margin: 20px 0;
            }
            .certificate-info {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #eee;
            }
            .certificate-number {
              font-size: 14px;
              color: #666;
              margin: 10px 0;
            }
            .verification-code {
              font-family: monospace;
              font-size: 16px;
              color: #667eea;
              font-weight: bold;
              margin: 10px 0;
            }
          </style>
        </head>
        <body>
          <div class="certificate">
            <div class="certificate-header">
              <div class="certificate-title">Certificate of Completion</div>
              <div class="certificate-subtitle">This certifies that</div>
            </div>
            <div class="certificate-body">
              <div class="certificate-name">Student Name</div>
              <div class="certificate-course">${(certificate as any).course?.title || 'Course Certificate'}</div>
              <div style="margin-top: 30px; font-size: 16px; color: #666;">
                has successfully completed the course and passed the final examination
              </div>
            </div>
            <div class="certificate-info">
              <div class="certificate-number">
                Certificate Number: ${certificate.certificate_number}
              </div>
              <div class="certificate-number">
                Issued: ${new Date(certificate.issued_at).toLocaleDateString()}
              </div>
              <div class="verification-code">
                Verification Code: ${certificate.verification_code}
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
    
    const blob = new Blob([certificateHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading certificates...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Certificates</h1>
          <p className="mt-2 text-gray-600">View and download your course completion certificates</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="text-red-500 mr-3">⚠️</div>
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {certificates.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">🏆</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Certificates Yet</h2>
            <p className="text-gray-600 mb-6">
              Complete courses and pass the grandtest to earn certificates.
            </p>
            <button
              onClick={() => router.push('/courses')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold"
            >
              Browse Courses
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((certificate) => (
              <div
                key={certificate.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Certificate Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-3xl">🎓</div>
                    <div className="text-xs bg-blue-800 px-2 py-1 rounded">
                      {certificate.is_valid ? 'Valid' : 'Invalid'}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-1">
                    {(certificate as any).course?.title || 'Course Certificate'}
                  </h3>
                  <p className="text-blue-100 text-sm">
                    Certificate #{certificate.certificate_number}
                  </p>
                </div>

                {/* Certificate Details */}
                <div className="p-6">
                  <div className="space-y-3 mb-6">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                        Issued Date
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(certificate.issued_at)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                        Verification Code
                      </p>
                      <p className="text-sm font-mono font-medium text-gray-900">
                        {certificate.verification_code}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <button
                      onClick={() => handleDownloadCertificate(certificate)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
                    >
                      Download Certificate
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(certificate.verification_code);
                        alert('Verification code copied to clipboard!');
                      }}
                      className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                    >
                      Copy Verification Code
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

