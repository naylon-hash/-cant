// src/app/api/vote/route.ts
import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export const runtime = "nodejs";

const Z_TOP = "cant:post:top";
const H_PREFIX = "cant:post:";

export async function POST(req: Request) {
  try {
    const { id, delta } = await req.json();
    const d = Number(delta);
    if (!id || ![1, -1].includes(d)) {
      return NextResponse.json({ error: "id + delta ∈ {1,-1}" }, { status: 400 });
    }

    // increment score in hash + leaderboard
    const newScore = await kv.hincrby(H_PREFIX + id, "score", d);
    await kv.zincrby(Z_TOP, d, id);

    return NextResponse.json({ ok: true, score: Number(newScore) });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "KV error" }, { status: 503 });
  }
}
