# Geçici Çözüm

## Problem:
- Users tablosunda `company_id` alanı yok
- Bu nedenle register ve login çalışmıyor

## Hızlı Çözüm:
1. **Register**: Sadece companies tablosuna kayıt yap
2. **Login**: Companies tablosundan giriş yap
3. **Sonra**: Users tablosuna company_id ekle

## Manuel Veritabanı Düzeltmesi:
```sql
-- PostgreSQL'de çalıştır:
ALTER TABLE users ADD COLUMN company_id INTEGER REFERENCES companies(id);
ALTER TABLE companies ADD COLUMN code VARCHAR(255) UNIQUE;
```