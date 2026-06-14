// Parse & serialize cookies in three interchange formats:
//   - "string"   : header style  ->  c_user=...; xs=...; datr=...
//   - "json"     : Cookie-Editor / EditThisCookie array
//   - "netscape" : tab-separated cookies.txt (curl / yt-dlp / wget)
//
// A parsed cookie is a plain object: { name, value, domain?, path?, secure?,
// httpOnly?, sameSite?, expirationDate?, session?, hostOnly? }. Fields absent in
// the source (very common for the string format) are left undefined so the
// importer can infer them.

export const SAME_SITE_VALUES = ["unspecified", "no_restriction", "lax", "strict"];

export function normalizeSameSite(v) {
  if (!v) return undefined;
  const s = String(v).toLowerCase();
  if (s === "none" || s === "no_restriction") return "no_restriction";
  if (s === "lax") return "lax";
  if (s === "strict") return "strict";
  if (s === "unspecified" || s === "" || s === "no_restriction") return "unspecified";
  return "unspecified";
}

// ---------------------------------------------------------------- detection

export function detectFormat(text) {
  const t = (text || "").trim();
  if (!t) return null;
  if (t.startsWith("[") || t.startsWith("{")) return "json";
  if (/^#\s*(Netscape )?HTTP Cookie File/i.test(t)) return "netscape";

  const lines = t.split(/\r?\n/).map((l) => l.trim());
  const dataLines = lines.filter((l) => l && !(l.startsWith("#") && !/^#HttpOnly_/i.test(l)));
  if (dataLines.length && dataLines.every((l) => l.split("\t").length >= 6)) {
    return "netscape";
  }
  if (t.includes("=")) return "string";
  return null;
}

// ------------------------------------------------------------------ parsing

export function parseCookies(text, format) {
  format = format || detectFormat(text);
  switch (format) {
    case "json":
      return parseJson(text);
    case "netscape":
      return parseNetscape(text);
    case "string":
      return parseString(text);
    default:
      throw new Error("Không nhận diện được định dạng cookie.");
  }
}

function parseString(text) {
  const t = text.trim().replace(/^cookie:\s*/i, "");
  return t
    .split(/;\s*/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((pair) => {
      const i = pair.indexOf("=");
      if (i === -1) return null;
      const name = pair.slice(0, i).trim();
      const value = pair.slice(i + 1).trim();
      return name ? { name, value } : null;
    })
    .filter(Boolean);
}

function parseJson(text) {
  let data = JSON.parse(text);
  if (!Array.isArray(data)) {
    // Could be a single cookie, or { cookies: [...] }
    if (Array.isArray(data.cookies)) data = data.cookies;
    else data = [data];
  }
  return data
    .map((c) => {
      if (!c || !c.name) return null;
      const out = { name: String(c.name), value: c.value != null ? String(c.value) : "" };
      if (c.domain) out.domain = String(c.domain);
      if (c.path) out.path = String(c.path);
      if (typeof c.secure === "boolean") out.secure = c.secure;
      if (typeof c.httpOnly === "boolean") out.httpOnly = c.httpOnly;
      if (c.sameSite) out.sameSite = normalizeSameSite(c.sameSite);
      if (c.hostOnly === true) out.hostOnly = true;
      const exp = c.expirationDate ?? c.expires ?? c.expiry;
      if (typeof exp === "number" && exp > 0) out.expirationDate = exp;
      if (c.session === true) out.session = true;
      return out;
    })
    .filter(Boolean);
}

function parseNetscape(text) {
  const out = [];
  for (const raw of text.split(/\r?\n/)) {
    let line = raw.replace(/\r$/, "");
    const trimmed = line.trim();
    if (!trimmed) continue;

    let httpOnly = false;
    if (/^#HttpOnly_/i.test(trimmed)) {
      httpOnly = true;
      line = trimmed.replace(/^#HttpOnly_/i, "");
    } else if (trimmed.startsWith("#")) {
      continue; // genuine comment
    }

    const f = line.split("\t");
    if (f.length < 7) continue;
    const [domain, , path, secure, expiry, name, ...rest] = f;
    if (!name) continue;
    const cookie = {
      name: name.trim(),
      value: rest.join("\t"),
      domain: domain.trim(),
      path: path || "/",
      secure: /^true$/i.test(secure),
      httpOnly,
    };
    const e = parseInt(expiry, 10);
    if (Number.isFinite(e) && e > 0) cookie.expirationDate = e;
    else cookie.session = true;
    out.push(cookie);
  }
  return out;
}

// -------------------------------------------------------------- serializing

export function serializeCookies(cookies, format) {
  switch (format) {
    case "json":
      return serializeJson(cookies);
    case "netscape":
      return serializeNetscape(cookies);
    case "string":
    default:
      return serializeString(cookies);
  }
}

function serializeString(cookies) {
  return cookies.map((c) => `${c.name}=${c.value}`).join("; ");
}

function serializeJson(cookies) {
  const arr = cookies.map((c) => ({
    name: c.name,
    value: c.value,
    domain: c.domain,
    hostOnly: c.hostOnly ?? !String(c.domain || "").startsWith("."),
    path: c.path || "/",
    secure: !!c.secure,
    httpOnly: !!c.httpOnly,
    sameSite: c.sameSite || "unspecified",
    session: c.session ?? typeof c.expirationDate !== "number",
    ...(typeof c.expirationDate === "number" ? { expirationDate: c.expirationDate } : {}),
  }));
  return JSON.stringify(arr, null, 2);
}

function serializeNetscape(cookies) {
  const lines = ["# Netscape HTTP Cookie File", "# Generated by Cookie Manager", ""];
  for (const c of cookies) {
    const domain = c.domain || "";
    const includeSub = domain.startsWith(".") ? "TRUE" : "FALSE";
    const expiry = typeof c.expirationDate === "number" ? Math.floor(c.expirationDate) : 0;
    const row = [
      domain,
      includeSub,
      c.path || "/",
      c.secure ? "TRUE" : "FALSE",
      String(expiry),
      c.name,
      c.value ?? "",
    ].join("\t");
    lines.push(c.httpOnly ? `#HttpOnly_${row}` : row);
  }
  return lines.join("\n");
}
