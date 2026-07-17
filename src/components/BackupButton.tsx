'use client';
import { useState } from 'react';

export function BackupButton() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  const doBackup = async () => {
    setStatus('loading');
    try {
      const res = await fetch('/api/backup', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setStatus('done');
        setMsg(data.message || 'تم الحفظ');
      } else {
        setStatus('error');
        setMsg(data.error || 'فشل الحفظ');
      }
    } catch {
      setStatus('error');
      setMsg('تعذر الاتصال بالخادم');
    }
    setTimeout(() => { setStatus('idle'); setMsg(''); }, 4000);
  };

  return (
    <>
      <button
        onClick={doBackup}
        disabled={status === 'loading'}
        title="حفظ نسخة احتياطية"
        className="no-print"
        style={{
          background: 'none',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          padding: '0.3rem 0.6rem',
          cursor: status === 'loading' ? 'wait' : 'pointer',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.3rem',
        }}
      >
        {status === 'loading' ? '⏳' : '💾'}
        {status === 'loading' ? 'جاري الحفظ...' : 'نسخ احتياطي'}
      </button>
      {(status === 'done' || status === 'error') && (
        <span style={{
          fontSize: '0.75rem',
          color: status === 'done' ? 'var(--success)' : 'var(--danger)',
          maxWidth: '200px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {status === 'done' ? '✓' : '✗'} {msg}
        </span>
      )}
    </>
  );
}
