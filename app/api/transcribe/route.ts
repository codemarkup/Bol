import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { audioUrl, messageId } = await req.json()

  // Create an admin client to bypass RLS when updating the message
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    console.log("Transcribing audioUrl:", audioUrl, "for messageId:", messageId);
    
    // Set to processing immediately via admin client to trigger Realtime UI update
    await adminClient.from('messages').update({ transcript_status: 'processing' }).eq('id', messageId);

    // Download audio from R2
    const audioResponse = await fetch(audioUrl)
    const audioBlob = await audioResponse.blob()
    const audioBuffer = await audioBlob.arrayBuffer()

    // Send to Groq Whisper API
    const formData = new FormData()
    formData.append('file', new Blob([audioBuffer], { type: 'audio/webm' }), 'audio.webm')
    formData.append('model', 'whisper-large-v3')
    formData.append('response_format', 'json')
    formData.append('language', 'ur') // Urdu first, falls back to English automatically

    const groqResponse = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: formData,
    })

    if (!groqResponse.ok) throw new Error('Transcription failed')
    
    const { text } = await groqResponse.json()
    console.log("Groq transcript:", text);

    // Update message with transcript
    const { error: updateError } = await adminClient
      .from('messages')
      .update({
        transcript: text,
        transcript_status: 'done'
      })
      .eq('id', messageId)

    if (updateError) {
      console.error("Supabase update error:", updateError);
    } else {
      console.log("Successfully updated message in DB with transcript:", messageId);
    }

    return NextResponse.json({ transcript: text })
  } catch (error) {
    // Update message with failed status
    await adminClient
      .from('messages')
      .update({ transcript_status: 'failed' })
      .eq('id', messageId)
    
    console.error("Transcription API Error:", error);
    return NextResponse.json({ error: 'Transcription failed' }, { status: 500 })
  }
}
