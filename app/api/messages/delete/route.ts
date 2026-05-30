import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { messageId, type, userId } = await request.json();

    if (!messageId || !type || !userId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (type === 'everyone') {
      const { error } = await supabase
        .from('messages')
        .update({ 
          content: '', 
          media_url: null, 
          duration_seconds: null, 
          waveform_data: null,
          type: 'text'
        })
        .eq('id', messageId)
        .eq('sender_id', userId); // Only allow deleting own messages for everyone

      if (error) throw error;
    } else if (type === 'me') {
      const { data } = await supabase
        .from('messages')
        .select('deleted_for')
        .eq('id', messageId)
        .single();
        
      const current = data?.deleted_for || [];
      if (!current.includes(userId)) {
        const { error } = await supabase
          .from('messages')
          .update({ deleted_for: [...current, userId] })
          .eq('id', messageId);
          
        if (error) throw error;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete message error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
