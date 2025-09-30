# Super Admin Kurulum Rehberi

Bu rehber, `bakiucartasarim@gmail.com` email adresini super admin olarak ayarlamak için gerekli adımları açıklar.

## 🚀 Hızlı Kurulum

### 1. Super Admin Migration'ı Çalıştır

```bash
npm run create-super-admin
```

Bu komut aşağıdaki işlemleri yapar:
- `roles` tablosunu oluşturur (super_admin, admin, user rolleri)
- `users` tablosunu oluşturur
- `user_roles` junction tablosunu oluşturur
- `bakiucartasarim@gmail.com` kullanıcısını oluşturur
- Super admin rolünü atar

### 2. Varsayılan Bilgiler

**Email:** `bakiucartasarim@gmail.com`
**Ad:** Baki Ucar
**Varsayılan Şifre:** `admin123` ⚠️ *Değiştirilmeli*
**Rol:** super_admin

### 3. Mail Engine Erişimi

Super admin olarak aşağıdaki URL'ye erişebilirsiniz:
```
http://localhost:3000/dashboard/mail-engine
```

## 📊 Database Yapısı

### Roller Sistemi

- **super_admin**: Tam sistem erişimi (Mail Engine dahil)
- **admin**: Sistem yönetimi erişimi
- **user**: Temel kullanıcı erişimi

### Tablolar

1. **roles** - Rol tanımları ve izinler
2. **users** - Kullanıcı bilgileri
3. **user_roles** - Kullanıcı-rol ilişkileri

## 🔧 Manuel Database Kurulumu

Eğer `DATABASE_URL` çevre değişkeni tanımlıysa, aşağıdaki SQL'i manuel olarak çalıştırabilirsiniz:

```sql
-- Migration dosyasını çalıştır
\i database/migrations/create_super_admin_user.sql
```

## 🔐 Güvenlik Notları

1. **Şifreyi Değiştirin**: Varsayılan `admin123` şifresini mutlaka değiştirin
2. **Email Doğrulama**: Kullanıcı email_verified=true olarak işaretlendi
3. **Aktif Durum**: Kullanıcı is_active=true olarak ayarlandı

## 🧪 Test Etme

### Super Admin Kontrolü

API endpoint'ini test edin:
```bash
curl http://localhost:3000/api/auth/check-super-admin
```

Başarılı yanıt:
```json
{
  "success": true,
  "data": {
    "isSuperAdmin": true,
    "user": {
      "id": 1,
      "name": "Baki Ucar",
      "email": "bakiucartasarim@gmail.com",
      "role": "super_admin"
    }
  }
}
```

### Mail Engine Erişimi

1. Tarayıcıda `/dashboard/mail-engine` adresine gidin
2. Super admin kontrolü otomatik olarak yapılır
3. Başarılı erişim halinde Mail Engine arayüzü görünür

## 🔄 Rollback

Eğer super admin kullanıcısını kaldırmak isterseniz:

```sql
DELETE FROM user_roles WHERE user_id = (SELECT id FROM users WHERE email = 'bakiucartasarim@gmail.com');
DELETE FROM users WHERE email = 'bakiucartasarim@gmail.com';
```

## 📁 İlgili Dosyalar

- `database/migrations/create_super_admin_user.sql` - Migration dosyası
- `scripts/run_super_admin_migration.js` - Migration runner
- `app/api/auth/check-super-admin/route.ts` - Super admin kontrol API'si
- `app/dashboard/mail-engine/page.tsx` - Mail Engine sayfası

## 🆘 Sorun Giderme

### Mock Mode
Eğer `DATABASE_URL` tanımlı değilse, sistem mock mode'da çalışır ve tüm kullanıcıları super admin olarak kabul eder.

### Database Bağlantı Hatası
API, database bağlantı hatası durumunda otomatik olarak mock mode'a geçer.

### Erişim Engeli
Eğer Mail Engine'e erişiminiz engelleniyorsa:
1. Migration'ın düzgün çalıştığını kontrol edin
2. Database bağlantısını test edin
3. Browser console'unda hata mesajlarını kontrol edin