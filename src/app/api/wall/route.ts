// src/app/api/wall/route.ts
import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export const runtime = "nodejs";

type Post = {
  id: string;
  cant: string;
  can: string;
  handle?: string;
  at: number;
  score: number;
};

const Z_NEW = "cant:post:new";
const Z_TOP = "cant:post:top";
const H_PREFIX = "cant:post:";

function coercePost(row: any): Post | null {
  if (!row) return null;
  const p = row as Record<string, any>;
  if (typeof p.id !== "string" || typeof p.cant !== "string" || typeof p.can !== "string") return null;
  const at = Number(p.at);
  const score = Number(p.score);
  return {
    id: p.id,
    cant: p.cant,
    can: p.can,
    handle: typeof p.handle === "string" ? p.handle : undefined,
    at: Number.isFinite(at) ? at : Date.now(),
    score: Number.isFinite(score) ? score : 0,
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sort = searchParams.get("sort") === "new" ? "new" : "top";
    const limitRaw = parseInt(searchParams.get("limit") || "50", 10);
    const limit = Math.min(Math.max(Number.isFinite(limitRaw) ? limitRaw : 50, 1), 100);

    const key = sort === "new" ? Z_NEW : Z_TOP;

    // NOTE: no generic here; cast result to string[]
    const rawIds = await kv.zrange(key, 0, limit - 1, { rev: true });
    const ids = (rawIds as any[]).map(String);

    const rows = await Promise.all(ids.map((id) => kv.hgetall(H_PREFIX + id)));
    const posts = rows.map(coercePost).filter(Boolean) as Post[];

    return NextResponse.json({ posts }, { headers: { "cache-control": "no-store" } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "KV unavailable" }, { status: 503 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const cant = String(body?.cant ?? "").trim();
    const can = String(body?.can ?? "").trim();
    const handle = body?.handle ? String(body.handle).trim() : undefined;

    if (!cant || !can) {
      return NextResponse.json({ error: "cant + can required" }, { status: 400 });
    }

    const id =
      typeof crypto !== "undefined" && (crypto as any).randomUUID
        ? (crypto as any).randomUUID()
        : `${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const post: Post = { id, cant, can, handle, at: Date.now(), score: 0 };

    await kv.hset(H_PREFIX + id, post as any);
    await kv.zadd(Z_NEW, { score: post.at, member: id });
    await kv.zadd(Z_TOP, { score: post.score, member: id });

    return NextResponse.json({ ok: true, post }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "KV error" }, { status: 503 });
  }
}
