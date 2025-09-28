import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export const runtime = "edge";

type Post = {
  id: string;
  cant: string;
  can: string;
  handle?: string;
  at: number;
  score: number;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sort = searchParams.get("sort") === "new" ? "new" : "top";
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10) || 50, 100);
  const key = sort === "top" ? "cant:score" : "cant:idx:new";

  const ids = (await kv.zrange(key, 0, limit - 1, { rev: true })) as string[];
  if (!ids.length) {
    return NextResponse.json({ posts: [] }, { headers: { "Cache-Control": "no-store" } });
  }

  // Fetch post blobs in a pipeline (results are the values themselves)
  const pipe = kv.pipeline();
  for (const id of ids) pipe.get(`cant:post:${id}`);
  const results = (await pipe.exec()) as Array<string | Record<string, unknown> | null>;

  const posts: Post[] = results
    .map((val) => {
      if (!val) return null;
      try {
        const parsed = typeof val === "string" ? JSON.parse(val) : val;
        return parsed as Post;
      } catch {
        return null;
      }
    })
    .filter((p): p is Post => !!p);

  return NextResponse.json({ posts }, { headers: { "Cache-Control": "no-store" } });
}

function ipFrom(req: NextRequest) {
  const xf = req.headers.get("x-forwarded-for") || "";
  return xf.split(",")[0]?.trim() || "0.0.0.0";
}

export async function POST(req: NextRequest) {
  const ip = ipFrom(req);
  // naive rate-limit: 8 posts / 60s per IP
  try {
    const rlKey = `cant:rl:post:${ip}`;
    const n = (await kv.incr(rlKey)) || 0;
    if (n === 1) await kv.expire(rlKey, 60);
    if (n > 8) return NextResponse.json({ error: "slow down" }, { status: 429 });
  } catch {}

  const body = await req.json().catch(() => ({}));
  const cant = (body?.cant || "").toString().slice(0, 800);
  const can = (body?.can || "").toString().slice(0, 800);
  const handle = (body?.handle || "").toString().slice(0, 32);
  if (!cant || !can) return NextResponse.json({ error: "cant and can required" }, { status: 400 });

  const id = crypto.randomUUID();
  const at = Date.now();
  const post: Post = { id, cant, can, handle: handle || undefined, at, score: 0 };

  await kv.set(`cant:post:${id}`, JSON.stringify(post));
  await kv.zadd("cant:idx:new", { score: at, member: id });
  await kv.zadd("cant:score", { score: 0, member: id });

  // soft-trim to keep things tidy
  try {
    const count = await kv.zcard("cant:idx:new");
    if (count && count > 1200) {
      const excess = count - 1000;
      const oldIds = await kv.zrange("cant:idx:new", 0, excess - 1);
      if (oldIds.length) {
        const p = kv.pipeline();
        for (const oid of oldIds) {
          p.del(`cant:post:${oid}`);
          p.zrem("cant:idx:new", oid);
          p.zrem("cant:score", oid);
        }
        await p.exec();
      }
    }
  } catch {}

  return NextResponse.json({ post }, { headers: { "Cache-Control": "no-store" } });
}
