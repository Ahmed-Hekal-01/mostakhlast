import { NextResponse } from 'next/server';
import { getAlerts, getDashboardStats } from '@/lib/queries';

export async function GET() {
  try {
    const alerts = getAlerts();
    const stats = getDashboardStats();
    return NextResponse.json({ alerts, stats });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
