import { useState, useRef, useCallback } from 'react'

export interface VoiceRecording {
  blob: Blob
  duration: number
  waveformData: number[]
  url: string
}

export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [audioLevel, setAudioLevel] = useState(0)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const waveformDataRef = useRef<number[]>([])
  const presignedUrlRef = useRef<{ presignedUrl: string; publicUrl: string; key: string } | null>(null)

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false, // Turn off browser's robotic filters
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 48000,
          channelCount: 1
        }
      })

      // Fetch presigned URL immediately while recording starts (parallel)
      fetch('/api/r2/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fileType: 'audio/webm', 
          fileExtension: 'webm',
          mediaType: 'voice'
        })
      }).then(r => r.json()).then(data => {
        presignedUrlRef.current = data
      })

      // Setup Studio-Quality Audio Processing Chain
      audioContextRef.current = new AudioContext({ sampleRate: 48000 })
      const source = audioContextRef.current.createMediaStreamSource(stream)
      
      // 1. High-pass filter to cut out low-frequency rumble (like ceiling fans)
      const highpass = audioContextRef.current.createBiquadFilter()
      highpass.type = 'highpass'
      highpass.frequency.value = 90 // Cut everything below 90Hz
      
      // 2. Dynamics Compressor to punch up the voice and make it sound full/loud
      const compressor = audioContextRef.current.createDynamicsCompressor()
      compressor.threshold.value = -40
      compressor.knee.value = 30
      compressor.ratio.value = 4
      compressor.attack.value = 0.01
      compressor.release.value = 0.25

      // 3. Gain Node to smoothly boost the final volume
      const gain = audioContextRef.current.createGain()
      gain.gain.value = 3.0 // 3x volume boost for clarity

      // Connect the chain: Mic -> Highpass -> Compressor -> Gain
      source.connect(highpass)
      highpass.connect(compressor)
      compressor.connect(gain)

      // Setup audio analyzer for waveform visualization
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      gain.connect(analyserRef.current)

      // Create a destination stream for the MediaRecorder
      const destination = audioContextRef.current.createMediaStreamDestination()
      gain.connect(destination)

      const processedStream = destination.stream

      // Collect waveform data while recording
      const collectWaveform = () => {
        if (!analyserRef.current || !isRecording) return
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
        analyserRef.current.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length
        waveformDataRef.current.push(average / 255)
        setAudioLevel(average / 255)
        requestAnimationFrame(collectWaveform)
      }

      // Setup MediaRecorder with best available codec
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'
      
      mediaRecorderRef.current = new MediaRecorder(processedStream, { 
        mimeType,
        audioBitsPerSecond: 128000 // 128 kbps Opus is extremely high quality
      })
      chunksRef.current = []
      waveformDataRef.current = []

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorderRef.current.start(100) // collect data every 100ms
      setIsRecording(true)
      setRecordingDuration(0)
      
      collectWaveform()

      // Duration timer
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1)
      }, 1000)

    } catch (error) {
      console.error('Microphone access denied:', error)
      throw new Error('Microphone permission denied')
    }
  }, [])

  const stopRecording = useCallback((): Promise<VoiceRecording> => {
    return new Promise((resolve, reject) => {
      if (!mediaRecorderRef.current) {
        reject(new Error('No recording in progress'))
        return
      }

      if (timerRef.current) clearInterval(timerRef.current)

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        
        // Normalize waveform to 40 data points for display
        const raw = waveformDataRef.current
        const normalized: number[] = []
        const step = Math.floor(raw.length / 40) || 1
        for (let i = 0; i < 40; i++) {
          normalized.push(raw[i * step] || 0)
        }

        resolve({
          blob,
          duration: recordingDuration,
          waveformData: normalized,
          url
        })
      }

      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop())
      audioContextRef.current?.close()
      setIsRecording(false)
      setAudioLevel(0)
    })
  }, [recordingDuration])

  const cancelRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    mediaRecorderRef.current?.stop()
    mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop())
    audioContextRef.current?.close()
    setIsRecording(false)
    setRecordingDuration(0)
    setAudioLevel(0)
    chunksRef.current = []
  }, [])

  return {
    isRecording,
    recordingDuration,
    audioLevel,
    presignedUrlRef,
    startRecording,
    stopRecording,
    cancelRecording
  }
}
