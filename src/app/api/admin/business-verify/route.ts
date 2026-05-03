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

// GET /api/admin/business-verify?status=all|verified|unverified
export async function GET(req: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || 'unverified';

  let query = supabaseAdmin
    .from('businesses')
    .select('id, name, category, region_code, address, manager_name, phone, business_reg_url, business_reg_number, is_verified, verified_at, created_at, owner_id, status, audit_note')
    .order('created_at', { ascending: false });

  if (status === 'verified') {
    query = query.eq('is_verified', true);
  } else if (status === 'unverified') {
    query = query.or('is_verified.is.null,is_verified.eq.false');
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ businesses: data || [] });
}

// PATCH /api/admin/business-verify  body: { businessId, isVerified, note? }
export async function PATCH(req: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { businessId, isVerified, note } = await req.json();
  if (!businessId || typeof isVerified !== 'boolean') {
    return NextResponse.json({ error: 'businessId, isVerified 필요' }, { status: 400 });
  }

  const updateData: {
    is_verified: boolean;
    verified_at: string | null;
    updated_at: string;
    audit_note?: string;
  } = {
    is_verified: isVerified,
    verified_at: isVerified ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  };

  if (note !== undefined) {
    updateData.audit_note = note;
  }

  const { error } = await supabaseAdmin
    .from('businesses')
    .update(updateData)
    .eq('id', businessId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
