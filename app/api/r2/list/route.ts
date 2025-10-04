import { NextRequest, NextResponse } from 'next/server'
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
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

    // Get folder from query params
    const { searchParams } = new URL(request.url)
    const folder = searchParams.get('folder') || 'uploads'

    // List objects
    const command = new ListObjectsV2Command({
      Bucket: settings.bucket_name,
      Prefix: folder + '/',
      MaxKeys: 100
    })

    const response = await s3Client.send(command)

    const files = (response.Contents || []).map(item => ({
      key: item.Key,
      size: item.Size,
      lastModified: item.LastModified,
      url: settings.public_domain
        ? `${settings.public_domain}/${item.Key}`
        : `https://${settings.bucket_name}.${settings.account_id}.r2.cloudflarestorage.com/${item.Key}`
    }))

    return NextResponse.json({
      success: true,
      files,
      count: files.length
    })

  } catch (error: any) {
    console.error('R2 list error:', error)
    return NextResponse.json(
      { error: 'Failed to list files', details: error.message },
      { status: 500 }
    )
  }
}
