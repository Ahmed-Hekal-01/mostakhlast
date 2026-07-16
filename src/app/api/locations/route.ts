import { NextRequest, NextResponse } from 'next/server';
import { getLocationsByCompany, createLocation } from '@/lib/queries';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('company_id');
    if (!companyId) return NextResponse.json({ error: 'company_id مطلوب' }, { status: 400 });
    const locations = getLocationsByCompany(Number(companyId));
    return NextResponse.json(locations);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.company_id) return NextResponse.json({ error: 'company_id مطلوب' }, { status: 400 });
    if (!body.name?.trim()) return NextResponse.json({ error: 'اسم الموقع مطلوب' }, { status: 400 });
    const id = createLocation(body);
    return NextResponse.json({ id }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
