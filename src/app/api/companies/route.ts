import { NextRequest, NextResponse } from 'next/server';
import { getAllCompanies, createCompany } from '@/lib/queries';

export async function GET() {
  try {
    const companies = getAllCompanies();
    return NextResponse.json(companies);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'اسم الشركة مطلوب' }, { status: 400 });
    }
    const id = createCompany(body);
    return NextResponse.json({ id }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
