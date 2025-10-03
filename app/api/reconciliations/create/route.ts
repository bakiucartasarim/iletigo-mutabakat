import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { query, formatTurkishDate } from '@/lib/db'

// Helper function to parse Turkish currency format
function parseTurkishCurrency(value: string | number): number {
  if (typeof value === 'number') return value;
  if (!value || value === '') return 0;

  // Convert to string and clean
  let cleanValue = value.toString().trim();

  // Remove currency symbols and spaces
  cleanValue = cleanValue.replace(/[₺\s]/g, '');

  // Handle Turkish format: "2.500,50" -> 2500.50
  // First remove thousand separators (dots), then replace decimal comma with dot
  if (cleanValue.includes(',')) {
    const parts = cleanValue.split(',');
    if (parts.length === 2) {
      // Remove dots from integer part and combine with decimal part
      const integerPart = parts[0].replace(/\./g, '');
      const decimalPart = parts[1];
      cleanValue = integerPart + '.' + decimalPart;
    }
  } else {
    // If no comma, just remove dots (assuming they are thousand separators)
    cleanValue = cleanValue.replace(/\./g, '');
  }

  const result = parseFloat(cleanValue);
  return isNaN(result) ? 0 : result;
}

export async function POST(request: NextRequest) {
  try {
    // Check for auth token and get user info
    const authToken = request.cookies.get('auth-token')?.value

    if (!authToken) {
      return NextResponse.json(
        { error: 'Kimlik doğrulama gerekli' },
        { status: 401 }
      )
    }

    // Extract user ID from token (format: user-{id}-{timestamp})
    let userId = 1; // Default fallback
    let companyId = 1; // Default fallback

    if (authToken.startsWith('user-')) {
      const tokenParts = authToken.split('-')
      if (tokenParts.length >= 2) {
        userId = parseInt(tokenParts[1])

        // Fetch user's company_id from database
        const userResult = await query(
          'SELECT company_id, role FROM users WHERE id = $1 AND is_active = true',
          [userId]
        )

        if (userResult.rows.length > 0) {
          companyId = userResult.rows[0].company_id || 1
        }
      }
    }

    const {
      formData,
      excelData
    } = await request.json()

    // Validation
    if (!formData || !excelData || excelData.length === 0) {
      return NextResponse.json(
        { error: 'Form verileri ve Excel verileri gereklidir' },
        { status: 400 }
      )
    }

    // Calculate totals
    const totalAmount = excelData.reduce((sum, row) => sum + parseTurkishCurrency(row.tutar || 0), 0)
    const borcRecords = excelData.filter(row => row.borcAlacak && row.borcAlacak.toUpperCase().includes('BORÇ')).length
    const alacakRecords = excelData.filter(row => row.borcAlacak && row.borcAlacak.toUpperCase().includes('ALACAK')).length

    if (!process.env.DATABASE_URL) {
      // Mock mode fallback
      console.log('🔄 Mock mode: Mutabakat dönemi oluşturuluyor...')
      const periodId = Math.floor(Math.random() * 1000) + 1
      const reconciliationId = Math.floor(Math.random() * 1000) + 1

      console.log('📊 Mock Mutabakat Verileri:', { formData, excelRows: excelData.length })

      return NextResponse.json({
        success: true,
        message: 'Mutabakat dönemi başarıyla oluşturuldu (Mock Mode)',
        data: { periodId, reconciliationId, excelRowsProcessed: excelData.length, totalAmount, borcRecords, alacakRecords }
      })
    }

    // Real database operations
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: false
    })

    console.log('🔄 Real database: Mutabakat dönemi oluşturuluyor...')

    try {
      await pool.query('BEGIN')

      // 1. Create reconciliation period
      const periodResult = await pool.query(`
        INSERT INTO reconciliation_periods (name, start_date, end_date, description)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `, [
        `Mutabakat Dönemi - ${formData.reconciliation_period || formatTurkishDate()}`,
        formData.start_date || new Date().toISOString().split('T')[0],
        formData.end_date || new Date().toISOString().split('T')[0],
        formData.description || `${formData.type || 'Cari Mutabakat'} dönemi`
      ])

      const periodId = periodResult.rows[0].id

      // 2. Create main reconciliation record (make columns nullable first)
      try {
        await pool.query(`ALTER TABLE reconciliations ALTER COLUMN user_id DROP NOT NULL`);
        await pool.query(`ALTER TABLE reconciliations ALTER COLUMN company_id DROP NOT NULL`);
      } catch (e) {
        // Ignore if already nullable
      }

      const reconciliationResult = await pool.query(`
        INSERT INTO reconciliations (period_id, user_id, company_id, period, status, total_count, matched, unmatched, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING id
      `, [
        periodId,
        userId, // From auth token
        companyId, // From user's company_id
        formData.reconciliation_period || formatTurkishDate(),
        'pending',
        excelData.length,
        0,
        excelData.length
      ])

      const reconciliationId = reconciliationResult.rows[0].id

      // 3. Insert Excel data rows
      for (const row of excelData) {
        await pool.query(`
          INSERT INTO reconciliation_excel_data (
            reconciliation_id, sira_no, cari_hesap_kodu, cari_hesap_adi,
            sube, cari_hesap_turu, tutar, birim, borc_alacak,
            vergi_dairesi, vergi_no, fax_numarasi, ilgili_kisi_eposta, hata, mail_status, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
        `, [
          reconciliationId,
          row.siraNo || null,
          row.cariHesapKodu || null,
          row.cariHesapAdi || null,
          row.sube || null,
          row.cariHesapTuru || null,
          parseTurkishCurrency(row.tutar || 0),
          row.birim || 'TRY',
          row.borcAlacak || null,
          row.vergiDairesi || null,
          row.vergiNo || null,
          row.faxNumarasi || null,
          row.ilgiliKisiEposta || null,
          row.hata || null,
          'gonderilmedi'
        ])
      }

      await pool.query('COMMIT')

      const result = {
        periodId,
        reconciliationId,
        excelRowsProcessed: excelData.length,
        totalAmount,
        borcRecords,
        alacakRecords
      }

      console.log('✅ Database: Mutabakat dönemi başarıyla oluşturuldu:', result)

      return NextResponse.json({
        success: true,
        message: 'Mutabakat dönemi başarıyla oluşturuldu',
        data: result
      })

    } catch (dbError) {
      await pool.query('ROLLBACK')
      throw dbError
    } finally {
      await pool.end()
    }

  } catch (error) {
    console.error('Reconciliation creation error:', error)
    return NextResponse.json(
      { error: 'Mutabakat dönemi oluşturulurken hata oluştu: ' + error.message },
      { status: 500 }
    )
  }
}