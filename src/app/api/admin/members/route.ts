import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function verifyAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'bizsetter7@gmail.com';
  return !!user && user.email === adminEmail;
}

// GET /api/admin/members
export async function GET() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // auth.users는 service role listUsers로 조회
  const { data: { users }, error: authErr } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
  if (authErr) {
    return NextResponse.json({ error: authErr.message }, { status: 500 });
  }

  // profiles 테이블에서 추가 정보 조회
  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('id, username, role, user_type, created_at');

  const profileMap: Record<string, { username?: string; role?: string; user_type?: string }> = {};
  (profiles || []).forEach(p => { profileMap[p.id] = p; });

  // businesses 테이블에서 업체 연결 여부 확인
  const { data: bizes } = await supabaseAdmin
    .from('businesses')
    .select('owner_id, name, status');
  const bizMap: Record<string, { name: string; status: string }> = {};
  (bizes || []).forEach(b => { if (b.owner_id) bizMap[b.owner_id] = b; });

  const members = (users || []).map(u => ({
    id: u.id,
    email: u.email,
    provider: u.app_metadata?.provider || 'email',
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at,
    username: profileMap[u.id]?.username || null,
    role: profileMap[u.id]?.role || profileMap[u.id]?.user_type || 'individual',
    business: bizMap[u.id] || null,
    banned_until: (u as unknown as { banned_until?: string }).banned_until || null,
  }));

  return NextResponse.json({ members });
}

// PATCH /api/admin/members — ban/unban 또는 역할 변경
export async function PATCH(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { userId, action, role } = await request.json() as {
    userId: string;
    action: 'ban' | 'unban' | 'changeRole';
    role?: string;
  };

  if (!userId || !action) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  if (action === 'ban' || action === 'unban') {
    const ban_duration = action === 'ban' ? '876600h' : 'none';
    const { error } = await (supabaseAdmin.auth.admin as unknown as {
      updateUserById: (id: string, attrs: { ban_duration: string }) => Promise<{ error: { message: string } | null }>;
    }).updateUserById(userId, { ban_duration });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else if (action === 'changeRole' && role) {
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ role })
      .eq('id', userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/members — 회원 탈퇴 (auth 계정만 삭제, 업소 데이터 별도 정리 필요)
export async function DELETE(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { userId } = await request.json() as { userId: string };
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
