import { ElectronAPI } from '@electron-toolkit/preload'

interface AppSettings {
  refinementEnabled: boolean;
  provider: 'ollama' | 'openai';
  ollamaModel: string;
  removeStutter: boolean;
  fixSpelling: boolean;
  completeSentences: boolean;
  customPrompt: string;
  llmApiKey: string;
}


declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      insertText: (text: string) => Promise<string>
      startDrag: () => Promise<void>
      transcribeAudio: (audioData: Blob) => Promise<string>
      transcribe: (buffer: ArrayBuffer) => Promise<string>
      closeOverlay: () => void
      onPTT: (callback: (status: 'START' | 'STOP') => void) => () => void
      openSettings: () => void
      getSettings: () => Promise<AppSettings>
      saveSettings: (settings: AppSettings) => Promise<boolean>
    }
  }
}

