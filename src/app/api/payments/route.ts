import { NextRequest, NextResponse } from 'next/server';
import { getPaymentsByMostakhlas, createPayment } from '@/lib/queries';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mostakhlasId = searchParams.get('mostakhlas_id');
    if (!mostakhlasId) return NextResponse.json({ error: 'mostakhlas_id مطلوب' }, { status: 400 });
    const payments = getPaymentsByMostakhlas(Number(mostakhlasId));
    return NextResponse.json(payments);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.mostakhlas_id) return NextResponse.json({ error: 'mostakhlas_id مطلوب' }, { status: 400 });
    if (!body.amount || body.amount <= 0) return NextResponse.json({ error: 'المبلغ يجب أن يكون أكبر من صفر' }, { status: 400 });
    if (!body.payment_date) return NextResponse.json({ error: 'تاريخ التحصيل مطلوب' }, { status: 400 });
    const id = createPayment(body);
    return NextResponse.json({ id }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
