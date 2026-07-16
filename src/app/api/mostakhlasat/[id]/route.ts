import { NextRequest, NextResponse } from 'next/server';
import { getMostakhlasByIdRaw, updateMostakhlas } from '@/lib/queries';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const m = getMostakhlasByIdRaw(Number(id));
    if (!m) return NextResponse.json({ error: 'المستخلص غير موجود' }, { status: 404 });
    return NextResponse.json(m);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    updateMostakhlas(Number(id), body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
