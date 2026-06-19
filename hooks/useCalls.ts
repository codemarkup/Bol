import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { IAgoraRTCClient, IMicrophoneAudioTrack, ICameraVideoTrack, IRemoteAudioTrack, IRemoteVideoTrack } from 'agora-rtc-sdk-ng';

export type CallStatus = 'initiated' | 'ringing' | 'ongoing' | 'ended' | 'missed' | 'rejected' | 'failed';
export type CallType = 'voice' | 'video';

export interface CallLog {
  id: string;
  conversation_id: string;
  caller_id: string;
  receiver_id: string;
  type: CallType;
  status: CallStatus;
  agora_channel: string;
  started_at: string;
  answered_at?: string;
  ended_at?: string;
  duration_seconds?: number;
}

const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID!;

export function useCalls(currentUserId: string | null) {
  const supabase = createClient();
  const [incomingCall, setIncomingCall] = useState<CallLog | null>(null);
  const [activeCall, setActiveCall] = useState<CallLog | null>(null);
  const [outgoingCall, setOutgoingCall] = useState<CallLog | null>(null);
  const [isCalling, setIsCalling] = useState(false); // Used when we are the caller ringing someone
  const [callError, setCallError] = useState<string | null>(null);
  
  // Agora State
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<any[]>([]);

  // Cleanup Agora resources
  const leaveCall = useCallback(async () => {
    if (localAudioTrack) {
      localAudioTrack.stop();
      localAudioTrack.close();
      setLocalAudioTrack(null);
    }
    if (localVideoTrack) {
      localVideoTrack.stop();
      localVideoTrack.close();
      setLocalVideoTrack(null);
    }
    if (clientRef.current) {
      await clientRef.current.leave();
      clientRef.current = null;
    }
    setRemoteUsers([]);
    setOutgoingCall(null);
  }, [localAudioTrack, localVideoTrack]);

  const incomingCallRef = useRef(incomingCall);
  const activeCallRef = useRef(activeCall);
  const outgoingCallRef = useRef(outgoingCall);

  // Sync refs
  useEffect(() => { incomingCallRef.current = incomingCall; }, [incomingCall]);
  useEffect(() => { activeCallRef.current = activeCall; }, [activeCall]);
  useEffect(() => { outgoingCallRef.current = outgoingCall; }, [outgoingCall]);

  // Global Subscription to Incoming Calls
  useEffect(() => {
    if (!currentUserId) return;

    const checkMissedCalls = async () => {
      const thirtySecondsAgo = new Date(Date.now() - 30000).toISOString();
      const { data } = await supabase
        .from('call_logs')
        .select('*')
        .eq('status', 'ringing')
        .or(`caller_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .lt('started_at', thirtySecondsAgo);

      if (data && data.length > 0) {
        for (const call of data) {
          await supabase.from('call_logs')
            .update({ status: 'missed', ended_at: new Date().toISOString() })
            .eq('id', call.id)
            .eq('status', 'ringing');
        }
      }
    };
    checkMissedCalls();

    const callSubscription = supabase.channel(`calls:${currentUserId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'call_logs', filter: `receiver_id=eq.${currentUserId}` }, (payload) => {
        const newCall = payload.new as CallLog;
        if (newCall.status === 'ringing') {
          setIncomingCall(newCall);
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'call_logs' }, async (payload) => {
        const updatedCall = payload.new as CallLog;
        
        // Receiver logic
        if (updatedCall.status !== 'ringing' && incomingCallRef.current?.id === updatedCall.id) {
           setIncomingCall(null);
        }
        if (updatedCall.status === 'ongoing' && updatedCall.id !== activeCallRef.current?.id) {
           setIncomingCall(null);
        }

        // Caller logic (no filter used because REPLICA IDENTITY is DEFAULT, caller_id is omitted)
        if (outgoingCallRef.current && updatedCall.id === outgoingCallRef.current.id) {
           if (updatedCall.status === 'ongoing') {
              setIsCalling(false);
              setOutgoingCall(null);
              // Merge full call state
              setActiveCall({ ...outgoingCallRef.current, ...updatedCall });
           } else if (['rejected', 'missed', 'ended', 'failed'].includes(updatedCall.status)) {
              setIsCalling(false);
              setOutgoingCall(null);
              if (activeCallRef.current?.id === updatedCall.id) {
                 setActiveCall(null);
                 await leaveCall();
              }
           }
        }
      })
      .subscribe();

    // Fast-path broadcast listener for instant UX
    const broadcastSub = supabase.channel(`call:${currentUserId}`)
      .on('broadcast', { event: 'incoming_call' }, async (payload) => {
        const callId = payload.payload.call_id;
        if (incomingCallRef.current?.id === callId || activeCallRef.current?.id === callId) return;
        
        const { data } = await supabase.from('call_logs').select('*').eq('id', callId).single();
        if (data && data.status === 'ringing') {
          setIncomingCall(data as CallLog);
        }
      })
      .on('broadcast', { event: 'call_accepted' }, (payload) => {
        const call = payload.payload.call;
        setIsCalling(false);
        setActiveCall(call);
      })
      .on('broadcast', { event: 'call_ended' }, async (payload) => {
        setIsCalling(false);
        setActiveCall(null);
        setIncomingCall(null);
        await leaveCall();
      })
      .on('broadcast', { event: 'call_rejected' }, async (payload) => {
        setIsCalling(false);
        setActiveCall(null);
        setIncomingCall(null);
        await leaveCall();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(callSubscription);
      supabase.removeChannel(broadcastSub);
    };
  }, [currentUserId, supabase, leaveCall]);

  // Pre-connect to caller's channel while ringing to eliminate Accept/Reject broadcast latency
  useEffect(() => {
    if (!incomingCall) return;
    const ch = supabase.channel(`call:${incomingCall.caller_id}`);
    ch.subscribe();
    // Do NOT remove channel on cleanup here, let it persist briefly so accept/reject can use it instantly
  }, [incomingCall?.id, supabase]);

  // Pre-connect to remote user's channel during active call to eliminate End Call broadcast latency
  useEffect(() => {
    if (!activeCall || !currentUserId) return;
    const otherId = activeCall.caller_id === currentUserId ? activeCall.receiver_id : activeCall.caller_id;
    const ch = supabase.channel(`call:${otherId}`);
    ch.subscribe();
  }, [activeCall?.id, currentUserId, supabase]);

  const startCall = useCallback(async (receiverId: string, conversationId: string, type: CallType) => {
    if (!currentUserId) return;
    
    // Create channel name
    const channelName = `bol_${conversationId}_${Date.now()}`;
    
    // 1. Create DB Row
    const { data: callRow, error } = await supabase
      .from('call_logs')
      .insert({
        caller_id: currentUserId,
        receiver_id: receiverId,
        conversation_id: conversationId,
        type,
        status: 'ringing',
        agora_channel: channelName
      })
      .select()
      .single();

    if (error || !callRow) {
      setCallError('Could not start call at this time');
      return;
    }

    setIsCalling(true);
    setOutgoingCall(callRow);

    // Get Agora Token
    const session = await supabase.auth.getSession();
    const tokenStr = session.data.session?.access_token;
    
    let rtcToken = '';
    try {
      // Use our user id (as integer or string hashed if needed, Agora prefers int, so we can use a hash or just an arbitrary int for web)
      // We'll use a random 32-bit int for Agora UID
      const numericUid = Math.floor(Math.random() * 1000000000);
      
      const res = await fetch('/api/agora/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenStr}`
        },
        body: JSON.stringify({ channelName, uid: numericUid })
      });
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      rtcToken = data.token;

      // Join Agora
      const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      clientRef.current = client;

      client.on('user-published', async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        if (mediaType === 'audio') {
          user.audioTrack?.play();
        }
        setRemoteUsers(Array.from(client.remoteUsers));
      });

      client.on('user-unpublished', (user) => {
         setRemoteUsers(Array.from(client.remoteUsers));
      });

      await client.join(appId, channelName, rtcToken, numericUid);

      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack({ AEC: true, ANS: true });
      setLocalAudioTrack(audioTrack);
      
      let videoTrack = null;
      if (type === 'video') {
         videoTrack = await AgoraRTC.createCameraVideoTrack({
           encoderConfig: '720p_1',
           optimizationMode: 'detail'
         });
         setLocalVideoTrack(videoTrack);
         await client.publish([audioTrack, videoTrack]);
      } else {
         await client.publish([audioTrack]);
      }

    } catch (err) {
      setCallError('Call connection issue. Please try again.');
      // Update DB to failed
      await supabase.from('call_logs').update({ status: 'failed' }).eq('id', callRow.id);
      setIsCalling(false);
      leaveCall();
      return;
    }

    // Fast-path broadcast (UX Accelerant)
    const pingCh = supabase.channel(`call:${receiverId}`);
    pingCh.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        pingCh.send({ type: 'broadcast', event: 'incoming_call', payload: { call_id: callRow.id } });
        
        // Multi-fire to guarantee delivery through network jitters
        setTimeout(() => pingCh.send({ type: 'broadcast', event: 'incoming_call', payload: { call_id: callRow.id } }), 1000);
        setTimeout(() => pingCh.send({ type: 'broadcast', event: 'incoming_call', payload: { call_id: callRow.id } }), 2000);
        setTimeout(() => pingCh.send({ type: 'broadcast', event: 'incoming_call', payload: { call_id: callRow.id } }), 3000);

        setTimeout(() => supabase.removeChannel(pingCh), 4000);
      }
    });

    // 30 second timeout for Missed Call
    setTimeout(async () => {
       const { data: check } = await supabase.from('call_logs').select('status').eq('id', callRow.id).single();
       if (check?.status === 'ringing') {
          await supabase.from('call_logs').update({ status: 'missed', ended_at: new Date().toISOString() }).eq('id', callRow.id);
          setIsCalling(false);
          leaveCall();
       }
    }, 30000);

  }, [currentUserId, supabase, leaveCall]);


  const acceptCall = useCallback(async (call: CallLog) => {
    if (!currentUserId) return;
    
    // Atomic update to ongoing
    const { data: updatedCall, error } = await supabase
      .from('call_logs')
      .update({ status: 'ongoing', answered_at: new Date().toISOString() })
      .eq('id', call.id)
      .eq('status', 'ringing') // Ensure it hasn't been answered/missed/rejected
      .select()
      .single();

    if (error || !updatedCall) {
       // Could not transition - probably answered elsewhere or caller hung up
       setIncomingCall(null);
       alert("Call was answered on another device or ended.");
       return;
    }

    setIncomingCall(null);
    setActiveCall(updatedCall);

    // Fast-path broadcast (UX Accelerant) to wake up caller
    const pingCh = supabase.channel(`call:${updatedCall.caller_id}`);
    
    // Optimistic send (instant if pre-connection succeeded)
    try { pingCh.send({ type: 'broadcast', event: 'call_accepted', payload: { call: updatedCall } }); } catch (e) {}

    pingCh.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        pingCh.send({ type: 'broadcast', event: 'call_accepted', payload: { call: updatedCall } });
        setTimeout(() => supabase.removeChannel(pingCh), 1000);
      }
    });

    // Get Agora Token
    const session = await supabase.auth.getSession();
    const tokenStr = session.data.session?.access_token;
    
    try {
      const numericUid = Math.floor(Math.random() * 1000000000);
      
      const res = await fetch('/api/agora/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenStr}`
        },
        body: JSON.stringify({ channelName: updatedCall.agora_channel, uid: numericUid })
      });
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const rtcToken = data.token;

      const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      clientRef.current = client;

      client.on('user-published', async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        if (mediaType === 'audio') {
          user.audioTrack?.play();
        }
        setRemoteUsers(Array.from(client.remoteUsers));
      });

      client.on('user-unpublished', (user) => {
         setRemoteUsers(Array.from(client.remoteUsers));
      });

      await client.join(appId, updatedCall.agora_channel, rtcToken, numericUid);

      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack({ AEC: true, ANS: true });
      setLocalAudioTrack(audioTrack);
      
      let videoTrack = null;
      if (updatedCall.type === 'video') {
         videoTrack = await AgoraRTC.createCameraVideoTrack({
           encoderConfig: '720p_1',
           optimizationMode: 'detail'
         });
         setLocalVideoTrack(videoTrack);
         await client.publish([audioTrack, videoTrack]);
      } else {
         await client.publish([audioTrack]);
      }
    } catch (err) {
      setCallError('Call connection lost');
      await supabase.from('call_logs').update({ status: 'failed', ended_at: new Date().toISOString() }).eq('id', updatedCall.id);
      setActiveCall(null);
      leaveCall();
    }
  }, [currentUserId, supabase, leaveCall]);


  const rejectCall = useCallback(async (call: CallLog) => {
    setIncomingCall(null);
    await supabase.from('call_logs')
      .update({ status: 'rejected', ended_at: new Date().toISOString() })
      .eq('id', call.id)
      .eq('status', 'ringing');

    const pingCh = supabase.channel(`call:${call.caller_id}`);
    
    try { pingCh.send({ type: 'broadcast', event: 'call_rejected', payload: { call_id: call.id } }); } catch (e) {}

    pingCh.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        pingCh.send({ type: 'broadcast', event: 'call_rejected', payload: { call_id: call.id } });
        setTimeout(() => supabase.removeChannel(pingCh), 1000);
      }
    });
  }, [supabase]);


  const endCall = useCallback(async () => {
     if (isCalling && outgoingCallRef.current) {
        setIsCalling(false);
        const call = outgoingCallRef.current;
        setOutgoingCall(null);
        await leaveCall();
        
        // Asynchronously update DB
        supabase.from('call_logs')
          .update({ status: 'missed', ended_at: new Date().toISOString() })
          .eq('id', call.id)
          .eq('status', 'ringing').then();
          
        // Send fast-path broadcast to cancel receiver's ringing
        const endCh = supabase.channel(`call:${call.receiver_id}`);
        try { endCh.send({ type: 'broadcast', event: 'call_ended', payload: { call_id: call.id } }); } catch (e) {}
        endCh.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            endCh.send({ type: 'broadcast', event: 'call_ended', payload: { call_id: call.id } });
            setTimeout(() => supabase.removeChannel(endCh), 1000);
          }
        });
        return;
     }

     if (!activeCall) return;

     const endTime = new Date();
     const answeredTime = activeCall.answered_at ? new Date(activeCall.answered_at) : endTime;
     const duration = Math.floor((endTime.getTime() - answeredTime.getTime()) / 1000);

     await supabase.from('call_logs')
        .update({ status: 'ended', ended_at: endTime.toISOString(), duration_seconds: duration })
        .eq('id', activeCall.id)
        .eq('status', 'ongoing'); // Only transition if ongoing
     
     const otherId = activeCall.caller_id === currentUserId ? activeCall.receiver_id : activeCall.caller_id;
     const endCh = supabase.channel(`call:${otherId}`);
     
     try { endCh.send({ type: 'broadcast', event: 'call_ended', payload: { call_id: activeCall.id } }); } catch (e) {}

     endCh.subscribe((status) => {
       if (status === 'SUBSCRIBED') {
         endCh.send({ type: 'broadcast', event: 'call_ended', payload: { call_id: activeCall.id } });
         setTimeout(() => supabase.removeChannel(endCh), 1000);
       }
     });

     setActiveCall(null);
     await leaveCall();
  }, [activeCall, isCalling, currentUserId, supabase, leaveCall]);

  // Handle remote ending the call via realtime subscription
  useEffect(() => {
    if (!activeCall) return;
    
    const endSub = supabase.channel(`active_call:${activeCall.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'call_logs', filter: `id=eq.${activeCall.id}` }, async (payload) => {
        const updated = payload.new as CallLog;
        if (updated.status === 'ended') {
          setActiveCall(null);
          await leaveCall();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(endSub);
    };
  }, [activeCall?.id, supabase, leaveCall]);

  return {
    incomingCall,
    activeCall,
    isCalling,
    callError,
    localAudioTrack,
    localVideoTrack,
    remoteUsers,
    startCall,
    acceptCall,
    rejectCall,
    endCall
  };
}
