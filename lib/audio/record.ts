'use client'

/**
 * Microphone capture that always hands the server the same thing.
 *
 * Browsers record in whatever they like — Chrome and Firefox give WebM Opus,
 * Safari gives MP4 AAC, which transcribers refuse outright. Rather than branch
 * on the browser and hope, whatever comes out is decoded and re-encoded here
 * as 16 kHz mono WAV: the one format every transcriber accepts, and the rate
 * speech recognition wants anyway.
 *
 * Doing it in the browser also keeps the upload small — a minute of speech is
 * under 2 MB rather than whatever a phone decided to use.
 */

export const SAMPLE_RATE = 16000

export function canRecord(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof MediaRecorder !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia
  )
}

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined
  return ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'].find((t) =>
    MediaRecorder.isTypeSupported(t),
  )
}

export interface Recorder {
  stop: () => Promise<Blob>
  cancel: () => void
}

export async function startRecording(): Promise<Recorder> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
  })

  const mimeType = pickMimeType()
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
  const chunks: Blob[] = []
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data)
  }
  recorder.start()

  const release = () => stream.getTracks().forEach((t) => t.stop())

  return {
    stop: () =>
      new Promise<Blob>((resolve, reject) => {
        recorder.onerror = () => {
          release()
          reject(new Error('The recording failed.'))
        }
        recorder.onstop = async () => {
          release()
          try {
            resolve(await toWav(new Blob(chunks, { type: recorder.mimeType })))
          } catch (err) {
            reject(err)
          }
        }
        recorder.stop()
      }),
    cancel: () => {
      try {
        recorder.stop()
      } catch {
        /* already stopped */
      }
      release()
    },
  }
}

/** Decode whatever was recorded and re-encode it as 16 kHz mono WAV. */
export async function toWav(input: Blob): Promise<Blob> {
  const bytes = await input.arrayBuffer()
  const ctx = new AudioContext()
  let decoded: AudioBuffer
  try {
    decoded = await ctx.decodeAudioData(bytes)
  } finally {
    void ctx.close()
  }

  // Resampling through an offline context rather than by hand: dropping every
  // third sample aliases, and aliasing is exactly the frequency range that
  // distinguishes one Arabic consonant from another.
  const offline = new OfflineAudioContext(1, Math.ceil(decoded.duration * SAMPLE_RATE), SAMPLE_RATE)
  const source = offline.createBufferSource()
  source.buffer = decoded
  source.connect(offline.destination)
  source.start()
  const mono = await offline.startRendering()

  return encodeWav(mono.getChannelData(0), SAMPLE_RATE)
}

/** 16-bit PCM in a WAV container. The header is 44 bytes and fixed. */
function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(buffer)
  const text = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i))
  }

  text(0, 'RIFF')
  view.setUint32(4, 36 + samples.length * 2, true)
  text(8, 'WAVE')
  text(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  text(36, 'data')
  view.setUint32(40, samples.length * 2, true)

  let offset = 44
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
  }

  return new Blob([buffer], { type: 'audio/wav' })
}
