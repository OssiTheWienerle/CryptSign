import React, { useState, useRef, useEffect } from "react";
import { 
  Shield, 
  Image as ImageIcon, 
  Binary, 
  Download, 
  Upload, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Eye, 
  Copy, 
  ArrowRight,
  Sparkles,
  Check,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  getUniversalPixelMap, 
  embedTextInImage, 
  extractTextFromImage, 
  validateMessage,
  containsEmoji
} from "./cryptsign";


// CryptSign uses 100% user-uploaded carrier images now


export default function App() {
  // Navigation tabs (local within the single view)
  const [activeTab, setActiveTab] = useState<"embed" | "extract">("embed");

  // State for Embedding (Sender-Logik)
  const [text, setText] = useState<string>("");
  const [senderUploadedImage, setSenderUploadedImage] = useState<string | null>(null);
  const [embeddedImage, setEmbeddedImage] = useState<string | null>(null);
  const [embedError, setEmbedError] = useState<string | null>(null);
  const [embedSuccess, setEmbedSuccess] = useState<boolean>(false);

  // State for Extracting (Empfänger-Logik)
  const [extractorUploadedImage, setExtractorUploadedImage] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Coordinate map state to display status info
  const [pixelMap, setPixelMap] = useState<{ x: number; y: number }[]>([]);

  // Referenzen für Canvas-Vorschauen
  const embedPreviewRef = useRef<HTMLCanvasElement | null>(null);
  const extractPreviewRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize the universal pixel map and draw current selected template in UI
  useEffect(() => {
    const map = getUniversalPixelMap();
    setPixelMap(map);
  }, []);

  // Update sender canvas preview whenever the custom image changes
  useEffect(() => {
    const canvas = embedPreviewRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, 480, 270); // 1920x1080 scaled down by 4 is 480x270

    if (senderUploadedImage) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, 480, 270);
      };
      img.src = senderUploadedImage;
    } else {
      // Fallback gray background
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(0, 0, 480, 270);
      ctx.font = "14px monospace";
      ctx.fillStyle = "#94a3b8";
      ctx.textAlign = "center";
      ctx.fillText("Bitte lade ein Trägerbild hoch", 240, 135);
    }
  }, [senderUploadedImage]);

  // Validation feedback in real-time
  const getValidationFeedback = () => {
    if (text.length > 3877) {
      return { error: true, message: "FEHLER: TEXT ZU LANG (Max. 3.877 Zeichen)" };
    }
    if (containsEmoji(text)) {
      return { error: true, message: "FEHLER: EMOJIS SIND VERBOTEN (Nur Text & Satzzeichen)" };
    }
    return { error: false, message: `${text.length} / 3.877 Zeichen verwendet` };
  };

  const validation = getValidationFeedback();

  // Händler für Sender Bild-Upload (drag-drop / file input)
  const handleSenderImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setSenderUploadedImage(event.target?.result as string);
      setEmbedSuccess(false);
      setEmbeddedImage(null);
    };
    reader.readAsDataURL(file);
  };

  // Händler für Empfänger Bild-Upload
  const handleExtractorImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setExtractorUploadedImage(event.target?.result as string);
      setExtractedText(null);
      setExtractError(null);

      // Render image on receiver preview canvas
      const img = new Image();
      img.onload = () => {
        const canvas = extractPreviewRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.clearRect(0, 0, 480, 270);
            ctx.drawImage(img, 0, 0, 480, 270);
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Perform embedding (Sender-Logik)
  const executeEmbed = () => {
    setEmbedError(null);
    setEmbedSuccess(false);

    if (!senderUploadedImage) {
      setEmbedError("Bitte lade ein eigenes Bild als Träger hoch.");
      return;
    }

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = 1920;
    tempCanvas.height = 1080;
    const tempCtx = tempCanvas.getContext("2d")!;

    const onImageLoaded = (img: HTMLImageElement) => {
      tempCtx.drawImage(img, 0, 0, 1920, 1080);
      runEmbedSequence(tempCanvas);
    };

    const img = new Image();
    img.onload = () => onImageLoaded(img);
    img.src = senderUploadedImage;
  };

  const runEmbedSequence = (sourceCanvas: HTMLCanvasElement) => {
    const embedResult = embedTextInImage(sourceCanvas, text);
    if (embedResult.success && embedResult.dataUrl) {
      setEmbeddedImage(embedResult.dataUrl);
      setEmbedSuccess(true);
    } else {
      setEmbedError(embedResult.error || "Unerwarteter Fehler beim Einbetten.");
    }
  };

  // Perform extraction (Empfänger-Logik)
  const executeExtract = () => {
    if (!extractorUploadedImage) {
      setExtractError("Kein Bild zum Auslesen vorhanden.");
      return;
    }

    const img = new Image();
    img.onload = () => {
      const result = extractTextFromImage(img);
      if (result.success && result.result !== undefined) {
        setExtractedText(result.result);
        setExtractError(null);
      } else {
        setExtractError(result.error || "Auslesen fehlgeschlagen. Ist dies ein gültiges CryptSign-Bild?");
      }
    };
    img.src = extractorUploadedImage;
  };

  // Convenient UX: transfer embedded image from Sender directly to Receiver input
  const transferToReceiver = () => {
    if (!embeddedImage) return;
    setExtractorUploadedImage(embeddedImage);
    setExtractedText(null);
    setExtractError(null);
    setActiveTab("extract");

    // Paint to receiver preview
    const img = new Image();
    img.onload = () => {
      const canvas = extractPreviewRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, 480, 270);
          ctx.drawImage(img, 0, 0, 480, 270);
        }
      }
    };
    img.src = embeddedImage;
  };

  const copyToClipboard = (txt: string) => {
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="cryptsign-root" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Upper Navigation Border / Status Rail */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-tr from-amber-500 to-yellow-400 p-2.5 rounded-xl shadow-lg shadow-amber-500/10 border border-amber-400/20">
            <Shield id="logo-icon" className="h-6 w-6 text-slate-950 stroke-[2]" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              CryptSign <span className="text-xs font-mono font-normal py-0.5 px-2 bg-slate-900 text-amber-500 rounded border border-slate-800">v1.2</span>
            </h1>
            <p className="text-xs text-slate-400">Programmgesteuertes Steganographie-Fundament_</p>
          </div>
        </div>

        {/* Humbler metadata values - No AI, 100% offline, Zero trackers */}
        <div className="flex items-center space-x-4 text-xs font-mono bg-slate-900/60 py-2 px-3 rounded-lg border border-slate-900">
          <span className="flex items-center gap-1.5 text-emerald-500">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            100% LOKAL
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">3.877 CHAR LIMIT</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 text-[10px]">ANONYM</span>
        </div>
      </header>

      {/* Primary Dashboard Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-8">
        {/* Left Side: Actions and Panels */}
        <div className="flex-1 flex flex-col space-y-6">
          
          {/* Section Selector Tab Buttons */}
          <div className="bg-slate-900/50 p-1 rounded-xl border border-slate-900 flex space-x-1">
            <button
              id="tab-embed"
              onClick={() => setActiveTab("embed")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium tracking-wide transition-all ${
                activeTab === "embed"
                  ? "bg-slate-800 text-amber-500 shadow border border-slate-700/50"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Einbetten (Sender)
            </button>
            <button
              id="tab-extract"
              onClick={() => setActiveTab("extract")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium tracking-wide transition-all ${
                activeTab === "extract"
                  ? "bg-slate-800 text-amber-500 shadow border border-slate-700/50"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Auslesen (Empfänger)
            </button>
          </div>

          {/* Tab Contents */}
          <div className="flex-1 bg-slate-900/20 border border-slate-900 rounded-2xl p-6 shadow-xl relative overflow-hidden min-h-[500px] flex flex-col">
            <AnimatePresence mode="wait">
              
              {/* SENDER PANEL */}
              {activeTab === "embed" && (
                <motion.div
                  key="embed-panel"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col h-full space-y-6"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-lg font-semibold text-white">Geheime Botschaft einbetten</h2>
                      <p className="text-xs text-slate-400 mt-1">
                        Sperrt Text verlustfrei und manipulationssicher in die LSB-Bits von 10.340 Pixeln.
                      </p>
                    </div>
                    <span className="p-1 px-2.5 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] font-mono text-amber-500 uppercase tracking-widest font-bold">
                      Bitspeicher: 31.020
                    </span>
                  </div>

                  {/* Character/Textarea input area */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300 flex justify-between">
                      <span>Nachrichtentext (Maximal 3.877 Zeichen)</span>
                      <span className={`font-mono text-[10px] ${validation.error ? "text-red-500 font-bold" : "text-slate-400"}`}>
                        {validation.message}
                      </span>
                    </label>
                    <textarea
                      id="secret-message-input"
                      value={text}
                      onChange={(e) => {
                        setText(e.target.value);
                        setEmbedError(null);
                        setEmbedSuccess(false);
                      }}
                      placeholder="Schreibe deine geheime Botschaft hier... (Satzzeichen . , ; ? ! und Leerzeichen sind erlaubt. Keine Emojis!)"
                      className={`w-full h-32 bg-slate-950 border rounded-xl p-4 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all font-sans leading-relaxed text-slate-200 ${
                        validation.error ? "border-red-500/60 ring-1 ring-red-500/20" : "border-slate-800"
                      }`}
                    />
                  </div>

                  {/* Trägerbild-Upload mit Warnhinweis */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-slate-300">
                        Einfaches Trägerbild hochladen (JPEG / PNG / WEBP)
                      </label>
                      <span className="text-[10px] text-amber-500 font-mono font-bold uppercase tracking-wider">Erfordert exakt 1920×1080</span>
                    </div>

                    <div className="relative group border border-dashed border-slate-800 bg-slate-950/40 rounded-2xl p-6 hover:bg-slate-950/60 transition-all text-center flex flex-col items-center justify-center min-h-[140px]">
                      <input
                        id="file-upload-input"
                        type="file"
                        accept="image/*"
                        onChange={handleSenderImageUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      {senderUploadedImage ? (
                        <div>
                          <CheckCircle className="h-6 w-6 text-amber-500 mx-auto mb-1.5" />
                          <span className="text-xs font-medium text-slate-200 block">Bild erfolgreich geladen</span>
                          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Wird auf exakt 1920×1080px gebracht</span>
                        </div>
                      ) : (
                        <div>
                          <Upload className="h-5 w-5 text-slate-550 group-hover:text-amber-500 mx-auto mb-2 transition-colors" />
                          <span className="text-xs font-medium text-slate-300 block">Trägerbild per Klick oder Drag & Drop laden</span>
                          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block font-normal">PNG, JPG, JPEG, WEBP etc.</span>
                        </div>
                      )}
                    </div>

                    {/* Drastische Warnung zur Pixeldimension */}
                    <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-start gap-2.5">
                      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <div className="text-[11px] leading-relaxed text-slate-300">
                        <span className="text-amber-500 font-bold block mb-0.5">WICHTIGE COMPLIANCE-REGEL:</span>
                        Das hochgeladene Bild sollte idealerweise <strong className="text-white">exakt 1920×1080 Pixel</strong> groß sein. Jede abweichende Auflösung wird hart auf 1920×1080 skaliert und kann das Trägerbild verzerren!
                      </div>
                    </div>
                  </div>

                  {/* Errors / Warnings */}
                  {embedError && (
                    <div className="p-3.5 bg-red-950/40 border border-red-900/60 rounded-xl flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
                      <span className="text-xs font-mono text-red-200">{embedError}</span>
                    </div>
                  )}

                  {/* Submit / Trigger Button */}
                  <div className="pt-2">
                    <button
                      id="embed-action-button"
                      onClick={executeEmbed}
                      disabled={validation.error || !senderUploadedImage}
                      className={`w-full py-3.5 px-4 rounded-xl font-medium tracking-wide flex items-center justify-center gap-2 transition-all ${
                        validation.error || !senderUploadedImage
                          ? "bg-slate-900 text-slate-600 border border-slate-950 cursor-not-allowed"
                          : "bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold shadow-lg shadow-amber-500/10 active:scale-[0.99]"
                      }`}
                    >
                      <Binary className="h-4 w-4" />
                      Nachricht einbetten & Verlustfreie PNG exportieren
                    </button>
                  </div>

                </motion.div>
              )}

              {/* RECIPIENT PANEL */}
              {activeTab === "extract" && (
                <motion.div
                  key="extract-panel"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col h-full space-y-6"
                >
                  <div>
                    <h2 className="text-lg font-semibold text-white font-sans">Geheime Botschaft auslesen</h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Lade die manipulierte PNG-Datei hoch, um die in der universellen Koordinaten-Map versteckten LSB-Bits zu dekodieren.
                    </p>
                  </div>

                  {/* Upload box */}
                  <div className="flex-1 flex flex-col justify-center items-center p-8 border-2 border-dashed border-slate-800 bg-slate-950/40 rounded-2xl hover:bg-slate-950/60 hover:border-slate-700 transition-all relative group min-h-[180px]">
                    <input
                      id="reader-upload-input"
                      type="file"
                      accept="image/*"
                      onChange={handleExtractorImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    
                    {extractorUploadedImage ? (
                      <div className="text-center pointer-events-none">
                        <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                        <span className="text-sm font-semibold text-white block">CryptSign-Bild bereitgestellt!</span>
                        <span className="text-xs text-slate-400 mt-1 font-mono">Pixelmatrix auf 1920×1080 skaliert</span>
                      </div>
                    ) : (
                      <div className="text-center pointer-events-none flex flex-col items-center">
                        <div className="h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center border border-slate-800 group-hover:border-slate-700 text-slate-400 group-hover:text-amber-500 mb-3 transition-colors">
                          <Upload className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-semibold text-slate-300 block">Klicke oder ziehe Bild hierher</span>
                        <span className="text-[10px] text-slate-500 mt-1 font-mono">Muss verlustfreies PNG Format sein</span>
                      </div>
                    )}
                  </div>

                  {/* Extract action error box */}
                  {extractError && (
                    <div className="p-3.5 bg-red-950/40 border border-red-900/60 rounded-xl flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
                      <span className="text-xs font-mono text-red-200">{extractError}</span>
                    </div>
                  )}

                  {/* Extract trigger button */}
                  <div className="pt-2">
                    <button
                      id="extract-action-button"
                      onClick={executeExtract}
                      disabled={!extractorUploadedImage}
                      className={`w-full py-4 px-4 rounded-xl font-medium tracking-wide flex items-center justify-center gap-2 transition-all ${
                        !extractorUploadedImage
                          ? "bg-slate-900 text-slate-600 border border-slate-950 cursor-not-allowed"
                          : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold shadow-lg shadow-emerald-500/10 active:scale-[0.99]"
                      }`}
                    >
                      <RefreshCw className="h-4 w-4 animate-spin-slow" />
                      LSB-Kanäle analysieren & Botschaft extrahieren
                    </button>
                  </div>

                  {/* Decoded result */}
                  {extractedText !== null && (
                    <div className="space-y-2 border-t border-slate-900 pt-6">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 font-mono">
                          <Check className="h-3.5 w-3.5" />
                          KLARTEXT EXTRAHIERT (HARD STOPP BEI NULLBYTE ERR_OK):
                        </span>
                        <button
                          onClick={() => copyToClipboard(extractedText)}
                          className="text-[11px] font-mono hover:text-white bg-slate-900/80 px-2 py-1 rounded border border-slate-800 flex items-center gap-1 hover:bg-slate-800 transition-all"
                        >
                          {copied ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-400" />
                              Kopiert!
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              Kopieren
                            </>
                          )}
                        </button>
                      </div>

                      <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl min-h-[100px] text-sm text-slate-150 leading-relaxed font-sans whitespace-pre-wrap select-all">
                        {extractedText === "" ? (
                          <span className="text-slate-500 italic">Die ausgelesene Nachricht ist leer (Sofortiger Stopp bei erstem Null-Byte).</span>
                        ) : (
                          extractedText
                        )}
                      </div>
                    </div>
                  )}

                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>

        {/* Right Side: Render/Result Preview Sidebar */}
        <div className="w-full lg:w-80 shrink-0 flex flex-col space-y-6">
          
          {/* SENDER OUTPUT OR PREVIEW CARD */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-4 sm:p-5 flex flex-col space-y-4">
            <h3 className="text-xs font-semibold text-slate-400 tracking-wider font-mono">
              SENDER-VORANSICHT & EXPORT
            </h3>
            
            <div className="border border-slate-850 rounded-xl overflow-hidden bg-slate-950 aspect-video relative">
              <canvas 
                ref={embedPreviewRef} 
                width={480} 
                height={270} 
                className="w-full h-auto block" 
              />
              <div className="absolute top-2 left-2 bg-slate-950/80 p-1 px-1.5 rounded border border-slate-800 font-mono text-[8px] text-slate-400">
                {senderUploadedImage ? "BENUTZER-TRÄGERBILD" : "KEIN BILD"}
              </div>
            </div>

            <div className="text-xs text-slate-400 leading-relaxed font-mono bg-slate-950/40 p-3 rounded-lg border border-slate-900">
              <span className="font-bold text-slate-300 block mb-1">Pixel-Spezifikation:</span>
              • Grid-Size: 1920×1080 Pixel<br/>
              • Map-Punkte: 10.340 Paare<br/>
              • Bits-Max: 31.020 (R+G+B LSB)
            </div>

            {/* If successfully embedded, provide action files download */}
            {embedSuccess && embeddedImage && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-3 bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl"
              >
                <div className="flex items-center gap-2 text-amber-500 text-xs font-semibold">
                  <Sparkles className="h-4 w-4" />
                  Botschaft erfolgreich eingebettet!
                </div>
                
                <div className="flex flex-col gap-2">
                  {/* Download button */}
                  <a
                    href={embeddedImage}
                    download={`cryptsign_stego_${Date.now()}.png`}
                    className="w-full py-2.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Bespieltes PNG herunterladen
                  </a>

                  {/* Transfer to Decoder workflow */}
                  <button
                    onClick={transferToReceiver}
                    className="w-full py-2.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 hover:border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                    In Empfänger-Kanal laden
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* SYSTEM ARCHITECTURE EXPLANATION CARD */}
          <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-semibold text-slate-400 tracking-wider font-mono uppercase flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-amber-500" />
              Spezifikation & Modul-Checks
            </h4>
            
            <div className="space-y-3 text-[11px] leading-relaxed text-slate-400">
              <div>
                <span className="text-slate-200 font-bold block">1. 100% Offline-Betrieb</span>
                Keine Server, keine Tracker, keine Cloud-Schnittstellen. Alle Canvas-Bits werden mathematisch lokal im Browser manipuliert.
              </div>
              <div className="border-t border-slate-900 pt-2">
                <span className="text-slate-200 font-bold block">2. Verlustfreie PNG Steganography</span>
                Der Export erzwingt verlustfreies PNG. Jede JPG-Kompression würde die extrem feinen LSB-Bits der Pixel verfälschen und die Information zerstören.
              </div>
              <div className="border-t border-slate-900 pt-2">
                <span className="text-slate-200 font-bold block">3. Harter Stopp auf Bit-Ebene</span>
                Das Ausleseverfahren stoppt exakt beim ersten vollständig leeren UTF-8 Block (00000000). Es entstehen dadurch niemals Geisterzeichen oder zufälliges Bit-Rauschen.
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer System Credits */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500 font-mono">
        <div>CRYPT_SIGN Engine • Autarkes steganographisches Sicherheits-Modul</div>
        <div className="mt-1 text-[10px] text-slate-600">Verarbeitet auf Canvas2D nach ISO-Spezifikationen</div>
      </footer>
    </div>
  );
}
