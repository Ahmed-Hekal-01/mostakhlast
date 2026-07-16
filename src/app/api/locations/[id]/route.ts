import { NextRequest, NextResponse } from 'next/server';
import { getLocationById, updateLocation } from '@/lib/queries';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const location = getLocationById(Number(id));
    if (!location) return NextResponse.json({ error: 'الموقع غير موجود' }, { status: 404 });
    return NextResponse.json(location);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    if (!body.name?.trim()) return NextResponse.json({ error: 'اسم الموقع مطلوب' }, { status: 400 });
    updateLocation(Number(id), body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
