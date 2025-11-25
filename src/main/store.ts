import { app, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';

// Define the shape of our settings
export interface AppSettings {
    refinementEnabled: boolean;
    removeStutter: boolean;     // "Remove duplicate words"
    fixSpelling: boolean;       // "Remove mis-spelled"
    completeSentences: boolean; // "Remove incomplete sentences"
    customPrompt: string;
    // Since Refinement usually needs an LLM (Whisper is dumb audio-to-text), 
    // we need a provider. For now, we will prep for an API Key or Local LLM URL.
    llmApiKey: string;
    provider: 'openai' | 'ollama';
    ollamaModel: string;
}

const defaultSettings: AppSettings = {
    refinementEnabled: false,
    removeStutter: true,
    fixSpelling: true,
    completeSentences: false,
    customPrompt: "",
    llmApiKey: "",
    provider: 'ollama',
    ollamaModel: "llama3.2",
};

const DATA_PATH = path.join(app.getPath('userData'), 'settings.json');

// LOAD
export const loadSettings = (): AppSettings => {
    try {
        if (fs.existsSync(DATA_PATH)) {
            const data = fs.readFileSync(DATA_PATH, 'utf-8');
            return { ...defaultSettings, ...JSON.parse(data) };
        }
    } catch (e) {
        console.error("Failed to load settings", e);
    }
    return defaultSettings;
};

// SAVE
export const saveSettings = (settings: AppSettings) => {
    try {
        fs.writeFileSync(DATA_PATH, JSON.stringify(settings, null, 2));
    } catch (e) {
        console.error("Failed to save settings", e);
    }
};

// REGISTER IPC HANDLERS
export const setupSettingsHandlers = () => {
    ipcMain.handle('get-settings', () => loadSettings());
    ipcMain.handle('save-settings', (_event, settings: AppSettings) => {
        saveSettings(settings);
        return true;
    });
};