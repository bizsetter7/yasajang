import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name, category, region, representative, business_number,
      phone, address, description, menu_main, menu_liquor, menu_snack,
      platform_choice, owner_id, license_path, permit_path, plan,
    } = body;

    if (!owner_id || !name || !phone) {
      return NextResponse.json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 });
    }

    const { data: businessData, error: businessError } = await supabaseAdmin
      .from('businesses')
      .insert({
        name, category, region, representative, business_number,
        phone, address, description, menu_main, menu_liquor, menu_snack,
        owner_id, license_path, permit_path,
        status: 'PENDING_REVIEW',
      })
      .select()
      .single();

    if (businessError) throw businessError;

    const { error: subError } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        business_id: businessData.id,
        plan,
        status: 'trial',
        platform_choice: plan === 'basic' ? null : platform_choice,
        trial_starts_at: new Date().toISOString(),
        trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

    if (subError) throw subError;

    return NextResponse.json({ success: true, business_id: businessData.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : '서버 오류가 발생했습니다.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
