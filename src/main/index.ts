import { app, BrowserWindow, ipcMain, clipboard, screen } from 'electron'
import { join } from 'path'
import { electronApp, is } from '@electron-toolkit/utils'
import { keyboard, Key } from '@nut-tree-fork/nut-js'
import { writeFile, unlink } from 'fs/promises'
import os from 'os'
import { execFile } from 'child_process' // Using native Process handling
import { uIOhook, UiohookKey } from 'uiohook-napi'

// --- IMPORTS FOR CONVERSION ---
import ffmpeg from 'fluent-ffmpeg'
import ffmpegPath from 'ffmpeg-static'

// @ts-ignore
ffmpeg.setFfmpegPath(ffmpegPath.replace('app.asar', 'app.asar.unpacked'))

let mainWindow: BrowserWindow | null = null;
keyboard.config.autoDelayMs = 0;

function createWindow(): void {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  mainWindow = new BrowserWindow({
    width: 140, // Small width
    height: 60, // Small height
    x: Math.round(width / 2 - 70), // Center X
    y: Math.round(height - 80),    // Bottom Y (with padding)
    frame: false,       // No title bar
    transparent: true,  // See-through corners
    alwaysOnTop: true,  // Float above everything
    resizable: false,
    hasShadow: false,   // Cleaner look
    skipTaskbar: true,  // Don't show in dock
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}


// -------------------------------------------------------------------
// 1. PUSH-TO-TALK STATE MACHINE
// -------------------------------------------------------------------
let isRecording = false;

// CHOOSE YOUR KEY: 
// Right Option = 3613 (Mac standard right-side modifier)
// Space = 57 (Not recommended, will spam spaces)
const PTT_KEY = UiohookKey.AltRight;

const setupHooks = () => {
  uIOhook.on('keydown', (e) => {
    if (e.keycode === PTT_KEY && !isRecording) {
      isRecording = true;
      console.log('PTT DOWN: Start Recording');

      // 2. Tell Renderer to START Mic
      mainWindow?.webContents.send('ptt-status-change', 'START');
    }
  });

  uIOhook.on('keyup', (e) => {
    if (e.keycode === PTT_KEY && isRecording) {
      isRecording = false;
      console.log('PTT UP: Stop Recording');

      // 2. Tell Renderer to STOP Mic & Process
      mainWindow?.webContents.send('ptt-status-change', 'STOP');
    }
  });

  uIOhook.start();
};

// ----------------------------------------------------
// HELPER: Convert Audio (WebM -> WAV 16k)
// ----------------------------------------------------
const convertAudioToWav = async (inputPath: string, outputPath: string) => {
  return new Promise<void>((resolve, reject) => {
    ffmpeg(inputPath)
      .toFormat('wav')
      .audioFrequency(16000)
      .audioChannels(1)
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .save(outputPath)
  });
};

// ----------------------------------------------------
// HELPER: Run Local Binary
// ----------------------------------------------------
const runWhisperBin = async (wavPath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    // LOCATE RESOURCES
    // In dev: process.cwd() + '/resources/...'
    // In prod: process.resourcesPath + '/...'
    const basePath = app.isPackaged ? process.resourcesPath : join(process.cwd(), 'resources');

    const binaryPath = join(basePath, 'whisper-core');
    const modelPath = join(basePath, 'ggml-tiny.en.bin');

    console.log("Binary:", binaryPath);
    console.log("Model:", modelPath);

    // COMMAND: ./whisper -m models/ggml-tiny.en.bin -f file.wav -nt -t 4
    // -nt: No timestamps in output
    // -t 4: Use 4 threads (faster)
    const args = [
      '-m', modelPath,
      '-f', wavPath,
      '-nt',            // Output text only (no [00:00 -> 00:05])
      '-t', '4'         // Use 4 CPU cores
    ];

    execFile(binaryPath, args, (error, stdout, stderr) => {
      if (error) {
        console.error("Whisper Error:", stderr);
        reject(error);
        return;
      }
      // cleanup whitespace
      const cleanText = stdout.trim();
      resolve(cleanText);
    });
  });
}

async function insertTextAtCursor(text: string) {
  if (!text) return;
  console.log("Typing:", text);

  // 1. Hide first
  // mainWindow?.hide();

  // 2. Wait for OS to switch focus back to target app
  await new Promise(r => setTimeout(r, 150));

  // 3. Clip Swap
  const original = clipboard.readText();
  clipboard.writeText(text);

  // 4. Paste Command
  const modifier = process.platform === 'darwin' ? Key.LeftSuper : Key.LeftControl;
  await keyboard.pressKey(modifier, Key.V);
  await keyboard.releaseKey(modifier, Key.V);

  // 5. Restore Clip
  setTimeout(() => clipboard.writeText(original), 300);
}


app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')
  createWindow()
  setupHooks();
})

app.on('will-quit', () => {
  uIOhook.stop();
});


ipcMain.handle('transcribe', async (_event, audioBuffer: ArrayBuffer) => {
  console.log("STARTING OFFLINE...");
  const inputPath = join(os.tmpdir(), `rec-${Date.now()}.webm`);
  const wavPath = join(os.tmpdir(), `rec-${Date.now()}.wav`);

  try {
    // 1. Save Webm
    await writeFile(inputPath, Buffer.from(audioBuffer));
    // 2. Convert to Wav
    await convertAudioToWav(inputPath, wavPath);
    // 3. Exec Binary
    const rawText = await runWhisperBin(wavPath);

    console.log("FINAL TEXT:", rawText);

    if (rawText.trim().length > 0) {
      await insertTextAtCursor(rawText);
    } else {
      console.log("Skipping paste - text was empty/silence.");
    }


    // Cleanup
    await unlink(inputPath);
    await unlink(wavPath);

    return rawText;
  } catch (error) {
    console.error("FAILED:", error);
    try { await unlink(inputPath); await unlink(wavPath); } catch (e) { }
    throw error;
  }
});