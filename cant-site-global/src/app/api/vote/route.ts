import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { cookies } from 'next/headers';

export const runtime = 'edge';

function voterIdCookie() {
  const c = cookies();
  const existing = c.get('cant_vid')?.value;
  return existing || crypto.randomUUID();
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const id = (body?.id || '').toString();
  const delta = Number(body?.delta) === 1 ? 1 : -1;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const vid = voterIdCookie();
  const key = `cant:votes:${id}:${vid}`;

  let prev = 0;
  try {
    const raw = await kv.get<string>(key);
    prev = raw ? parseInt(raw, 10) || 0 : 0;
  } catch {}

  const next = prev === delta ? 0 : delta;
  const scoreAdj = prev === 0 ? delta : next - prev;

  if (next === 0) await kv.del(key);
  else await kv.set(key, String(next));

  let newScore = 0;
  try {
    // @ts-ignore
    newScore = await kv.zincrby('cant:score', scoreAdj, id);
  } catch {
    const currentScore = await kv.zscore('cant:score', id).catch(() => 0 as any as number);
    const updated = (Number(currentScore) || 0) + scoreAdj;
    await kv.zadd('cant:score', { score: updated, member: id });
    newScore = updated;
  }

  try {
    const postRaw = await kv.get<string>(`cant:post:${id}`);
    if (postRaw) {
      const p = JSON.parse(postRaw);
      p.score = newScore;
      await kv.set(`cant:post:${id}`, JSON.stringify(p));
    }
  } catch {}

  const res = NextResponse.json({ ok: true, score: newScore, userVote: next }, { headers: { 'Cache-Control': 'no-store' } });
  res.cookies.set('cant_vid', vid, { httpOnly: false, path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 * 365 });
  return res;
}
