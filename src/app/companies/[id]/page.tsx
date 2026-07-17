'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatEGP, statusBadgeClass } from '@/lib/utils';

interface Company {
  id: number;
  name: string;
  contact_person: string | null;
  phone: string | null;
  notes: string | null;
  total_debt: number;
  location_count: number;
}

interface Location {
  id: number;
  name: string;
  scope_description: string | null;
  status: string;
  total_remaining: number;
  mostakhlasat_count: number;
  latest_status?: string;
}

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [company, setCompany] = useState<Company | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showEditCompany, setShowEditCompany] = useState(false);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  // Forms
  const [editForm, setEditForm] = useState({ name: '', contact_person: '', phone: '', notes: '' });
  const [locForm, setLocForm] = useState({ name: '', scope_description: '', status: 'نشط' });

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = async () => {
    const [compRes, locRes] = await Promise.all([
      fetch(`/api/companies/${id}`).then(r => r.json()),
      fetch(`/api/locations?company_id=${id}`).then(r => r.json()),
    ]);
    setCompany(compRes);
    setLocations(locRes);
    setLoading(false);
    if (compRes.name) setEditForm({ name: compRes.name, contact_person: compRes.contact_person || '', phone: compRes.phone || '', notes: compRes.notes || '' });
  };

  useEffect(() => { load(); }, [id]);

  const handleEditCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.name.trim()) { setError('اسم الشركة مطلوب'); return; }
    setSaving(true); setError('');
    const res = await fetch(`/api/companies/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    });
    setSaving(false);
    if (res.ok) { setShowEditCompany(false); showToast('تم تعديل بيانات الشركة ✓'); load(); }
    else { const d = await res.json(); setError(d.error || 'حدث خطأ'); }
  };

  const handleDeleteCompany = async () => {
    if (!confirm('هل أنت متأكد من حذف هذه الشركة؟ سيتم حذف جميع المواقع والمستخلصات المرتبطة بها.')) return;
    await fetch(`/api/companies/${id}`, { method: 'DELETE' });
    router.push('/companies');
  };

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locForm.name.trim()) { setError('اسم الموقع مطلوب'); return; }
    setSaving(true); setError('');
    const res = await fetch('/api/locations', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...locForm, company_id: Number(id) }),
    });
    setSaving(false);
    if (res.ok) {
      const data = await res.json();
      setShowAddLocation(false);
      setLocForm({ name: '', scope_description: '', status: 'نشط' });
      showToast('تم إضافة الموقع بنجاح ✓');
      load();
      router.push(`/locations/${data.id}`);
    } else {
      const d = await res.json(); setError(d.error || 'حدث خطأ');
    }
  };

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;
  if (!company) return <div className="empty-state"><div className="empty-state-title">الشركة غير موجودة</div></div>;

  return (
    <div>
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link href="/companies">الشركات</Link>
        <span className="breadcrumb-sep">/</span>
        <span>{company.name}</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">{company.name}</h1>
          <p className="page-subtitle">{company.location_count} موقع</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => { setShowEditCompany(true); setError(''); }}>✏ تعديل</button>
          <button className="btn btn-danger btn-sm" onClick={handleDeleteCompany}>🗑 حذف</button>
          <button className="btn btn-primary" onClick={() => { setShowAddLocation(true); setError(''); }}>+ إضافة موقع</button>
        </div>
      </div>

      {/* Company Info */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="info-grid">
          {company.contact_person && (
            <div className="info-item">
              <div className="info-item-label">جهة الاتصال</div>
              <div className="info-item-value">{company.contact_person}</div>
            </div>
          )}
          {company.phone && (
            <div className="info-item">
              <div className="info-item-label">الهاتف</div>
              <div className="info-item-value" style={{ direction: 'ltr', textAlign: 'right' }}>{company.phone}</div>
            </div>
          )}
          {company.notes && (
            <div className="info-item" style={{ gridColumn: '1 / -1' }}>
              <div className="info-item-label">ملاحظات</div>
              <div className="info-item-value">{company.notes}</div>
            </div>
          )}
        </div>
      </div>

      {/* Debt Banner */}
      <div className="summary-banner">
        <div>
          <div className="summary-banner-label">إجمالي المستحق لهذه الشركة</div>
          <div className={`summary-banner-value ${company.total_debt === 0 ? 'clean' : ''}`}>
            {formatEGP(company.total_debt)}
          </div>
        </div>
        {company.total_debt === 0 && <span style={{ fontSize: '2rem' }}>✅</span>}
      </div>

      {/* Locations */}
      <div className="section-header">
        <div className="section-title">المواقع ({locations.length})</div>
        <button className="btn btn-primary btn-sm" onClick={() => { setShowAddLocation(true); setError(''); }}>+ إضافة موقع</button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>اسم الموقع</th>
              <th>وصف الأعمال</th>
              <th>الحالة</th>
              <th>عدد المستخلصات</th>
              <th>المتبقي</th>
              <th>حالة آخر مستخلص</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {locations.length === 0 && (
              <tr><td colSpan={7}>
                <div className="empty-state">
                  <div className="empty-state-icon">📍</div>
                  <div className="empty-state-title">لا توجد مواقع بعد</div>
                  <div className="empty-state-desc">اضغط على "إضافة موقع" لإضافة أول موقع</div>
                </div>
              </td></tr>
            )}
            {locations.map(loc => (
              <tr key={loc.id} className="clickable-row" onClick={() => window.location.href = `/locations/${loc.id}`}>
                <td style={{ fontWeight: 700 }}>{loc.name}</td>
                <td className="muted" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {loc.scope_description || '—'}
                </td>
                <td>
                  <span className={loc.status === 'نشط' ? 'badge badge-active' : 'badge badge-inactive'}>{loc.status}</span>
                </td>
                <td className="muted">{loc.mostakhlasat_count}</td>
                <td className={loc.total_remaining > 0 ? 'danger amount' : 'success amount'}>
                  {formatEGP(loc.total_remaining)}
                </td>
                <td>
                  {loc.latest_status
                    ? <span className={statusBadgeClass(loc.latest_status)}>{loc.latest_status}</span>
                    : <span className="muted">—</span>}
                </td>
                <td><Link href={`/locations/${loc.id}`} className="btn btn-ghost btn-sm" onClick={e => e.stopPropagation()}>تفاصيل ←</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Company Modal */}
      {showEditCompany && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowEditCompany(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">تعديل بيانات الشركة</div>
              <button className="modal-close" onClick={() => setShowEditCompany(false)}>✕</button>
            </div>
            <form onSubmit={handleEditCompany}>
              <div className="form-group">
                <label className="form-label">اسم الشركة *</label>
                <input className="form-control" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} autoFocus />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">المسؤول</label>
                  <input className="form-control" value={editForm.contact_person} onChange={e => setEditForm(f => ({ ...f, contact_person: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">الهاتف</label>
                  <input className="form-control" value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">ملاحظات</label>
                <textarea className="form-control" value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
              </div>
              {error && <div className="form-error">⚠ {error}</div>}
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowEditCompany(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Location Modal */}
      {showAddLocation && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAddLocation(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">إضافة موقع جديد</div>
              <button className="modal-close" onClick={() => setShowAddLocation(false)}>✕</button>
            </div>
            <form onSubmit={handleAddLocation}>
              <div className="form-group">
                <label className="form-label">اسم الموقع *</label>
                <input id="location-name" className="form-control" value={locForm.name} onChange={e => setLocForm(f => ({ ...f, name: e.target.value }))} placeholder="مثال: مشروع القاهرة الجديدة" autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">وصف الأعمال</label>
                <textarea className="form-control" value={locForm.scope_description} onChange={e => setLocForm(f => ({ ...f, scope_description: e.target.value }))} placeholder="مثال: أعمال الهيكل الخرساني والتشطيبات الخارجية" rows={2} />
              </div>
              <div className="form-group">
                <label className="form-label">الحالة</label>
                <select className="form-control" value={locForm.status} onChange={e => setLocForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="نشط">نشط</option>
                  <option value="منتهي">منتهي</option>
                </select>
              </div>
              {error && <div className="form-error">⚠ {error}</div>}
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddLocation(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'جاري الحفظ...' : 'إضافة الموقع'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <div className="toast-container"><div className="toast success">{toast}</div></div>}
    </div>
  );
}
