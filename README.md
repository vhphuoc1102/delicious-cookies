# Cookie Manager — Export / Import (FB-friendly)

Chrome / Edge (Manifest V3) extension để **xem, sửa, thêm, xóa, export và import cookie** của một website. Tập trung giải quyết painpoint khi import **cookie Facebook dạng chuỗi**.

## Cài nhanh (từ Release zip)

1. Vào tab **[Releases](https://github.com/vhphuoc1102/delicious-cookies/releases)** → tải file `delicious-cookies-vX.Y.Z.zip` mới nhất ở mục **Assets**.
2. **Giải nén** → được thư mục `delicious-cookies`.
3. Mở `chrome://extensions` (hoặc `edge://extensions`) → bật **Developer mode**.
4. Bấm **Load unpacked** → chọn thư mục `delicious-cookies` vừa giải nén.

> Chrome không cho cài trực tiếp file `.zip`; phải giải nén rồi *Load unpacked*. Mỗi lần có bản mới, tải zip mới và Load unpacked lại (hoặc bấm ⟳ trên card extension sau khi thay file).

## Vì sao import cookie Facebook hay fail?

Chuỗi kiểu `c_user=...; xs=...; datr=...; fr=...` là **định dạng "Cookie header"** — nó **không chứa metadata** (domain, path, expiry, Secure, HttpOnly, SameSite). Tool import phải tự suy ra.

Hai lỗi phổ biến của các extension khác:

1. **Domain sai** → set thành host-only `www.facebook.com`. Cookie chỉ áp dụng cho `www`, mất session khi FB chuyển qua `web/m/business/...` → login fail.
2. **Inject bằng `document.cookie`** → **không set được cookie HttpOnly** như `xs`, `datr`. Mà thiếu `xs` thì không đăng nhập được.

**Cách extension này fix:**

- Luôn set qua **`chrome.cookies.set`** với `domain = .facebook.com` → tạo **domain cookie** phủ mọi subdomain.
- Áp **Site Profile** để gán đúng `HttpOnly / Secure / SameSite` cho từng cookie đã biết (`xs`, `datr`, `fr`, `sb`, `c_user`...).
- API set được cả cookie HttpOnly.

## Tính năng

- **Cookies**: liệt kê + **search** (name/value/domain), **sửa từng field**, **thêm thủ công**, **xóa từng cái**, **xóa tất cả** của site.
- **Import**: tự nhận diện 3 định dạng — `string` (`a=1;b=2`), `JSON` (Cookie-Editor / EditThisCookie), `Netscape cookies.txt`. Tùy chọn chuẩn hóa domain & áp site profile, chọn hạn dùng (1 năm / 30 ngày / session).
- **Export**: xuất ra `string` / `JSON` / `Netscape`, copy hoặc download.

## Cài đặt (unpacked)

1. Mở `chrome://extensions` (hoặc `edge://extensions`).
2. Bật **Developer mode**.
3. **Load unpacked** → chọn thư mục `extension-import-cookie`.
4. Ghim icon, mở một website rồi bấm vào extension.

## ⚠️ Bảo mật

Cookie phiên = **đăng nhập tài khoản**. Ai có cookie của bạn = vào được tài khoản (kể cả khi đã bật 2FA). Đừng dán cookie vào trang/web lạ, đừng chia sẻ file export, và chỉ import cookie từ nguồn bạn tin tưởng.

## Cấu trúc

```
manifest.json      # MV3, quyền: cookies, tabs, activeTab, storage, <all_urls>
popup.html/css/js  # UI + thao tác chrome.cookies
lib/formats.js     # parse & serialize 3 định dạng + auto-detect
lib/psl.js         # tính registrable domain (eTLD+1) -> .facebook.com
lib/profiles.js    # site profiles (HttpOnly/Secure/SameSite cho FB, IG, Google, TikTok)
icons/             # icon 16/32/48/128
```
