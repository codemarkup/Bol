import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 });
    }

    // Use service role key to bypass RLS when verifying the user token
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { channelName, uid } = await request.json();

    if (!channelName || uid === undefined) {
      return NextResponse.json({ error: 'Missing channelName or uid' }, { status: 400 });
    }

    const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId || !appCertificate) {
      return NextResponse.json({ error: 'Agora credentials not configured' }, { status: 500 });
    }

    const agoraToken = require('agora-token');
    const { RtcTokenBuilder, RtcRole } = agoraToken;

    const role = RtcRole.PUBLISHER;
    const tokenExpire = 3600;
    const privilegeExpire = 3600;

    const rtcToken = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      role,
      tokenExpire,
      privilegeExpire
    );

    return NextResponse.json({ token: rtcToken });
  } catch (error: any) {
    console.error('Agora token error:', error);
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
