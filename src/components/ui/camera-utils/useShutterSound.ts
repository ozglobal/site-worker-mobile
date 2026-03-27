import { useEffect, useRef, useCallback } from "react"

/** Encode an AudioBuffer as a WAV ArrayBuffer */
function encodeWav(buffer: AudioBuffer): ArrayBuffer {
  const numChannels = 1
  const sampleRate = buffer.sampleRate
  const data = buffer.getChannelData(0)
  const byteRate = sampleRate * numChannels * 2
  const blockAlign = numChannels * 2
  const dataSize = data.length * 2
  const headerSize = 44
  const buf = new ArrayBuffer(headerSize + dataSize)
  const view = new DataView(buf)

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
  }

  writeString(0, "RIFF")
  view.setUint32(4, 36 + dataSize, true)
  writeString(8, "WAVE")
  writeString(12, "fmt ")
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, byteRate, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, 16, true)
  writeString(36, "data")
  view.setUint32(40, dataSize, true)

  for (let i = 0; i < data.length; i++) {
    const sample = Math.max(-1, Math.min(1, data[i]))
    view.setInt16(headerSize + i * 2, sample * 0x7fff, true)
  }

  return buf
}

/**
 * Hook that creates a shutter click sound on mount.
 * Returns a `play` function that plays the sound and triggers vibration.
 */
export function useShutterSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const urlRef = useRef<string | null>(null)

  useEffect(() => {
    try {
      const audioCtx = new AudioContext()
      const duration = 0.15
      const sampleRate = audioCtx.sampleRate
      const buffer = audioCtx.createBuffer(1, sampleRate * duration, sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < data.length; i++) {
        const t = i / sampleRate
        data[i] = Math.exp(-t * 40) * (Math.random() * 2 - 1) * 0.5
      }
      const blob = new Blob([encodeWav(buffer)], { type: "audio/wav" })
      const url = URL.createObjectURL(blob)
      urlRef.current = url
      audioRef.current = new Audio(url)
      audioRef.current.volume = 0.6
      audioCtx.close()
    } catch {
      // Audio not supported — silent fallback
    }

    return () => {
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current)
      }
    }
  }, [])

  const play = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {})
    }
    navigator.vibrate?.(50)
  }, [])

  return { play }
}
