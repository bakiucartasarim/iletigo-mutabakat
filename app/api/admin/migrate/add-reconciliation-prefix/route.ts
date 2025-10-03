import { NextResponse } from 'next/server'
import { Pool } from 'pg'

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'DATABASE_URL not configured' }, { status: 500 })
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false
  })

  try {
    console.log('🔄 Adding reconciliation_code_prefix column to companies table...')

    // Add column if it doesn't exist
    await pool.query(`
      ALTER TABLE companies
      ADD COLUMN IF NOT EXISTS reconciliation_code_prefix VARCHAR(10) DEFAULT NULL
    `)

    console.log('✅ Column added successfully')

    // Show current companies
    const result = await pool.query('SELECT id, name, reconciliation_code_prefix FROM companies')
    console.log('📊 Current companies:', result.rows)

    return NextResponse.json({
      success: true,
      message: 'reconciliation_code_prefix column added successfully',
      companies: result.rows
    })

  } catch (error) {
    console.error('❌ Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await pool.end()
  }
}
