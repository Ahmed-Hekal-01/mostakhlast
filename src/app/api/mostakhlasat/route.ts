import { NextRequest, NextResponse } from 'next/server';
import { getMostakhlasat, createMostakhlas } from '@/lib/queries';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get('location_id');
    if (!locationId) return NextResponse.json({ error: 'location_id مطلوب' }, { status: 400 });
    const list = getMostakhlasat(Number(locationId));
    return NextResponse.json(list);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.location_id) return NextResponse.json({ error: 'location_id مطلوب' }, { status: 400 });
    if (!body.due_date) return NextResponse.json({ error: 'تاريخ التحصيل مطلوب' }, { status: 400 });
    const id = createMostakhlas(body);
    return NextResponse.json({ id }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
