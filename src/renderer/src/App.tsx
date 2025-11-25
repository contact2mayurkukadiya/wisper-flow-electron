import { useState, useRef, useEffect, JSX } from 'react';
import { GripHorizontal, Mic } from 'lucide-react'; // Make sure lucide-react is installed

function App(): JSX.Element {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // New State for "thinking"
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  useEffect(() => {
    // Initialize Mic (Cold start)
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      mediaRecorder.current = new MediaRecorder(stream);
      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };
      mediaRecorder.current.onstop = async () => {
        // START PROCESSING UI
        setIsProcessing(true);

        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        const arrayBuffer = await audioBlob.arrayBuffer();
        audioChunks.current = [];

        // Send to Backend
        await window.api.transcribe(arrayBuffer);

        // DONE
        setIsProcessing(false);
      };
    });

    window.api.onPTT((status) => {
      if (status === 'START') {
        audioChunks.current = [];
        if (mediaRecorder.current?.state === 'inactive') {
          mediaRecorder.current.start();
          setIsRecording(true);
        }
      }
      else if (status === 'STOP') {
        if (mediaRecorder.current?.state === 'recording') {
          mediaRecorder.current.stop();
          setIsRecording(false);
        }
      }
    });
  }, []);

  return (
    // ROOT CONTAINER: Full Drag support + Transparency
    <div className="flex items-center justify-center w-full h-screen bg-transparent">

      {/* THE PILL WIDGET */}
      {/* 'draggable' makes the whole pill move the window */}
      <div className="draggable group relative flex items-center justify-between w-32 h-10 bg-gray-900/90 backdrop-blur-md border border-gray-700 rounded-full px-3 shadow-xl transition-all hover:bg-gray-800 hover:border-gray-600 hover:scale-105 cursor-grab active:cursor-grabbing">

        {/* 1. STATUS ICON (Left) */}
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-700">
          {isProcessing ? (
            // Loading Spinner
            <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            // Simple Grip or Dot
            <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></div>
          )}
        </div>

        {/* 2. CENTER CONTENT (Animation or Text) */}
        <div className="flex-1 flex items-center justify-center h-full px-2 gap-[2px]">
          {isRecording ? (
            // WAVY AUDIO BARS
            <>
              <div className="w-1 bg-red-400 rounded-full animate-wave" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1 bg-red-400 rounded-full animate-wave" style={{ animationDelay: '100ms' }}></div>
              <div className="w-1 bg-red-400 rounded-full animate-wave" style={{ animationDelay: '200ms' }}></div>
              <div className="w-1 bg-red-400 rounded-full animate-wave" style={{ animationDelay: '150ms' }}></div>
              <div className="w-1 bg-red-400 rounded-full animate-wave" style={{ animationDelay: '50ms' }}></div>
            </>
          ) : (
            // IDLE TEXT
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest select-none">
              {isProcessing ? 'Thinking' : 'Ready'}
            </span>
          )}
        </div>

        {/* 3. GRIP HANDLE (Right) */}
        <div className="text-gray-600">
          <GripHorizontal size={14} />
        </div>

      </div>
    </div>
  );
}

export default App;