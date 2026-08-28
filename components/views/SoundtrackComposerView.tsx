import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { SoundtrackComposerIcon } from '../icons/SoundtrackComposerIcon';
import { SparklesIcon } from '../icons/SparklesIcon';
import { CheckIcon } from '../icons/CheckIcon';
import PromptForgeDock from '../promptforge/PromptForgeDock';
import { AlertIcon } from '../icons/AlertIcon';
import { SoundtrackTrack } from '../../types';
import type { ActivityItemProps } from '../ContextualSmartPanel';

interface SoundtrackComposerViewProps {
  soundtracks: SoundtrackTrack[];
  setSoundtracks: React.Dispatch<React.SetStateAction<SoundtrackTrack[]>>;
  addActivity: (activity: Omit<ActivityItemProps, 'time'>) => void;
}

const SoundtrackComposerView: React.FC<SoundtrackComposerViewProps> = ({
  soundtracks,
  setSoundtracks,
  addActivity,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTrackId, setActiveTrackId] = useState<string>(soundtracks[0]?.id || 'track-1');
  const [masterVolume, setMasterVolume] = useState<number>(0.6);
  const [filterCutoff, setFilterCutoff] = useState<number>(1800);
  const [bpm, setBpm] = useState<number>(soundtracks[0]?.bpm || 110);
  const [notification, setNotification] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // AI Score Composer
  const [sceneConcept, setSceneConcept] = useState('');
  const [isComposingAiScore, setIsComposingAiScore] = useState(false);

  // Web Audio Nodes refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const synthIntervalRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const activeTrack = soundtracks.find((t) => t.id === activeTrackId) || soundtracks[0];

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Initialize Web Audio API
  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      const gain = ctx.createGain();
      gain.gain.value = masterVolume;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = filterCutoff;
      filter.Q.value = 4;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;

      filter.connect(gain);
      gain.connect(analyser);
      analyser.connect(ctx.destination);

      audioCtxRef.current = ctx;
      masterGainRef.current = gain;
      filterNodeRef.current = filter;
      analyserNodeRef.current = analyser;
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  // Start Real Synthetic Sequencer
  const startSynthesizer = (track: SoundtrackTrack) => {
    initAudio();
    stopSynthesizer();

    const ctx = audioCtxRef.current;
    const filter = filterNodeRef.current;
    if (!ctx || !filter) return;

    let step = 0;
    const noteScale =
      track.type === 'synthwave'
        ? [130.81, 155.56, 174.61, 196.0, 233.08, 261.63] // C Minor Pentatonic
        : track.type === 'action'
        ? [146.83, 164.81, 174.61, 220.0, 293.66] // D Minor Heavy
        : [110.0, 130.81, 146.83, 164.81, 220.0]; // Ambient Drone

    const intervalMs = (60 / (track.bpm || 110)) * 250; // 16th note timing

    // Synthesized Noise for rain/atmosphere
    if (track.type === 'ambient') {
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.value = 800;

      const noiseGain = ctx.createGain();
      noiseGain.gain.value = 0.08;

      whiteNoise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(filter);
      whiteNoise.start();
    }

    synthIntervalRef.current = window.setInterval(() => {
      if (!audioCtxRef.current || audioCtxRef.current.state !== 'running') return;

      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();

      const freq = noteScale[step % noteScale.length] * (step % 4 === 0 ? 1 : 2);
      osc.type = track.type === 'synthwave' ? 'sawtooth' : track.type === 'action' ? 'square' : 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      noteGain.gain.setValueAtTime(0.2, ctx.currentTime);
      noteGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + intervalMs / 1000);

      osc.connect(noteGain);
      noteGain.connect(filter);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + intervalMs / 1000);

      step++;
    }, intervalMs);

    setIsPlaying(true);
  };

  const stopSynthesizer = () => {
    if (synthIntervalRef.current) {
      clearInterval(synthIntervalRef.current);
      synthIntervalRef.current = null;
    }
    setIsPlaying(false);
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      stopSynthesizer();
    } else {
      startSynthesizer(activeTrack);
      showToast(`Playing "${activeTrack.title}"`);
    }
  };

  // Soundboard Trigger
  const triggerSoundFx = (type: 'laser' | 'glitch' | 'thunder' | 'chime' | 'siren') => {
    initAudio();
    const ctx = audioCtxRef.current;
    const filter = filterNodeRef.current;
    if (!ctx || !filter) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === 'laser') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === 'glitch') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(240, ctx.currentTime);
      osc.frequency.setValueAtTime(820, ctx.currentTime + 0.05);
      osc.frequency.setValueAtTime(160, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else if (type === 'thunder') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.8);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } else if (type === 'chime') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046.5, ctx.currentTime); // C6
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } else if (type === 'siren') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.3);
      osc.frequency.linearRampToValueAtTime(440, ctx.currentTime + 0.6);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    }

    osc.connect(gain);
    gain.connect(filter);
  };

  // Canvas visualizer animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      animationFrameRef.current = requestAnimationFrame(render);
      const analyser = analyserNodeRef.current;

      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (!analyser || !isPlaying) {
        // Draw idle wave
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        for (let i = 0; i < canvas.width; i += 10) {
          ctx.lineTo(i, canvas.height / 2 + Math.sin(i * 0.05 + Date.now() * 0.002) * 4);
        }
        ctx.stroke();
        return;
      }

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      const barWidth = (canvas.width / bufferLength) * 2;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.9;

        const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
        gradient.addColorStop(0, '#06b6d4');
        gradient.addColorStop(0.5, '#3b82f6');
        gradient.addColorStop(1, '#d946ef');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
        x += barWidth;
      }
    };

    render();
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying]);

  // Update volume & filter in real-time
  useEffect(() => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = masterVolume;
    }
  }, [masterVolume]);

  useEffect(() => {
    if (filterNodeRef.current) {
      filterNodeRef.current.frequency.value = filterCutoff;
    }
  }, [filterCutoff]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      stopSynthesizer();
    };
  }, []);

  const handleAiComposeScore = async () => {
    if (!sceneConcept.trim()) {
      setError('Please provide a scene mood or story beat.');
      return;
    }
    setIsComposingAiScore(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY });
      const prompt = `Compose a soundtrack theme specification for a cyberpunk graphic novel scene.
Scene: "${sceneConcept.trim()}".
Return a JSON object with:
- title: Evocative track title
- mood: Atmospheric descriptor (e.g. "Tense Infiltration", "Heartbreaking Noir")
- bpm: Number between 60 and 150
- description: 2 sentences detailing the synth arrangement, arpeggiator patterns, sub-bass, and emotional resonance
- key: Musical key (e.g. "D Minor", "F# Phrygian")
- type: one of 'synthwave', 'ambient', 'action', 'cyberpunk-drone'`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              mood: { type: Type.STRING },
              bpm: { type: Type.NUMBER },
              description: { type: Type.STRING },
              key: { type: Type.STRING },
              type: { type: Type.STRING, enum: ['synthwave', 'ambient', 'action', 'cyberpunk-drone'] },
            },
            required: ['title', 'mood', 'bpm', 'description', 'key', 'type'],
          },
        },
      });

      const parsed = JSON.parse(response.text.trim());
      const newTrack: SoundtrackTrack = {
        id: `track-${Date.now()}`,
        title: parsed.title,
        mood: parsed.mood,
        bpm: parsed.bpm || 110,
        description: parsed.description,
        key: parsed.key,
        type: parsed.type,
      };

      setSoundtracks((prev) => [newTrack, ...prev]);
      setActiveTrackId(newTrack.id);
      setBpm(newTrack.bpm);
      setSceneConcept('');
      showToast(`AI Composed Score Track: "${newTrack.title}"!`);
      addActivity({
        imgSrc: 'https://picsum.photos/seed/ai-icon/40/40',
        userName: 'Soundtrack AI',
        action: `composed score theme "${newTrack.title}" (${newTrack.bpm} BPM).`,
      });
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to compose score.');
    } finally {
      setIsComposingAiScore(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-[#2E2E3A] pb-3">
        <div className="flex items-center gap-3">
          <span className="w-3 h-8 bg-[#FF2244]"></span>
          <div>
            <h2 className="font-display text-4xl font-extrabold text-[#F0EBE1] uppercase tracking-wider">
              AUDIO SYNTHESIZER // SOUNDTRACK DECK
            </h2>
            <p className="font-mono text-xs text-[#8E8A84] mt-0.5">
              Real-time Web Audio cyberpunk synth engine, interactive soundboard, and AI score designer.
            </p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div className="flex items-center gap-2 p-3 bg-[#00E5FF]/10 border-2 border-[#00E5FF] text-[#00E5FF] font-mono text-xs shadow-[4px_4px_0px_#0A0A0F] animate-fade-in">
          <CheckIcon className="w-5 h-5 text-[#00E5FF]" />
          <span>{notification}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-[#FF2244]/10 border-2 border-[#FF2244] text-[#FF2244] font-mono text-xs shadow-[4px_4px_0px_#0A0A0F]">
          <AlertIcon className="w-5 h-5 text-[#FF2244]" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Synthesizer Deck */}
      <div className="bg-[#12121A] border-2 border-[#2E2E3A] p-6 shadow-[8px_8px_0px_#0A0A0F] space-y-6">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b-2 border-[#2E2E3A] pb-4">
          <div>
            <span className="font-mono text-xs font-bold text-[#00E5FF] uppercase tracking-widest block">
              ACTIVE SYNTHESIZER PRESET
            </span>
            <h3 className="font-display text-3xl font-black text-[#F0EBE1] uppercase tracking-wide mt-0.5">{activeTrack.title}</h3>
            <p className="font-mono text-xs text-[#8E8A84] mt-1">
              MOOD: <span className="text-[#F0EBE1]">{activeTrack.mood}</span> | KEY: {activeTrack.key} | TEMPO: {activeTrack.bpm} BPM
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleTogglePlay}
              className={`flex items-center gap-3 px-8 py-3 font-mono font-black text-xs tracking-wider uppercase transition-all shadow-[4px_4px_0px_#0A0A0F] ${
                isPlaying
                  ? 'bg-[#FF2244] text-white border-2 border-[#FF2244] animate-pulse'
                  : 'bg-[#00E5FF] text-[#0A0A0F] border-2 border-[#00E5FF] hover:bg-[#00E5FF]/80'
              }`}
            >
              {isPlaying ? (
                <>
                  <span>⏹ STOP SYNTHESIZER</span>
                </>
              ) : (
                <>
                  <span>▶ PLAY SYNTHESIZER</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Real-time Spectrum Canvas Visualizer */}
        <div className="relative border-2 border-[#2E2E3A] bg-[#0A0A0F] h-32">
          <canvas ref={canvasRef} width={800} height={128} className="w-full h-full" />
          <div className="absolute top-2 right-3 font-mono text-[10px] text-[#00E5FF] bg-[#0A0A0F] px-2 py-0.5 border border-[#2E2E3A]">
            {isPlaying ? 'AUDIO SPECTRUM LIVE' : 'SYNTH STANDBY'}
          </div>
        </div>

        {/* Real-time Modulation Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-[#0A0A0F] p-4 border-2 border-[#2E2E3A]">
          <div>
            <div className="flex justify-between font-mono text-xs font-bold text-[#F0EBE1] mb-1">
              <span>MASTER VOLUME</span>
              <span className="text-[#00E5FF]">{Math.round(masterVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={masterVolume}
              onChange={(e) => setMasterVolume(Number(e.target.value))}
              className="w-full accent-[#00E5FF]"
            />
          </div>

          <div>
            <div className="flex justify-between font-mono text-xs font-bold text-[#F0EBE1] mb-1">
              <span>LOW-PASS FILTER CUTOFF</span>
              <span className="text-[#00E5FF]">{filterCutoff} Hz</span>
            </div>
            <input
              type="range"
              min={200}
              max={6000}
              step={50}
              value={filterCutoff}
              onChange={(e) => setFilterCutoff(Number(e.target.value))}
              className="w-full accent-[#00E5FF]"
            />
          </div>

          <div>
            <div className="flex justify-between font-mono text-xs font-bold text-[#F0EBE1] mb-1">
              <span>TEMPO RATE</span>
              <span className="text-[#00E5FF]">{bpm} BPM</span>
            </div>
            <input
              type="range"
              min={60}
              max={160}
              step={1}
              value={bpm}
              onChange={(e) => {
                const val = Number(e.target.value);
                setBpm(val);
                if (isPlaying) {
                  startSynthesizer({ ...activeTrack, bpm: val });
                }
              }}
              className="w-full accent-[#00E5FF]"
            />
          </div>
        </div>
      </div>

      {/* Cyberpunk Soundboard SFX Trigger Pads */}
      <div className="bg-[#12121A] border-2 border-[#2E2E3A] p-6 shadow-[6px_6px_0px_#0A0A0F] space-y-4">
        <h3 className="font-display text-2xl font-bold text-[#F0EBE1] uppercase tracking-wider">CYBERPUNK SOUNDBOARD TRIGGER PADS</h3>
        <p className="font-mono text-xs text-[#8E8A84]">
          Live Web Audio oscillators synthesize authentic sci-fi comic sound effects on demand.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <button
            onClick={() => triggerSoundFx('laser')}
            className="p-4 bg-[#1A1A24] hover:bg-[#2A2A38] border-2 border-[#2E2E3A] text-center transition-all group active:scale-95 shadow-[3px_3px_0px_#0A0A0F]"
          >
            <span className="text-2xl block mb-1">⚡</span>
            <span className="font-mono text-xs font-bold text-[#F0EBE1] group-hover:text-[#00E5FF]">LASER BLASTER</span>
          </button>

          <button
            onClick={() => triggerSoundFx('glitch')}
            className="p-4 bg-[#1A1A24] hover:bg-[#2A2A38] border-2 border-[#2E2E3A] text-center transition-all group active:scale-95 shadow-[3px_3px_0px_#0A0A0F]"
          >
            <span className="text-2xl block mb-1">👾</span>
            <span className="font-mono text-xs font-bold text-[#F0EBE1] group-hover:text-[#FF2244]">CYBER GLITCH</span>
          </button>

          <button
            onClick={() => triggerSoundFx('thunder')}
            className="p-4 bg-[#1A1A24] hover:bg-[#2A2A38] border-2 border-[#2E2E3A] text-center transition-all group active:scale-95 shadow-[3px_3px_0px_#0A0A0F]"
          >
            <span className="text-2xl block mb-1">🌩️</span>
            <span className="font-mono text-xs font-bold text-[#F0EBE1] group-hover:text-[#FFB800]">THUNDER CLAP</span>
          </button>

          <button
            onClick={() => triggerSoundFx('chime')}
            className="p-4 bg-[#1A1A24] hover:bg-[#2A2A38] border-2 border-[#2E2E3A] text-center transition-all group active:scale-95 shadow-[3px_3px_0px_#0A0A0F]"
          >
            <span className="text-2xl block mb-1">✨</span>
            <span className="font-mono text-xs font-bold text-[#F0EBE1] group-hover:text-[#00E5FF]">HOLO CHIME</span>
          </button>

          <button
            onClick={() => triggerSoundFx('siren')}
            className="p-4 bg-[#1A1A24] hover:bg-[#2A2A38] border-2 border-[#2E2E3A] text-center transition-all group active:scale-95 shadow-[3px_3px_0px_#0A0A0F]"
          >
            <span className="text-2xl block mb-1">🚨</span>
            <span className="font-mono text-xs font-bold text-[#F0EBE1] group-hover:text-[#FF2244]">SECURITY SIREN</span>
          </button>
        </div>
      </div>

      {/* AI Scene Score Composer */}
      <div className="bg-[#12121A] border-2 border-[#2E2E3A] p-6 shadow-[6px_6px_0px_#0A0A0F] space-y-4">
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-[#00E5FF]" />
          <h3 className="font-display text-xl font-bold text-[#F0EBE1] uppercase tracking-wider">AI SCORE ARRANGER & COMPOSER</h3>
          <span className="font-mono text-[10px] px-2 py-0.5 bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]">
            SMART MUSIC AI
          </span>
        </div>
        <p className="font-mono text-xs text-[#8E8A84]">
          Describe any graphic novel climax, stealth infiltration, or noir monologue, and AI will compose an arrangement preset.
        </p>

        <div className="flex gap-2">
          <PromptForgeDock domain="soundtrack-score" value={sceneConcept} onApply={setSceneConcept} className="flex-1 min-w-0">
            <input
              type="text"
              value={sceneConcept}
              onChange={(e) => setSceneConcept(e.target.value)}
              placeholder="e.g. Final rooftop confrontation between Kaira and Vespera under torrential thunderstorm"
              className="w-full bg-[#0A0A0F] border-2 border-[#2E2E3A] px-3 py-2 pr-9 font-mono text-xs text-[#F0EBE1] focus:border-[#00E5FF] focus:outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleAiComposeScore()}
            />
          </PromptForgeDock>
          <button
            onClick={handleAiComposeScore}
            disabled={isComposingAiScore || !sceneConcept.trim()}
            className="px-5 py-2 bg-[#FF2244] hover:bg-[#FF2244]/80 text-white font-mono text-xs font-bold transition-all disabled:opacity-50 shadow-[4px_4px_0px_#0A0A0F] whitespace-nowrap"
          >
            {isComposingAiScore ? 'COMPOSING...' : 'COMPOSE SCORE'}
          </button>
        </div>
      </div>

      {/* Track Library */}
      <div className="space-y-4">
        <h3 className="font-display text-2xl font-bold text-[#F0EBE1] uppercase tracking-wider">SOUNDTRACK PRESETS & SCORES</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {soundtracks.map((track) => {
            const isThisActive = activeTrackId === track.id;

            return (
              <div
                key={track.id}
                onClick={() => {
                  setActiveTrackId(track.id);
                  setBpm(track.bpm);
                  if (isPlaying) {
                    startSynthesizer(track);
                  }
                }}
                className={`p-5 border-2 cursor-pointer transition-all ${
                  isThisActive
                    ? 'bg-[#12121A] border-[#00E5FF] shadow-[6px_6px_0px_#0A0A0F]'
                    : 'bg-[#12121A] border-[#2E2E3A] hover:border-[#00E5FF] shadow-[4px_4px_0px_#0A0A0F]'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-mono text-[10px] uppercase px-2 py-0.5 bg-[#0A0A0F] text-[#00E5FF] border border-[#2E2E3A]">
                      {track.type}
                    </span>
                    <h4 className="font-display text-xl font-bold text-[#F0EBE1] uppercase mt-1">{track.title}</h4>
                  </div>
                  <span className="font-mono text-xs font-bold text-[#8E8A84]">{track.bpm} BPM</span>
                </div>

                <p className="font-sans text-xs text-[#F0EBE1]/80 mb-3">{track.description}</p>

                <div className="flex items-center justify-between font-mono text-[10px] text-[#8E8A84] border-t-2 border-[#2E2E3A] pt-2">
                  <span>KEY: {track.key}</span>
                  <span className="text-[#00E5FF] font-bold">{isThisActive && isPlaying ? '● PLAYING' : 'READY'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SoundtrackComposerView;
