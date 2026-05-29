import React, { useState, useEffect, useRef } from 'react';
import { PredictionRecord, AnalyticsData } from './types.js';
import AnalyticsPanel from './components/AnalyticsPanel.jsx';
import RecentPredictions from './components/RecentPredictions.jsx';
import BenchmarkSuite from './components/BenchmarkSuite.jsx';

export default function App() {
  // Navigation & Interactive Tabs
  const [activeTab, setActiveTab] = useState<'classify' | 'dashboard' | 'history'>('classify');

  // Login & Secure Session States
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [emailInput, setEmailInput] = useState('daria.josephine1@gmail.com');
  const [passwordInput, setPasswordInput] = useState('••••••••');
  const [loginMsg, setLoginMsg] = useState('');

  // File Upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [inferenceResult, setInferenceResult] = useState<{
    predicted_class: string;
    confidence: number;
    top_predictions: Array<{ class: string; confidence: number }>;
    explanation?: string;
    processing_time: string;
    heatmap_url?: string;
    overlay_url?: string;
  } | null>(null);

  // Stats / Historical Data States
  const [history, setHistory] = useState<PredictionRecord[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [savingPrediction, setSavingPrediction] = useState(false);

  // Webcam AI States
  const [webcamActive, setWebcamActive] = useState(false);
  const [webcamLoading, setWebcamLoading] = useState(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const [webcamPredictions, setWebcamPredictions] = useState<{
    predictedClass: string;
    confidence: number;
    explanation?: string;
  } | null>(null);
  const [webcamLogs, setWebcamLogs] = useState<string[]>([
    'System ready...',
    'Neural pathways initialized...',
    'Awaiting visual handshake...'
  ]);

  // Refs for media streaming
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hiddenInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<any>(null);

  // Run initialization
  useEffect(() => {
    reloadDatabaseResources();
  }, []);

  // Attach stream once the video element is mounted and webcamActive is true
  useEffect(() => {
    if (webcamActive && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(err => {
        console.error('Failed to auto-play webcam video element:', err);
        addLog('Error: Failed to play webcam stream.');
      });
    }
  }, [webcamActive]);

  // Fetch predictions and stats from backend
  const reloadDatabaseResources = async () => {
    setLoadingHistory(true);
    try {
      // Load History
      const resHistory = await fetch('/api/history');
      if (resHistory.ok) {
        const historyData = await resHistory.json();
        setHistory(historyData);
      }

      // Load Analytics
      const resAnalytics = await fetch('/api/analytics');
      if (resAnalytics.ok) {
        const analyticsData = await resAnalytics.json();
        setAnalytics(analyticsData);
      }
    } catch (error) {
      console.error('Failed to synchonize with history database servers:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Drag and Drop triggers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileSelected(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('File error: Standard convolutional neural vectors require a valid image input.');
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setInferenceResult(null); // Clear previous results
  };

  // Primary prediction analyzer
  const triggerImageAnalysis = async () => {
    if (!selectedFile) return;
    setAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const res = await fetch('/api/predict', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const payload = await res.json();
        setInferenceResult(payload);
        
        // Reload history/analytics because it gets saved automatically on POST
        await reloadDatabaseResources();
      } else {
        const err = await res.json();
        alert(`Classification error: ${err.error || 'Server pipeline error.'}`);
      }
    } catch (e) {
      console.error(e);
      alert('Backend offline: VisionAI prediction routes are currently unreachable.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Webcam sensor initializer
  async function startWebcam() {
    setWebcamLoading(true);
    setWebcamError(null);
    setWebcamPredictions(null);
    addLog('Synchronizing streaming sensor configurations...');
    
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Webcam media streaming is not supported by this browser/origin.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      
      streamRef.current = stream;
      setWebcamActive(true);
      setWebcamLoading(false);
      addLog('Neural handshake complete. Sensor live feed active.');

      // Start capturing frames every 1.5 seconds for classification
      intervalRef.current = setInterval(captureFrame, 1500);

    } catch (err: any) {
      console.error('Failed to open camera stream:', err);
      setWebcamActive(false);
      setWebcamLoading(false);
      let errorMsg = 'Camera stream permission denied or device not found.';
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        errorMsg = 'Permission denied: Please enable camera access in your browser settings.';
      } else if (err?.message) {
        errorMsg = err.message;
      }
      setWebcamError(errorMsg);
      addLog(`Error: ${errorMsg}`);
    }
  }

  // Frame capture and transmission
  async function captureFrame() {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw the current frame to the hidden canvas
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert frame to Base64 (data:image/jpeg;base64,...)
    const base64Frame = canvas.toDataURL('image/jpeg', 0.85);

    try {
      const res = await fetch('/api/predict-frame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Frame }),
      });

      if (res.ok) {
        const data = await res.json();
        setWebcamPredictions({
          predictedClass: data.predicted_class,
          confidence: data.confidence,
          explanation: data.explanation
        });
        addLog(`Target detected: ${data.predicted_class} (${(data.confidence * 100).toFixed(1)}%) in ${data.processing_time}`);
      } else {
        const errorData = await res.json();
        addLog(`Inference log: API responded with status ${res.status} (${errorData.error || 'unknown issue'})`);
      }
    } catch (e) {
      console.error('Real-time webcam inference failed:', e);
      addLog('Error: Server lookup interface error.');
    }
  }

  // Release camera resource
  async function stopWebcam() {
    addLog('Deactivating streaming channels...');
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setWebcamActive(false);
    setWebcamPredictions(null);
    addLog('Sensor stream offline.');
  }

  // Logging updates
  const addLog = (text: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setWebcamLogs(prev => [`[${timestamp}] ${text}`, ...prev.slice(0, 15)]);
  };

  const clearUpload = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setInferenceResult(null);
  };

  // Secure login submitter
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.includes('@')) {
      setLoginMsg('Error: Enter a valid work email.');
      return;
    }
    setLoginMsg('');
    setAuthenticated(true);
    // Auto shift to dashboard to let user manage
    setActiveTab('dashboard');
  };

  // Clean-up refs on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#08090A] text-[#e3e2e3] font-sans overflow-x-hidden selection:bg-primary/30 select-text">
      {/* Navigation Dock */}
      <nav className="fixed top-0 w-full z-50 glass-nav">
        <div className="flex justify-between items-center px-6 md:px-12 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-3xl font-bold">blur_on</span>
            <span className="font-sans text-xl font-bold text-primary tracking-tighter select-none">VisionAI</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => setActiveTab('classify')}
              className={`text-sm font-medium transition-colors ${activeTab === 'classify' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              Classify
            </button>
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`text-sm font-medium transition-colors ${activeTab === 'history' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              History
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <button 
              onClick={() => {
                alert("Settings configured. Active neural modules: MobileNetV2, ResNet50, EfficientNet-V2. Real-time logging streaming online.");
              }}
              className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors cursor-pointer select-none"
            >
              settings
            </button>
            
            {authenticated ? (
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1 select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-ai-accent animate-pulse"></span>
                <span className="text-[10px] font-mono text-on-surface-variant max-w-[120px] truncate">{emailInput}</span>
              </div>
            ) : (
              <button 
                onClick={() => {
                  const el = document.getElementById('login-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-primary text-on-primary px-5 py-2 rounded-lg text-xs font-bold hover:scale-105 active:scale-95 transition-transform"
              >
                Get Started
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Container Workspace */}
      <main className="pt-24 px-6 md:px-12 max-w-7xl mx-auto space-y-24 hero-gradient">
        
        {/* Active Workspace View Router */}
        {activeTab === 'classify' && (
          <>
            {/* HERO INTRODUCTION */}
            <header className="min-h-[50vh] flex flex-col items-center justify-center text-center max-w-4xl mx-auto space-y-8 py-12" id="hero">
              <div className="inline-flex items-center px-3.5 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold uppercase tracking-widest leading-none select-none">
                <span className="mr-1.5 font-bold">V2.4 RELEASE</span>
                <span className="opacity-40">•</span>
                <span className="ml-1.5 text-[10px] text-primary/80 font-mono">Ready with EfficientNet-V2</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-extrabold text-[#e3e2e3] tracking-tighter leading-[1.1]">
                AI-powered Image <br/>
                <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_auto] bg-clip-text text-transparent animate-[pulse_6s_infinite]">Classification System</span>
              </h1>
              <p className="text-base md:text-lg text-on-surface-variant max-w-2xl font-sans">
                Experience surgical precision in computer vision. Deploy industry-leading neural network architectures with a single click and visualize activations in real-time.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button 
                  onClick={() => document.getElementById('classification-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="bg-primary text-on-primary px-8 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(173,198,255,0.3)] transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">upload_file</span>
                  Upload Image
                </button>
                <button 
                  onClick={() => document.getElementById('webcam-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="glass-panel text-on-surface px-8 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-all border border-white/10 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">videocam</span>
                  Start Webcam AI
                </button>
              </div>
            </header>

            {/* SECTOR 1: CLASSIFICATION HUB */}
            <section className="py-12 border-t border-white/5 scroll-mt-24" id="classification-section">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                
                {/* File Uploader & Controls */}
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-on-surface tracking-tight">Analyze New Entity</h2>
                    <p className="text-sm text-on-surface-variant font-sans mt-1">Drag and drop high-resolution imagery for instant convolutional prediction and Grad-CAM activations.</p>
                  </div>

                  {/* Drag-and-drop box */}
                  <div 
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => hiddenInputRef.current?.click()}
                    className={`border-2 border-dashed border-white/10 bg-white/[0.01] rounded-3xl h-80 flex flex-col items-center justify-center space-y-4 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group select-none relative overflow-hidden`}
                  >
                    <input 
                      type="file" 
                      ref={hiddenInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />

                    {previewUrl ? (
                      <div className="absolute inset-0 w-full h-full">
                        <img 
                          referrerPolicy="no-referrer"
                          src={previewUrl} 
                          className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-[1.01]" 
                          alt="Inference Backdrop" 
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="material-symbols-outlined text-white text-3xl">add_photo_alternate</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <span className="material-symbols-outlined text-primary text-3xl font-light">cloud_upload</span>
                        </div>
                        <div className="text-center font-sans">
                          <p className="text-on-surface font-semibold text-sm">Drop your image here</p>
                          <p className="text-on-surface-variant/70 text-xs mt-1">PNG, JPEG or WEBP up to 20MB</p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Actions Bar */}
                  {selectedFile && (
                    <div className="flex items-center justify-between p-4 glass-panel rounded-xl border border-white/5">
                      <div className="flex items-center gap-3 truncate max-w-[60%]">
                        <span className="material-symbols-outlined text-on-surface-variant">image</span>
                        <div className="truncate text-left">
                          <p className="text-on-surface text-xs font-semibold truncate leading-none">{selectedFile.name}</p>
                          <p className="text-[10px] font-mono text-on-surface-variant/70 mt-1 uppercase">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={clearUpload}
                          className="px-3.5 py-2 border border-white/15 hover:bg-white/5 text-on-surface-variant rounded-lg text-xs font-medium cursor-pointer"
                        >
                          Clear
                        </button>
                        <button 
                          onClick={triggerImageAnalysis}
                          disabled={analyzing}
                          className="bg-primary text-on-primary px-5 py-2 rounded-lg text-xs font-bold hover:brightness-110 transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {analyzing ? (
                            <>
                              <span className="material-symbols-outlined text-[14px] animate-spin">autorenew</span>
                              Processing...
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-[14px]">psychology</span>
                              Analyze Image
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* RESULTS PREVIEW CARD */}
                <div 
                  className={`glass-panel p-8 rounded-3xl border border-white/5 bg-white/[0.02] flex flex-col justify-between h-full min-h-[450px] transition-all duration-300 ${
                    inferenceResult ? 'opacity-100 scale-100' : 'opacity-40 scale-[0.99] select-none'
                  }`}
                  id="result-panel"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="font-sans text-xl font-bold text-on-surface">Inference Result</h3>
                      <p className="text-[10px] font-mono text-on-surface-variant mt-0.5 uppercase">AI DECISSION VECTORS</p>
                    </div>
                    {inferenceResult ? (
                      <span className="px-3 py-1 rounded-full bg-ai-accent/10 border border-ai-accent/30 text-ai-accent text-[9px] font-mono font-bold select-none tracking-widest uppercase animate-pulse">
                        READY ({inferenceResult.processing_time})
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-on-surface-variant text-[9px] font-mono font-bold select-none tracking-widest uppercase">
                        STANDBY
                      </span>
                    )}
                  </div>

                  <div className="space-y-6">
                    {/* Classifier result class */}
                    <div className="flex justify-between items-end border-b border-white/5 pb-4">
                      <div>
                        <p className="font-mono text-[10px] text-on-surface-variant/60 tracking-wider">PREDICTED CLASS</p>
                        <p className="font-sans text-2xl font-bold text-on-surface mt-1">
                          {inferenceResult ? inferenceResult.predicted_class : '---'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-[10px] text-on-surface-variant/60 tracking-wider">CONFIDENCE</p>
                        <p className="font-sans text-2xl font-semibold text-primary mt-1">
                          {inferenceResult ? (inferenceResult.confidence * 100).toFixed(2) + '%' : '0.00%'}
                        </p>
                      </div>
                    </div>

                    {/* Classifier top-predictions list */}
                    {inferenceResult && (
                      <div className="space-y-2.5">
                        <p className="font-mono text-[10px] text-on-surface-variant/60 tracking-wider uppercase">Top Predictions Model Scores</p>
                        <div className="space-y-2">
                          {inferenceResult.top_predictions?.map((pred, i) => (
                            <div key={i} className="flex items-center justify-between text-xs font-sans">
                              <span className="text-on-surface font-medium truncate max-w-[150px]">{pred.class}</span>
                              <div className="flex items-center gap-3 flex-1 justify-end ml-4">
                                <div className="w-24 bg-white/5 rounded-full h-1 overflow-hidden">
                                  <div className="bg-primary h-full rounded-full" style={{ width: `${pred.confidence * 100}%` }}></div>
                                </div>
                                <span className="font-mono text-on-surface-variant text-[10.5px] w-10 text-right">{(pred.confidence * 100).toFixed(1)}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Explaining reasoning summary */}
                    <div className="space-y-2 text-left">
                      <p className="font-mono text-[10px] text-on-surface-variant/60 tracking-wider uppercase">Explainable AI Activation Reasoning</p>
                      <p className="text-xs font-sans text-on-surface-variant leading-relaxed">
                        {inferenceResult?.explanation || 'Awaiting target file upload... VisionAI will automatically identify visual parameters and explain predictions.'}
                      </p>
                    </div>

                    {/* GradCAM visual layout */}
                    <div className="space-y-2 bg-black/25 p-4 rounded-2xl border border-white/5">
                      <p className="font-mono text-[10px] text-on-surface-variant/60 tracking-wider uppercase">Grad-CAM Convolutional Layer Activation Map</p>
                      <div className="w-full h-44 bg-surface-container/40 rounded-xl flex items-center justify-center text-on-surface-variant/30 relative overflow-hidden">
                        {inferenceResult?.overlay_url ? (
                          <img 
                            referrerPolicy="no-referrer"
                            src={inferenceResult.overlay_url} 
                            className="w-full h-full object-contain" 
                            alt="Grad-CAM activations" 
                          />
                        ) : (
                          <div className="text-center font-mono text-xs p-4 flex flex-col items-center justify-center">
                            <span className="material-symbols-outlined text-3xl mb-1 opacity-20">heat_pump</span>
                            Awaiting inference variables...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </section>

            {/* SECTOR 2: WEBCAM CLASS LIVE STREAM */}
            <section className="py-12 border-t border-white/5 scroll-mt-24" id="webcam-section">
              <div className="flex flex-col lg:flex-row gap-12 items-stretch">
                
                {/* Live video frame */}
                <div className="w-full lg:w-2/3 flex flex-col relative">
                  <div className="relative rounded-[2rem] overflow-hidden border border-white/5 aspect-video flex items-center justify-center bg-[#0d0e0f] shadow-lg">
                    
                    {/* Webcam preview video or placeholder */}
                    {!webcamActive ? (
                      <div className="absolute inset-0 flex items-center justify-center flex-col space-y-5 p-6 text-center" id="webcam-placeholder">
                        {webcamLoading ? (
                          <div className="flex flex-col items-center space-y-4">
                            {/* Stylish rotating spinner */}
                            <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
                            <div className="space-y-1">
                              <p className="text-on-surface font-semibold text-sm">Initializing Optical Sensors...</p>
                              <p className="text-on-surface-variant/70 text-[11px] font-mono">Awaiting hardware negotiation...</p>
                            </div>
                          </div>
                        ) : webcamError ? (
                          <div className="flex flex-col items-center space-y-3 max-w-md">
                            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                              <span className="material-symbols-outlined text-red-400 text-2xl font-light">warning</span>
                            </div>
                            <div className="space-y-1">
                              <p className="text-red-400 font-semibold text-sm">Sensor Handshake Denied</p>
                              <p className="text-on-surface-variant text-xs leading-normal font-sans px-4">
                                {webcamError}
                              </p>
                            </div>
                            <button 
                              onClick={startWebcam}
                              className="mt-2 px-5 py-2 rounded-full bg-primary text-on-primary hover:scale-[1.03] active:scale-95 transition-all font-bold text-xs cursor-pointer flex items-center gap-2"
                            >
                              <span className="material-symbols-outlined text-sm">videocam</span>
                              Retry Connection
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-6xl text-on-surface-variant opacity-20">videocam_off</span>
                            <div className="space-y-1">
                              <p className="text-on-surface font-semibold text-sm">Camera stream sensor offline...</p>
                              <p className="text-on-surface-variant/70 text-xs font-sans">Grant permissions to perform real-time video inference scanning.</p>
                            </div>
                            <button 
                              onClick={startWebcam}
                              className="px-6 py-2.5 rounded-full bg-primary text-on-primary hover:shadow-[0_0_15px_rgba(173,198,255,0.4)] hover:scale-[1.03] active:scale-95 transition-all font-bold text-xs cursor-pointer flex items-center gap-2"
                            >
                              <span className="material-symbols-outlined text-sm">videocam</span>
                              Start Camera
                            </button>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="relative w-full h-full">
                        <video 
                          ref={videoRef}
                          className="w-full h-full object-cover" 
                          playsInline 
                          muted
                        />
                        
                        {/* Animated Scanning Overlay */}
                        <div className="scan-line" />
                        
                        <div className="absolute top-4 right-4 bg-red-500/10 border border-red-500/30 text-red-500 rounded-full px-3 py-1 flex items-center gap-1.5 select-none text-xs font-bold tracking-widest uppercase">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                          LIVE STREAM (1.5s FPS)
                        </div>

                        <button 
                          onClick={stopWebcam}
                          className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-md hover:bg-black/90 border border-white/10 hover:border-white/20 text-white rounded-full px-4 py-2 flex items-center gap-1.5 text-xs font-bold cursor-pointer transition-all"
                        >
                          <span className="material-symbols-outlined text-base">videocam_off</span>
                          Stop Camera
                        </button>

                        {/* Thermal activation overlay mockup overlayed on screen in stream */}
                        {webcamPredictions && (
                          <div className="absolute bottom-4 right-4 max-w-sm glass-panel p-4 rounded-xl border border-white/15 bg-black/60 backdrop-blur-xl">
                            <span className="text-[9px] font-mono text-ai-accent tracking-widest uppercase font-bold block mb-1">REAL-TIME INFERENCE</span>
                            <div className="flex justify-between items-baseline">
                              <span className="text-sm font-bold text-on-surface truncate">{webcamPredictions.predictedClass}</span>
                              <span className="text-xs font-semibold text-primary ml-4">{(webcamConfidence() * 100).toFixed(1)}%</span>
                            </div>
                            <span className="text-[10px] text-on-surface-variant/80 block mt-1 leading-normal">{webcamPredictions.explanation}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Hidden Canvas used for base64 conversions of frames */}
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                </div>

                {/* Webcam Controls & Telemetry log terminal */}
                <div className="w-full lg:w-1/3 flex flex-col justify-between py-2 space-y-8">
                  <div className="space-y-4 text-left">
                    <div>
                      <h2 className="text-2xl font-bold text-on-surface tracking-tight">Live Perception</h2>
                      <p className="text-sm text-on-surface-variant font-sans mt-0.5">Real-time object classification optimized for streaming edge layers.</p>
                    </div>

                    <div className="space-y-3 font-sans text-xs">
                      <div className="p-3.5 rounded-xl glass-panel flex justify-between items-center border border-white/5 bg-white/[0.01]">
                        <span className="text-on-surface-variant">Stream Standard</span>
                        <span className="font-bold text-on-surface">JPEG @ 480p </span>
                      </div>
                      <div className="p-3.5 rounded-xl glass-panel flex justify-between items-center border border-white/5 bg-white/[0.01]">
                        <span className="text-on-surface-variant">Active Model</span>
                        <span className="font-bold text-on-surface select-none underline decoration-primary decoration-2 decoration-wavy">EfficientNet-V2</span>
                      </div>
                      <div className="p-3.5 rounded-xl glass-panel flex justify-between items-center border border-white/5 bg-white/[0.01]">
                        <span className="text-on-surface-variant">Data Sovereignty</span>
                        <span className="font-bold text-ai-accent select-none tracking-widest uppercase">Secured Local Proxy</span>
                      </div>
                    </div>
                  </div>

                  {/* Telemetry Logger */}
                  <div className="pt-4 border-t border-white/5 text-left">
                    <p className="font-mono text-[9px] text-on-surface-variant tracking-widest uppercase font-bold mb-2">TELEMETRY LOGGER</p>
                    <div className="font-mono text-[11px] text-on-surface-variant/80 space-y-1.5 h-36 overflow-y-auto no-scrollbar bg-black/30 p-4 border border-white/5 rounded-2xl">
                      {webcamLogs.map((log, i) => (
                        <p key={i} className="truncate select-text">
                          {log.startsWith('[Error') || log.includes('denied') ? (
                            <span className="text-red-400 font-semibold">{log}</span>
                          ) : log.includes('Target detected') ? (
                            <span className="text-primary">{log}</span>
                          ) : (
                            <span>{log}</span>
                          )}
                        </p>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </section>

            {/* BENCHMARK TESTING TABLE */}
            <BenchmarkSuite />

            {/* SECURE DASHBOARD REGISTRATION CARD (Interactive layout matching user image) */}
            <section className="py-12 border-t border-white/5 scroll-mt-24" id="login-section">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="glass-panel w-full max-w-md p-10 rounded-3xl relative overflow-hidden group border border-white/10 bg-white/[0.02]">
                  <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/10 blur-3xl group-hover:bg-primary/20 transition-all duration-500"></div>
                  
                  <form onSubmit={handleLogin} className="relative z-10 space-y-6 text-left">
                    <div className="text-center">
                      <span className="material-symbols-outlined text-primary text-4xl mb-2">admin_panel_settings</span>
                      <h2 className="font-sans text-xl font-bold text-on-surface">Secure Access</h2>
                      <p className="text-xs font-sans text-on-surface-variant">Enter company credentials to unlock VisionAI analytical dashboards.</p>
                    </div>

                    <div className="space-y-4 font-sans text-xs text-left">
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono uppercase text-on-surface-variant tracking-wider ml-1">Work Email</label>
                        <input 
                          type="email"
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          className="w-full bg-[#0d0e0f] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-on-surface font-sans"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono uppercase text-on-surface-variant tracking-wider ml-1">Password</label>
                        <input 
                          type="password"
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                          className="w-full bg-[#0d0e0f] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-on-surface font-sans"
                        />
                      </div>
                    </div>

                    {loginMsg && (
                      <p className="text-red-400 font-mono text-[10.5px] font-medium text-center">{loginMsg}</p>
                    )}

                    <button 
                      type="submit" 
                      className="w-full bg-primary hover:brightness-110 text-on-primary py-3.5 rounded-xl text-xs font-bold transition-all shadow-md text-center cursor-pointer"
                    >
                      Sign In to Dashboard
                    </button>

                    <div className="flex items-center justify-between text-on-surface-variant font-sans text-[11px] pt-1">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          defaultChecked 
                          className="rounded bg-white/5 border-white/10 text-primary focus:ring-0 cursor-pointer" 
                        /> 
                        Remember me
                      </label>
                      <a href="#" className="hover:text-primary transition-colors">Forgot password?</a>
                    </div>
                  </form>
                </div>
              </div>
            </section>

          </>
        )}

        {activeTab === 'dashboard' && (
          <section className="py-12 space-y-12">
            <div>
              <h2 className="text-3xl font-bold text-on-surface tracking-tight">Analytical Overview</h2>
              <p className="text-sm text-on-surface-variant mt-1">Operational statistics, live prediction ratios, and historical telemetry metrics saved inside the persistent database.</p>
            </div>

            {/* stats card panel component */}
            <AnalyticsPanel analytics={analytics} loading={loadingHistory} />

            {/* statistics visual charts using vector shapes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6">
              
              {/* Common classes list */}
              <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/5 bg-white/[0.02]">
                <h4 className="text-lg font-bold text-on-surface mb-6 flex justify-between items-center">
                  <span>Most Classified Classes</span>
                  <span className="material-symbols-outlined text-primary text-lg">donut_large</span>
                </h4>
                <div className="space-y-4 font-sans text-sm">
                  {loadingHistory ? (
                    <div className="text-center py-10 font-mono text-xs text-on-surface-variant">Analyzing metrics...</div>
                  ) : analytics?.most_common_classes?.length ? (
                    analytics.most_common_classes.map((cls, idx) => {
                      const maxCount = analytics.most_common_classes[0].count;
                      const percentage = maxCount > 0 ? (cls.count / maxCount) * 100 : 0;
                      return (
                        <div key={idx} className="space-y-1.5 text-xs text-left">
                          <div className="flex justify-between items-center text-on-surface-variant font-medium">
                            <span>{cls.class}</span>
                            <span className="font-mono text-[10.5px] font-semibold bg-white/5 px-2 py-0.5 rounded">{cls.count} classifications</span>
                          </div>
                          <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-gradient-to-r from-primary to-secondary h-full rounded-full" style={{ width: `${percentage}%` }}></div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-10 font-mono text-xs text-on-surface-variant">No aggregated analytical predictions in history yet.</div>
                  )}
                </div>
              </div>

              {/* Class confidence groups metrics */}
              <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/5 bg-white/[0.02]">
                <h4 className="text-lg font-bold text-on-surface mb-6 flex justify-between items-center">
                  <span>Usage telemetry logs</span>
                  <span className="material-symbols-outlined text-primary text-lg">trending_up</span>
                </h4>
                <div className="space-y-4 font-sans text-sm text-left">
                  {loadingHistory ? (
                    <div className="text-center py-10 font-mono text-xs text-on-surface-variant">Syncing metrics data...</div>
                  ) : analytics?.daily_usage_stats?.length ? (
                    <div className="space-y-4 text-xs font-sans">
                      {analytics.daily_usage_stats.map((stat, idx) => (
                        <div key={idx} className="flex justify-between items-center py-2 border-b border-white/5">
                          <span className="font-mono text-on-surface-variant">{stat.date}</span>
                          <span className="font-semibold text-primary">{stat.count} requests</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 font-mono text-xs text-on-surface-variant">No tracking data available for daily analysis.</div>
                  )}
                </div>
              </div>

            </div>

            {/* history sub-layout loaded in dashboard as well */}
            <RecentPredictions history={history} loading={loadingHistory} />
          </section>
        )}

        {activeTab === 'history' && (
          <section className="py-12 space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-on-surface tracking-tight">Database Logs</h2>
              <p className="text-sm text-on-surface-variant mt-1">Audit trail for all classifications, showing prediction timestamps, confidences, and bounding maps cached inside the system storage.</p>
            </div>
            
            <RecentPredictions history={history} loading={loadingHistory} />
          </section>
        )}

      </main>

      {/* Premium Footer */}
      <footer className="w-full py-12 border-t border-white/5 bg-[#08090A] mt-24">
        <div className="flex flex-col md:flex-row justify-between items-center px-12 max-w-7xl mx-auto space-y-6 md:space-y-0 text-center font-sans">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-2xl font-bold">blur_on</span>
            <span className="font-sans text-lg font-bold text-primary tracking-tighter">VisionAI</span>
          </div>
          <p className="text-on-surface-variant/70 text-xs font-mono uppercase tracking-wider select-none">© 2026 VisionAI Systems. Built with precision and clinical accuracy.</p>
          <div className="flex space-x-6 text-[11px] font-mono tracking-wider text-on-surface-variant/70 select-none uppercase">
            <a onClick={() => alert("Privacy metrics compliant with healthcare AI frameworks.")} className="hover:text-primary transition-colors cursor-pointer">Privacy</a>
            <a onClick={() => alert("Enterprise sandbox terms active.")} className="hover:text-primary transition-colors cursor-pointer">Terms</a>
            <a onClick={() => alert("VisionAI API Standard v2.4 Swagger docs configured on backend /api/* routes.")} className="hover:text-primary transition-colors cursor-pointer">API Docs</a>
          </div>
        </div>
      </footer>
    </div>
  );

  // Helper inside webcam component
  function webcamConfidence(): number {
    return webcamPredictions ? webcamPredictions.confidence : 0.99;
  }
}
