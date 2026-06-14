// Minimal public-suffix handling to compute the registrable ("eTLD+1") domain.
// This is a pragmatic subset of the Public Suffix List — enough to cover the
// multi-label TLDs people actually paste cookies for. Falls back to last-2-labels.

const MULTI_PART_SUFFIXES = new Set([
  // United Kingdom
  "co.uk", "org.uk", "me.uk", "ltd.uk", "plc.uk", "net.uk", "sch.uk", "ac.uk", "gov.uk",
  // Australia
  "com.au", "net.au", "org.au", "edu.au", "gov.au", "id.au",
  // Vietnam
  "com.vn", "net.vn", "org.vn", "edu.vn", "gov.vn", "biz.vn", "info.vn",
  // Brazil / Argentina / Mexico
  "com.br", "net.br", "org.br", "com.ar", "com.mx",
  // Asia
  "com.cn", "net.cn", "org.cn", "com.tw", "com.hk", "com.sg", "com.my", "com.ph",
  "co.jp", "ne.jp", "or.jp", "co.kr", "co.in", "co.id", "co.th", "in.th",
  // Others
  "co.za", "com.tr", "com.ua", "co.nz", "co.il", "com.sa", "com.eg",
]);

/** Return true for IP literals and bare hosts that have no registrable domain. */
function isIpOrLocal(hostname) {
  if (!hostname) return true;
  if (hostname === "localhost") return true;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) return true; // IPv4
  if (hostname.includes(":")) return true; // IPv6
  if (!hostname.includes(".")) return true; // single label
  return false;
}

/**
 * Compute the registrable domain (eTLD+1) for a hostname.
 * e.g. "www.facebook.com" -> "facebook.com", "foo.bar.co.uk" -> "bar.co.uk".
 */
export function getRegistrableDomain(hostname) {
  if (!hostname) return hostname;
  hostname = hostname.replace(/^\./, "").toLowerCase();
  if (isIpOrLocal(hostname)) return hostname;

  const parts = hostname.split(".");
  const lastTwo = parts.slice(-2).join(".");
  if (MULTI_PART_SUFFIXES.has(lastTwo) && parts.length >= 3) {
    return parts.slice(-3).join(".");
  }
  return parts.slice(-2).join(".");
}

/**
 * Cookie domain to use for a "domain cookie" (covers all subdomains).
 * e.g. "www.facebook.com" -> ".facebook.com". IPs/localhost stay host-only.
 */
export function toCookieDomain(hostname) {
  const reg = getRegistrableDomain(hostname);
  if (isIpOrLocal(reg)) return reg; // can't make a domain cookie for an IP
  return "." + reg;
}

/** Strip a leading dot to get a hostname usable in a URL. */
export function domainToHost(domain) {
  return (domain || "").replace(/^\./, "");
}
