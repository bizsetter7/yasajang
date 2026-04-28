import { NextRequest, NextResponse } from 'next/server';

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    const path = form.get('path') as string | null;

    if (!file || !path) {
      return NextResponse.json({ error: 'file and path are required' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // service_role로 storage 업로드 (RLS 우회)
    // 경로 구분자 '/'는 인코딩하지 않고 각 세그먼트만 인코딩 (encodeURIComponent 전체 금지 — %2F 이슈)
    const encodedPath = path.split('/').map((seg: string) => encodeURIComponent(seg)).join('/');
    const uploadRes = await fetch(
      `${SB_URL}/storage/v1/object/businesses-docs/${encodedPath}`,
      {
        method: 'POST',
        headers: {
          'apikey': SB_KEY,
          'Authorization': `Bearer ${SB_KEY}`,
          'Content-Type': file.type || 'application/octet-stream',
          'x-upsert': 'true',
        },
        body: buffer,
      }
    );

    if (!uploadRes.ok) {
      const err = await uploadRes.json().catch(() => ({}));
      const msg = (err as any)?.error || (err as any)?.message || uploadRes.statusText;
      return NextResponse.json({ error: `업로드 실패: ${msg}` }, { status: 500 });
    }

    return NextResponse.json({ path });
  } catch (err) {
    const message = err instanceof Error ? err.message : '업로드 중 오류';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
