import { useState, useRef, useEffect, JSX } from 'react';
import { Settings2, Loader2, Mic } from 'lucide-react';

export default function Widget(): JSX.Element {
  // --- STATE ---
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // --- REFS ---
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  // --- LIFECYCLE ---
  useEffect(() => {
    
    // 1. Initialize Microphone on mount (Warmup)
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        mediaRecorder.current = new MediaRecorder(stream);

        mediaRecorder.current.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunks.current.push(e.data);
        };

        mediaRecorder.current.onstop = async () => {
          // A. Recording Stopped -> Start Processing
          setIsProcessing(true);

          try {
            const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
            const arrayBuffer = await audioBlob.arrayBuffer();
            audioChunks.current = []; // Reset buffer

            // B. Send to Main Process (Whisper + Optional AI Refinement)
            // processing will finish when the await returns
            await window.api.transcribe(arrayBuffer);
          } catch (error) {
            console.error("Transcription pipeline failed", error);
          } finally {
            // C. Done
            setIsProcessing(false);
          }
        };
      })
      .catch((err) => {
        console.error("Microphone access denied:", err);
      });

    // 2. Subscribe to Backend Push-to-Talk Signals (from Shortcuts/Hooks)
    // We strictly use callbacks so we don't leak listeners
    const unsubscribe = window.api.onPTT((status: 'START' | 'STOP') => {
      if (status === 'START') {
        if (mediaRecorder.current && mediaRecorder.current.state === 'inactive') {
          audioChunks.current = [];
          mediaRecorder.current.start();
          setIsRecording(true);
        }
      }
      else if (status === 'STOP') {
        if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
          mediaRecorder.current.stop();
          setIsRecording(false);
        }
      }
    });


    // Cleanup listeners if component unmounts (rare for this app but good practice)
    return () => {
      unsubscribe();
    };
  }, []);

  // --- RENDER ---
  return (
    // ROOT: Full width/height transparent container to center the widget initially
    // or allows the dragged widget to float anywhere.
    <div className="flex items-center justify-center w-full h-screen bg-transparent select-none overflow-visible">

      {/* 
        THE MAIN PILL WIDGET 
        - 'draggable': Applies -webkit-app-region: drag (Moves the window)
        - 'group': Used so child elements can react to hover state
      */}
      <div className="draggable group relative flex items-center justify-between w-36 h-11 bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-full pl-3 pr-3 shadow-2xl transition-all duration-200 hover:bg-gray-800 hover:border-gray-500 hover:shadow-blue-900/10">

        {/* 1. STATUS INDICATOR (LEFT) */}
        <div className="flex items-center justify-center w-5 h-5">
          {isProcessing ? (
            <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
          ) : isRecording ? (
            <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
          ) : (
            <Mic className="w-3.5 h-3.5 text-gray-500" />
          )}
        </div>

        {/* 2. CENTER CONTENT (ANIMATION OR TEXT) */}
        <div className="flex-1 flex items-center justify-center h-full gap-[3px]">
          {isRecording ? (
            // --- WAVE ANIMATION (CSS required in index.css) ---
            // Simulates voice activity visualization
            <div className="flex items-center justify-center h-4 gap-[2px]">
              <div className="w-[3px] bg-red-400 rounded-full animate-wave h-2" style={{ animationDelay: '0ms' }}></div>
              <div className="w-[3px] bg-red-400 rounded-full animate-wave h-4" style={{ animationDelay: '100ms' }}></div>
              <div className="w-[3px] bg-red-400 rounded-full animate-wave h-3" style={{ animationDelay: '200ms' }}></div>
              <div className="w-[3px] bg-red-400 rounded-full animate-wave h-4" style={{ animationDelay: '150ms' }}></div>
              <div className="w-[3px] bg-red-400 rounded-full animate-wave h-2" style={{ animationDelay: '50ms' }}></div>
            </div>
          ) : (
            // --- STATUS TEXT ---
            <span className={`text-[10px] font-bold tracking-widest uppercase transition-colors ${isProcessing ? 'text-blue-400' : 'text-gray-500'}`}>
              {isProcessing ? 'Thinking' : 'Ready'}
            </span>
          )}
        </div>

        {/* 3. SETTINGS BUTTON (HOVER REVEAL) */}
        {/* 
            - 'no-drag': Crucial! Allows clicking without trying to drag window.
            - Absolute Position: Puts it outside the pill to the right.
            - group-hover: Only shows when user mouses over the widget.
        */}

        {/* 4. SETTING HANDLE (RIGHT) */}
        {/* Visual cue that this object is draggable */}
        <button
          onClick={() => window.api.openSettings()}
          className="no-drag clickable"
          title="Configuration"
        >
          <div className="text-gray-600 ml-1">
            <Settings2 size={14} />
          </div>
        </button>
      </div>
    </div>
  );
}