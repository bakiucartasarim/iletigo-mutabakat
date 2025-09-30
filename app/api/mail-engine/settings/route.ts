import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

interface KlaviyoSettings {
  apiKey: string
  fromEmail: string
  fromName: string
  isActive: boolean
}

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      // Return empty settings if no database
      const emptySettings: KlaviyoSettings = {
        apiKey: '',
        fromEmail: '',
        fromName: 'İletigo Teknoloji',
        isActive: false
      }

      return NextResponse.json({
        success: true,
        data: emptySettings
      })
    }

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: false
    })

    try {
      const result = await pool.query(`
        SELECT api_key, from_email, from_name, is_active, updated_at
        FROM mail_engine_settings
        WHERE id = 1
      `)

      if (result.rows.length === 0) {
        // Return default settings if none exist
        const defaultSettings: KlaviyoSettings = {
          apiKey: '',
          fromEmail: '',
          fromName: 'İletigo Teknoloji',
          isActive: false
        }

        return NextResponse.json({
          success: true,
          data: defaultSettings
        })
      }

      const settings = result.rows[0]
      return NextResponse.json({
        success: true,
        data: {
          apiKey: settings.api_key || '',
          fromEmail: settings.from_email || '',
          fromName: settings.from_name || 'İletigo Teknoloji',
          isActive: settings.is_active || false
        }
      })

    } finally {
      await pool.end()
    }

  } catch (error) {
    console.error('Mail engine settings fetch error:', error)
    return NextResponse.json(
      { error: 'Ayarlar getirilemedi' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const settings: KlaviyoSettings = await request.json()

    if (!process.env.DATABASE_URL) {
      // Mock mode
      console.log('📧 Mock mode: Klaviyo ayarları kaydediliyor...', {
        fromEmail: settings.fromEmail,
        fromName: settings.fromName,
        isActive: settings.isActive,
        apiKeyLength: settings.apiKey.length
      })

      return NextResponse.json({
        success: true,
        message: 'Klaviyo ayarları başarıyla kaydedildi (Mock Mode)'
      })
    }

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: false
    })

    try {
      // Create table if it doesn't exist
      await pool.query(`
        CREATE TABLE IF NOT EXISTS mail_engine_settings (
          id INTEGER PRIMARY KEY DEFAULT 1,
          api_key TEXT,
          from_email VARCHAR(255),
          from_name VARCHAR(255),
          is_active BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `)

      // Upsert settings
      await pool.query(`
        INSERT INTO mail_engine_settings (id, api_key, from_email, from_name, is_active, updated_at)
        VALUES (1, $1, $2, $3, $4, NOW())
        ON CONFLICT (id) DO UPDATE SET
          api_key = EXCLUDED.api_key,
          from_email = EXCLUDED.from_email,
          from_name = EXCLUDED.from_name,
          is_active = EXCLUDED.is_active,
          updated_at = NOW()
      `, [settings.apiKey, settings.fromEmail, settings.fromName, settings.isActive])

      return NextResponse.json({
        success: true,
        message: 'Klaviyo ayarları başarıyla kaydedildi'
      })

    } finally {
      await pool.end()
    }

  } catch (error) {
    console.error('Mail engine settings save error:', error)
    return NextResponse.json(
      { error: 'Ayarlar kaydedilemedi: ' + error.message },
      { status: 500 }
    )
  }
}