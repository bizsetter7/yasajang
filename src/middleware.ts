import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = new URL(request.url);
  const path = url.pathname;

  // 어드민 대시보드 보호
  if (path.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/?auth=login', request.url));
    }
    // 어드민 권한 체크 (이메일 기반)
    if (user.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // 업소 등록 페이지 보호
  if (path.startsWith('/register')) {
    if (!user) {
      return NextResponse.redirect(new URL('/?auth=login', request.url));
    }
  }

  // 로그인 상태에서 루트 접근 시 어드민이면 리다이렉트 (선택 사항)
  if (path === '/' && user && user.email === process.env.ADMIN_EMAIL) {
    // 관리자는 첫 화면 접근 시 관리자 페이지로 리다이렉트 가능
    // return NextResponse.redirect(new URL('/admin', request.url));
  }

  // 봇 차단 (P2 패턴 참조)
  const userAgent = request.headers.get('user-agent') || '';
  const botKeywords = ['bot', 'crawler', 'spider', 'scrap', 'yandex', 'baidu', 'ahrefs'];
  const isBot = botKeywords.some(keyword => userAgent.toLowerCase().includes(keyword));

  if (isBot && !path.startsWith('/api')) {
     // 로봇은 API 제외하고 차단하거나 특정 처리 가능
     // return new NextResponse('Forbidden', { status: 403 });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
