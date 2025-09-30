# Klaviyo API Integration

Klaviyo profile'larında company_id saklama ve çekme işlemleri için API endpoint'leri.

## Özellikler

- ✅ Profile'dan company_id çekme
- ✅ Profile'a company_id ekleme/güncelleme
- ✅ Tüm Klaviyo API test fonksiyonları
- ✅ Debug modu ile detaylı loglar

## API Endpoints

### 1. Get Company ID from Profile

Profile'dan company_id bilgisini çeker.

```typescript
POST /api/klaviyo/get-company-id

Request Body:
{
  "apiKey": "pk_xxx...",
  "email": "user@example.com"
}

Response:
{
  "success": true,
  "data": {
    "profileId": "01ABCD...",
    "email": "user@example.com",
    "companyId": 123,
    "firstName": "John",
    "lastName": "Doe",
    "properties": {
      "company_id": 123,
      "other_property": "value"
    }
  }
}
```

### 2. Update Profile with Company ID

Profile'a company_id ve diğer bilgileri ekler/günceller.

```typescript
POST /api/klaviyo/update-profile

Request Body:
{
  "apiKey": "pk_xxx...",
  "email": "user@example.com",
  "companyId": 123,
  "firstName": "John",
  "lastName": "Doe",
  "additionalProperties": {
    "custom_field": "value"
  }
}

Response:
{
  "success": true,
  "data": {
    "profileId": "01ABCD...",
    "email": "user@example.com",
    "companyId": 123,
    "action": "updated" // or "created"
  }
}
```

### 3. Test Klaviyo API

Tüm Klaviyo API fonksiyonlarını test eder.

```typescript
POST /api/klaviyo/test

Request Body:
{
  "apiKey": "pk_xxx...",
  "testEmail": "test@example.com",
  "testType": "all" // or "connection", "profile", "email", "campaign", "client-events"
}

Response:
{
  "success": true,
  "message": "Tüm testler başarılı!",
  "totalTests": 5,
  "successfulTests": 5,
  "results": [...]
}
```

## Kullanım Örnekleri

### Frontend'den Company ID Çekme

```typescript
async function getCompanyId(email: string) {
  const response = await fetch('/api/klaviyo/get-company-id', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiKey: klaviyoSettings.apiKey,
      email: email
    })
  })

  const result = await response.json()
  return result.data.companyId
}
```

### Profile Güncelleme

```typescript
async function updateProfileWithCompanyId(email: string, companyId: number) {
  const response = await fetch('/api/klaviyo/update-profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiKey: klaviyoSettings.apiKey,
      email: email,
      companyId: companyId,
      firstName: 'John',
      lastName: 'Doe'
    })
  })

  return await response.json()
}
```

## Klaviyo Profile Properties

Klaviyo profile'larda custom property olarak `company_id` saklanır:

```json
{
  "data": {
    "type": "profile",
    "attributes": {
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "properties": {
        "company_id": 123,
        "created_by": "İletigo Mail Engine"
      }
    }
  }
}
```

## Additional Fields Query Parameter

Profile'dan properties çekmek için `additional-fields` query parametresini kullanın:

```
GET /api/profiles/?filter=equals(email,"user@example.com")&additional-fields[profile]=properties
```

## Referanslar

- [Klaviyo API Documentation](https://developers.klaviyo.com/en/reference/api_overview)
- [Get Profiles Example](https://github.com/klaviyo-labs/api-examples/tree/main/profiles/get_profiles_youtube)
- [Klaviyo Labs API Examples](https://github.com/klaviyo-labs/api-examples)

## Mail Engine Kullanımı

Mail Engine dashboard'unda (/dashboard/mail-engine):

1. **Klaviyo Ayarları** sekmesinde API key'inizi girin
2. **Test & Debug** sekmesinde API'yi test edin
3. Profile testinde company_id bilgisi gösterilecek
4. Debug modunu açarak detaylı request/response loglarını görün