# İletigo Mutabakat Sistemi - Veritabanı Kurulumu

## 🚀 Hızlı Başlangıç

### 1. Veritabanı Kurulumu

#### PostgreSQL yükleyin:
```bash
# Windows için PostgreSQL indirin: https://www.postgresql.org/download/windows/
# macOS için:
brew install postgresql

# Ubuntu/Debian için:
sudo apt-get install postgresql postgresql-contrib
```

#### Veritabanı oluşturun:
```sql
CREATE DATABASE mutabakat_db;
CREATE USER mutabakat_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE mutabakat_db TO mutabakat_user;
```

### 2. Environment Variables

`.env.local` dosyasını oluşturun:
```bash
cp .env.example .env.local
```

`.env.local` dosyasını düzenleyin:
```env
DATABASE_URL="postgresql://mutabakat_user:your_password@localhost:5432/mutabakat_db"
NODE_ENV="development"
```

### 3. Veritabanı Şemasını Oluşturun

```bash
# Otomatik kurulum (DATABASE_URL ayarlandıysa)
node scripts/setup_database.js

# Manuel kurulum (yukarıdaki SQL'leri PostgreSQL'de çalıştırın)
```

## 📊 Tablo Yapısı

### Ana Tablolar:
- `companies` - Şirket/kurum bilgileri
- `users` - Kullanıcı yönetimi
- `reconciliation_periods` - Mutabakat dönemleri
- `reconciliations` - Ana mutabakat kayıtları
- `reconciliation_excel_data` - Excel verilerinin saklandığı tablo

### Destek Tabloları:
- `reconciliation_details` - Mutabakat detayları
- `attachments` - Dosya ekleri
- `comments` - Yorumlar/notlar
- `activity_logs` - Audit trail
- `settings` - Sistem ayarları
- `user_sessions` - Oturum yönetimi

## 🔧 API Endpoints

### Mutabakat Oluşturma:
```
POST /api/reconciliations/create
Body: {
  formData: { /* form verileri */ },
  excelData: [ /* Excel satırları */ ]
}
```

## 🎯 Özellikler

- ✅ Excel dosyası yükleme ve işleme
- ✅ Otomatik veri validasyonu
- ✅ İstatistik hesaplama (Borç/Alacak)
- ✅ Audit trail (aktivite logları)
- ✅ Multi-company support
- ✅ Mock mode (veritabanı olmadan çalışma)

## 📝 Mock Mode

Veritabanı kurulumu yapılmadığında sistem otomatik olarak Mock Mode'da çalışır:
- Veriler console'a loglanır
- İşlem başarılı olarak gösterilir
- Gerçek kayıt yapılmaz

## 🚨 Önemli Notlar

1. **Güvenlik**: Production ortamında güçlü şifreler kullanın
2. **Backup**: Düzenli veritabanı yedekleri alın
3. **SSL**: Production'da SSL bağlantısı kullanın
4. **Indexler**: Büyük veri setleri için ek indexler ekleyin

## 🐛 Sorun Giderme

### Hata: "relation does not exist"
- Veritabanı şeması oluşturulmamış
- `node scripts/setup_database.js` çalıştırın

### Hata: "connection refused"
- PostgreSQL servisi çalışmıyor
- CONNECTION_URL hatalı

### Mock Mode aktif
- DATABASE_URL ayarlanmamış
- `.env.local` dosyasını kontrol edin