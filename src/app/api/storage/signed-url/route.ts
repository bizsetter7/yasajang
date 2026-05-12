import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { path } = await req.json();
  if (!path) return NextResponse.json({ error: 'path required' }, { status: 400 });

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { 
      cookies: { 
        get: (name) => cookieStore.get(name)?.value 
      } 
    }
  );

  // ── path 정규화 (Object not found 방지) ────────────────────────────
  // 저장된 형식이 세 가지로 혼재:
  //   ① 정상 상대경로:          {owner_id}/{ts}_license.png
  //   ② URL-encoded 경로:       {owner_id}%2F{ts}_license.png
  //   ③ 전체 Supabase URL:      https://.../businesses-docs/{...}
  let storagePath = path.trim();

  if (storagePath.includes('/businesses-docs/')) {
    // ③ → 버킷명 뒤 path 추출 + 쿼리스트링 제거
    const idx = storagePath.indexOf('/businesses-docs/');
    storagePath = storagePath.slice(idx + '/businesses-docs/'.length);
    const qIdx = storagePath.indexOf('?');
    if (qIdx !== -1) storagePath = storagePath.slice(0, qIdx);
    storagePath = decodeURIComponent(storagePath);
  } else if (storagePath.includes('%')) {
    // ② → URL 디코딩 (%2F → /)
    storagePath = decodeURIComponent(storagePath);
  }
  // ① → 그대로 사용
  // ────────────────────────────────────────────────────────────────────

  const { data, error } = await supabase.storage
    .from('businesses-docs')
    .createSignedUrl(storagePath, 60 * 60); // 1시간 유효

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ url: data.signedUrl });
}
