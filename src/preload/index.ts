import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'


// Custom APIs for renderer
const api = {
  insertText: (text: string) => ipcRenderer.invoke('insert-text', text),
  startDrag: () => ipcRenderer.invoke('window-drag'),
  transcribe: (buffer: ArrayBuffer) => ipcRenderer.invoke('transcribe', buffer),
  closeOverlay: () => ipcRenderer.send('close-overlay'),
  openSettings: () => ipcRenderer.send('open-settings'),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  onPTT: (callback: (status: 'START' | 'STOP') => void) => {
    const subscription = (_event: any, value: any) => callback(value);
    ipcRenderer.on('ptt-status-change', subscription);

    // Return the Unsubscribe function
    return () => {
      ipcRenderer.removeListener('ptt-status-change', subscription);
    };
  },
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', {})
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
