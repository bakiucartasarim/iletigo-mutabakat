# Klaviyo Flow Setup Guide - Email Gönderimi İçin

## ⚠️ Önemli Bilgi

Klaviyo'da **Event oluşturmak email göndermez!** Email gönderimi için **Flow** (otomasyon) kurulumu gerekir.

## Klaviyo'da Email Göndermenin 3 Yolu

### 1. Flow (Otomasyon) - Önerilen Yöntem ✅

Event-based email gönderimi için Flow oluşturun.

**Adımlar:**

1. Klaviyo Dashboard'da **Flows** sekmesine gidin
2. **Create Flow** butonuna tıklayın
3. **Metric-Triggered Flow** seçin
4. **Metric** olarak custom event'inizi seçin (örn: "İletigo Test Email")
5. **Email** action ekleyin
6. Email template'ini tasarlayın
7. Flow'u **Live** yapın

**API Kullanımı:**
```typescript
// Event oluştur (Flow tarafından tetiklenir)
await fetch('https://a.klaviyo.com/api/events/', {
  method: 'POST',
  headers: {
    'Authorization': `Klaviyo-API-Key ${apiKey}`,
    'REVISION': '2024-10-15'
  },
  body: JSON.stringify({
    data: {
      type: 'event',
      attributes: {
        metric: {
          data: {
            type: 'metric',
            attributes: { name: 'İletigo Test Email' }
          }
        },
        profile: {
          data: {
            type: 'profile',
            attributes: { email: 'user@example.com' }
          }
        },
        properties: {
          subject: 'Custom Subject',
          custom_data: 'value'
        }
      }
    }
  })
})
```

### 2. Campaign API - Manuel Gönderim

Tek seferlik email gönderimi için campaign oluşturun.

**Dezavantajlar:**
- Kompleks API workflow
- Template oluşturma gerekli
- Segment/List yönetimi gerekli

**Daha karmaşık olduğu için önerilmez.**

### 3. SMTP ile Direkt Email ✅ Pratik Çözüm

Klaviyo'yu bypass ederek direkt SMTP ile email gönderin.

**Avantajlar:**
- Anında email gönderimi
- Klaviyo Flow kurulumu gereksiz
- Basit API

**Kullanım:**
```typescript
const response = await fetch('/api/mail-engine/send-smtp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    smtpHost: process.env.SMTP_HOST,
    smtpPort: process.env.SMTP_PORT,
    smtpUser: process.env.SMTP_USER,
    smtpPassword: process.env.SMTP_PASS,
    fromEmail: 'noreply@example.com',
    fromName: 'İletigo',
    toEmail: 'user@example.com',
    subject: 'Test Email',
    htmlContent: '<h1>Test</h1>'
  })
})
```

## Önerilen Mimari

### Klaviyo Kullanımı:
- **Profile management**: Müşteri bilgilerini sakla
- **Segmentation**: Müşteri segmentleri oluştur
- **Analytics**: Email metriklerini takip et
- **Automation**: Uzun vadeli email otomasyonları için Flow'lar

### SMTP Kullanımı:
- **Instant emails**: Anında gönderilmesi gereken emailler
- **System notifications**: Sistem bildirimleri
- **Test emails**: Test emailler
- **Transactional emails**: Sipariş onayı, şifre sıfırlama vs.

## Gmail SMTP Kurulumu (Development)

1. Gmail hesabınıza gidin
2. **Settings** > **Security** > **2-Step Verification** açın
3. **App Passwords** oluşturun
4. `.env.local` dosyasına ekleyin:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
```

## Production SMTP Servisleri

- **SendGrid**: 100 email/day ücretsiz
- **Mailgun**: 10,000 email/month ücretsiz (ilk 3 ay)
- **AWS SES**: Çok ucuz, yüksek deliverability
- **Postmark**: Transactional email için optimize edilmiş

## Test Etme

### SMTP Email Testi:
```bash
curl -X POST http://localhost:3001/api/mail-engine/send-smtp \
  -H "Content-Type: application/json" \
  -d '{
    "smtpHost": "smtp.gmail.com",
    "smtpPort": 587,
    "smtpUser": "your-email@gmail.com",
    "smtpPassword": "your-app-password",
    "toEmail": "test@example.com",
    "subject": "Test Email"
  }'
```

### Klaviyo Event Testi:
```bash
curl -X POST http://localhost:3001/api/klaviyo/test \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "pk_xxx",
    "testEmail": "test@example.com",
    "testType": "email"
  }'
```

## Sorun Giderme

### "Event oluşturuldu ama email gelmedi"
- ✅ Klaviyo'da Flow oluşturun ve Live yapın
- ✅ Flow'un metric'ini event adıyla eşleştirin
- ✅ Profile'ın email adresi doğru olduğundan emin olun

### "SMTP bağlantı hatası"
- ✅ Gmail için App Password kullanın (normal şifre değil)
- ✅ Port 587 (TLS) veya 465 (SSL) kullanın
- ✅ Firewall/antivirus SMTP bağlantısını engelliyor olabilir

### "Email spam'e düşüyor"
- ✅ SPF, DKIM, DMARC kayıtlarını DNS'e ekleyin
- ✅ Güvenilir bir SMTP servisi kullanın
- ✅ Email içeriğinde spam tetikleyici kelimeler kullanmayın