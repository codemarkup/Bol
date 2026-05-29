import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { r2Client, R2_BUCKET } from '@/lib/r2Client'

export async function POST(req: NextRequest) {
  try {
    // Verify user is authenticated
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { fileType, fileExtension, mediaType } = await req.json()
    
    // Validate allowed file types
    const allowedTypes = ['audio/webm', 'audio/ogg', 'audio/mp4', 'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'application/pdf']
    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 })
    }

    // Generate unique file path
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 10)
    const key = `${mediaType}/${user.id}/${timestamp}_${randomId}.${fileExtension}`

    // Generate presigned URL valid for 5 minutes
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      ContentType: fileType,
    })

    const presignedUrl = await getSignedUrl(r2Client, command, { expiresIn: 300 })
    const publicUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${key}`

    return NextResponse.json({ presignedUrl, publicUrl, key })
  } catch (error: any) {
    console.error("Presign error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
