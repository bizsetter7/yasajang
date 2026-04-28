import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/** 업소 사진 업로드 — business-images 버킷 (public)
 *  Body: FormData { file: File, businessId: string }
 *  Returns: { url: string }
 */
export async function POST(req: NextRequest) {
  try {
    // 1. 인증 확인
    const cookieStore = await cookies();
    const supabase = createServerClient(
      SB_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cs) => {
            try { cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); }
            catch { /* Route Handler OK */ }
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 2. FormData 파싱
    const form = await req.formData();
    const file = form.get('file') as File | null;
    const businessId = form.get('businessId') as string | null;

    if (!file || !businessId) {
      return NextResponse.json({ error: 'file and businessId are required' }, { status: 400 });
    }

    // 3. 파일 크기 제한 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: '파일 크기는 10MB 이하여야 합니다.' }, { status: 400 });
    }

    // 4. 이미지 타입 검증
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: '이미지 파일만 업로드 가능합니다.' }, { status: 400 });
    }

    // 5. 경로 생성: {businessId}/{timestamp}_{random}.{ext}
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filename = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const path = `${businessId}/${filename}`;
    const encodedPath = path.split('/').map((seg: string) => encodeURIComponent(seg)).join('/');

    // 6. service_role로 업로드 (business-images 버킷 — public)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadRes = await fetch(
      `${SB_URL}/storage/v1/object/business-images/${encodedPath}`,
      {
        method: 'POST',
        headers: {
          'apikey': SB_KEY,
          'Authorization': `Bearer ${SB_KEY}`,
          'Content-Type': file.type || 'image/jpeg',
          'x-upsert': 'true',
        },
        body: buffer,
      }
    );

    if (!uploadRes.ok) {
      const err = await uploadRes.json().catch(() => ({}));
      const msg = (err as Record<string, string>)?.error || (err as Record<string, string>)?.message || uploadRes.statusText;
      return NextResponse.json({ error: `업로드 실패: ${msg}` }, { status: 500 });
    }

    // 7. 공개 URL 반환
    const publicUrl = `${SB_URL}/storage/v1/object/public/business-images/${encodedPath}`;
    return NextResponse.json({ url: publicUrl });

  } catch (err) {
    const message = err instanceof Error ? err.message : '업로드 중 오류 발생';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
