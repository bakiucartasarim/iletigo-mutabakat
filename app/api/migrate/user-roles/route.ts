import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    console.log('Running user roles migration...')

    // Drop old constraint
    await query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check`)
    console.log('Old role constraint dropped')

    // Add new constraint with updated roles
    await query(`
      ALTER TABLE users ADD CONSTRAINT users_role_check
      CHECK (role IN ('super_admin', 'company_admin', 'company_user'))
    `)
    console.log('New role constraint added')

    // Migrate existing data
    await query(`UPDATE users SET role = 'super_admin' WHERE role = 'admin'`)
    await query(`UPDATE users SET role = 'company_admin' WHERE role = 'manager'`)
    await query(`UPDATE users SET role = 'company_user' WHERE role = 'user'`)
    console.log('Existing roles migrated')

    // Add additional columns
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS position VARCHAR(100)`)
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}'`)
    console.log('Additional columns added')

    // Create performance index
    await query(`CREATE INDEX IF NOT EXISTS idx_users_role_company ON users(role, company_id)`)
    console.log('Performance index created')

    // Update default role
    await query(`ALTER TABLE users ALTER COLUMN role SET DEFAULT 'company_user'`)
    console.log('Default role updated')

    // Verify the changes
    const result = await query(`
      SELECT role, COUNT(*) as count
      FROM users
      GROUP BY role
      ORDER BY role
    `)

    console.log('Migration completed successfully')
    console.log('Role distribution:', result.rows)

    return NextResponse.json({
      success: true,
      message: 'User roles migration completed successfully',
      roleDistribution: result.rows
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