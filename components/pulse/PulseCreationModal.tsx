"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Image as ImageIcon, Video, Mic, Type, Sparkles, Loader2, Play, Square } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getPresignedUrl, uploadToR2 } from "@/lib/uploadToR2";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";

type PulseType = 'photo' | 'video' | 'voice' | 'text' | null;
type PrivacyType = 'contacts' | 'close_friends' | 'everyone';

const MOODS = [
  { id: 'chill', emoji: '😌', label: 'Chill' },
  { id: 'celebration', emoji: '🎉', label: 'Celebration' },
  { id: 'work', emoji: '💻', label: 'Work' },
  { id: 'cricket', emoji: '🏏', label: 'Cricket' },
  { id: 'travel', emoji: '✈️', label: 'Travel' },
  { id: 'food', emoji: '🍕', label: 'Food' },
  { id: 'music', emoji: '🎵', label: 'Music' },
  { id: 'love', emoji: '❤️', label: 'Love' },
  { id: 'random', emoji: '✨', label: 'Random' },
];

const TEXT_BGS = [
  '#0D9488', // teal
  '#EF4444', // red
  '#F59E0B', // amber
  '#10B981', // emerald
  '#3B82F6', // blue
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#111827', // dark
];

interface PulseCreationModalProps {
  onClose: () => void;
  onCreated?: () => void;
  currentUserId: string | null;
}

export function PulseCreationModal({ onClose, onCreated, currentUserId }: PulseCreationModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [type, setType] = useState<PulseType>(null);
  
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  
  const [textContent, setTextContent] = useState("");
  const [textBg, setTextBg] = useState(TEXT_BGS[0]);
  
  const [caption, setCaption] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [privacy, setPrivacy] = useState<PrivacyType>('contacts');
  
  const [isUploading, setIsUploading] = useState(false);
  const [aiTitle, setAiTitle] = useState("Your Morning Vibes");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isRecording, recordingDuration, audioLevel, startRecording, stopRecording } = useVoiceRecorder();
  const [currentRecording, setCurrentRecording] = useState<any>(null);

  const handleTypeSelect = (t: PulseType) => {
    setType(t);
    setStep(2);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const handleStartRecording = async () => {
    setCurrentRecording(null);
    await startRecording();
  };

  const handleStopRecording = async () => {
    const recording = await stopRecording();
    setCurrentRecording(recording);
  };

  const canProceedToStep3 = () => {
    if (type === 'photo' || type === 'video') return !!mediaFile;
    if (type === 'text') return textContent.trim().length > 0;
    if (type === 'voice') return !!currentRecording;
    return false;
  };

  const handleSubmit = async () => {
    if (!currentUserId || !type) return;
    setIsUploading(true);
    const supabase = createClient();

    try {
      let mediaUrl = "";
      let durationSeconds = null;
      let waveformData = null;

      if (type === 'photo' || type === 'video') {
        if (!mediaFile) throw new Error("No media file");
        const ext = mediaFile.name.split('.').pop() || '';
        const presigned = await getPresignedUrl(mediaFile.type, ext, 'pulse');
        mediaUrl = presigned.publicUrl; // The public URL
        await uploadToR2(mediaFile, presigned.presignedUrl, mediaFile.type);
      } else if (type === 'voice') {
        if (!currentRecording) throw new Error("No recording");
        const file = new File([currentRecording.blob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
        const presigned = await getPresignedUrl(file.type, 'webm', 'pulse');
        mediaUrl = presigned.publicUrl;
        await uploadToR2(file, presigned.presignedUrl, file.type);
        durationSeconds = currentRecording.duration;
        waveformData = currentRecording.waveformData;
      } else if (type === 'text') {
        // For text, the text is stored in caption, background in background_color
      }

      const { error } = await supabase.from('pulses').insert({
        user_id: currentUserId,
        media_type: type,
        media_url: type === 'text' ? null : mediaUrl,
        caption: type === 'text' ? textContent : (caption.trim() || null),
        mood: mood,
        privacy: privacy,
        background_color: type === 'text' ? textBg : null,
        duration_seconds: durationSeconds,
        waveform_data: waveformData,
      });

      if (error) throw error;
      if (onCreated) onCreated();
      else onClose();
    } catch (err: any) {
      console.error("Supabase Insert Error:", err);
      alert("Failed to share Status: " + (err.message || err));
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#ECECEC] shrink-0">
          <h2 className="text-[16px] font-semibold text-[#0F0F14]">
            {step === 1 ? "Share a Moment" : step === 2 ? "Create Content" : "Status Details"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-[#F6F8F7] rounded-full transition-colors text-[#6B7280]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="grid grid-cols-2 gap-4">
                <button onClick={() => handleTypeSelect('photo')} className="flex flex-col items-center justify-center gap-3 p-6 bg-white border border-[#ECECEC] rounded-[16px] hover:border-[#0D9488] hover:bg-[#EEF4F3] transition-all group">
                  <ImageIcon className="w-8 h-8 text-[#0D9488]" />
                  <div className="text-center">
                    <span className="block text-[14px] font-semibold text-[#0F0F14]">Photo</span>
                    <span className="block text-[12px] text-[#6B7280]">From camera roll</span>
                  </div>
                </button>
                <button onClick={() => handleTypeSelect('video')} className="flex flex-col items-center justify-center gap-3 p-6 bg-white border border-[#ECECEC] rounded-[16px] hover:border-[#0D9488] hover:bg-[#EEF4F3] transition-all group">
                  <Video className="w-8 h-8 text-[#0D9488]" />
                  <div className="text-center">
                    <span className="block text-[14px] font-semibold text-[#0F0F14]">Video</span>
                    <span className="block text-[12px] text-[#6B7280]">Up to 30 seconds</span>
                  </div>
                </button>
                <button onClick={() => handleTypeSelect('voice')} className="flex flex-col items-center justify-center gap-3 p-6 bg-white border border-[#ECECEC] rounded-[16px] hover:border-[#0D9488] hover:bg-[#EEF4F3] transition-all group">
                  <Mic className="w-8 h-8 text-[#0D9488]" />
                  <div className="text-center">
                    <span className="block text-[14px] font-semibold text-[#0F0F14]">Voice</span>
                    <span className="block text-[12px] text-[#6B7280]">Record your voice</span>
                  </div>
                </button>
                <button onClick={() => handleTypeSelect('text')} className="flex flex-col items-center justify-center gap-3 p-6 bg-white border border-[#ECECEC] rounded-[16px] hover:border-[#0D9488] hover:bg-[#EEF4F3] transition-all group">
                  <Type className="w-8 h-8 text-[#0D9488]" />
                  <div className="text-center">
                    <span className="block text-[14px] font-semibold text-[#0F0F14]">Text</span>
                    <span className="block text-[12px] text-[#6B7280]">Write something</span>
                  </div>
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex flex-col h-full">
                {(type === 'photo' || type === 'video') && (
                  <div className="flex-1 flex flex-col">
                    {!mediaFile ? (
                      <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-[#ECECEC] rounded-2xl p-8 hover:bg-[#F6F8F7] transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        {type === 'photo' ? <ImageIcon className="w-12 h-12 text-[#9CA3AF] mb-4" /> : <Video className="w-12 h-12 text-[#9CA3AF] mb-4" />}
                        <p className="text-[#0F0F14] font-medium mb-1">Click to browse</p>
                        <p className="text-[#6B7280] text-sm">Select {type === 'photo' ? 'an image' : 'a video'} from your device</p>
                        <input type="file" ref={fileInputRef} className="hidden" accept={type === 'photo' ? "image/*" : "video/*"} onChange={handleFileSelect} />
                      </div>
                    ) : (
                      <div className="relative flex-1 rounded-2xl overflow-hidden bg-black flex items-center justify-center min-h-[300px]">
                        {type === 'photo' ? (
                          <img src={mediaPreview!} className="max-w-full max-h-full object-contain" />
                        ) : (
                          <video src={mediaPreview!} className="max-w-full max-h-full" controls />
                        )}
                        <button onClick={() => { setMediaFile(null); setMediaPreview(null); }} className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {type === 'voice' && (
                  <div className="flex-1 flex flex-col items-center justify-center gap-8 py-10">
                    <div className="w-32 h-32 rounded-full bg-[#EEF4F3] flex items-center justify-center relative overflow-hidden">
                      {isRecording && (
                        <motion.div className="absolute inset-0 bg-[#0D9488]/20" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
                      )}
                      <Mic className={`w-12 h-12 ${isRecording ? 'text-[#0D9488]' : 'text-[#9CA3AF]'}`} />
                    </div>
                    
                    <div className="text-center">
                      <div className="text-3xl font-mono text-[#0F0F14] mb-2">
                        {Math.floor(recordingDuration / 60).toString().padStart(2, '0')}:{(recordingDuration % 60).toString().padStart(2, '0')}
                      </div>
                      <p className="text-[#6B7280] text-sm">
                        {isRecording ? "Recording..." : currentRecording ? "Recording ready" : "Press the mic to start"}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      {currentRecording ? (
                        <button onClick={() => {}} className="w-14 h-14 rounded-full bg-[#EEF4F3] text-[#0D9488] flex items-center justify-center cursor-pointer hover:bg-[#E0EDED]">
                          <Play className="w-6 h-6 fill-current ml-1" />
                        </button>
                      ) : (
                        <button 
                          onClick={isRecording ? handleStopRecording : handleStartRecording} 
                          className={`w-16 h-16 rounded-full flex items-center justify-center cursor-pointer transition-colors shadow-md ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-[#0D9488] hover:bg-[#0F766E]'}`}
                        >
                          {isRecording ? <Square className="w-6 h-6 text-white fill-current" /> : <Mic className="w-6 h-6 text-white" />}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {type === 'text' && (
                  <div className="flex-1 flex flex-col gap-4">
                    <div 
                      className="flex-1 min-h-[250px] rounded-2xl p-6 flex items-center justify-center transition-colors"
                      style={{ backgroundColor: textBg }}
                    >
                      <textarea 
                        value={textContent}
                        onChange={(e) => setTextContent(e.target.value)}
                        placeholder="What's on your mind?"
                        className="w-full bg-transparent text-white placeholder:text-white/60 text-2xl font-medium text-center resize-none outline-none border-none min-h-[150px]"
                        maxLength={200}
                      />
                    </div>
                    <div className="flex gap-2 justify-center pb-2">
                      {TEXT_BGS.map(bg => (
                        <button 
                          key={bg} 
                          onClick={() => setTextBg(bg)}
                          className={`w-8 h-8 rounded-full shadow-sm transition-transform ${textBg === bg ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-gray-100' : 'hover:scale-110'}`}
                          style={{ backgroundColor: bg }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex flex-col gap-6">
                
                {/* AI Title Suggestion */}
                <div 
                  onClick={() => { if (!caption) setCaption(aiTitle); }}
                  className="bg-[#EEF4F3] border border-[#0D9488]/20 rounded-xl p-4 flex items-start gap-3 cursor-pointer hover:bg-[#E0EDED] transition-colors"
                >
                  <Sparkles className="w-5 h-5 text-[#0D9488] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[13px] font-semibold text-[#0F0F14] mb-0.5">AI Suggestion</p>
                    <p className="text-[14px] text-[#0D9488]">"{aiTitle}"</p>
                  </div>
                </div>

                {type !== 'text' && (
                  <div>
                    <label className="block text-[13px] font-semibold text-[#0F0F14] mb-2">Caption</label>
                    <input 
                      type="text" 
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      maxLength={120}
                      placeholder="Add a caption..."
                      className="w-full bg-transparent border-b-2 border-[#ECECEC] focus:border-[#0D9488] py-2 outline-none text-[#0F0F14] text-[15px] transition-colors"
                    />
                    <div className="text-right text-[11px] text-[#9CA3AF] mt-1">{caption.length}/120</div>
                  </div>
                )}

                <div>
                  <label className="block text-[13px] font-semibold text-[#0F0F14] mb-2">Mood</label>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {MOODS.map(m => (
                      <button 
                        key={m.id}
                        onClick={() => setMood(m.id === mood ? null : m.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap text-[13px] border transition-colors ${mood === m.id ? 'border-[#0D9488] bg-[#EEF4F3] text-[#0D9488] font-medium' : 'border-[#ECECEC] bg-white text-[#6B7280] hover:bg-[#F6F8F7]'}`}
                      >
                        <span>{m.emoji}</span>
                        <span>{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#0F0F14] mb-2">Who can see this?</label>
                  <div className="flex gap-2">
                    {[
                      { id: 'contacts', label: 'My Contacts' },
                      { id: 'close_friends', label: 'Close Friends' },
                      { id: 'everyone', label: 'Everyone' }
                    ].map(p => (
                      <button 
                        key={p.id}
                        onClick={() => setPrivacy(p.id as PrivacyType)}
                        className={`flex-1 py-2 rounded-xl text-[13px] font-medium transition-colors border ${privacy === p.id ? 'bg-[#0F0F14] text-white border-[#0F0F14]' : 'bg-white text-[#6B7280] border-[#ECECEC] hover:bg-[#F6F8F7]'}`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#ECECEC] shrink-0 flex gap-3 bg-[#F6F8F7]">
          {step > 1 && (
            <button 
              onClick={() => setStep(step - 1 as any)}
              className="px-6 py-3 bg-white border border-[#ECECEC] text-[#0F0F14] font-medium rounded-full hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
          )}
          {step === 2 && (
            <button 
              onClick={() => setStep(3)}
              disabled={!canProceedToStep3()}
              className="flex-1 py-3 bg-[#0D9488] text-white font-medium rounded-full hover:bg-[#0F766E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          )}
          {step === 3 && (
            <button 
              onClick={handleSubmit}
              disabled={isUploading}
              className="flex-1 py-3 bg-[#0D9488] text-white font-medium rounded-full hover:bg-[#0F766E] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Share Status"}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
