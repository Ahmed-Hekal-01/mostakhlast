'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatEGP, formatDate, statusBadgeClass } from '@/lib/utils';

interface AlertItem {
  mostakhlas_id: number;
  sequence_number: number;
  location_name: string;
  company_name: string;
  company_id: number;
  location_id: number;
  due_date: string;
  expected_amount: number | null;
  collected: number;
  remaining: number;
  alert_type: 'overdue' | 'due_today' | 'upcoming';
}

interface Stats {
  total_debt: number;
  company_count: number;
  active_location_count: number;
}

interface Company {
  id: number;
  name: string;
  location_count: number;
  total_debt: number;
}

export default function DashboardPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard').then(r => r.json()),
      fetch('/api/companies').then(r => r.json()),
    ]).then(([dash, comps]) => {
      setAlerts(dash.alerts ?? []);
      setStats(dash.stats ?? null);
      setCompanies(comps ?? []);
      setLoading(false);
    });
  }, []);

  const alertIcon = (type: string) => {
    if (type === 'overdue') return '🔴';
    if (type === 'due_today') return '🟡';
    return '🔵';
  };

  const alertClass = (type: string) => {
    if (type === 'overdue') return 'alert-item alert-overdue';
    if (type === 'due_today') return 'alert-item alert-due-today';
    return 'alert-item alert-upcoming';
  };

  const alertLabel = (a: AlertItem) => {
    if (a.alert_type === 'overdue') return `متأخر — تجاوز موعد التحصيل`;
    if (a.alert_type === 'due_today') return `مستحق اليوم`;
    const due = new Date(a.due_date + 'T00:00:00');
    const today = new Date(); today.setHours(0,0,0,0);
    const diff = Math.floor((due.getTime() - today.getTime()) / 86400000);
    return `بعد ${diff} ${diff === 1 ? 'يوم' : 'أيام'}`;
  };

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;

  const overdueAlerts  = alerts.filter(a => a.alert_type === 'overdue');
  const todayAlerts    = alerts.filter(a => a.alert_type === 'due_today');
  const upcomingAlerts = alerts.filter(a => a.alert_type === 'upcoming');

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">لوحة التحكم</h1>
          <p className="page-subtitle">نظرة عامة على المستخلصات والمستحقات</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">إجمالي المستحق</div>
          <div className={`stat-value ${stats && stats.total_debt > 0 ? 'danger' : 'success'}`}>
            {stats ? formatEGP(stats.total_debt) : '—'}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">عدد الشركات</div>
          <div className="stat-value primary">{stats?.company_count ?? '—'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">المواقع النشطة</div>
          <div className="stat-value primary">{stats?.active_location_count ?? '—'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">تنبيهات نشطة</div>
          <div className={`stat-value ${alerts.length > 0 ? 'danger' : 'success'}`}>{alerts.length}</div>
        </div>
      </div>

      {/* Alerts Panel */}
      <div className="alerts-panel">
        <div className="alerts-panel-title">🔔 التنبيهات والتحذيرات</div>

        {alerts.length === 0 && (
          <div className="no-alerts">✅ لا توجد تنبيهات — جميع المستخلصات في الموعد المحدد</div>
        )}

        {overdueAlerts.length > 0 && (
          <>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--danger)', marginBottom: '0.4rem', marginTop: '0.5rem' }}>
              متأخرة ({overdueAlerts.length})
            </div>
            {overdueAlerts.map(a => (
              <Link key={a.mostakhlas_id} href={`/mostakhlasat/${a.mostakhlas_id}`} className={alertClass(a.alert_type)}>
                <span className="alert-icon">{alertIcon(a.alert_type)}</span>
                <div className="alert-body">
                  <div className="alert-main">
                    مستخلص رقم {a.sequence_number} — {a.location_name}
                    <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> (شركة {a.company_name})</span>
                  </div>
                  <div className="alert-sub">{alertLabel(a)} — تاريخ التحصيل: {formatDate(a.due_date)}</div>
                </div>
                <div className="alert-amount">{formatEGP(a.remaining)} متبقي</div>
              </Link>
            ))}
          </>
        )}

        {todayAlerts.length > 0 && (
          <>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--warning)', marginBottom: '0.4rem', marginTop: '0.75rem' }}>
              مستحقة اليوم ({todayAlerts.length})
            </div>
            {todayAlerts.map(a => (
              <Link key={a.mostakhlas_id} href={`/mostakhlasat/${a.mostakhlas_id}`} className={alertClass(a.alert_type)}>
                <span className="alert-icon">{alertIcon(a.alert_type)}</span>
                <div className="alert-body">
                  <div className="alert-main">
                    مستخلص رقم {a.sequence_number} — {a.location_name}
                    <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> (شركة {a.company_name})</span>
                  </div>
                  <div className="alert-sub">مستحق اليوم</div>
                </div>
                <div className="alert-amount">{formatEGP(a.remaining)} متبقي</div>
              </Link>
            ))}
          </>
        )}

        {upcomingAlerts.length > 0 && (
          <>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.4rem', marginTop: '0.75rem' }}>
              قادمة خلال يومين ({upcomingAlerts.length})
            </div>
            {upcomingAlerts.map(a => (
              <Link key={a.mostakhlas_id} href={`/mostakhlasat/${a.mostakhlas_id}`} className={alertClass(a.alert_type)}>
                <span className="alert-icon">{alertIcon(a.alert_type)}</span>
                <div className="alert-body">
                  <div className="alert-main">
                    مستخلص رقم {a.sequence_number} — {a.location_name}
                    <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> (شركة {a.company_name})</span>
                  </div>
                  <div className="alert-sub">{alertLabel(a)} — تاريخ التحصيل: {formatDate(a.due_date)}</div>
                </div>
                <div className="alert-amount">{formatEGP(a.remaining)} متبقي</div>
              </Link>
            ))}
          </>
        )}
      </div>

      {/* Companies Quick List */}
      <div className="section-header">
        <div className="section-title">الشركات — مرتبة حسب المستحق</div>
        <Link href="/companies" className="btn btn-ghost btn-sm">عرض الكل</Link>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>اسم الشركة</th>
              <th>عدد المواقع</th>
              <th>إجمالي المستحق</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {companies.length === 0 && (
              <tr><td colSpan={4}><div className="empty-state"><div className="empty-state-icon">🏢</div><div className="empty-state-title">لا توجد شركات بعد</div></div></td></tr>
            )}
            {companies.map(c => (
              <tr key={c.id} className="clickable-row" onClick={() => window.location.href = `/companies/${c.id}`}>
                <td style={{ fontWeight: 600 }}>{c.name}</td>
                <td className="muted">{c.location_count}</td>
                <td className={c.total_debt > 0 ? 'danger' : 'success'}>{formatEGP(c.total_debt)}</td>
                <td><Link href={`/companies/${c.id}`} className="btn btn-ghost btn-sm" onClick={e => e.stopPropagation()}>تفاصيل</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
