import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';
      const baseUrl = isLocalEnv
        ? origin
        : forwardedHost
        ? `https://${forwardedHost}`
        : origin;

      // 어드민 계정은 바로 어드민 페이지로
      const { data: { user } } = await supabase.auth.getUser();
      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'bizsetter7@gmail.com';
      const isAdmin = user?.email === adminEmail;

      if (user) {
        // 야사장은 사장님 B2B 사이트 — 가입 = 업체회원(corporate) 확정
        // → P2/P9/P10 AuthProvider가 profiles.role/user_type 기준으로 판별하므로
        //    야사장 첫 로그인 시점에 무조건 corporate 부여 (어드민 제외)
        if (!isAdmin) {
          try {
            await supabase.from('profiles').upsert({
              id: user.id,
              role: 'corporate',
              user_type: 'corporate',
              username: user.email?.split('@')[0] ?? null,
              contact_email: user.email,
              full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
            }, { onConflict: 'id' });
          } catch (e) {
            console.warn('[auth/callback] profiles upsert 실패:', e);
            // upsert 실패해도 로그인 흐름은 계속 진행
          }
        }

        if (isAdmin) {
          return NextResponse.redirect(`${baseUrl}/admin`);
        }

        // 업소 등록 여부 확인 — 없으면 온보딩(register)으로 안내
        const { data: business } = await supabase
          .from('businesses')
          .select('id')
          .eq('owner_id', user.id)
          .maybeSingle();

        if (!business) {
          // 신규 사용자 → 입점신청 온보딩
          return NextResponse.redirect(`${baseUrl}/register`);
        }
        // 기존 사용자 → 대시보드
        return NextResponse.redirect(`${baseUrl}/dashboard`);
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
