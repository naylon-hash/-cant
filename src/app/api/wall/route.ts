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

function isPost(x: any): x is Post {
  return (
    x &&
    typeof x.id === "string" &&
    typeof x.cant === "string" &&
    typeof x.can === "string" &&
    typeof x.at === "number" &&
    typeof x.score === "number"
  );
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sort = searchParams.get("sort") === "new" ? "new" : "top";
    const limitRaw = parseInt(searchParams.get("limit") || "50", 10);
    const limit = Math.min(Math.max(isFinite(limitRaw) ? limitRaw : 50, 1), 100);

    const zkey = sort === "new" ? Z_NEW : Z_TOP;
    const ids = await kv.zrange<string>(zkey, 0, limit - 1, { rev: true });
    const rows = await Promise.all(ids.map((id) => kv.hgetall<Post>(H_PREFIX + id)));
    const posts = rows.filter(isPost);

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

    await kv.hset(H_PREFIX + id, post);
    await kv.zadd(Z_NEW, { score: post.at, member: id });
    await kv.zadd(Z_TOP, { score: post.score, member: id });

    return NextResponse.json({ ok: true, post }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "KV error" }, { status: 503 });
  }
}
