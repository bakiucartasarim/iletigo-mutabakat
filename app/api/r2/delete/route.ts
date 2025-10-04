import { NextRequest, NextResponse } from 'next/server'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { query } from '@/lib/db'

export async function DELETE(request: NextRequest) {
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

    // Get key from request body
    const body = await request.json()
    const { key } = body

    if (!key) {
      return NextResponse.json(
        { error: 'No file key provided' },
        { status: 400 }
      )
    }

    // Initialize S3 client for R2
    const s3Client = new S3Client({
      region: 'auto',
      endpoint: settings.endpoint_url || `https://${settings.account_id}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: settings.access_key_id,
        secretAccessKey: settings.secret_access_key,
      },
    })

    // Delete object
    const command = new DeleteObjectCommand({
      Bucket: settings.bucket_name,
      Key: key,
    })

    await s3Client.send(command)

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    })

  } catch (error: any) {
    console.error('R2 delete error:', error)
    return NextResponse.json(
      { error: 'Delete failed', details: error.message },
      { status: 500 }
    )
  }
}
