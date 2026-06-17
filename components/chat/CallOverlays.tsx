"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Video, X, Mic, MicOff, Camera, CameraOff, MonitorSpeaker, Lock, User, MessageSquare, UserPlus } from "lucide-react";

export function CallOverlays({
  incomingCall,
  activeCall,
  isCalling,
  localAudioTrack,
  localVideoTrack,
  remoteUsers,
  acceptCall,
  rejectCall,
  endCall,
}: any) {
  const [callStatusText, setCallStatusText] = useState("Calling");
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Animate Calling -> Ringing
  useEffect(() => {
    if (isCalling && !activeCall) {
      const timer = setTimeout(() => {
        setCallStatusText("Ringing");
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setCallStatusText("Calling");
    }
  }, [isCalling, activeCall]);

  // Duration Timer
  useEffect(() => {
    if (activeCall) {
      // Calculate initial duration based on answered_at if available
      const start = activeCall.answered_at ? new Date(activeCall.answered_at).getTime() : Date.now();
      setCallDuration(Math.floor((Date.now() - start) / 1000));

      const timer = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - start) / 1000));
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setCallDuration(0);
    }
  }, [activeCall]);

  // Auto-hide controls for video calls
  const resetControlsTimeout = () => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (activeCall?.type === "video") {
      controlsTimeoutRef.current = setTimeout(() => {
        setControlsVisible(false);
      }, 4000);
    }
  };

  useEffect(() => {
    if (activeCall?.type === "video") {
      resetControlsTimeout();
    } else {
      setControlsVisible(true);
    }
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [activeCall]);

  const toggleMute = () => {
    if (localAudioTrack) {
      localAudioTrack.setMuted(!isMuted);
    }
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    if (localVideoTrack) {
      localVideoTrack.setMuted(!isVideoOff);
    }
    setIsVideoOff(!isVideoOff);
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Shared animated background
  const AmbientBackground = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none bg-[#0a0a0a]">
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
          rotate: [0, 90, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand/20 via-[#0a0a0a]/80 to-[#0a0a0a] blur-3xl opacity-50"
      />
      <div className="absolute inset-0 backdrop-blur-[100px]" />
    </div>
  );

  return (
    <AnimatePresence>
      {(isCalling || incomingCall || activeCall) && (
        <motion.div
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed inset-0 z-[100] flex flex-col bg-[#0F0F14] text-white overflow-hidden"
          onClick={resetControlsTimeout}
          onMouseMove={resetControlsTimeout}
        >
          {/* Outgoing Call Screen */}
          {isCalling && !activeCall && (
            <motion.div key="outgoing" className="absolute inset-0 flex flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AmbientBackground />
              <div className="flex-1 flex flex-col items-center justify-center relative z-10 -mt-20">
                <div className="absolute top-6 inset-x-0 flex justify-center z-20 pointer-events-none">
                  <div className="flex items-center gap-2 text-white/50 text-sm font-medium bg-black/20 px-4 py-1.5 rounded-full backdrop-blur-md">
                    <Lock className="w-4 h-4" /> End-to-end encrypted
                  </div>
                </div>
                <div className="relative mb-8">
                  <motion.div
                    animate={{ scale: [1, 1.5, 2], opacity: [0.8, 0, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                    className="absolute inset-0 rounded-full border border-brand bg-brand/20"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1.5], opacity: [0, 0.5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
                    className="absolute inset-0 rounded-full border border-brand bg-brand/10"
                  />
                  <div className="w-32 h-32 bg-brand/90 backdrop-blur-sm rounded-full flex items-center justify-center relative z-10 shadow-2xl shadow-brand/40 border border-white/10">
                    <User className="w-16 h-16 text-white/90" />
                  </div>
                </div>
                <h2 className="text-3xl font-bold tracking-tight mb-3">Outgoing Call</h2>
                <div className="flex items-center gap-2 text-white/60 font-medium">
                  <motion.div className="flex items-center gap-1">
                    {callStatusText}
                    <span className="flex">
                      <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}>.</motion.span>
                      <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}>.</motion.span>
                      <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}>.</motion.span>
                    </span>
                  </motion.div>
                </div>
              </div>
              <div className="absolute bottom-8 inset-x-0 flex flex-col items-center z-30">
                <div className="flex items-center gap-6 px-8 py-5 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">
                  <button onClick={toggleMute} className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${isMuted ? "bg-white text-black" : "bg-white/10 hover:bg-white/20 text-white"}`}>
                    {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                  </button>
                  <button className="w-14 h-14 rounded-full flex items-center justify-center transition-colors bg-white/10 hover:bg-white/20 text-white">
                    <MonitorSpeaker className="w-6 h-6" />
                  </button>
                  <div className="w-[1px] h-10 bg-white/10 mx-2" />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={endCall}
                    className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors shadow-2xl shadow-red-500/20"
                  >
                    <Phone className="w-8 h-8 rotate-[135deg]" fill="currentColor" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Incoming Call Screen */}
          {incomingCall && !activeCall && (
            <motion.div key="incoming" className="absolute inset-0 flex flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AmbientBackground />
              <div className="flex-1 flex flex-col items-center justify-center relative z-10 -mt-20">
                <div className="absolute top-6 inset-x-0 flex justify-center z-20 pointer-events-none">
                  <div className="flex items-center gap-2 text-white/50 text-sm font-medium bg-black/20 px-4 py-1.5 rounded-full backdrop-blur-md">
                    <Lock className="w-4 h-4" /> End-to-end encrypted
                  </div>
                </div>
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="mb-8 relative"
                >
                  <div className="absolute inset-0 rounded-full bg-brand/20 blur-xl" />
                  <div className="w-32 h-32 bg-brand/90 backdrop-blur-sm rounded-full flex items-center justify-center relative z-10 shadow-2xl shadow-brand/40 border border-white/10">
                    <User className="w-16 h-16 text-white/90" />
                  </div>
                </motion.div>
                <h2 className="text-3xl font-bold tracking-tight mb-3">Incoming Call</h2>
                <div className="flex items-center gap-2 text-white/60 font-medium">
                  {incomingCall.type === "video" ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                  Incoming {incomingCall.type} call
                </div>
              </div>
              <div className="absolute bottom-12 inset-x-0 flex justify-center gap-12 z-30">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => rejectCall(incomingCall)}
                  className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors shadow-2xl shadow-red-500/20"
                >
                  <X className="w-10 h-10" />
                </motion.button>
                <div className="flex flex-col items-center">
                  <motion.div
                    animate={{ y: [0, -8, 0], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="mb-2 text-green-400"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
                  </motion.div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => acceptCall(incomingCall)}
                    className="w-20 h-20 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-colors shadow-2xl shadow-green-500/30"
                  >
                    {incomingCall.type === "video" ? <Video className="w-8 h-8" fill="currentColor" /> : <Phone className="w-8 h-8" fill="currentColor" />}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Active Call Screen */}
          {activeCall && (
            <motion.div key="active" className="absolute inset-0 flex flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {activeCall.type === "video" && !isVideoOff ? (
                // VIDEO CALL BACKGROUND
                <div className="absolute inset-0 bg-black">
                  {remoteUsers[0]?.videoTrack ? (
                    <div ref={(node) => { if (node) remoteUsers[0]?.videoTrack?.play(node); }} className="w-full h-full object-cover" />
                  ) : (
                    <AmbientBackground />
                  )}
                  {/* PiP Local Video */}
                  <div className="absolute top-6 right-4 w-32 h-48 bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-white/10 z-20">
                    {localVideoTrack && <div ref={(node) => { if (node) localVideoTrack.play(node); }} className="w-full h-full object-cover" />}
                  </div>
                </div>
              ) : (
                // VOICE CALL BACKGROUND (or Video disabled)
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <AmbientBackground />
                  <motion.div
                    animate={{ boxShadow: ["0px 0px 0px 0px rgba(13,148,136,0)", "0px 0px 40px 10px rgba(13,148,136,0.2)", "0px 0px 0px 0px rgba(13,148,136,0)"] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="w-32 h-32 bg-brand rounded-full flex items-center justify-center text-5xl font-bold relative z-10 mb-8"
                  >
                    A
                  </motion.div>
                  <h2 className="text-3xl font-bold tracking-tight mb-2 relative z-10">Connected</h2>
                </div>
              )}

              {/* Top Bar for active call */}
              <div className="absolute top-6 inset-x-0 flex justify-center z-20 pointer-events-none">
                <div className="flex items-center gap-3 px-5 py-2 rounded-full bg-black/30 backdrop-blur-md border border-white/10 shadow-lg">
                  <Lock className="w-3 h-3 text-brand" />
                  <div className="w-[1px] h-3 bg-white/20" />
                  <span className="font-mono text-sm tracking-wider font-medium text-white/90">
                    {formatDuration(callDuration)}
                  </span>
                </div>
              </div>

              {/* Control Bar */}
              <AnimatePresence>
                {controlsVisible && (
                  <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="absolute bottom-8 inset-x-0 flex justify-center z-30"
                  >
                    <div className="flex items-center gap-6 px-8 py-5 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">
                      <div className="flex flex-col items-center gap-2">
                        <button
                          onClick={toggleMute}
                          className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${isMuted ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]" : "bg-white/10 hover:bg-white/20 text-white"}`}
                        >
                          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                        </button>
                      </div>
                      
                      {activeCall.type === "video" && (
                        <div className="flex flex-col items-center gap-2">
                          <button
                            onClick={toggleVideo}
                            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${isVideoOff ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]" : "bg-white/10 hover:bg-white/20 text-white"}`}
                          >
                            {isVideoOff ? <CameraOff className="w-6 h-6" /> : <Camera className="w-6 h-6" />}
                          </button>
                        </div>
                      )}

                      <div className="flex flex-col items-center gap-2 hidden sm:flex">
                        <button className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors">
                          <MessageSquare className="w-6 h-6" />
                        </button>
                      </div>

                      <div className="w-[1px] h-10 bg-white/10 mx-2" />

                      <button
                        onClick={endCall}
                        className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors shadow-[0_0_30px_rgba(239,68,68,0.3)]"
                      >
                        <Phone className="w-8 h-8 rotate-[135deg]" fill="currentColor" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
