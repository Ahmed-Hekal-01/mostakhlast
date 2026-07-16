'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatEGP } from '@/lib/utils';

interface Company {
  id: number;
  name: string;
  location_count: number;
  total_debt: number;
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', contact_person: '', phone: '', notes: '' });
  const [toast, setToast] = useState('');

  const load = () => {
    fetch('/api/companies').then(r => r.json()).then(data => {
      setCompanies(data);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('اسم الشركة مطلوب'); return; }
    setSaving(true); setError('');
    const res = await fetch('/api/companies', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      setShowModal(false);
      setForm({ name: '', contact_person: '', phone: '', notes: '' });
      showToast('تم إضافة الشركة بنجاح ✓');
      load();
    } else {
      const d = await res.json();
      setError(d.error || 'حدث خطأ');
    }
  };

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">الشركات</h1>
          <p className="page-subtitle">جميع الشركات وإجمالي مستحقاتها</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowModal(true); setError(''); }}>
          + إضافة شركة
        </button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>اسم الشركة</th>
              <th>جهة الاتصال</th>
              <th>عدد المواقع</th>
              <th>إجمالي المستحق</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {companies.length === 0 && (
              <tr><td colSpan={6}>
                <div className="empty-state">
                  <div className="empty-state-icon">🏢</div>
                  <div className="empty-state-title">لا توجد شركات بعد</div>
                  <div className="empty-state-desc">اضغط على "إضافة شركة" للبدء</div>
                </div>
              </td></tr>
            )}
            {companies.map((c, i) => (
              <tr key={c.id} className="clickable-row" onClick={() => window.location.href = `/companies/${c.id}`}>
                <td className="muted" style={{ width: 40 }}>{i + 1}</td>
                <td style={{ fontWeight: 700 }}>{c.name}</td>
                <td className="muted">—</td>
                <td className="muted">{c.location_count} موقع</td>
                <td className={c.total_debt > 0 ? 'danger amount' : 'success amount'}>{formatEGP(c.total_debt)}</td>
                <td><Link href={`/companies/${c.id}`} className="btn btn-ghost btn-sm" onClick={e => e.stopPropagation()}>تفاصيل ←</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">إضافة شركة جديدة</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label className="form-label">اسم الشركة *</label>
                <input id="company-name" className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="مثال: شركة النيل للمقاولات" autoFocus />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">المسؤول / جهة الاتصال</label>
                  <input className="form-control" value={form.contact_person} onChange={e => setForm(f => ({ ...f, contact_person: e.target.value }))} placeholder="اسم المسؤول" />
                </div>
                <div className="form-group">
                  <label className="form-label">رقم الهاتف</label>
                  <input className="form-control" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="01xxxxxxxxx" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">ملاحظات</label>
                <textarea className="form-control" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="ملاحظات إضافية..." rows={2} />
              </div>
              {error && <div className="form-error">⚠ {error}</div>}
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'جاري الحفظ...' : 'حفظ الشركة'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast-container">
          <div className="toast success">{toast}</div>
        </div>
      )}
    </div>
  );
}
