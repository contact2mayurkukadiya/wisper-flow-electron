# WhisperFlow 🎙️

**WhisperFlow** is a powerful, system-wide AI dictation assistant for macOS. It allows you to speak into any application (VS Code, Slack, Notes, etc.), transcribes your voice using a local Whisper model, refines the text using AI (Ollama or OpenAI), and automatically pastes the result at your cursor position.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Platform](https://img.shields.io/badge/platform-macOS-lightgrey)
![Stack](https://img.shields.io/badge/built%20with-Electron%20%2B%20React%20%2B%20Vite-blueviolet)

## ✨ Features

*   **Global Push-to-Talk:** Hold `Right Option` (Alt) to record from anywhere.
*   **100% Offline Dictation:** Uses `whisper.cpp` to run OpenAI's Whisper model locally.
*   **AI Refinement:** Automatically removes stutter, fixes spelling, and formats text using a local LLM (Ollama) or OpenAI.
*   **Floating Widget:** A minimal, draggable UI that stays out of your way.
*   **Optimized Performance:** Cold-start recording (0% battery drain when idle).
*   **System Integration:** Simulates native keyboard events to paste text into any focused input field.

---

## 🛠️ Prerequisites

Before starting, ensure you have the following installed on your machine:

*   **Node.js** (v18 or higher recommended)
*   **npm** (comes with Node.js)
*   **Python 3.12** (Required for building the keyboard hook library)

---

## 📥 Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/whisper-flow.git
    cd whisper-flow
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```
    *Note: This runs a `postinstall` script to compile native modules (`uiohook-napi`) for Electron. If this fails, ensure you have Python installed.*

---

## ⚙️ Critical Setup: Resources Folder

Because this app runs offline binaries, you must manually place the engine files in the `resources/` folder. **The app will not work without this.**

### 1. Create the folder
Create a folder named `resources` in the root of your project:
```bash
mkdir resources
```

### 2. Download the Binaries
You need three files inside `resources/`:

* **A. Whisper Engine (The Ears):**
  * Download `whisper-bin-mac-arm64.zip` (for Apple Silicon) or `x64` (Intel) from [whisper.cpp Releases](https://github.com/ggml-org/whisper.cpp/releases).
  * Extract the file named `main` or `whisper-cli`.
  * Rename it to: `whisper-core`
  * Place it in `resources/`
    * **NOTE :** If `whisper-bin-mac-arm64.zip` not found in repository then follow alternative flow.
    * **Alternative Flow** :
      * run following commands in order.
  
      ```html
        <!-- # 1. Clone whisper library -->
        git clone https://github.com/ggerganov/whisper.cpp
        cd whisper.cpp

        <!-- # 2. Build it (Your Mac comes with 'make' installed) -->
        make

        <!-- # 3. Download the AI Model (Smallest one for speed) -->
        bash ./models/download-ggml-model.sh tiny.en

        <!-- 
        # -----------------------------------------------------------
        # STOP HERE: You now have the files we need.
        # 1. The executable file is named: 'main'  (build/bin/main | build/bin/whisper-cli)
        # 2. The model file is at: 'models/ggml-tiny.en.bin'
        # 3. follow this above main steps and copy these files into resource folder.
        # -----------------------------------------------------------
         -->
      ```

* **B. The Whisper Model (The Brain):**
  * Download the Tiny English model: [ggml-tiny.en.bin](https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en.bin)
  * Place it in `resources/`
* **C. Ollama Server (The Refiner):**
  * Download `Ollama-darwin.zip` from [Ollama Releases](https://github.com/ollama/ollama/releases).
  * Unzip and Right Click the App -> "Show Package Contents" -> `Contents/MacOS/`
  * Copy the ollama binary file.
  * Place it in `resources/`.

### 3. Final Folder Structure

```
whisper-flow/
├── resources/
│   ├── whisper-core        (Executable)
│   ├── ggml-tiny.en.bin    (Model file)
│   └── ollama              (Executable)
├── src/
├── package.json
...
```

### 4. Set Permissions

```console
chmod +x resources/whisper-core resources/ollama
xattr -cr resources/whisper-core resources/ollama
```

## 🚀 Running Locally (Development)

* 1. Start the development server :
  
    ```bash
    npm run dev
    ```

* 2. Grant Permissions:
  * On the first run, macOS will prompt you for **Microphone Access**. Click Allow.
  * It will also ask for **Accessibility Access** (to simulate key presses).
    * Go to System Settings > Privacy & Security > Accessibility.
    * Toggle the switch ON for Terminal (or VS Code / Electron).
  
* 3. Usage:
  * You will see a small widget at the bottom of the screen.
  * Hold **Right Option (Alt)** to speak.
  * Release to transcribe and paste.

---
## 📦 Building for Production (macOS)

To create an installable `.dmg` file:

* 1. **Add an Icon (Optional):**
  * Create a folder named `build` in the root.
  * Place a file named `icon.icns` inside it.
  
* 2. **Run the Build Command:**

```bash
npm run build:mac
```

*This will compile React, bundle the resources, and code-sign (locally).*

* 3. **Locate the Installer:**
  * The file will be in `dist/WhisperFlow-1.0.0.dmg`.
  
* 4. **Install:**
  * Open the DMG and drag to Applications.
  * *Note: Since this is self-signed, you may need to go to Privacy & Security settings and click "Open Anyway" on the first launch.
*

## 🔧 Configuration

### Offline Refinement (Ollama)

To use local AI refinement (fixing spelling/grammar offline):

* 1. Open the App Settings (Hover over widget -> Click Cog).
* 2. Enable **Refinement**.
* 3. Select **Ollama (Local)**.
* 4. Enter model name (e.g., **qwen2.5:0.5b** for speed).
* 5. Click **Download Model** if you haven't pulled it yet.


## 🐛 Troubleshooting

**Q: `node-gyp` failed to rebuild `uiohook-napi`?**
A: This usually happens on Python 3.12+.
*  Run `pip3 install setuptools`.
*  Delete `node_modules` and run `npm install` again.

*  **Note:** Use Python 3.12 version while building `.dmg` file. If you have multiple python versions, then
     * Activate specific version by running this command : `source <venv name>/bin/activate` 
     * Example : `source py3.12/bin/activate`


**Q: The app records but doesn't paste text?**
*  Check **Accessibility Permissions**. Remove the app from the Accessibility list in System Settings and re-add it.

**Q: "App is damaged" message after installing?**

*  Run `xattr -cr /Applications/WhisperFlow.app` in your terminal to clear the quarantine flag.











