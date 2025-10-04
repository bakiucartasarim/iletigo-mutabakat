import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

// GET - Load R2 settings
export async function GET(request: NextRequest) {
  try {
    // Create table if not exists
    await query(`
      CREATE TABLE IF NOT EXISTS r2_settings (
        id SERIAL PRIMARY KEY,
        account_id VARCHAR(255) NOT NULL,
        bucket_name VARCHAR(255) NOT NULL,
        access_key_id VARCHAR(255) NOT NULL,
        secret_access_key TEXT NOT NULL,
        endpoint_url VARCHAR(500),
        public_domain VARCHAR(500),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Get R2 settings
    const result = await query('SELECT * FROM r2_settings ORDER BY id DESC LIMIT 1')

    if (result.rows.length === 0) {
      return NextResponse.json({
        account_id: '',
        bucket_name: '',
        access_key_id: '',
        secret_access_key: '',
        endpoint_url: '',
        public_domain: '',
        is_active: false
      })
    }

    return NextResponse.json(result.rows[0])
  } catch (error: any) {
    console.error('R2 settings load error:', error)
    return NextResponse.json(
      { error: 'Failed to load R2 settings', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Save R2 settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      account_id,
      bucket_name,
      access_key_id,
      secret_access_key,
      endpoint_url,
      public_domain,
      is_active
    } = body

    // Validate required fields
    if (!account_id || !bucket_name || !access_key_id || !secret_access_key) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if settings exist
    const existingResult = await query('SELECT id FROM r2_settings LIMIT 1')

    if (existingResult.rows.length > 0) {
      // Update existing settings
      await query(
        `UPDATE r2_settings
         SET account_id = $1,
             bucket_name = $2,
             access_key_id = $3,
             secret_access_key = $4,
             endpoint_url = $5,
             public_domain = $6,
             is_active = $7,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $8`,
        [
          account_id,
          bucket_name,
          access_key_id,
          secret_access_key,
          endpoint_url || null,
          public_domain || null,
          is_active || true,
          existingResult.rows[0].id
        ]
      )
    } else {
      // Insert new settings
      await query(
        `INSERT INTO r2_settings
         (account_id, bucket_name, access_key_id, secret_access_key, endpoint_url, public_domain, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          account_id,
          bucket_name,
          access_key_id,
          secret_access_key,
          endpoint_url || null,
          public_domain || null,
          is_active || true
        ]
      )
    }

    return NextResponse.json({
      success: true,
      message: 'R2 settings saved successfully'
    })
  } catch (error: any) {
    console.error('R2 settings save error:', error)
    return NextResponse.json(
      { error: 'Failed to save R2 settings', details: error.message },
      { status: 500 }
    )
  }
}
