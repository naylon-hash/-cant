"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Copy,
  Share2,
  TerminalSquare,
  ThumbsUp,
  ThumbsDown,
  ArrowUpNarrowWide,
  ExternalLink,
} from "lucide-react";

/**
 * $CANT — Submit → AI responds → Share/Post (clean UI + Voting Wall)
 * This version forces readable white buttons (black text) and prevents double-open.
 */

// ---------------- Runtime-safe env + mode helpers ----------------
const DEFAULT_COMMUNITY_URL = "https://x.com/i/communities/1972229235319197729";

function getCommunityUrl(): string {
  try {
    // @ts-ignore
    if (typeof process !== "undefined" && process.env && process.env.NEXT_PUBLIC_COMMUNITY_URL) {
      // @ts-ignore
      return String(process.env.NEXT_PUBLIC_COMMUNITY_URL);
    }
  } catch {}
  try {
    const meta = document.querySelector('meta[name="community-url"]') as HTMLMetaElement | null;
    if (meta?.content) return meta.content;
    const sp = new URLSearchParams(window.location.search);
    const qp = sp.get("community");
    if (qp) return qp;
  } catch {}
  return DEFAULT_COMMUNITY_URL;
}

const COMMUNITY_URL = getCommunityUrl();

const isDev = (() => {
  try {
    // @ts-ignore
    if (typeof process !== "undefined" && process.env && process.env.NODE_ENV) {
      // @ts-ignore
      return process.env.NODE_ENV !== "production";
    }
  } catch {}
  try {
    if (typeof window !== "undefined") {
      if (/^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname)) return true;
      if (window.localStorage.getItem("CANT_DEV") === "1") return true;
    }
  } catch {}
  return false;
})();

// ---------------- UI PRIMITIVES ----------------
const Frame: React.FC<{ title?: string; children: React.ReactNode }> = ({ title, children }) => {
  return (
    <div className="relative rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-800">
      {title && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-neutral-700" />
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-neutral-700" />
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-neutral-700" />
            <span className="ml-3 text-xs text-neutral-400 font-mono">{title}</span>
          </div>
          <TerminalSquare className="h-4 w-4 text-neutral-600" />
        </div>
      )}
      <div className="p-6 md:p-8">{children}</div>
    </div>
  );
};

const Screen: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="relative rounded-xl p-5 md:p-6 bg-neutral-900 text-neutral-100 font-mono border border-neutral-800">
    <div
      className="pointer-events-none absolute inset-0 opacity-20"
      style={{
        background:
          "repeating-linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.02) 2px, transparent 2px, transparent 4px)",
      }}
    />
    <pre className="relative whitespace-pre-wrap leading-relaxed text-[15px] md:text-xl">{children}</pre>
  </div>
);

// ---------------- DEGEN AI (120+ canned lines) ----------------
const baseOpeners = [
  "Convert fear to fuel",
  "Stop narrating limits",
  "Mute the FUD",
  "Courage is a muscle",
  "Ship ugly, ship fast",
  "Your keyboard is the start button",
  "Rent due? So is greatness",
  "The chart is not your boss",
  "Bear markets mint beasts",
  "Your future self is watching",
  "Discomfort is the signal",
  "Small size, big consistency",
];

const baseClosers = [
  "press buy",
  "ship v1",
  "post the thread",
  "touch grass then send",
  "DCA and don't cope",
  "risk small, repeat often",
  "set slippage to bravery",
  "execute step 1",
  "be first, be fearless",
  "log off and build",
  "zoom out and commit",
  "make the rep today",
];

const suffixes = [
  "Timer: now.",
  "Excuse: declined.",
  "WAGMI.",
  "$CANT.",
  "No one cares; work harder.",
  "Execute > excuses.",
  "Survive the chop.",
  "Let the work talk.",
];

const generatedPhrases: string[] = (() => {
  const arr: string[] = [];
  outer: for (let i = 0; i < baseOpeners.length; i++) {
    for (let j = 0; j < baseClosers.length; j++) {
      const suf = suffixes[arr.length % suffixes.length];
      const line = `CAN: ${baseOpeners[i]}. ${baseClosers[j]}. ${suf}`.trim();
      arr.push(line);
      if (arr.length >= 120) break outer; // >=100 required
    }
  }
  return arr;
})();

const degenTemplates: ((cant: string) => string)[] = [
  (cant: string) =>
    `CAN: ${cant ? cant.replace(/I can’t|I can't|I cannot/gi, "You can").replace(/\.$/, "") : "You can."} — set slippage to bravery, size to conviction, and press buy.`,
  (cant: string) => `CAN: ${cant ? cant.replace(/I can’t|I can't|I cannot/gi, "You can") : "You can"}. Touch grass, hydrate, and send.`,
  (cant: string) => `CAN: ${cant ? cant.replace(/I can’t|I can't|I cannot/gi, "You can") : "You can"}. Narratives don't pay; execution does.`,
  ...generatedPhrases.map((line) => () => line),
];

function roastCant(cantLine: string, spice = 2) {
  const t = degenTemplates[Math.floor(Math.random() * degenTemplates.length)];
  let base = t(cantLine || "");
  if (spice >= 2) base += " #ICant #WeCant #UCant";
  return base;
}

// ---------------- UTILS ----------------
function encodeTweet(text: string) {
  return encodeURIComponent(text);
}
function useSiteUrl() {
  const [url, setUrl] = useState("https://cant.example");
  useEffect(() => {
    try {
      const href = window?.location?.href;
      if (href) setUrl(href.split("?")[0]);
    } catch {}
  }, []);
  return url;
}
function normalizeHandle(h: string) {
  const t = (h || "").trim();
  if (!t) return "";
  const stripped = t.replace(/^@+/, "").replace(/\s+/g, "");
  return stripped ? `@${stripped}` : "";
}

function buildTweet({
  cant,
  canLine,
  siteUrl,
  handle,
  communityUrl,
}: {
  cant: string;
  canLine: string;
  siteUrl: string;
  handle?: string;
  communityUrl?: string;
}) {
  const parts: string[] = [cant, canLine, "$CANT"]; // always include ticker
  const h = normalizeHandle(handle || "");
  if (h) parts.push(h);
  if (siteUrl) parts.push(siteUrl);
  if (communityUrl) parts.push(communityUrl);
  return parts.join("\n").trim();
}

// ---------------- PAGE ----------------
export default function CantPage() {
  const siteUrl = useSiteUrl();

  // Inputs
  const [cant, setCant] = useState("I can’t pay rent but I bought $CANT.");
  const [handle, setHandle] = useState("");

  // Submit-driven AI
  const [submitted, setSubmitted] = useState(false);
  const [canLine, setCanLine] = useState("");
  function handleSubmit() {
    const trimmed = (cant || "").trim();
    if (!trimmed) return;
    setCanLine(roastCant(trimmed, 2));
    setSubmitted(true);
  }

  // Toast
  const [toast, setToast] = useState<{ msg: string; visible: boolean }>({ msg: "", visible: false });
  function showToast(msg: string) {
    setToast({ msg, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 1500);
  }

  // Share
  const tweetText = useMemo(
    () => buildTweet({ cant, canLine, siteUrl, handle, communityUrl: COMMUNITY_URL }),
    [cant, canLine, siteUrl, handle]
  );
  const tweetUrl = useMemo(
    () => `https://twitter.com/intent/tweet?text=${encodeTweet(tweetText)}`,
    [tweetText]
  );

  // Wall + votes (local fallback version)
  type WallItem = {
    id: string;
    cant: string;
    can: string;
    handle?: string;
    at: number;
    score: number;
  };
  const [wall, setWall] = useState<WallItem[]>([]);
  const [sortBy, setSortBy] = useState<"new" | "top">("top");
  const [votes, setVotes] = useState<Record<string, number>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem("cant.wall");
      if (raw) setWall(JSON.parse(raw));
      const rawVotes = localStorage.getItem("cant.votes");
      if (rawVotes) setVotes(JSON.parse(rawVotes));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("cant.wall", JSON.stringify(wall.slice(0, 100)));
    } catch {}
  }, [wall]);
  useEffect(() => {
    try {
      localStorage.setItem("cant.votes", JSON.stringify(votes));
    } catch {}
  }, [votes]);

  function tweetUrlFor(item: WallItem) {
    const text = buildTweet({
      cant: item.cant,
      canLine: item.can,
      siteUrl,
      handle: item.handle,
      communityUrl: COMMUNITY_URL,
    });
    return `https://twitter.com/intent/tweet?text=${encodeTweet(text)}`;
  }

  // Debounce guard for posting
  const [postCooldown, setPostCooldown] = useState(false);

  function postToWall() {
    if (!submitted || !canLine || postCooldown) return;
    setPostCooldown(true);
    setTimeout(() => setPostCooldown(false), 500);

    const id =
      typeof crypto !== "undefined" && (crypto as any).randomUUID
        ? (crypto as any).randomUUID()
        : `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const item: WallItem = {
      id,
      cant,
      can: canLine,
      handle: handle?.trim() || undefined,
      at: Date.now(),
      score: 0,
    };
    setWall((prev) => [item, ...prev].slice(0, 100));
  }

  function vote(id: string, delta: 1 | -1) {
    setWall((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const prevVote = votes[id] || 0;
        const nextVote = prevVote === delta ? 0 : delta; // toggle
        const scoreAdj = prevVote === 0 ? delta : nextVote - prevVote;
        return { ...it, score: it.score + scoreAdj };
      })
    );
    setVotes((v) => {
      const prevVote = v[id] || 0;
      const nextVote = prevVote === delta ? 0 : delta;
      return { ...v, [id]: nextVote };
    });
  }

  const sortedWall = useMemo(() => {
    const arr = [...wall];
    if (sortBy === "top") arr.sort((a, b) => b.score - a.score || b.at - a.at);
    else arr.sort((a, b) => b.at - a.at);
    return arr;
  }, [wall, sortBy]);

  // Dev-only logs
  if (isDev) {
    try {
      if (tweetText.length > 280) {
        console.warn(`[warn] tweet length ${tweetText.length} > 280; consider trimming lines`);
      }
      if (!COMMUNITY_URL) {
        console.warn("[warn] COMMUNITY_URL empty; falling back to default");
      }
    } catch {}
  }

  return (
    <div className="min-h-screen w-full bg-neutral-950 text-neutral-100">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-neutral-950/70 bg-neutral-950/90 border-b border-neutral-800">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-emerald-300 font-mono text-2xl">$CANT</span>
            <span className="text-sm text-neutral-400">I can’t. We can’t. You can’t.</span>
          </div>
          <div className="flex items-center gap-2">
            {/* FIXED: readable and single open */}
            <Button
              asChild
              className="bg-white !text-black hover:bg-neutral-100 border border-neutral-200"
              aria-label="Open the $CANT X Community (opens in a new tab)"
            >
              <a href={COMMUNITY_URL} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" /> X Community
              </a>
            </Button>
            {/* FIXED: readable and single open */}
            <Button
              asChild
              className="bg-white !text-black hover:bg-neutral-100 border border-neutral-200"
              aria-label="Share current tweet to X (opens in a new tab)"
            >
              <a href={tweetUrl} target="_blank" rel="noopener noreferrer">
                <Share2 className="h-4 w-4 mr-2" /> Share to X
              </a>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 grid lg:grid-cols-[1.05fr_0.95fr] gap-6">
        {/* Left: compose + preview */}
        <section className="space-y-4">
          <Frame title="$CANT — compose">
            <div className="space-y-4">
              <label className="text-xs uppercase tracking-wider text-neutral-400">Your CANT</label>
              <Textarea
                value={cant}
                onChange={(e) => {
                  setCant(e.target.value);
                  setSubmitted(false);
                }}
                className="bg-neutral-900 border-neutral-800 font-mono"
                rows={3}
                placeholder="I can’t ____"
                aria-label="Write your CANT"
              />

              <div className="w-full">
                <Input
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="(optional) your @handle"
                  className="bg-neutral-900 border-neutral-800"
                  aria-label="Optional X handle"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-3">
                <Button onClick={handleSubmit} className="bg-emerald-600 hover:bg-emerald-500" aria-label="Submit your CANT">
                  Submit
                </Button>
                <Button asChild disabled={!submitted} aria-label="Share your CANT to X">
                  <a
                    href={submitted ? tweetUrl : undefined}
                    target={submitted ? "_blank" : undefined}
                    rel={submitted ? "noreferrer" : undefined}
                    aria-label="Share your CANT to X"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share to X
                  </a>
                </Button>
                <Button
                  className="bg-neutral-800 text-neutral-100 hover:bg-neutral-700 border border-neutral-700"
                  disabled={!submitted}
                  onClick={() => {
                    navigator.clipboard.writeText(tweetText);
                    showToast("Tweet copied");
                  }}
                  aria-label="Copy tweet text to clipboard"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Tweet
                </Button>
              </div>
            </div>
          </Frame>

          <Frame title="$CANT — preview">
            <Screen>{`$CANT> ${cant}${submitted ? `\n\n$CANT_AI> ${canLine}` : ""}`}</Screen>
          </Frame>

          <div className="flex items-center justify-between">
            <Button onClick={postToWall} className="bg-emerald-600 hover:bg-emerald-500" disabled={!submitted || postCooldown} aria-label="Post to the CANT Wall">
              Post to Wall
            </Button>
          </div>
        </section>

        {/* Right: Wall with votes */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">CANT Wall (local)</h2>
            <div className="flex items-center gap-2 text-sm">
              <ArrowUpNarrowWide className="h-4 w-4" />
              <button
                onClick={() => setSortBy("top")}
                className={`px-2 py-1 rounded ${sortBy === "top" ? "bg-neutral-800" : "hover:bg-neutral-900"}`}
                aria-label="Sort wall by top"
              >
                Top
              </button>
              <button
                onClick={() => setSortBy("new")}
                className={`px-2 py-1 rounded ${sortBy === "new" ? "bg-neutral-800" : "hover:bg-neutral-900"}`}
                aria-label="Sort wall by newest"
              >
                New
              </button>
            </div>
          </div>

          <div className="grid gap-4">
            {sortedWall.length === 0 && (
              <p className="text-neutral-500 text-sm">
                Your posts will appear here. Connect a backend later to make this global.
              </p>
            )}
            {sortedWall.map((item) => (
              <Card key={item.id} className="bg-neutral-950 border-neutral-800">
                <CardContent className="pt-6 space-y-3">
                  <Screen>{`$CANT> ${item.cant}\n\n$CANT_AI> ${item.can}`}</Screen>
                  <div className="flex items-center justify-between text-xs text-neutral-400">
                    <span>{item.handle ? `by ${item.handle}` : "anon"}</span>
                    <span>{new Date(item.at).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className={`border-neutral-700 ${votes[item.id] === 1 ? "bg-neutral-800" : ""}`}
                        onClick={() => vote(item.id, 1)}
                        aria-label="Upvote this post"
                      >
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        Upvote
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className={`border-neutral-700 ${votes[item.id] === -1 ? "bg-neutral-800" : ""}`}
                        onClick={() => vote(item.id, -1)}
                        aria-label="Downvote this post"
                      >
                        <ThumbsDown className="h-4 w-4 mr-1" />
                        Downvote
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* FIXED: single-open wall share link */}
                      <Button asChild size="sm" className="bg-emerald-600 text-white hover:bg-emerald-500" aria-label="Share this wall post to X">
                        <a href={tweetUrlFor(item)} target="_blank" rel="noopener noreferrer">
                          <Share2 className="h-4 w-4 mr-1" /> Share to X
                        </a>
                      </Button>
                      <div className="text-sm text-neutral-300">
                        Score: <span className="font-semibold">{item.score}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-4 py-10 text-center text-neutral-500">
        <p className="font-mono">$CANT · I can’t. We can’t. You can’t.</p>
      </footer>

      {/* Tiny toast */}
      {toast.visible && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-neutral-100 text-neutral-900 px-4 py-2 shadow-xl border border-neutral-200"
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
