import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { ARENA_IMAGE_MODELS, ARENA_FAST_IMAGE_MODEL_ID, DEFAULT_ARENA_IMAGE_MODEL_ID } from '../services/arena/arenaConfig';
import { arenaEngine } from '../services/arena/arenaEngine';
import { FrameGeneratorIcon } from './icons/FrameGeneratorIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { SaveIcon } from './icons/SaveIcon';
import { LoadIcon } from './icons/LoadIcon';
import { CheckIcon } from './icons/CheckIcon';
import { RotateIcon } from './icons/RotateIcon';
import { ResetIcon } from './icons/ResetIcon';
import { CropIcon } from './icons/CropIcon';
import { TuneIcon } from './icons/TuneIcon';
import { VariationsIcon } from './icons/VariationsIcon';
import { UpscaleIcon } from './icons/UpscaleIcon';
import { UndoIcon } from './icons/UndoIcon';
import { RedoIcon } from './icons/RedoIcon';
import { StyleAlchemistIcon } from './icons/StyleAlchemistIcon';
import { AlertIcon } from './icons/AlertIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { TemplateIcon } from './icons/TemplateIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { CopyIcon } from './icons/CopyIcon';

// Add SpeechRecognition types for window object
declare global {
  interface Window {
    SpeechRecognition: { new (): SpeechRecognition };
    webkitSpeechRecognition: { new (): SpeechRecognition };
  }
}

interface SpeechRecognitionResultItem {
  transcript: string;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionResultItem;
  isFinal: boolean;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

interface SpeechRecognition {
  continuous: boolean;
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
type SaveStatus = 'idle' | 'saving' | 'saved';
type CopyStatus = 'idle' | 'copied';
type CropAspect = '1:1' | '16:9' | '9:16';
type EditState = { imageUrl: string; rotation: number; filter: string; };

const STORAGE_KEY = 'artStudio-lastCreation';

interface ImageGeneratorCardProps {
  onImageGenerated: (imageUrl: string) => void;
  onCreationSaved: (prompt: string) => void;
  promptInputRef: React.RefObject<HTMLTextAreaElement>;
}

export type ImageGeneratorCardRef = {
  reset: () => void;
};

const ImageGeneratorCard = forwardRef<ImageGeneratorCardRef, ImageGeneratorCardProps>((props, ref) => {
  const [prompt, setPrompt] = useState<string>('');
  const [negativePrompt, setNegativePrompt] = useState<string>('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isSpeechRecognitionSupported, setIsSpeechRecognitionSupported] = useState<boolean>(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle');
  const [hasSavedCreation, setHasSavedCreation] = useState<boolean>(false);
  const [activePrompt, setActivePrompt] = useState<string | null>(null);
  const [activeAspectRatio, setActiveAspectRatio] = useState<AspectRatio | null>(null);
  const [rotation, setRotation] = useState<number>(0);
  const [filter, setFilter] = useState<string>('none');
  const [isCropDropdownOpen, setIsCropDropdownOpen] = useState<boolean>(false);
  const cropDropdownRef = useRef<HTMLDivElement>(null);
  const [isTemplateDropdownOpen, setIsTemplateDropdownOpen] = useState(false);
  const templateDropdownRef = useRef<HTMLDivElement>(null);
  const [showFineTune, setShowFineTune] = useState<boolean>(false);
  const [isUpscaling, setIsUpscaling] = useState<boolean>(false);
  const [upscaledImage, setUpscaledImage] = useState<string | null>(null);
  const [showUpscaled, setShowUpscaled] = useState<boolean>(false);
  const [editHistory, setEditHistory] = useState<EditState[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedGenerationModel, setSelectedGenerationModel] = useState<string>(DEFAULT_ARENA_IMAGE_MODEL_ID);
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [engineMode, setEngineMode] = useState<'live' | 'simulation' | null>(null);

  const selectedModelCapabilities = ARENA_IMAGE_MODELS.find(m => m.id === selectedGenerationModel)?.capabilities ?? ARENA_IMAGE_MODELS[0].capabilities;
  const arenaStatus = arenaEngine.status();
  const isAiBusy = isLoading || isUpscaling || isEditing || isEnhancing;

  useImperativeHandle(ref, () => ({
    reset() {
      setPrompt('');
      setNegativePrompt('');
      setGeneratedImage(null);
      setOriginalImage(null);
      setError(null);
      setIsLoading(false);
      setAspectRatio('1:1');
      setSaveStatus('idle');
      setActivePrompt(null);
      setActiveAspectRatio(null);
      setRotation(0);
      setFilter('none');
      setShowFineTune(false);
      setUpscaledImage(null);
      setShowUpscaled(false);
      setEditHistory([]);
      setHistoryIndex(-1);
      setActivePreset(null);
      setEngineMode(null);
      props.promptInputRef.current?.focus();
    }
  }));
  
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        setHasSavedCreation(true);
      }
    } catch (e) {
      console.error("Could not access local storage:", e);
    }
  }, []);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSpeechRecognitionSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        const speechResult = event.results[0][0].transcript;
        setPrompt(prevPrompt => prevPrompt ? `${prevPrompt.trim()} ${speechResult}`.trim() : speechResult);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setError(`Speech recognition error: ${event.error}`);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };
      
      recognitionRef.current = recognition;
    } else {
      console.warn('Speech Recognition not supported in this browser.');
      setIsSpeechRecognitionSupported(false);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cropDropdownRef.current && !cropDropdownRef.current.contains(event.target as Node)) {
        setIsCropDropdownOpen(false);
      }
      if (templateDropdownRef.current && !templateDropdownRef.current.contains(event.target as Node)) {
        setIsTemplateDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const presets = [
    { name: 'Cinematic Anime', model: DEFAULT_ARENA_IMAGE_MODEL_ID, keywords: 'masterpiece, cel-shaded, vibrant colors, detailed background, cinematic lighting', negative: 'low quality, blurry, text, watermark', aspect: '16:9' as AspectRatio },
    { name: 'Photorealistic', model: DEFAULT_ARENA_IMAGE_MODEL_ID, keywords: 'photorealistic, 8K, sharp focus, high detail, professional photograph', negative: 'drawing, painting, illustration, cartoon', aspect: '4:3' as AspectRatio },
    { name: 'Cyberpunk Concept', model: DEFAULT_ARENA_IMAGE_MODEL_ID, keywords: 'cyberpunk concept art, neon lighting, futuristic, dystopian, gritty', negative: 'clean, bright, utopian', aspect: '16:9' as AspectRatio },
    { name: 'Vintage Comic', model: DEFAULT_ARENA_IMAGE_MODEL_ID, keywords: 'vintage comic book art, halftone dots, bold lines, limited color palette', negative: 'photorealistic, 3D render', aspect: '3:4' as AspectRatio },
  ];

  useEffect(() => {
    if (!activePreset) return;
    const preset = presets.find(p => p.name === activePreset);
    if (!preset) return;

    const keywordsPresent = prompt.includes(preset.keywords);
    const negativeMatches = negativePrompt === preset.negative;
    const aspectMatches = aspectRatio === preset.aspect;
    const modelMatches = selectedGenerationModel === preset.model;

    if (!keywordsPresent || !negativeMatches || !aspectMatches || !modelMatches) {
        setActivePreset(null);
    }
  }, [prompt, negativePrompt, aspectRatio, selectedGenerationModel, activePreset]);
  
  useEffect(() => {
    // When switching to a model that doesn't support certain features, disable them.
    if (!selectedModelCapabilities.negativePrompt) {
      setShowFineTune(false);
      setNegativePrompt('');
    }
  }, [selectedGenerationModel, selectedModelCapabilities]);
  
  const applyEdit = (edit: Partial<Omit<EditState, 'imageUrl'>> & { imageUrl?: string }) => {
    const current = editHistory[historyIndex];
    if (!current) return;

    const newImageUrl = edit.imageUrl ?? current.imageUrl;
    const newRotation = edit.rotation ?? current.rotation;
    const newFilter = edit.filter ?? current.filter;
    
    const newState: EditState = {
      imageUrl: newImageUrl,
      rotation: newRotation,
      filter: newFilter
    };

    setGeneratedImage(newState.imageUrl);
    setRotation(newState.rotation);
    setFilter(newState.filter);

    const newHistory = [...editHistory.slice(0, historyIndex + 1), newState];
    setEditHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleToggleRecording = () => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (isRecording) {
      recognition.stop();
    } else {
      setError(null);
      recognition.start();
      setIsRecording(true);
    }
  };

  const handleGenerateImage = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);
    setOriginalImage(null);
    setActivePrompt(null);
    setActiveAspectRatio(null);
    setRotation(0);
    setFilter('none');
    setSaveStatus('idle');
    setCopyStatus('idle');
    setUpscaledImage(null);
    setShowUpscaled(false);
    setIsEditing(false);
    setEditHistory([]);
    setHistoryIndex(-1);

    try {
      const result = await arenaEngine.generateImage({
        model: selectedGenerationModel,
        prompt: prompt.trim(),
        negativePrompt: selectedModelCapabilities.negativePrompt && negativePrompt.trim() ? negativePrompt.trim() : undefined,
        aspectRatio: selectedModelCapabilities.aspectRatio ? aspectRatio : undefined,
      });
      setEngineMode(result.mode);
      setGeneratedImage(result.image);
      setOriginalImage(result.image);
      setActivePrompt(prompt);
      setActiveAspectRatio(aspectRatio);
      props.onImageGenerated(result.image);

      const initialEditState: EditState = { imageUrl: result.image, rotation: 0, filter: 'none' };
      setEditHistory([initialEditState]);
      setHistoryIndex(0);
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Failed to generate image. ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRefineImage = async () => {
    if (!activePrompt) {
      setError('No active prompt to refine.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);
    setOriginalImage(null);
    setRotation(0);
    setFilter('none');
    setSaveStatus('idle');
    setUpscaledImage(null);
    setShowUpscaled(false);
    setEditHistory([]);
    setHistoryIndex(-1);

    try {
      const result = await arenaEngine.generateImage({
        model: selectedGenerationModel,
        prompt: activePrompt,
        negativePrompt: selectedModelCapabilities.negativePrompt && negativePrompt.trim() ? negativePrompt.trim() : undefined,
        aspectRatio: activeAspectRatio || '1:1',
      });
      setEngineMode(result.mode);
      setGeneratedImage(result.image);
      setOriginalImage(result.image);
      props.onImageGenerated(result.image);
      const initialEditState: EditState = { imageUrl: result.image, rotation: 0, filter: 'none' };
      setEditHistory([initialEditState]);
      setHistoryIndex(0);
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Failed to refine image. ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateVariations = async () => {
    if (!activePrompt) {
      setError('No active prompt to generate variations from.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);
    setOriginalImage(null);
    setRotation(0);
    setFilter('none');
    setSaveStatus('idle');
    setUpscaledImage(null);
    setShowUpscaled(false);
    setEditHistory([]);
    setHistoryIndex(-1);

    try {
      const result = await arenaEngine.generateImage({
        model: selectedGenerationModel,
        prompt: activePrompt,
        negativePrompt: selectedModelCapabilities.negativePrompt && negativePrompt.trim() ? negativePrompt.trim() : undefined,
        aspectRatio: activeAspectRatio || '1:1',
        // A fresh seed per request steers the model away from the previous render.
        seed: Math.floor(Math.random() * 2_147_483_647),
      });
      setEngineMode(result.mode);
      setGeneratedImage(result.image);
      setOriginalImage(result.image);
      props.onImageGenerated(result.image);
      const initialEditState: EditState = { imageUrl: result.image, rotation: 0, filter: 'none' };
      setEditHistory([initialEditState]);
      setHistoryIndex(0);
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Failed to generate variations. ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUpscaleImage = async () => {
    if (!originalImage) {
      setError('No original image available to upscale.');
      return;
    }
    setIsUpscaling(true);
    setError(null);

    try {
      const result = await arenaEngine.upscaleImage({ image: originalImage, model: ARENA_FAST_IMAGE_MODEL_ID });
      setEngineMode(result.mode);
      setUpscaledImage(result.image);
      setShowUpscaled(true);
    } catch (e) {
      console.error('Upscaling failed:', e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Failed to upscale image. ${errorMessage}`);
    } finally {
      setIsUpscaling(false);
    }
  };
  
  const handleGenerativeEdit = async () => {
    if (!editPrompt.trim() || !generatedImage) {
      setError('Please enter an edit instruction.');
      return;
    }
    setIsEditing(true);
    setError(null);

    try {
      const result = await arenaEngine.editImage({
        model: ARENA_FAST_IMAGE_MODEL_ID,
        image: generatedImage,
        prompt: editPrompt.trim(),
      });
      setEngineMode(result.mode);
      applyEdit({ imageUrl: result.image });
      setEditPrompt('');
    } catch (e) {
      console.error('Generative edit failed:', e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Failed to apply edit. ${errorMessage}`);
    } finally {
      setIsEditing(false);
    }
  };

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt to enhance.');
      return;
    }
    setIsEnhancing(true);
    setError(null);
    try {
      const { prompt: enhancedPrompt, mode } = await arenaEngine.enhancePrompt({ prompt: prompt.trim() });
      setEngineMode(mode);
      setPrompt(enhancedPrompt);
    } catch (e) {
      console.error('Prompt enhancement failed:', e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Failed to enhance prompt. ${errorMessage}`);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleSaveCreation = () => {
    if (!generatedImage || !prompt) return;

    setSaveStatus('saving');
    try {
      const creationData = {
        prompt,
        negativePrompt,
        aspectRatio,
        rotation,
        filter,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(creationData));
      setHasSavedCreation(true);
      props.onCreationSaved(prompt);
      setTimeout(() => setSaveStatus('saved'), 200);
    } catch (e) {
      console.error("Failed to save to local storage:", e);
      setError("Could not save settings. Browser storage may be full.");
      setSaveStatus('idle');
    }
  };

  const handleLoadCreation = () => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        
        setPrompt(parsedData.prompt || '');
        setNegativePrompt(parsedData.negativePrompt || '');
        setAspectRatio(parsedData.aspectRatio || '1:1');
        setRotation(parsedData.rotation || 0);
        setFilter(parsedData.filter || 'none');
        
        setGeneratedImage(null);
        setOriginalImage(null);
        setUpscaledImage(null);
        setActivePrompt(null);
        setActiveAspectRatio(null);
        setShowFineTune(false);
        setEditHistory([]);
        setHistoryIndex(-1);
        setError(null);
        setSaveStatus('idle');
      }
    } catch (e) {
      console.error("Failed to load from local storage:", e);
      setError("Could not load the saved settings.");
    }
  };
  
  const handleDownloadImage = () => {
    const imageToDownload = (showUpscaled && upscaledImage) ? upscaledImage : generatedImage;
    if (!imageToDownload) return;
    const link = document.createElement('a');
    link.href = imageToDownload;
    const filename = activePrompt ? activePrompt.substring(0, 30).replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'generated_image';
    link.download = `${filename}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyImage = async () => {
    const imageToCopy = (showUpscaled && upscaledImage) ? upscaledImage : generatedImage;
    if (!imageToCopy || !navigator.clipboard) {
        setError("Clipboard API not available in this browser.");
        return;
    }

    try {
        const response = await fetch(imageToCopy);
        const blob = await response.blob();
        await navigator.clipboard.write([
            new ClipboardItem({ [blob.type]: blob })
        ]);
        setCopyStatus('copied');
        setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (err) {
        console.error('Failed to copy image: ', err);
        setError('Failed to copy image to clipboard.');
    }
  };

  const handleRotate = () => {
    const current = editHistory[historyIndex];
    if (!current) return;
    applyEdit({ ...current, rotation: (current.rotation + 90) % 360 });
  };

  const handleResetEdits = () => {
    const initialState = editHistory[0];
    if (initialState) {
        applyEdit({ ...initialState });
        setUpscaledImage(null);
        setShowUpscaled(false);
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const stateToRestore = editHistory[newIndex];
      setGeneratedImage(stateToRestore.imageUrl);
      setRotation(stateToRestore.rotation);
      setFilter(stateToRestore.filter);
      setHistoryIndex(newIndex);
    }
  };
  
  const handleRedo = () => {
    if (historyIndex < editHistory.length - 1) {
      const newIndex = historyIndex + 1;
      const stateToRestore = editHistory[newIndex];
      setGeneratedImage(stateToRestore.imageUrl);
      setRotation(stateToRestore.rotation);
      setFilter(stateToRestore.filter);
      setHistoryIndex(newIndex);
    }
  };
  
  const handleCrop = (cropAspect: CropAspect) => {
    const sourceImage = originalImage;
    if (!sourceImage) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = sourceImage;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;
      const sourceAspect = img.width / img.height;
      
      let targetAspect: number;
      if (cropAspect === '1:1') targetAspect = 1;
      else if (cropAspect === '16:9') targetAspect = 16 / 9;
      else targetAspect = 9 / 16;

      if (sourceAspect > targetAspect) {
        sWidth = img.height * targetAspect;
        sx = (img.width - sWidth) / 2;
      } else {
        sHeight = img.width / targetAspect;
        sy = (img.height - sHeight) / 2;
      }

      canvas.width = sWidth;
      canvas.height = sHeight;
      ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);
      
      const croppedImageUrl = canvas.toDataURL('image/png');
      applyEdit({ imageUrl: croppedImageUrl });
      setUpscaledImage(null);
      setShowUpscaled(false);
      setIsCropDropdownOpen(false);
    };

    img.onerror = () => {
      setError("Could not load image to apply crop.");
    };
  };

  const handleToggleKeyword = (keyword: string) => {
    const keywordRegex = new RegExp(`\\b${keyword}\\b`, 'i');
    setPrompt(prev => {
      if (keywordRegex.test(prev)) {
        const parts = prev.split(',').map(p => p.trim()).filter(Boolean);
        const newParts = parts.filter(part => !keywordRegex.test(part));
        return newParts.join(', ').replace(/,$/, '').trim();
      } else {
        const trimmed = prev.trim().replace(/,$/, '').trim();
        return trimmed ? `${trimmed}, ${keyword}` : keyword;
      }
    });
  };

  const handleSelectTemplate = (template: string) => {
    setPrompt(template);
    setIsTemplateDropdownOpen(false);
    props.promptInputRef.current?.focus();
  };

  const handleSelectPreset = (presetName: string) => {
    if (activePreset === presetName) {
        setActivePreset(null);
        return;
    }
    const preset = presets.find(p => p.name === presetName);
    if (preset) {
        setPrompt(prev => {
            const oldPreset = presets.find(p => p.name === activePreset);
            let cleanedPrompt = prev;
            if (oldPreset) {
                cleanedPrompt = cleanedPrompt.replace(new RegExp(`,? ${oldPreset.keywords.replace(/ /g, '\\s*')}`, 'gi'), '').trim().replace(/,$/, '').trim();
            }
            const currentParts = cleanedPrompt.split(',').map(p => p.trim()).filter(Boolean);
            const newKeywords = preset.keywords.split(',').map(p => p.trim()).filter(Boolean);
            const combined = [...currentParts, ...newKeywords];
            const unique = [...new Set(combined)];
            return unique.join(', ');
        });
        setNegativePrompt(preset.negative);
        setAspectRatio(preset.aspect);
        setSelectedGenerationModel(preset.model);
        setActivePreset(presetName);
        setShowFineTune(true);
    }
  };

  const filterPresets = [
    { name: 'None', value: 'none' },
    { name: 'B&W', value: 'grayscale(100%)' },
    { name: 'Sepia', value: 'sepia(100%)' },
    { name: 'Vintage', value: 'sepia(60%) contrast(110%) brightness(90%) saturation(1.2)' },
    { name: 'Cyber', value: 'hue-rotate(180deg) saturate(200%)' },
  ];
  const generationModels = ARENA_IMAGE_MODELS;
  const styleKeywords = ['Photorealistic', 'Cyberpunk', 'Anime Style', 'Oil Painting', 'Comic Book Art', 'Low Poly', 'Cinematic Lighting', '4K'];
  const promptTemplates = [
    { name: 'Detailed Scene', value: 'A [adjective] [subject] in a [setting], [action], [style].' },
    { name: 'Character Concept', value: 'Concept art for a [character type] character, wearing [clothing], with [details], comic book style.' },
    { name: 'Cinematic Shot', value: 'Cinematic shot of [subject], [lighting], [camera angle], detailed, 4K.' },
    { name: 'Architecture', value: 'Architectural concept of a [building type], [style], with [materials], [lighting].' },
  ];

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < editHistory.length - 1;

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Image Display Area */}
      <div className="aspect-square w-full flex-grow flex items-center justify-center bg-slate-900/50 rounded-lg overflow-hidden border border-slate-700 relative">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-900/80 z-10">
            <svg className="animate-spin h-8 w-8 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-4 text-lg font-semibold animate-pulse">Generating your vision...</p>
            <p className="text-sm text-slate-500">The AI is warming up its creative circuits.</p>
          </div>
        ) : generatedImage ? (
          <>
            <img
              key={generatedImage}
              src={showUpscaled && upscaledImage ? upscaledImage : generatedImage}
              alt={activePrompt || 'Generated image'}
              className="object-contain h-full w-full transition-all duration-300"
              style={{
                transform: `rotate(${rotation}deg)`,
                filter: filter,
              }}
            />
            {/* Quick Edit Toolbar */}
            <div className="absolute top-2 left-2 right-2 flex justify-between items-start z-10">
              <div className="flex items-center gap-2 p-1.5 bg-slate-900/50 backdrop-blur-md rounded-lg border border-slate-700">
                <button onClick={handleUndo} disabled={!canUndo || isAiBusy} className="p-1.5 text-slate-300 hover:text-cyan-400 disabled:text-slate-600 transition-colors rounded-md" title="Undo"><UndoIcon className="w-5 h-5" /></button>
                <button onClick={handleRedo} disabled={!canRedo || isAiBusy} className="p-1.5 text-slate-300 hover:text-cyan-400 disabled:text-slate-600 transition-colors rounded-md" title="Redo"><RedoIcon className="w-5 h-5" /></button>
                <div className="w-px h-5 bg-slate-700"></div>
                <button onClick={handleRotate} disabled={isAiBusy} className="p-1.5 text-slate-300 hover:text-cyan-400 disabled:text-slate-600 transition-colors rounded-md" title="Rotate"><RotateIcon className="w-5 h-5" /></button>
                <div className="relative" ref={cropDropdownRef}>
                  <button onClick={() => setIsCropDropdownOpen(prev => !prev)} disabled={isAiBusy} className="p-1.5 text-slate-300 hover:text-cyan-400 disabled:text-slate-600 transition-colors rounded-md" title="Crop"><CropIcon className="w-5 h-5" /></button>
                  {isCropDropdownOpen && (
                    <div className="absolute top-full mt-2 w-28 bg-slate-800 border border-slate-700 rounded-md shadow-lg z-20">
                      {(['1:1', '16:9', '9:16'] as CropAspect[]).map(aspect => (
                        <button key={aspect} onClick={() => handleCrop(aspect)} className="w-full text-left px-3 py-1.5 text-sm hover:bg-slate-700/50">{aspect}</button>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={handleResetEdits} disabled={isAiBusy} className="p-1.5 text-slate-300 hover:text-cyan-400 disabled:text-slate-600 transition-colors rounded-md" title="Reset Edits"><ResetIcon className="w-5 h-5" /></button>
              </div>
              <div className="flex flex-col items-end gap-2">
                {generatedImage && engineMode === 'simulation' && (
                  <span className="px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/40 rounded-md" title="Generated by the local Arena simulation engine. Set ARENA_API_KEY in .env to use live Arena models.">
                    Local Simulation
                  </span>
                )}
                {upscaledImage && (
                  <button
                    onClick={() => setShowUpscaled(prev => !prev)}
                    className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors border ${
                      showUpscaled
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                        : 'bg-slate-900/50 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {showUpscaled ? 'Show Original' : 'Show Upscaled'}
                  </button>
                )}
              </div>
            </div>
             {/* Generative Edit */}
            <div className="absolute bottom-2 left-2 right-2 z-10">
              <div className="relative">
                <input
                  type="text"
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  placeholder="Describe an edit, e.g., 'add a hat on the character'"
                  disabled={isAiBusy}
                  className="w-full bg-slate-900/60 backdrop-blur-md border border-slate-700 rounded-lg p-2.5 pr-20 text-sm focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                />
                <button
                  onClick={handleGenerativeEdit}
                  disabled={isAiBusy || !editPrompt}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 text-sm font-semibold bg-fuchsia-600/80 hover:bg-fuchsia-600 text-white rounded-md disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
                >
                  {isEditing ? 'Editing...' : 'Apply'}
                </button>
              </div>
            </div>
          </>
        ) : error ? (
          <div className="absolute inset-4 flex flex-col items-center justify-center text-center text-red-400 p-4 bg-red-900/20 rounded-lg">
            <AlertIcon className="w-10 h-10 mb-2" />
            <p className="font-semibold">Generation Failed</p>
            <p className="text-xs text-red-300/80 mt-1">{error}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-500">
            <FrameGeneratorIcon className="w-16 h-16" />
            <p className="mt-4 font-semibold">AI Image Generation</p>
            <p className="text-sm">Your creations will appear here.</p>
          </div>
        )}
      </div>

      {/* Post-Generation Toolkit */}
      {generatedImage && (
        <div className="space-y-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
          <h4 className="text-md font-semibold text-slate-200">Post-Generation Toolkit</h4>
          <div className="text-xs text-slate-400 bg-slate-800/50 p-2 rounded-md border border-slate-700">
              <span className="font-bold text-slate-300">Active Prompt: </span>
              {activePrompt}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <button onClick={handleDownloadImage} disabled={isAiBusy} className="flex items-center justify-center gap-2 p-2 bg-slate-700/50 hover:bg-slate-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><DownloadIcon className="w-4 h-4" /> Download</button>
            <button onClick={handleCopyImage} disabled={isAiBusy} className="flex items-center justify-center gap-2 p-2 bg-slate-700/50 hover:bg-slate-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {copyStatus === 'copied' ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
              {copyStatus === 'copied' ? 'Copied!' : 'Copy'}
            </button>
            <button onClick={handleRefineImage} disabled={isAiBusy || !selectedModelCapabilities.refinement} className="flex items-center justify-center gap-2 p-2 bg-slate-700/50 hover:bg-slate-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><RotateIcon className="w-4 h-4" />Refine</button>
            <button onClick={handleGenerateVariations} disabled={isAiBusy || !selectedModelCapabilities.refinement} className="flex items-center justify-center gap-2 p-2 bg-slate-700/50 hover:bg-slate-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><VariationsIcon className="w-4 h-4" />Variations</button>
            <button onClick={handleUpscaleImage} disabled={isAiBusy || upscaledImage !== null} className="flex items-center justify-center gap-2 p-2 bg-slate-700/50 hover:bg-slate-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {isUpscaling ? <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : <UpscaleIcon className="w-4 h-4" />}
              {upscaledImage ? 'Upscaled' : 'Upscale'}
            </button>
             <button onClick={handleSaveCreation} disabled={isAiBusy} className="flex items-center justify-center gap-2 p-2 bg-slate-700/50 hover:bg-slate-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {saveStatus === 'saving' ? <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : saveStatus === 'saved' ? <CheckIcon className="w-4 h-4" /> : <SaveIcon className="w-4 h-4" />}
              {saveStatus === 'saved' ? 'Saved' : 'Save Settings'}
            </button>
            {hasSavedCreation && (
              <button onClick={handleLoadCreation} disabled={isAiBusy} className="flex items-center justify-center col-span-2 md:col-span-1 gap-2 p-2 bg-slate-700/50 hover:bg-slate-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><LoadIcon className="w-4 h-4" />Load Settings</button>
            )}
          </div>
           {/* Filter presets */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 -mb-2">
            {filterPresets.map(preset => (
              <button
                key={preset.name}
                onClick={() => applyEdit({ filter: preset.value })}
                className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap transition-colors ${filter === preset.value ? 'bg-cyan-500 text-slate-900' : 'bg-slate-700/50 hover:bg-slate-700 text-slate-300'}`}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Pre-Generation Presets */}
      {!generatedImage && selectedModelCapabilities.negativePrompt && (
        <div>
          <p className="text-xs text-slate-400 mb-2 font-semibold">Style Presets</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {presets.map(preset => (
                  <button
                      key={preset.name}
                      onClick={() => handleSelectPreset(preset.name)}
                      disabled={isAiBusy}
                      className={`p-2 text-xs font-semibold rounded-md transition-colors text-center disabled:opacity-50 ${
                          activePreset === preset.name
                          ? 'bg-cyan-500 text-slate-900 ring-2 ring-cyan-300'
                          : 'bg-slate-700/50 hover:bg-slate-700 text-slate-300'
                      }`}
                  >
                      {preset.name}
                  </button>
              ))}
          </div>
        </div>
      )}

      {/* Prompt Input */}
      <div className="relative">
        <textarea
          ref={props.promptInputRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full bg-slate-800 border border-slate-600 rounded-md p-3 pr-32 text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors resize-none disabled:bg-slate-700/50"
          rows={3}
          placeholder="e.g., A cyberpunk city street at night..."
          disabled={isAiBusy}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              handleGenerateImage();
            }
          }}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
           <button onClick={() => setIsTemplateDropdownOpen(prev => !prev)} disabled={isAiBusy} className="p-1.5 text-slate-400 rounded-md hover:bg-slate-700 hover:text-cyan-400 disabled:text-slate-600 disabled:hover:bg-transparent transition-colors" aria-label="Prompt Templates" title="Prompt Templates">
            <TemplateIcon className="w-5 h-5" />
          </button>
           <button onClick={handleEnhancePrompt} disabled={isAiBusy || !prompt} className="p-1.5 text-slate-400 rounded-md hover:bg-slate-700 hover:text-cyan-400 disabled:text-slate-600 disabled:hover:bg-transparent transition-colors" aria-label="Enhance Prompt" title="Enhance Prompt">
            {isEnhancing ? (<svg className="animate-spin h-5 w-5 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>) : (<SparklesIcon className="w-5 h-5" />)}
          </button>
          {isSpeechRecognitionSupported && (
            <button onClick={handleToggleRecording} disabled={isAiBusy} className={`p-1.5 rounded-md transition-colors ${isRecording ? 'text-red-500 bg-red-900/50' : 'text-slate-400 hover:bg-slate-700 hover:text-cyan-400'} disabled:text-slate-600 disabled:hover:bg-transparent`} aria-label={isRecording ? 'Stop Recording' : 'Start Voice-to-Text'} title={isRecording ? 'Stop Recording' : 'Start Voice-to-Text'}>
              <MicrophoneIcon className="w-5 h-5" />
            </button>
          )}
        </div>
        {isTemplateDropdownOpen && (
          <div ref={templateDropdownRef} className="absolute top-full left-0 mt-2 w-full bg-slate-800 border border-slate-700 rounded-md shadow-lg z-20 p-2">
            {promptTemplates.map(template => (
              <button key={template.name} onClick={() => handleSelectTemplate(template.value)} className="w-full text-left p-2 text-sm hover:bg-slate-700/50 rounded-md">
                <p className="font-semibold">{template.name}</p>
                <p className="text-xs text-slate-400 truncate">{template.value}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Style keywords */}
      <div className="py-2">
        <div className="flex flex-wrap gap-2">
          {styleKeywords.map(keyword => (
            <button key={keyword} onClick={() => handleToggleKeyword(keyword)} disabled={isAiBusy} className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors disabled:opacity-50 ${ new RegExp(`\\b${keyword}\\b`, 'i').test(prompt) ? 'bg-cyan-500 text-slate-900' : 'bg-slate-700/50 hover:bg-slate-700 text-slate-300'}`}>
              {keyword}
            </button>
          ))}
        </div>
      </div>
      
      <div className="text-center">
          <button onClick={() => setShowFineTune(prev => !prev)} disabled={isAiBusy} className="text-sm text-cyan-400 hover:text-cyan-300 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors">
              {showFineTune ? 'Hide Fine-tune Settings' : 'Show Fine-tune Settings'}
          </button>
      </div>

      {/* Fine-tune options */}
      {showFineTune && (
        <div className="space-y-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
              <label htmlFor="negative-prompt" className={`block text-sm font-medium mb-1 ${selectedModelCapabilities.negativePrompt ? 'text-slate-300' : 'text-slate-500'}`}>Negative Prompt</label>
              <input id="negative-prompt" type="text" value={negativePrompt} onChange={(e) => setNegativePrompt(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-md p-2 text-sm text-slate-200 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 disabled:bg-slate-800/50 disabled:text-slate-500" placeholder="e.g., blurry, watermark, text" disabled={isAiBusy || !selectedModelCapabilities.negativePrompt}/>
            </div>
            <div>
              <label htmlFor="aspect-ratio" className={`block text-sm font-medium mb-1 ${selectedModelCapabilities.aspectRatio ? 'text-slate-300' : 'text-slate-500'}`}>Aspect Ratio</label>
              <select id="aspect-ratio" value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as AspectRatio)} disabled={isAiBusy || !selectedModelCapabilities.aspectRatio} className="w-full bg-slate-800 border border-slate-600 rounded-md p-2 text-sm text-slate-200 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 disabled:bg-slate-800/50 disabled:text-slate-500">
                <option value="1:1">1:1 (Square)</option>
                <option value="16:9">16:9 (Widescreen)</option>
                <option value="9:16">9:16 (Portrait)</option>
                <option value="4:3">4:3 (Landscape)</option>
                <option value="3:4">3:4 (Vertical)</option>
              </select>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-300 mb-2">Generation Model</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              {generationModels.map(model => (
                <button key={model.id} onClick={() => setSelectedGenerationModel(model.id)} disabled={isAiBusy} className={`p-3 rounded-md text-left transition-colors border-2 ${ selectedGenerationModel === model.id ? 'bg-cyan-900/50 border-cyan-500' : 'bg-slate-700/50 hover:bg-slate-700 border-transparent' } disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed`}>
                  <p className="font-semibold text-slate-100">{model.name}</p>
                  <p className="text-xs text-slate-400">{model.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Arena engine status */}
      <div className="text-center">
        <p className={`text-[10px] font-mono uppercase tracking-wider ${arenaStatus.mode === 'live' ? 'text-emerald-400/80' : 'text-amber-400/80'}`}>
          {arenaStatus.mode === 'live'
            ? `Arena engine online // ${arenaStatus.baseUrl}`
            : 'Arena engine in local simulation mode // set ARENA_API_KEY in .env for live models'}
        </p>
      </div>

      {/* Main Action Button */}
      <div className="pt-2">
        <button onClick={handleGenerateImage} disabled={isAiBusy || !prompt.trim()} className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:bg-slate-600 disabled:cursor-not-allowed shadow-lg shadow-cyan-900/50 hover:shadow-cyan-700/50">
          <FrameGeneratorIcon className="w-6 h-6" />
          <span>Generate</span>
        </button>
      </div>
    </div>
  );
});

export default ImageGeneratorCard;
