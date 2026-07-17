'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { formatEGP, formatDate, statusBadgeClass, todayISO } from '@/lib/utils';

interface Mostakhlas {
  id: number;
  sequence_number: number;
  expected_amount: number | null;
  due_date: string;
  notes: string | null;
  collected: number;
  remaining: number | undefined;
  status: string;
  location_id: number;
  location_name: string;
  company_id: number;
  company_name: string;
}

interface Payment {
  id: number;
  mostakhlas_id: number;
  amount: number;
  payment_date: string;
  notes: string | null;
  created_at: string;
}

export default function MostakhlasDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [m, setM] = useState<Mostakhlas | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit expected amount
  const [showEditAmount, setShowEditAmount] = useState(false);
  const [showEditM, setShowEditM] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const [editAmountVal, setEditAmountVal] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [payForm, setPayForm] = useState({ amount: '', payment_date: todayISO(), notes: '' });

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = async () => {
    const [mRes, pRes] = await Promise.all([
      fetch(`/api/mostakhlasat/${id}`).then(r => r.json()),
      fetch(`/api/payments?mostakhlas_id=${id}`).then(r => r.json()),
    ]);
    setM(mRes);
    setPayments(Array.isArray(pRes) ? pRes : []);
    setLoading(false);
    if (mRes) {
      setEditAmountVal(mRes.expected_amount !== null ? String(mRes.expected_amount) : '');
      setEditDueDate(mRes.due_date || '');
      setEditNotes(mRes.notes || '');
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleUpdateAmount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAmountVal || Number(editAmountVal) <= 0) { setError('أدخل مبلغاً صحيحاً أكبر من صفر'); return; }
    setSaving(true); setError('');
    const res = await fetch(`/api/mostakhlasat/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expected_amount: Number(editAmountVal) }),
    });
    setSaving(false);
    if (res.ok) { setShowEditAmount(false); showToast('تم تحديث المبلغ المطلوب ✓'); load(); }
    else { const d = await res.json(); setError(d.error || 'حدث خطأ'); }
  };

  const handleUpdateM = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDueDate) { setError('تاريخ التحصيل مطلوب'); return; }
    setSaving(true); setError('');
    const res = await fetch(`/api/mostakhlasat/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        expected_amount: editAmountVal ? Number(editAmountVal) : null,
        due_date: editDueDate,
        notes: editNotes,
      }),
    });
    setSaving(false);
    if (res.ok) { setShowEditM(false); showToast('تم تعديل بيانات المستخلص ✓'); load(); }
    else { const d = await res.json(); setError(d.error || 'حدث خطأ'); }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payForm.amount || Number(payForm.amount) <= 0) { setError('المبلغ يجب أن يكون أكبر من صفر'); return; }
    if (!payForm.payment_date) { setError('تاريخ التحصيل مطلوب'); return; }
    setSaving(true); setError('');
    const res = await fetch('/api/payments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mostakhlas_id: Number(id), amount: Number(payForm.amount), payment_date: payForm.payment_date, notes: payForm.notes || undefined }),
    });
    setSaving(false);
    if (res.ok) {
      setShowAddPayment(false);
      setPayForm({ amount: '', payment_date: todayISO(), notes: '' });
      showToast('تم تسجيل الدفعة بنجاح ✓');
      load();
    } else {
      const d = await res.json(); setError(d.error || 'حدث خطأ');
    }
  };

  const handleDeletePayment = async (paymentId: number) => {
    if (!confirm('هل تريد حذف هذه الدفعة؟')) return;
    await fetch(`/api/payments/${paymentId}`, { method: 'DELETE' });
    showToast('تم حذف الدفعة ✓');
    load();
  };

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;
  if (!m) return <div className="empty-state"><div className="empty-state-title">المستخلص غير موجود</div></div>;

  const isFullyCollected = m.expected_amount !== null && m.collected >= m.expected_amount;
  const progressPct = m.expected_amount && m.expected_amount > 0
    ? Math.min(100, Math.round((m.collected / m.expected_amount) * 100))
    : null;

  // Running total accumulation for display
  let runningTotal = 0;

  return (
    <div>
      {/* Print header — only visible when printing */}
      <div className="print-header">
        <h1>مستخلص رقم {m?.sequence_number} — {m?.location_name}</h1>
        <p>شركة: {m?.company_name} | تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG')}</p>
      </div>

      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link href="/companies">الشركات</Link>
        <span className="breadcrumb-sep">/</span>
        <Link href={`/companies/${m.company_id}`}>{m.company_name}</Link>
        <span className="breadcrumb-sep">/</span>
        <Link href={`/locations/${m.location_id}`}>{m.location_name}</Link>
        <span className="breadcrumb-sep">/</span>
        <span>مستخلص رقم {m.sequence_number}</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">مستخلص رقم {m.sequence_number}</h1>
          <p className="page-subtitle">{m.location_name} — {m.company_name}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-ghost btn-sm no-print" onClick={() => window.print()} title="طباعة / حفظ PDF">🖨️ طباعة</button>
          <button className="btn btn-ghost btn-sm" onClick={() => { setShowEditM(true); setError(''); }}>✏ تعديل</button>
          {!isFullyCollected && (
            <button className="btn btn-primary" onClick={() => { setShowAddPayment(true); setError(''); }}>+ تسجيل دفعة</button>
          )}
        </div>
      </div>

      {/* Status badge */}
      <div style={{ marginBottom: '1.25rem' }}>
        <span className={statusBadgeClass(m.status)} style={{ fontSize: '0.9rem', padding: '0.3rem 0.9rem' }}>{m.status}</span>
      </div>

      {/* Key Figures */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-label">تاريخ التحصيل</div>
          <div className="stat-value" style={{ fontSize: '1.1rem', fontWeight: 700 }}>{formatDate(m.due_date)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">المبلغ المطلوب</div>
          <div className="stat-value" style={{ fontSize: '1.2rem' }}>
            {m.expected_amount !== null
              ? formatEGP(m.expected_amount)
              : <button className="btn btn-ghost btn-sm" onClick={() => { setShowEditAmount(true); setError(''); }}>تحديد المبلغ</button>}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">المحصل حتى الآن</div>
          <div className="stat-value success">{formatEGP(m.collected)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">المتبقي</div>
          <div className={`stat-value ${m.expected_amount === null ? '' : isFullyCollected ? 'success' : 'danger'}`}>
            {m.expected_amount === null ? <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>غير محدد</span> : formatEGP(m.remaining ?? 0)}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {progressPct !== null && (
        <div style={{ marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
            <span>نسبة التحصيل</span>
            <span style={{ fontWeight: 700, color: isFullyCollected ? 'var(--success)' : 'var(--primary)' }}>{progressPct}%</span>
          </div>
          <div style={{ height: 8, background: 'var(--bg-input)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${progressPct}%`,
              background: isFullyCollected ? 'var(--success)' : `linear-gradient(90deg, var(--primary), #7a4ff8)`,
              borderRadius: 999,
              transition: 'width 0.5s ease',
            }} />
          </div>
        </div>
      )}

      {/* Notes */}
      {m.notes && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-title">📝 ملاحظات</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{m.notes}</p>
        </div>
      )}

      {/* Payments Log */}
      <div className="section-header">
        <div className="section-title">سجل الدفعات ({payments.length})</div>
        {!isFullyCollected && (
          <button className="btn btn-primary btn-sm" onClick={() => { setShowAddPayment(true); setError(''); }}>+ تسجيل دفعة</button>
        )}
      </div>

      {isFullyCollected && (
        <div className="no-alerts" style={{ marginBottom: '1rem' }}>✅ تم تحصيل هذا المستخلص بالكامل</div>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>تاريخ التحصيل</th>
              <th>المبلغ</th>
              <th>الإجمالي المتراكم</th>
              <th>المتبقي بعد الدفعة</th>
              <th>ملاحظات</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 && (
              <tr><td colSpan={7}>
                <div className="empty-state">
                  <div className="empty-state-icon">💰</div>
                  <div className="empty-state-title">لم يتم تسجيل أي دفعات بعد</div>
                  <div className="empty-state-desc">اضغط على "تسجيل دفعة" لتسجيل أول دفعة مُحصَّلة</div>
                </div>
              </td></tr>
            )}
            {payments.map((p, i) => {
              runningTotal += p.amount;
              const remainingAfter = m.expected_amount !== null ? m.expected_amount - runningTotal : null;
              return (
                <tr key={p.id}>
                  <td className="muted">{i + 1}</td>
                  <td>{formatDate(p.payment_date)}</td>
                  <td className="amount success">{formatEGP(p.amount)}</td>
                  <td className="amount" style={{ color: 'var(--primary)' }}>{formatEGP(runningTotal)}</td>
                  <td className={remainingAfter !== null ? (remainingAfter <= 0 ? 'success amount' : 'danger amount') : 'muted'}>
                    {remainingAfter !== null ? formatEGP(Math.max(0, remainingAfter)) : '—'}
                  </td>
                  <td className="muted">{p.notes || '—'}</td>
                  <td>
                    <button className="btn btn-danger btn-sm btn-icon" title="حذف الدفعة" onClick={() => handleDeletePayment(p.id)}>🗑</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Quick Add Payment inline summary */}
      {payments.length > 0 && m.expected_amount !== null && !isFullyCollected && (
        <div className="payment-running-total" style={{ marginTop: '1rem' }}>
          <span className="running-label">المتبقي الآن:</span>
          <span className="running-value" style={{ color: 'var(--danger)' }}>{formatEGP(Math.max(0, (m.remaining ?? 0)))}</span>
        </div>
      )}

      {/* Set Amount Modal */}
      {showEditAmount && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowEditAmount(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">تحديد المبلغ المطلوب</div>
              <button className="modal-close" onClick={() => setShowEditAmount(false)}>✕</button>
            </div>
            <form onSubmit={handleUpdateAmount}>
              <div className="form-group">
                <label className="form-label">المبلغ المطلوب (جنيه مصري) *</label>
                <input type="number" className="form-control" value={editAmountVal} onChange={e => setEditAmountVal(e.target.value)} placeholder="مثال: 150000" min="1" autoFocus />
              </div>
              {error && <div className="form-error">⚠ {error}</div>}
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowEditAmount(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'جاري الحفظ...' : 'تحديد المبلغ'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Mostakhlas Modal */}
      {showEditM && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowEditM(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">تعديل بيانات المستخلص</div>
              <button className="modal-close" onClick={() => setShowEditM(false)}>✕</button>
            </div>
            <form onSubmit={handleUpdateM}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">تاريخ التحصيل *</label>
                  <input type="date" className="form-control" value={editDueDate} onChange={e => setEditDueDate(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">المبلغ المطلوب</label>
                  <input type="number" className="form-control" value={editAmountVal} onChange={e => setEditAmountVal(e.target.value)} placeholder="اتركه فارغاً إذا لم يحدد" min="0" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">ملاحظات</label>
                <textarea className="form-control" value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={2} />
              </div>
              {error && <div className="form-error">⚠ {error}</div>}
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowEditM(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      {showAddPayment && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAddPayment(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">تسجيل دفعة جديدة</div>
              <button className="modal-close" onClick={() => setShowAddPayment(false)}>✕</button>
            </div>
            {m.expected_amount !== null && (
              <div style={{ background: 'var(--bg-input)', borderRadius: 8, padding: '0.6rem 0.9rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>المتبقي: </span>
                <span style={{ fontWeight: 700, color: 'var(--danger)' }}>{formatEGP(m.remaining ?? 0)}</span>
              </div>
            )}
            <form onSubmit={handleAddPayment}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">المبلغ المحصَّل *</label>
                  <input id="payment-amount" type="number" className="form-control" value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} placeholder="مثال: 50000" min="1" autoFocus />
                </div>
                <div className="form-group">
                  <label className="form-label">تاريخ التحصيل *</label>
                  <input type="date" className="form-control" value={payForm.payment_date} onChange={e => setPayForm(f => ({ ...f, payment_date: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">ملاحظات</label>
                <input className="form-control" value={payForm.notes} onChange={e => setPayForm(f => ({ ...f, notes: e.target.value }))} placeholder="مثال: دفعة أولى، شيك رقم ..." />
              </div>
              {error && <div className="form-error">⚠ {error}</div>}
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddPayment(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'جاري الحفظ...' : 'تسجيل الدفعة'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <div className="toast-container"><div className="toast success">{toast}</div></div>}
      <div className="print-footer">
        نظام متابعة المستخلصات — طُبع بتاريخ {new Date().toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}
      </div>
    </div>
  );
}
