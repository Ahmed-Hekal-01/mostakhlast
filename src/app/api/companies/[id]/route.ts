import { NextRequest, NextResponse } from 'next/server';
import { getCompanyById, updateCompany, deleteCompany } from '@/lib/queries';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const company = getCompanyById(Number(id));
    if (!company) return NextResponse.json({ error: 'الشركة غير موجودة' }, { status: 404 });
    return NextResponse.json(company);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'اسم الشركة مطلوب' }, { status: 400 });
    }
    updateCompany(Number(id), body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    deleteCompany(Number(id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
