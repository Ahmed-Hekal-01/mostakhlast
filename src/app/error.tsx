'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '1rem',
        textAlign: 'center',
        padding: '2rem',
      }}
    >
      <div style={{ fontSize: '3rem' }}>⚠️</div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
        حدث خطأ غير متوقع
      </h2>
      <p style={{ color: 'var(--text-muted)', maxWidth: '400px' }}>
        حدث خطأ في تحميل هذه الصفحة. يمكنك المحاولة مجدداً أو العودة للصفحة
        الرئيسية.
      </p>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button className="btn btn-primary" onClick={reset}>
          إعادة المحاولة
        </button>
        <a href="/" className="btn btn-ghost">
          الصفحة الرئيسية
        </a>
      </div>
    </div>
  );
}
