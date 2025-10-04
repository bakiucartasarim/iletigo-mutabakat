import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { query } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    console.log('📤 Upload request received')

    // Get auth token from cookies
    const authToken = request.cookies.get('auth-token')?.value
    console.log('🔑 Auth token:', authToken ? 'present' : 'missing')

    if (!authToken) {
      return NextResponse.json(
        { error: 'No authentication token' },
        { status: 401 }
      )
    }

    // Extract company ID from auth token
    const tokenParts = authToken.split('-')
    if (tokenParts.length < 2) {
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 401 }
      )
    }

    const companyId = tokenParts[1]
    console.log('🏢 Company ID:', companyId)

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'logo' or 'stamp'

    console.log('📁 File received:', file?.name, 'Type:', type, 'Size:', file?.size)

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!type || !['logo', 'stamp'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be "logo" or "stamp"' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    // Validate file size (max 1MB)
    if (file.size > 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must not exceed 1MB' },
        { status: 400 }
      )
    }

    // Get R2 settings from database
    const settingsResult = await query('SELECT * FROM r2_settings WHERE is_active = true ORDER BY id DESC LIMIT 1')

    if (settingsResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'R2 settings not configured. Please configure R2 in System Settings.' },
        { status: 400 }
      )
    }

    const settings = settingsResult.rows[0]

    // Initialize S3 client for R2
    const s3Client = new S3Client({
      region: 'auto',
      endpoint: settings.endpoint_url || `https://${settings.account_id}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: settings.access_key_id,
        secretAccessKey: settings.secret_access_key,
      },
    })

    // Generate unique filename
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const filename = `${type}-${timestamp}.${extension}`
    const key = `companies/${companyId}/${filename}`

    console.log('☁️ Uploading to R2:', key)

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: settings.bucket_name,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    })

    await s3Client.send(command)

    console.log('✅ File uploaded to R2 successfully')

    // Generate public URL
    const publicUrl = settings.public_domain
      ? `${settings.public_domain}/${key}`
      : `https://${settings.bucket_name}.${settings.account_id}.r2.cloudflarestorage.com/${key}`

    // Update database
    const updateField = type === 'logo' ? 'logo_url' : 'stamp_url'
    const updateQuery = `
      UPDATE companies
      SET ${updateField} = $1
      WHERE id = $2
      RETURNING id, ${updateField}
    `

    console.log('🗄️ Updating database...')
    const result = await query(updateQuery, [publicUrl, companyId])

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    console.log('✅ Database updated:', publicUrl)

    return NextResponse.json({
      success: true,
      url: publicUrl,
      message: `${type === 'logo' ? 'Logo' : 'Kaşe'} başarıyla yüklendi`
    })

  } catch (error: any) {
    console.error('❌ Upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed', details: error.message },
      { status: 500 }
    )
  }
}
