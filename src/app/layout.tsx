import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'نظام متابعة المستخلصات',
  description: 'نظام لمتابعة وإدارة المستخلصات وتحصيل المستحقات',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <nav className="navbar">
          <div className="navbar-brand">
            <span className="navbar-icon">📋</span>
            <span>نظام المستخلصات</span>
          </div>
          <div className="navbar-links">
            <a href="/" className="nav-link">لوحة التحكم</a>
            <a href="/companies" className="nav-link">الشركات</a>
          </div>
        </nav>
        <main className="main-content">
          {children}
        </main>
      </body>
    </html>
  );
}
