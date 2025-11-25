import { JSX, useEffect, useState } from 'react';
import {
    Save,
    Settings2,
    Bot,
    CloudLightning,
    Cpu,
    Wand2,
    CheckCircle2,
    Terminal
} from 'lucide-react';

// Define Interface matching your Store (in Main)
interface AppSettings {
    refinementEnabled: boolean;
    provider: 'ollama' | 'openai';
    ollamaModel: string;
    llmApiKey: string;
    removeStutter: boolean;
    fixSpelling: boolean;
    completeSentences: boolean;
    customPrompt: string;
}

export default function Settings(): JSX.Element {
    const [loading, setLoading] = useState(true);
    const [isSaved, setIsSaved] = useState(false);

    // Default State
    const [config, setConfig] = useState<AppSettings>({
        refinementEnabled: false,
        provider: 'ollama',
        ollamaModel: 'llama3.2',
        llmApiKey: '',
        removeStutter: true,
        fixSpelling: true,
        completeSentences: false,
        customPrompt: ''
    });

    // Load Settings on Mount
    useEffect(() => {
        window.api.getSettings().then((saved: AppSettings) => {
            // Merge saved with defaults to prevent null errors on new fields
            setConfig(prev => ({ ...prev, ...saved }));
            setLoading(false);
        });
    }, []);

    const update = (key: keyof AppSettings, value: any) => {
        setConfig(prev => ({ ...prev, [key]: value }));
        setIsSaved(false); // Reset saved indicator on change
    };

    const handleSave = async () => {
        await window.api.saveSettings(config);
        setIsSaved(true);
        // Auto hide success message after 2s
        setTimeout(() => setIsSaved(false), 2000);
    };

    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-gray-950 text-gray-500 animate-pulse">
            Loading Configuration...
        </div>
    );

    return (
        <div className="h-screen w-full bg-gray-950 text-gray-200 font-sans selection:bg-blue-500/30 overflow-y-auto">
            <div className="max-w-2xl mx-auto p-8">

                {/* HEADER */}
                <div className="flex items-center gap-3 mb-10 pb-4 border-b border-gray-800">
                    <div className="p-3 bg-gray-900 rounded-xl shadow-lg border border-gray-800">
                        <Settings2 className="w-8 h-8 text-blue-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">System Preferences</h1>
                        <p className="text-sm text-gray-500">Configure Speech Logic & AI Intelligence</p>
                    </div>
                </div>

                {/* 1. MAIN SWITCH: AI REFINEMENT */}
                <div className="bg-gray-900/50 rounded-2xl p-5 border border-gray-800 mb-8 flex items-center justify-between group hover:border-blue-500/30 transition-colors">
                    <div className="flex gap-4 items-center">
                        <div className={`p-2 rounded-lg transition-colors ${config.refinementEnabled ? 'bg-blue-500/10 text-blue-400' : 'bg-gray-800 text-gray-500'}`}>
                            <Wand2 size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-white">Smart Refinement</h3>
                            <p className="text-xs text-gray-400 max-w-sm">
                                When enabled, Whisper text is sent to an LLM to correct spelling, remove stutter, and format structure.
                            </p>
                        </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={config.refinementEnabled}
                            onChange={(e) => update('refinementEnabled', e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-12 h-7 bg-gray-700 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600 shadow-inner"></div>
                    </label>
                </div>

                {/* CONTENT (Only visible if Refinement Enabled) */}
                <div className={`transition-all duration-500 ease-in-out ${config.refinementEnabled ? 'opacity-100 translate-y-0' : 'opacity-30 pointer-events-none translate-y-4 blur-sm grayscale'}`}>

                    {/* 2. PROVIDER SELECTOR */}
                    <div className="mb-8">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Bot size={14} /> Intelligence Provider
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                            {/* OPTION A: OLLAMA */}
                            <button
                                onClick={() => update('provider', 'ollama')}
                                className={`relative p-4 rounded-xl border text-left transition-all ${config.provider === 'ollama'
                                    ? 'bg-blue-900/20 border-blue-500 ring-1 ring-blue-500'
                                    : 'bg-gray-900/40 border-gray-800 hover:bg-gray-800'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <Cpu className={`w-6 h-6 ${config.provider === 'ollama' ? 'text-blue-400' : 'text-gray-500'}`} />
                                    {config.provider === 'ollama' && <CheckCircle2 className="w-4 h-4 text-blue-500" />}
                                </div>
                                <h4 className="font-bold text-sm">Ollama (Local)</h4>
                                <p className="text-[11px] text-gray-400 mt-1">Runs offline on your Mac. Free & Private.</p>
                            </button>

                            {/* OPTION B: OPENAI */}
                            <button
                                onClick={() => update('provider', 'openai')}
                                className={`relative p-4 rounded-xl border text-left transition-all ${config.provider === 'openai'
                                    ? 'bg-green-900/20 border-green-500 ring-1 ring-green-500'
                                    : 'bg-gray-900/40 border-gray-800 hover:bg-gray-800'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <CloudLightning className={`w-6 h-6 ${config.provider === 'openai' ? 'text-green-400' : 'text-gray-500'}`} />
                                    {config.provider === 'openai' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                </div>
                                <h4 className="font-bold text-sm">OpenAI (Cloud)</h4>
                                <p className="text-[11px] text-gray-400 mt-1">Slightly smarter, but requires API Key.</p>
                            </button>
                        </div>

                        {/* DYNAMIC INPUTS */}
                        <div className="mt-4 p-4 bg-gray-900/60 rounded-xl border border-gray-800/60">
                            {config.provider === 'ollama' ? (
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-semibold text-gray-400 ml-1">Local Model Name</label>
                                    <div className="flex items-center gap-3">
                                        <Terminal size={18} className="text-gray-600" />
                                        <input
                                            type="text"
                                            value={config.ollamaModel}
                                            onChange={(e) => update('ollamaModel', e.target.value)}
                                            placeholder="e.g. llama3.2"
                                            className="flex-1 bg-transparent border-b border-gray-700 focus:border-blue-500 py-1 px-2 outline-none text-blue-100 placeholder-gray-700 font-mono text-sm"
                                        />
                                    </div>
                                    <p className="text-[10px] text-gray-500 ml-8">Ensure you ran <code>ollama pull {config.ollamaModel || 'llama3.2'}</code> in terminal.</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-semibold text-gray-400 ml-1">OpenAI API Key</label>
                                    <input
                                        type="password"
                                        value={config.llmApiKey}
                                        onChange={(e) => update('llmApiKey', e.target.value)}
                                        placeholder="sk-..."
                                        className="w-full bg-gray-950 border border-gray-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-green-900 outline-none text-sm font-mono"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 3. RULES & METRICS */}
                    <div className="mb-8">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Correction Metrics</h3>

                        <div className="space-y-3">
                            {[
                                { key: 'removeStutter', label: 'Remove Stutter', desc: 'Deletes duplicate words (e.g. "I I went") and filler sounds like "um, ah".' },
                                { key: 'fixSpelling', label: 'Correct Spelling', desc: 'Fixes typo-level errors in transcription.' },
                                { key: 'completeSentences', label: 'Prune Incomplete', desc: 'Removes the last sentence if it ends abruptly.' },
                            ].map((item) => (
                                <div key={item.key} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-900 transition-colors">
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-200">{item.label}</h4>
                                        <p className="text-[11px] text-gray-500">{item.desc}</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={!!config[item.key as keyof AppSettings]}
                                        onChange={(e) => update(item.key as keyof AppSettings, e.target.checked)}
                                        className="w-5 h-5 accent-blue-500 rounded cursor-pointer"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 4. CUSTOM PROMPT */}
                    <div className="mb-6">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 block">Additional Rules (Prompt)</label>
                        <textarea
                            rows={4}
                            value={config.customPrompt}
                            onChange={(e) => update('customPrompt', e.target.value)}
                            placeholder="e.g. 'Always format Python code in Markdown', 'Translate text to Spanish', or 'Keep response concise'."
                            className="w-full bg-gray-900 border border-gray-800 rounded-xl p-4 text-sm focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500 outline-none resize-none placeholder-gray-700 leading-relaxed shadow-inner"
                        />
                    </div>

                </div>

                {/* 5. FOOTER / SAVE */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-950/80 backdrop-blur-lg border-t border-gray-900 flex justify-center z-10">
                    <button
                        onClick={handleSave}
                        className={`flex items-center gap-2 px-8 py-3 rounded-full font-bold shadow-lg transform transition-all active:scale-95 ${isSaved
                            ? 'bg-green-500 text-white shadow-green-900/20 scale-105'
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/30'
                            }`}
                    >
                        {isSaved ? <CheckCircle2 size={18} /> : <Save size={18} />}
                        {isSaved ? 'Settings Saved' : 'Save Changes'}
                    </button>
                </div>

                {/* Spacer for fixed footer */}
                <div className="h-24" />

            </div>
        </div>
    );
}