'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { formatEGP, formatDate, statusBadgeClass, todayISO } from '@/lib/utils';

interface Location {
  id: number;
  company_id: number;
  name: string;
  scope_description: string | null;
  status: string;
  company_name: string;
  total_remaining: number;
}

interface Mostakhlas {
  id: number;
  sequence_number: number;
  expected_amount: number | null;
  due_date: string;
  notes: string | null;
  collected: number;
  remaining: number | undefined;
  status: string;
}

export default function LocationDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [location, setLocation] = useState<Location | null>(null);
  const [mostakhlasat, setMostakhlasat] = useState<Mostakhlas[]>([]);
  const [loading, setLoading] = useState(true);

  const [showEditLoc, setShowEditLoc] = useState(false);
  const [showAddM, setShowAddM] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const [editForm, setEditForm] = useState({ name: '', scope_description: '', status: 'نشط' });
  const [mForm, setMForm] = useState({ due_date: '', expected_amount: '', notes: '' });

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = async () => {
    const [locRes, mRes] = await Promise.all([
      fetch(`/api/locations/${id}`).then(r => r.json()),
      fetch(`/api/mostakhlasat?location_id=${id}`).then(r => r.json()),
    ]);
    setLocation(locRes);
    setMostakhlasat(Array.isArray(mRes) ? mRes : []);
    setLoading(false);
    if (locRes.name) setEditForm({ name: locRes.name, scope_description: locRes.scope_description || '', status: locRes.status || 'نشط' });
  };

  useEffect(() => { load(); }, [id]);

  const handleEditLoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.name.trim()) { setError('اسم الموقع مطلوب'); return; }
    setSaving(true); setError('');
    const res = await fetch(`/api/locations/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    });
    setSaving(false);
    if (res.ok) { setShowEditLoc(false); showToast('تم تعديل بيانات الموقع ✓'); load(); }
    else { const d = await res.json(); setError(d.error || 'حدث خطأ'); }
  };

  const handleAddM = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mForm.due_date) { setError('تاريخ التحصيل مطلوب'); return; }
    setSaving(true); setError('');
    const payload = {
      location_id: Number(id),
      due_date: mForm.due_date,
      expected_amount: mForm.expected_amount ? Number(mForm.expected_amount) : null,
      notes: mForm.notes || undefined,
    };
    const res = await fetch('/api/mostakhlasat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) {
      setShowAddM(false);
      setMForm({ due_date: '', expected_amount: '', notes: '' });
      showToast('تم إضافة المستخلص بنجاح ✓');
      load();
    } else {
      const d = await res.json(); setError(d.error || 'حدث خطأ');
    }
  };

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;
  if (!location) return <div className="empty-state"><div className="empty-state-title">الموقع غير موجود</div></div>;

  return (
    <div>
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link href="/companies">الشركات</Link>
        <span className="breadcrumb-sep">/</span>
        <Link href={`/companies/${location.company_id}`}>{location.company_name}</Link>
        <span className="breadcrumb-sep">/</span>
        <span>{location.name}</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">{location.name}</h1>
          <p className="page-subtitle">{location.company_name}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => { setShowEditLoc(true); setError(''); }}>✏ تعديل الموقع</button>
          <button className="btn btn-primary" onClick={() => { setShowAddM(true); setError(''); }}>+ إضافة مستخلص</button>
        </div>
      </div>

      {/* Location Info */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="info-grid">
          <div className="info-item">
            <div className="info-item-label">حالة الموقع</div>
            <div className="info-item-value">
              <span className={location.status === 'نشط' ? 'badge badge-active' : 'badge badge-inactive'}>{location.status}</span>
            </div>
          </div>
          <div className="info-item">
            <div className="info-item-label">عدد المستخلصات</div>
            <div className="info-item-value">{mostakhlasat.length}</div>
          </div>
          {location.scope_description && (
            <div className="info-item" style={{ gridColumn: '1 / -1' }}>
              <div className="info-item-label">وصف الأعمال</div>
              <div className="info-item-value">{location.scope_description}</div>
            </div>
          )}
        </div>
      </div>

      {/* Total Remaining Banner */}
      <div className="summary-banner">
        <div>
          <div className="summary-banner-label">إجمالي المتبقي لهذا الموقع</div>
          <div className={`summary-banner-value ${location.total_remaining === 0 ? 'clean' : ''}`}>
            {formatEGP(location.total_remaining)}
          </div>
        </div>
        {location.total_remaining === 0 && mostakhlasat.length > 0 && <span style={{ fontSize: '2rem' }}>✅</span>}
      </div>

      {/* Mostakhlasat Table */}
      <div className="section-header">
        <div className="section-title">المستخلصات ({mostakhlasat.length})</div>
        <button className="btn btn-primary btn-sm" onClick={() => { setShowAddM(true); setError(''); }}>+ إضافة مستخلص</button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>رقم المستخلص</th>
              <th>تاريخ التحصيل</th>
              <th>المبلغ المطلوب</th>
              <th>المحصل</th>
              <th>المتبقي</th>
              <th>الحالة</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {mostakhlasat.length === 0 && (
              <tr><td colSpan={7}>
                <div className="empty-state">
                  <div className="empty-state-icon">📄</div>
                  <div className="empty-state-title">لا توجد مستخلصات بعد</div>
                  <div className="empty-state-desc">اضغط على "إضافة مستخلص" لإنشاء أول مستخلص</div>
                </div>
              </td></tr>
            )}
            {mostakhlasat.map(m => (
              <tr key={m.id} className="clickable-row" onClick={() => window.location.href = `/mostakhlasat/${m.id}`}>
                <td style={{ fontWeight: 700 }}>مستخلص رقم {m.sequence_number}</td>
                <td className="muted">{formatDate(m.due_date)}</td>
                <td className="amount">{m.expected_amount !== null ? formatEGP(m.expected_amount) : <span className="muted">غير محدد</span>}</td>
                <td className="amount success">{formatEGP(m.collected)}</td>
                <td className={m.remaining !== undefined && m.remaining > 0 ? 'danger amount' : 'success amount'}>
                  {m.expected_amount !== null ? formatEGP(m.remaining ?? 0) : <span className="muted">—</span>}
                </td>
                <td><span className={statusBadgeClass(m.status)}>{m.status}</span></td>
                <td>
                  <Link href={`/mostakhlasat/${m.id}`} className="btn btn-ghost btn-sm" onClick={e => e.stopPropagation()}>تفاصيل ←</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Location Modal */}
      {showEditLoc && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowEditLoc(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">تعديل بيانات الموقع</div>
              <button className="modal-close" onClick={() => setShowEditLoc(false)}>✕</button>
            </div>
            <form onSubmit={handleEditLoc}>
              <div className="form-group">
                <label className="form-label">اسم الموقع *</label>
                <input className="form-control" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">وصف الأعمال</label>
                <textarea className="form-control" value={editForm.scope_description} onChange={e => setEditForm(f => ({ ...f, scope_description: e.target.value }))} rows={2} />
              </div>
              <div className="form-group">
                <label className="form-label">الحالة</label>
                <select className="form-control" value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="نشط">نشط</option>
                  <option value="منتهي">منتهي</option>
                </select>
              </div>
              {error && <div className="form-error">⚠ {error}</div>}
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowEditLoc(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Mostakhlas Modal */}
      {showAddM && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAddM(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">إضافة مستخلص جديد — {location.name}</div>
              <button className="modal-close" onClick={() => setShowAddM(false)}>✕</button>
            </div>
            <form onSubmit={handleAddM}>
              <div className="form-group">
                <label className="form-label">الرقم التسلسلي</label>
                <div className="form-control" style={{ background: 'var(--bg)', cursor: 'not-allowed', color: 'var(--text-muted)' }}>
                  مستخلص رقم {mostakhlasat.length + 1} (تلقائي)
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">تاريخ التحصيل *</label>
                  <input type="date" className="form-control" value={mForm.due_date} onChange={e => setMForm(f => ({ ...f, due_date: e.target.value }))} autoFocus />
                </div>
                <div className="form-group">
                  <label className="form-label">المبلغ المطلوب (اختياري)</label>
                  <input type="number" className="form-control" value={mForm.expected_amount} onChange={e => setMForm(f => ({ ...f, expected_amount: e.target.value }))} placeholder="اتركه فارغاً إذا لم يحدد بعد" min="0" />
                  <div className="form-hint">يمكن تحديده لاحقاً من صفحة المستخلص</div>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">ملاحظات</label>
                <textarea className="form-control" value={mForm.notes} onChange={e => setMForm(f => ({ ...f, notes: e.target.value }))} placeholder="ملاحظات إضافية..." rows={2} />
              </div>
              {error && <div className="form-error">⚠ {error}</div>}
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddM(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'جاري الحفظ...' : 'إضافة المستخلص'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <div className="toast-container"><div className="toast success">{toast}</div></div>}
    </div>
  );
}
