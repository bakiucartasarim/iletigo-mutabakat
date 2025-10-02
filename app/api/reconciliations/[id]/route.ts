import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!process.env.DATABASE_URL) {
      // Mock data fallback
      const mockData = {
        id: parseInt(id),
        period_id: 1,
        period: 'Mutabakat Dönemi - Ocak 2024',
        status: 'pending',
        total_count: 2,
        matched: 0,
        unmatched: 2,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        period_name: 'Mutabakat Dönemi - Ocak 2024',
        period_start_date: '2024-01-01',
        period_end_date: '2024-01-31',
        period_status: 'active',
        period_description: 'Ocak ayı mutabakat dönemi',
        period_created_at: '2024-01-15T10:00:00Z',
        excel_data: [
          {
            id: 1,
            sira_no: 1,
            cari_hesap_kodu: 'C001',
            cari_hesap_adi: 'ABC Şirket Ltd.',
            sube: 'Merkez',
            cari_hesap_turu: 'Müşteri',
            tutar: 2500.00,
            birim: 'TRY',
            borc_alacak: 'BORÇ',
            vergi_dairesi: 'İstanbul VD',
            vergi_no: '1234567890',
            fax_numarasi: '0212 123 45 67',
            ilgili_kisi_eposta: 'info@abc.com',
            hata: '',
            mail_status: 'gonderilmedi',
            created_at: '2024-01-15T10:00:00Z'
          },
          {
            id: 2,
            sira_no: 2,
            cari_hesap_kodu: 'C002',
            cari_hesap_adi: 'XYZ Ltd. Şti.',
            sube: 'Şube 1',
            cari_hesap_turu: 'Tedarikçi',
            tutar: 3750.50,
            birim: 'TRY',
            borc_alacak: 'ALACAK',
            vergi_dairesi: 'Ankara VD',
            vergi_no: '0987654321',
            fax_numarasi: '0312 987 65 43',
            ilgili_kisi_eposta: 'info@xyz.com',
            hata: '',
            mail_status: 'gonderilmedi',
            created_at: '2024-01-15T10:00:00Z'
          }
        ],
        company_name: 'İletigo Teknoloji',
        user_name: 'Admin User'
      }

      return NextResponse.json({
        success: true,
        data: mockData
      })
    }

    // Real database operations
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: false
    })

    try {
      // Get main reconciliation data with related information
      const reconciliationQuery = `
        SELECT
          r.id,
          r.period_id,
          r.period,
          r.status,
          r.total_count,
          r.matched,
          r.unmatched,
          r.created_at,
          r.updated_at,
          rp.id as rp_id,
          rp.name as period_name,
          rp.start_date as period_start_date,
          rp.end_date as period_end_date,
          rp.status as period_status,
          rp.description as period_description,
          rp.created_at as period_created_at,
          COALESCE(c.name, 'İletigo Teknoloji') as company_name,
          COALESCE(u.first_name || ' ' || u.last_name, 'Admin User') as user_name
        FROM reconciliations r
        LEFT JOIN reconciliation_periods rp ON r.period_id = rp.id
        LEFT JOIN companies c ON r.company_id = c.id
        LEFT JOIN users u ON r.user_id = u.id
        WHERE r.id = $1
      `

      const reconciliationResult = await pool.query(reconciliationQuery, [id])

      if (reconciliationResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Mutabakat kaydı bulunamadı' },
          { status: 404 }
        )
      }

      const reconciliation = reconciliationResult.rows[0]

      // Get Excel data for this reconciliation with dispute info
      const excelDataQuery = `
        SELECT
          red.id,
          red.sira_no,
          red.cari_hesap_kodu,
          red.cari_hesap_adi,
          red.sube,
          red.cari_hesap_turu,
          red.tutar,
          red.birim,
          red.borc_alacak,
          red.vergi_dairesi,
          red.vergi_no,
          red.fax_numarasi,
          red.ilgili_kisi_eposta,
          red.hata,
          COALESCE(red.mail_status, 'gonderilmedi') as mail_status,
          COALESCE(red.reconciliation_status, 'beklemede') as reconciliation_status,
          red.created_at,
          rl.disputed_amount,
          rl.disputed_currency,
          rl.response_note
        FROM reconciliation_excel_data red
        LEFT JOIN reconciliation_links rl ON rl.record_id = red.id AND rl.reconciliation_id = red.reconciliation_id
        WHERE red.reconciliation_id = $1
        ORDER BY red.sira_no ASC, red.id ASC
      `

      const excelDataResult = await pool.query(excelDataQuery, [id])

      // Build response object
      const response = {
        id: reconciliation.id,
        period_id: reconciliation.period_id,
        period: reconciliation.period,
        status: reconciliation.status,
        total_count: reconciliation.total_count,
        matched: reconciliation.matched,
        unmatched: reconciliation.unmatched,
        created_at: reconciliation.created_at,
        updated_at: reconciliation.updated_at,
        period_name: reconciliation.period_name,
        period_start_date: reconciliation.period_start_date,
        period_end_date: reconciliation.period_end_date,
        period_status: reconciliation.period_status,
        period_description: reconciliation.period_description,
        period_created_at: reconciliation.period_created_at,
        excel_data: excelDataResult.rows,
        company_name: reconciliation.company_name,
        user_name: reconciliation.user_name
      }

      return NextResponse.json({
        success: true,
        data: response
      })

    } finally {
      await pool.end()
    }
  } catch (error) {
    console.error('Reconciliation fetch error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    const { status } = body;
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Geçersiz ID' },
        { status: 400 }
      );
    }

    // Mock update response
    return NextResponse.json({ 
      id, 
      status, 
      updated_at: new Date().toISOString() 
    });
  } catch (error) {
    console.error('Reconciliation update error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
