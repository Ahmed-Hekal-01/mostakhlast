export default function NotFound() {
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
      <div style={{ fontSize: '3rem' }}>🔍</div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
        الصفحة غير موجودة
      </h2>
      <p style={{ color: 'var(--text-muted)' }}>
        تحققت من الرابط ولم نجد ما تبحث عنه.
      </p>
      <a href="/" className="btn btn-primary">
        العودة للصفحة الرئيسية
      </a>
    </div>
  );
}
