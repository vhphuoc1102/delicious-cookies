// Per-site "known cookie" profiles. The string format (a=1;b=2) carries NO
// metadata, so we infer sensible flags from these profiles when importing.
//
// The single most important fix: always set a `domain` (e.g. .facebook.com) so
// the cookie is a *domain cookie* covering every subdomain (www, web, m,
// business, mbasic...). Extensions that inject via document.cookie or only pass
// a `url` create host-only cookies scoped to one subdomain — that's why FB
// logins break. Plus document.cookie cannot set HttpOnly cookies like `xs`.

export const SITE_PROFILES = {
  "facebook.com": {
    cookieDomain: ".facebook.com",
    testUrl: "https://www.facebook.com/",
    defaults: { secure: true, sameSite: "no_restriction", path: "/" },
    // httpOnly per real Facebook Set-Cookie behaviour
    cookies: {
      c_user: { httpOnly: false },
      xs: { httpOnly: true },
      datr: { httpOnly: true },
      sb: { httpOnly: true },
      fr: { httpOnly: true },
      wd: { httpOnly: false },
      presence: { httpOnly: false },
      dpr: { httpOnly: false },
      m_pixel_ratio: { httpOnly: false },
    },
  },
  "instagram.com": {
    cookieDomain: ".instagram.com",
    testUrl: "https://www.instagram.com/",
    defaults: { secure: true, sameSite: "no_restriction", path: "/" },
    cookies: {
      sessionid: { httpOnly: true },
      ds_user_id: { httpOnly: false },
      csrftoken: { httpOnly: false },
      mid: { httpOnly: false },
      ig_did: { httpOnly: true },
      rur: { httpOnly: true },
    },
  },
  "google.com": {
    cookieDomain: ".google.com",
    testUrl: "https://www.google.com/",
    defaults: { secure: true, sameSite: "no_restriction", path: "/" },
    cookies: {
      SID: { httpOnly: false },
      HSID: { httpOnly: true },
      SSID: { httpOnly: true },
      SAPISID: { httpOnly: false },
      APISID: { httpOnly: false },
      "__Secure-1PSID": { httpOnly: true },
      "__Secure-3PSID": { httpOnly: true },
    },
  },
  "tiktok.com": {
    cookieDomain: ".tiktok.com",
    testUrl: "https://www.tiktok.com/",
    defaults: { secure: true, sameSite: "no_restriction", path: "/" },
    cookies: {
      sessionid: { httpOnly: true },
      sessionid_ss: { httpOnly: true },
      sid_tt: { httpOnly: true },
    },
  },
};

export function getProfile(registrableDomain) {
  return SITE_PROFILES[registrableDomain] || null;
}
