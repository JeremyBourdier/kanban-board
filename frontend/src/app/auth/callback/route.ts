import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    // In client-side rendered Supabase auth, client will exchange token via hash/query
    return NextResponse.redirect(`${origin}${next}`);
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${origin}${next}`);
}
