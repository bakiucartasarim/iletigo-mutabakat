import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

export async function POST(request: NextRequest) {
  try {
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
    const totalAmount = excelData.reduce((sum, row) => sum + parseFloat(row.tutar || 0), 0)
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
        `Mutabakat Dönemi - ${formData.reconciliation_period || new Date().toLocaleDateString('tr-TR')}`,
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
        1, // Default user_id
        1, // Default company_id
        formData.reconciliation_period || new Date().toLocaleDateString('tr-TR'),
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
            vergi_dairesi, vergi_no, fax_numarasi, ilgili_kisi_eposta, hata, mail_status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        `, [
          reconciliationId,
          row.siraNo || null,
          row.cariHesapKodu || null,
          row.cariHesapAdi || null,
          row.sube || null,
          row.cariHesapTuru || null,
          parseFloat(row.tutar || 0),
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