import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      insertText: (text: string) => Promise<string>
      startDrag: () => Promise<void>
      transcribeAudio: (audioData: Blob) => Promise<string>
      transcribe: (buffer: ArrayBuffer) => Promise<string>
      closeOverlay: () => void
      onPTT: (callback: (status: 'START' | 'STOP') => void) => void
    }
  }
}

