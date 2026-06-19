export async function uploadToR2(
  blob: Blob,
  presignedUrl: string,
  fileType: string
): Promise<void> {
  const response = await fetch(presignedUrl, {
    method: 'PUT',
    body: blob,
    headers: {
      'Content-Type': fileType,
    },
  })
  
  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`)
  }
}

export async function getPresignedUrl(
  fileType: string,
  fileExtension: string,
  mediaType: 'voice' | 'image' | 'video' | 'file' | 'avatar' | 'chat' | 'pulse',
  conversationId?: string
): Promise<{ presignedUrl: string; publicUrl: string; key: string }> {
  const response = await fetch('/api/r2/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileType, fileExtension, mediaType, conversationId })
  })
  
  if (!response.ok) throw new Error('Failed to get upload URL')
  return response.json()
}
