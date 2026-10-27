import { getStore } from "@netlify/blobs";
import { createHash } from "node:crypto";

// Hash SHA-256 dari "username:password". Lebih aman diisi lewat env var ADMIN_HASH di Netlify.
const H = process.env.ADMIN_HASH || "c59970654e43b6c3bc8f1d83a8274ba1aa54ea82b5164276a0f3beb92f220117";
const ok = (u, p) => createHash("sha256").update(`${u}:${p}`).digest("hex") === H;

export default async (req) => {
  const store = getStore("dhc");
  if (req.method === "GET") {
    const d = await store.get("data", { type: "json" });
    return d
      ? Response.json(d, { headers: { "cache-control": "no-store" } })
      : new Response("{}", { status: 404 });
  }
  if (req.method !== "POST") return new Response("", { status: 405 });
  let b;
  try { b = await req.json(); } catch { return new Response("", { status: 400 }); }
  if (!ok(String(b.u || "").trim(), String(b.p || ""))) {
    await new Promise((r) => setTimeout(r, 600));
    return new Response("", { status: 401 });
  }
  if (b.action === "login") return new Response("ok");
  const d = b.data;
  if (!d || typeof d !== "object" || !d.name || !Array.isArray(d.players) || JSON.stringify(d).length > 200000)
    return new Response("", { status: 400 });
  await store.setJSON("data", d);
  return new Response("ok");
};

export const config = { path: "/api/data" };
                     
