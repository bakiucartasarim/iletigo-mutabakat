import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    console.log('Running logo and stamp fields migration...')

    // Add logo field
    await query(`ALTER TABLE companies ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500)`)
    console.log('Logo field added successfully')

    // Add stamp field
    await query(`ALTER TABLE companies ADD COLUMN IF NOT EXISTS stamp_url VARCHAR(500)`)
    console.log('Stamp field added successfully')

    // Update existing records with default values if needed
    await query(`UPDATE companies SET logo_url = '' WHERE logo_url IS NULL`)
    await query(`UPDATE companies SET stamp_url = '' WHERE stamp_url IS NULL`)
    console.log('Default values set successfully')

    // Add indexes for better performance
    await query(`CREATE INDEX IF NOT EXISTS idx_companies_logo ON companies(logo_url)`)
    await query(`CREATE INDEX IF NOT EXISTS idx_companies_stamp ON companies(stamp_url)`)
    console.log('Indexes created successfully')

    // Verify the changes
    const result = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'companies'
      AND column_name IN ('logo_url', 'stamp_url')
      ORDER BY column_name
    `)

    console.log('Migration completed successfully')
    console.log('New columns:', result.rows)

    return NextResponse.json({
      success: true,
      message: 'Logo and stamp fields migration completed successfully',
      columns: result.rows
    })

  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Migration failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}