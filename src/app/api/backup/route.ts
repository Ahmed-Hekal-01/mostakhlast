import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import path from 'path';
import fs from 'fs';

export async function POST() {
  try {
    const db = getDb();

    const DB_DIR = process.env.DB_PATH
      ? path.dirname(process.env.DB_PATH)
      : path.join(process.cwd(), 'data');

    const backupDir = path.join(DB_DIR, 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupPath = path.join(backupDir, `mostakhlasat-${timestamp}.db`);

    // better-sqlite3's official backup API — creates a consistent, point-in-time copy
    await db.backup(backupPath);

    // Keep only the last 10 backups to avoid filling up disk space
    const files = fs
      .readdirSync(backupDir)
      .filter((f) => f.endsWith('.db'))
      .sort();

    if (files.length > 10) {
      const toDelete = files.slice(0, files.length - 10);
      for (const f of toDelete) {
        fs.unlinkSync(path.join(backupDir, f));
      }
    }

    return NextResponse.json({
      success: true,
      file: path.basename(backupPath),
      message: `تم حفظ النسخة الاحتياطية: ${path.basename(backupPath)}`,
    });
  } catch (error) {
    console.error('Backup failed:', error);
    return NextResponse.json(
      { error: 'فشل إنشاء النسخة الاحتياطية' },
      { status: 500 }
    );
  }
}
