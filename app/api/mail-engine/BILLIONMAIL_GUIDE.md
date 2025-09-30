# BillionMail Integration Guide

## BillionMail Nedir?

BillionMail, açık kaynaklı, self-hosted email marketing ve mail server platformudur.

**GitHub:** https://github.com/aaPanel/BillionMail

### ✅ Avantajları:
- Ücretsiz ve açık kaynak (AGPLv3)
- Sınırsız email gönderimi
- Kendi sunucunuzda tam kontrol
- WebMail (RoundCube) entegrasyonu
- Gelişmiş analitik ve tracking
- Özelleştirilebilir email şablonları
- Aylık abonelik ücreti yok

### 📊 Demo:
- URL: https://demo.billionmail.com/billionmail
- Kullanıcı: `billionmail`
- Şifre: `billionmail`

## Kurulum

### 1. Doğrudan Kurulum (Linux Server)

```bash
cd /opt
git clone https://github.com/aaPanel/BillionMail
cd BillionMail
bash install.sh
```

### 2. Docker Kurulum

```bash
cd /opt
git clone https://github.com/aaPanel/BillionMail
cd BillionMail
cp env_init .env
docker compose up -d
```

### 3. Kurulum Sonrası

```bash
# Giriş bilgilerini görüntüle
bm default

# DNS kayıtlarını görüntüle
bm show-record

# Güncelleme
bm update

# Yardım
bm help
```

## DNS Ayarları

BillionMail kurulumundan sonra domain'iniz için şu DNS kayıtlarını eklemelisiniz:

```
# A Record
mail.yourdomain.com  ->  YOUR_SERVER_IP

# MX Record
yourdomain.com  ->  mail.yourdomain.com  (Priority: 10)

# SPF Record (TXT)
yourdomain.com  ->  "v=spf1 mx ~all"

# DKIM Record (TXT)
default._domainkey.yourdomain.com  ->  [BillionMail tarafından sağlanacak]

# DMARC Record (TXT)
_dmarc.yourdomain.com  ->  "v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com"
```

## İletigo Mail Engine Entegrasyonu

### 1. Tekli Email Gönderimi

```typescript
const response = await fetch('/api/mail-engine/billionmail/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    billionmailHost: 'https://mail.yourdomain.com',
    apiKey: 'your-api-key',
    apiSecret: 'your-api-secret',
    fromEmail: 'noreply@yourdomain.com',
    fromName: 'İletigo',
    toEmail: 'user@example.com',
    subject: 'Test Email',
    htmlContent: '<h1>Hello!</h1>',
    textContent: 'Hello!'
  })
})
```

### 2. Toplu Email Gönderimi

```typescript
const response = await fetch('/api/mail-engine/billionmail/send-bulk', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    billionmailHost: 'https://mail.yourdomain.com',
    apiKey: 'your-api-key',
    apiSecret: 'your-api-secret',
    fromEmail: 'noreply@yourdomain.com',
    fromName: 'İletigo',
    recipients: [
      {
        email: 'user1@example.com',
        firstName: 'John',
        lastName: 'Doe',
        companyName: 'Company A'
      },
      {
        email: 'user2@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        companyName: 'Company B'
      }
    ],
    subject: 'Bulk Email Test',
    htmlTemplate: `
      <h1>Hello {{firstName}} {{lastName}}!</h1>
      <p>Welcome from {{companyName}}</p>
    `,
    batchSize: 100,
    delayBetweenBatches: 500
  })
})
```

## SMTP ile Direkt Kullanım

BillionMail SMTP üzerinden de kullanılabilir:

```typescript
const response = await fetch('/api/mail-engine/send-smtp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    smtpHost: 'mail.yourdomain.com',
    smtpPort: 587,
    smtpUser: 'noreply@yourdomain.com',
    smtpPassword: 'your-password',
    fromEmail: 'noreply@yourdomain.com',
    fromName: 'İletigo',
    toEmail: 'user@example.com',
    subject: 'Test via SMTP'
  })
})
```

## Environment Variables

`.env.local` dosyanıza ekleyin:

```env
# BillionMail Configuration
BILLIONMAIL_HOST=https://mail.yourdomain.com
BILLIONMAIL_API_KEY=your-api-key
BILLIONMAIL_API_SECRET=your-api-secret
BILLIONMAIL_FROM_EMAIL=noreply@yourdomain.com
BILLIONMAIL_FROM_NAME=İletigo

# Alternative: BillionMail SMTP
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your-password
```

## Mail Engine Dashboard Kullanımı

1. `/dashboard/mail-engine` adresine gidin
2. **Settings** sekmesinde BillionMail bilgilerini girin
3. **Test & Debug** sekmesinden test emaili gönderin

## Toplu Email Template Değişkenleri

HTML/Text template'lerinizde şu değişkenleri kullanabilirsiniz:

- `{{email}}` - Alıcının email adresi
- `{{firstName}}` - Ad
- `{{lastName}}` - Soyad
- `{{companyName}}` - Şirket adı
- `{{companyId}}` - Şirket ID
- `{{customData.FIELD}}` - Custom veri alanları
- `{{currentDate}}` - Güncel tarih
- `{{currentDateTime}}` - Güncel tarih ve saat

**Örnek:**

```html
<h1>Merhaba {{firstName}} {{lastName}},</h1>
<p>{{companyName}} için mutabakat raporu hazır.</p>
<p>Tarih: {{currentDate}}</p>
```

## Production Önerileri

### 1. DKIM/SPF/DMARC Kurulumu
- Email deliverability için gerekli
- BillionMail otomatik DKIM key oluşturur
- DNS kayıtlarını ekleyin

### 2. IP Reputation
- Dedicated IP kullanın
- IP warm-up süreci uygulayın
- İlk günlerde düşük volume ile başlayın

### 3. Rate Limiting
- Batch size: 50-100 email
- Delay between batches: 500-1000ms
- Günlük limit belirleyin

### 4. Monitoring
- Bounce rate izleyin
- Spam complaint oranını takip edin
- BillionMail analytics'i kullanın

### 5. List Hygiene
- Invalid email adreslerini temizleyin
- Hard bounce'ları listeden çıkarın
- Unsubscribe işlemlerini otomatikleştirin

## Troubleshooting

### Email Gönderilmiyor
1. ✅ BillionMail servisi çalışıyor mu? (`systemctl status billionmail`)
2. ✅ DNS kayıtları doğru mu?
3. ✅ Firewall port 25, 587, 465 açık mı?
4. ✅ API credentials doğru mu?

### Email Spam'e Düşüyor
1. ✅ SPF/DKIM/DMARC kayıtları eklenmiş mi?
2. ✅ IP reputation temiz mi? (mxtoolbox.com/blacklists.aspx)
3. ✅ Email content spam kelimeler içermiyor mu?
4. ✅ Unsubscribe linki var mı?

### Yavaş Gönderim
1. ✅ Batch size'ı artırın (dikkatli)
2. ✅ Server resources yeterli mi?
3. ✅ Network latency düşük mü?

## Alternatif Self-Hosted Çözümler

- **Postal** - https://github.com/postalserver/postal
- **Mailu** - https://mailu.io/
- **Mail-in-a-Box** - https://mailinabox.email/
- **iRedMail** - https://www.iredmail.org/

## Support

- BillionMail GitHub: https://github.com/aaPanel/BillionMail
- Issues: https://github.com/aaPanel/BillionMail/issues
- İletigo Mail Engine: `/dashboard/mail-engine`