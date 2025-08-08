import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function Custom404() {
  const router = useRouter();

  return (
    <div className="error-page">
      <div className="error-content">
        <h1>404 - Page Not Found</h1>
        <p>The page you're looking for doesn't exist.</p>
        <div className="error-actions">
          <Link href="/buy" className="button button-primary">
            Go to Home
          </Link>
          <button 
            className="button button-secondary" 
            onClick={() => router.back()}
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}