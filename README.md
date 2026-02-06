# EOIR Gateway

VPN IP kontrolü ile EOIR portalına güvenli erişim sağlayan basit bir web uygulaması.

## Nasıl Çalışır

1. Kullanıcı siteyi açar
2. Sunucu kullanıcının IP'sini kontrol eder
3. IP, VPN IP listesinde varsa → credentials gösterilir + EOIR linki aktif
4. IP eşleşmezse → "VPN'i aç" uyarısı gösterilir

## Vercel'e Deploy

### 1. GitHub'a Push

```bash
git init
git add .
git commit -m "EOIR Gateway"
git remote add origin https://github.com/KULLANICI/eoir-gateway.git
git push -u origin main
```

### 2. Vercel'de Import

- [vercel.com](https://vercel.com) → New Project → GitHub repo'yu seç → Import

### 3. Environment Variables (Vercel Dashboard)

Settings → Environment Variables → şunları ekle:

| Key | Value |
|-----|-------|
| `ALLOWED_VPN_IPS` | `203.0.113.50,198.51.100.25` (VPN IP'lerin, virgülle ayır) |
| `EOIR_EMAIL` | EOIR giriş emaili |
| `EOIR_PASSWORD` | EOIR giriş şifresi |
| `EOIR_URL` | `https://portal.eoir.justice.gov/` |

### 4. Deploy

Vercel otomatik deploy eder. Her push'ta yeniden deploy olur.

## Lokal Geliştirme

```bash
cp .env.example .env.local
# .env.local dosyasını düzenle
npm install
npm run dev
```

## Güvenlik Notu

- Credentials sadece sunucu tarafında tutulur, IP eşleşmezse asla client'a gönderilmez.
- Vercel'in environment variables'ları şifrelidir.
- Vercel projesini **private** olarak tutun.
