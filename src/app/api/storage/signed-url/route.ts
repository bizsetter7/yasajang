import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// service_role로 스토리지 서명 URL 생성 (createServerClient는 쿠키 auth 클라이언트라 storage 서비스롤 동작 불안정)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: Request) {
  const { path } = await req.json();
  if (!path) return NextResponse.json({ error: 'path required' }, { status: 400 });

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

  const { data, error } = await supabaseAdmin.storage
    .from('businesses-docs')
    .createSignedUrl(storagePath, 60 * 60); // 1시간 유효

  if (error) {
    console.error('[signed-url] createSignedUrl error:', error.message, '| path:', storagePath);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ url: data.signedUrl });
}
