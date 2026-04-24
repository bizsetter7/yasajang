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

  const { data, error } = await supabase.storage
    .from('businesses-docs')
    .createSignedUrl(path, 60 * 60); // 1시간 유효

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ url: data.signedUrl });
}
