import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { query } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    // Get R2 settings from database
    const settingsResult = await query('SELECT * FROM r2_settings WHERE is_active = true ORDER BY id DESC LIMIT 1')

    if (settingsResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'R2 settings not configured' },
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

    // Get form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string || 'uploads'

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must not exceed 10MB' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(7)
    const extension = file.name.split('.').pop()
    const filename = `${timestamp}-${randomStr}.${extension}`
    const key = `${folder}/${filename}`

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

    // Generate URL
    const publicUrl = settings.public_domain
      ? `${settings.public_domain}/${key}`
      : `https://${settings.bucket_name}.${settings.account_id}.r2.cloudflarestorage.com/${key}`

    return NextResponse.json({
      success: true,
      url: publicUrl,
      key: key,
      filename: filename,
      size: file.size,
      type: file.type,
      message: 'File uploaded successfully to R2'
    })

  } catch (error: any) {
    console.error('R2 upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed', details: error.message },
      { status: 500 }
    )
  }
}
