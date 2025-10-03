import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

// Demo reconciliations data (fallback)
const demoReconciliations = [
  {
    id: 1,
    reference_number: 'MUT-2024-001',
    title: 'Ocak Ayi Satis Mutabakati',
    company_name: 'ABC Sirket Ltd.',
    company_code: 'ABC123',
    our_amount: 15000.00,
    their_amount: 14800.00,
    difference: 200.00,
    currency: 'TRY',
    status: 'pending',
    priority: 'high',
    due_date: '2024-02-15',
    assigned_to: 'Admin User',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-20T14:20:00Z',
    reconciliation_date: '2024-01-15',
    year: 2024,
    month: 1,
    email: 'info@abcsirket.com',
    phone: '0212 123 45 67',
    type: 'mutabakat',
    debt_credit: 'borc',
    is_active: true,
    mail_status: 'not_sent',
    approval_token: null
  },
  {
    id: 2,
    reference_number: 'MUT-2024-002',
    title: 'Subat Ayi Alim Mutabakati',
    company_name: 'XYZ Corp A.S.',
    company_code: 'XYZ001',
    our_amount: 25000.00,
    their_amount: 25000.00,
    difference: 0.00,
    currency: 'TRY',
    status: 'resolved',
    priority: 'medium',
    due_date: '2024-03-15',
    assigned_to: 'Manager User',
    created_at: '2024-02-01T09:15:00Z',
    updated_at: '2024-02-10T16:45:00Z',
    reconciliation_date: '2024-02-01',
    year: 2024,
    month: 2,
    email: 'contact@xyzcorp.com',
    phone: '0212 987 65 43',
    type: 'mutabakat',
    debt_credit: 'alacak',
    is_active: true,
    mail_status: 'approved',
    approval_token: 'abc123token'
  },
  {
    id: 3,
    reference_number: 'MUT-2024-003',
    title: 'Mart Ayi Hizmet Mutabakati',
    company_name: 'DEF Teknoloji Ltd.',
    company_code: 'DEF-500',
    our_amount: 8500.00,
    their_amount: 9200.00,
    difference: -700.00,
    currency: 'TRY',
    status: 'disputed',
    priority: 'urgent',
    due_date: '2024-04-10',
    assigned_to: 'Admin User',
    created_at: '2024-03-05T11:20:00Z',
    updated_at: '2024-03-12T13:30:00Z',
    reconciliation_date: '2024-03-05',
    year: 2024,
    month: 3,
    email: 'bilgi@deftek.com',
    phone: '0216 555 11 22',
    type: 'bilgilendirme',
    debt_credit: 'borc',
    is_active: false,
    mail_status: 'rejected',
    approval_token: 'def456token'
  },
  {
    id: 4,
    reference_number: 'MUT-2024-004',
    title: 'Nisan Ayi Urun Satis Mutabakati',
    company_name: 'GHI Insaat A.S.',
    company_code: 'GHI999',
    our_amount: 35000.00,
    their_amount: 34500.00,
    difference: 500.00,
    currency: 'TRY',
    status: 'pending',
    priority: 'medium',
    due_date: '2024-05-15',
    assigned_to: 'User Staff',
    created_at: '2024-04-02T08:45:00Z',
    updated_at: '2024-04-08T10:15:00Z',
    reconciliation_date: '2024-04-02',
    year: 2024,
    month: 4,
    email: 'info@ghiinsaat.com',
    phone: '0312 444 55 66',
    type: 'mutabakat',
    debt_credit: 'alacak',
    is_active: true,
    mail_status: 'sent',
    approval_token: 'ghi789token'
  },
  {
    id: 5,
    reference_number: 'MUT-2025-005',
    title: 'Ocak Ayi Danismanlik Mutabakati',
    company_name: 'JKL Consulting Ltd.',
    company_code: 'JKL-CONS',
    our_amount: 12000.00,
    their_amount: 12000.00,
    difference: 0.00,
    currency: 'TRY',
    status: 'resolved',
    priority: 'low',
    due_date: '2025-02-20',
    assigned_to: 'Manager User',
    created_at: '2025-01-01T14:10:00Z',
    updated_at: '2025-01-15T09:25:00Z',
    reconciliation_date: '2025-01-01',
    year: 2025,
    month: 1,
    email: 'hello@jklcons.com',
    phone: '0216 777 88 99',
    type: 'cari_bakiye_hatirlatma',
    debt_credit: 'borc',
    is_active: true,
    mail_status: 'not_sent',
    approval_token: null
  }
]

// Demo companies data
let demoCompanies = [
  {
    id: 1,
    code: 'ABC123',
    name: 'ABC Şirket Ltd.',
    contact_person: 'Ali Veli',
    email: 'info@abcsirket.com',
    phone: '0212 123 45 67',
    mobile_phone: '0555 123 45 67'
  },
  {
    id: 2,
    code: 'XYZ001',
    name: 'XYZ Corp A.Ş.',
    contact_person: 'Mehmet Yılmaz',
    email: 'contact@xyzcorp.com',
    phone: '0212 987 65 43',
    mobile_phone: '0555 987 65 43'
  },
  {
    id: 3,
    code: 'DEF-500',
    name: 'DEF Teknoloji Ltd.',
    contact_person: 'Ayşe Demir',
    email: 'bilgi@deftek.com',
    phone: '0216 555 11 22',
    mobile_phone: '0533 555 11 22'
  },
  {
    id: 4,
    code: 'GHI999',
    name: 'GHI İnşaat A.Ş.',
    contact_person: 'Fatma Özkan',
    email: 'info@ghiinsaat.com',
    phone: '0312 444 55 66',
    mobile_phone: '0544 444 55 66'
  },
  {
    id: 5,
    code: 'JKL-CONS',
    name: 'JKL Consulting Ltd.',
    contact_person: 'Ahmet Kaya',
    email: 'hello@jklcons.com',
    phone: '0216 777 88 99',
    mobile_phone: '0532 777 88 99'
  }
]

// In-memory storage for new data
let reconciliationsStorage = [...demoReconciliations]
let companiesStorage = [...demoCompanies]
let nextReconciliationId = 8
let nextCompanyId = 6

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user info from cookie
    const authToken = request.cookies.get('auth-token')?.value
    let userCompanyId: number | null = null
    let userRole: string | null = null

    if (authToken && authToken.startsWith('user-')) {
      const tokenParts = authToken.split('-')
      if (tokenParts.length >= 2) {
        const userId = tokenParts[1]

        // Fetch user info to get company_id and role
        const pool = new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: false
        })

        try {
          const userQuery = `
            SELECT company_id, role FROM users WHERE id = $1 AND is_active = true
          `
          const userResult = await pool.query(userQuery, [userId])

          if (userResult.rows.length > 0) {
            userCompanyId = userResult.rows[0].company_id
            userRole = userResult.rows[0].role
          }
        } finally {
          await pool.end()
        }
      }
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const search = searchParams.get('search')

    if (!process.env.DATABASE_URL) {
      // Fallback to mock data
      let filteredData = [...reconciliationsStorage]

      if (status && status !== 'all') {
        filteredData = filteredData.filter(item => item.status === status)
      }

      if (priority && priority !== 'all') {
        filteredData = filteredData.filter(item => item.priority === priority)
      }

      if (search) {
        const searchLower = search.toLowerCase()
        filteredData = filteredData.filter(item =>
          item.title.toLowerCase().includes(searchLower) ||
          item.company_name.toLowerCase().includes(searchLower) ||
          item.reference_number.toLowerCase().includes(searchLower)
        )
      }

      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      const paginatedData = filteredData.slice(startIndex, endIndex)

      return NextResponse.json({
        data: paginatedData,
        pagination: {
          current_page: page,
          per_page: limit,
          total: filteredData.length,
          total_pages: Math.ceil(filteredData.length / limit)
        },
        filters: { status, priority, search }
      })
    }

    // Real database operations
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: false
    })

    try {
      // Build WHERE conditions
      const conditions = []
      const params: any[] = []
      let paramIndex = 1

      // Company-based filtering (super_admin sees all, others see only their company)
      if (userRole !== 'super_admin' && userCompanyId) {
        conditions.push(`r.company_id = $${paramIndex}`)
        params.push(userCompanyId)
        paramIndex++
      }

      if (status && status !== 'all') {
        conditions.push(`r.status = $${paramIndex}`)
        params.push(status)
        paramIndex++
      }

      if (search) {
        conditions.push(`(
          r.period ILIKE $${paramIndex}
          OR c.name ILIKE $${paramIndex}
          OR CONCAT(COALESCE(c.reconciliation_code_prefix, 'MUT'), '-', r.id) ILIKE $${paramIndex}
          OR CAST(r.id AS TEXT) ILIKE $${paramIndex}
        )`)
        params.push(`%${search}%`)
        paramIndex++
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM reconciliations r
        LEFT JOIN companies c ON r.company_id = c.id
        LEFT JOIN users u ON r.user_id = u.id
        ${whereClause}
      `
      const countResult = await pool.query(countQuery, params)
      const total = parseInt(countResult.rows[0].total)

      // Get paginated data with Excel data summary
      const offset = (page - 1) * limit
      const dataQuery = `
        SELECT
          r.id,
          CONCAT(COALESCE(c.reconciliation_code_prefix, 'MUT'), '-', r.id) as reference_number,
          r.period as title,
          COALESCE(c.name, 'İletigo Teknoloji') as company_name,
          COALESCE(
            (SELECT SUM(red.tutar) FROM reconciliation_excel_data red WHERE red.reconciliation_id = r.id),
            0
          ) as our_amount,
          0 as their_amount,
          COALESCE(
            (SELECT SUM(red.tutar) FROM reconciliation_excel_data red WHERE red.reconciliation_id = r.id),
            0
          ) as difference,
          COALESCE(
            (SELECT red.birim FROM reconciliation_excel_data red WHERE red.reconciliation_id = r.id LIMIT 1),
            'TRY'
          ) as currency,
          CASE
            WHEN EXISTS(SELECT 1 FROM reconciliation_excel_data red WHERE red.reconciliation_id = r.id AND red.reconciliation_status = 'itiraz') THEN 'disputed'
            WHEN (SELECT COUNT(*) FROM reconciliation_excel_data red WHERE red.reconciliation_id = r.id AND red.reconciliation_status = 'onaylandi') =
                 (SELECT COUNT(*) FROM reconciliation_excel_data red WHERE red.reconciliation_id = r.id) THEN 'resolved'
            ELSE 'pending'
          END as status,
          'medium' as priority,
          (CURRENT_DATE + INTERVAL '30 days')::date as due_date,
          COALESCE(u.first_name || ' ' || u.last_name, 'Admin User') as assigned_to,
          r.created_at,
          r.updated_at,
          r.total_count,
          r.matched,
          r.unmatched
        FROM reconciliations r
        LEFT JOIN companies c ON r.company_id = c.id
        LEFT JOIN users u ON r.user_id = u.id
        ${whereClause}
        ORDER BY r.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `

      params.push(limit, offset)
      const dataResult = await pool.query(dataQuery, params)

      const totalPages = Math.ceil(total / limit)

      return NextResponse.json({
        data: dataResult.rows,
        pagination: {
          current_page: page,
          per_page: limit,
          total,
          total_pages: totalPages
        },
        filters: { status, priority, search }
      })

    } finally {
      await pool.end()
    }
    
  } catch (error) {
    console.error('Reconciliations API error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const requiredFields = ['company_code', 'company_name', 'email', 'phone', 'type', 'debt_credit', 'amount', 'reconciliation_date']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        )
      }
    }

    // Check if company exists, if not create it
    let company = companiesStorage.find(c => c.code === body.company_code.toUpperCase())
    
    if (!company) {
      // Create new company
      company = {
        id: nextCompanyId++,
        code: body.company_code.toUpperCase(),
        name: body.company_name,
        contact_person: body.contact_person || '',
        email: body.email,
        phone: body.phone,
        mobile_phone: body.mobile_phone || ''
      }
      companiesStorage.push(company)
    } else {
      // Update existing company with new information
      company.name = body.company_name
      company.contact_person = body.contact_person || company.contact_person
      company.email = body.email
      company.phone = body.phone
      company.mobile_phone = body.mobile_phone || company.mobile_phone
    }

    // Generate reference number
    const year = new Date().getFullYear()
    const referenceNumber = `MUT-${year}-${String(nextReconciliationId).padStart(3, '0')}`

    // Create reconciliation record
    const newReconciliation = {
      id: nextReconciliationId++,
      reference_number: referenceNumber,
      title: `${body.company_name} - ${body.type} (${body.debt_credit})`,
      company_name: body.company_name,
      company_code: body.company_code.toUpperCase(),
      our_amount: parseFloat(body.amount),
      their_amount: 0, // Will be filled later during reconciliation process
      difference: parseFloat(body.amount), // Initially equals our amount
      currency: 'TRY',
      status: 'pending',
      priority: body.amount > 50000 ? 'high' : body.amount > 20000 ? 'medium' : 'low',
      type: body.type,
      debt_credit: body.debt_credit,
      due_date: body.due_date || null,
      reconciliation_date: body.reconciliation_date,
      year: body.year,
      month: body.month,
      description: body.description || '',
      contact_person: body.contact_person || '',
      email: body.email,
      phone: body.phone,
      mobile_phone: body.mobile_phone || '',
      assigned_to: 'Admin User', // This would come from auth in real app
      is_active: true,
      mail_status: 'not_sent',
      approval_token: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Add to storage
    reconciliationsStorage.push(newReconciliation)

    return NextResponse.json({
      success: true,
      message: 'Mutabakat başarıyla oluşturuldu',
      data: newReconciliation,
      company: company
    }, { status: 201 })

  } catch (error) {
    console.error('POST Reconciliation error:', error)
    return NextResponse.json(
      { error: 'Mutabakat oluşturulurken hata oluştu' },
      { status: 500 }
    )
  }
}