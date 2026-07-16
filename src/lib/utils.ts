// Utility helpers shared across client and server

export function formatEGP(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return 'غير محدد';
  return new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('ar-EG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function statusBadgeClass(status: string): string {
  switch (status) {
    case 'متأخر': return 'badge badge-overdue';
    case 'مستحق اليوم': return 'badge badge-due-today';
    case 'قادم': return 'badge badge-upcoming';
    case 'محصل بالكامل': return 'badge badge-collected';
    case 'لم يحدد المبلغ بعد': return 'badge badge-unknown';
    default: return 'badge';
  }
}
