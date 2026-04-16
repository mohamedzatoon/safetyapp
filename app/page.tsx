"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  ShieldAlert,
  FileText,
  CheckCircle2,
  HardHat,
  AlertTriangle,
  Upload,
  RefreshCw,
  Download,
  ScanSearch,
  X,
  ArrowLeft,
  Siren,
  Plus,
  TriangleAlert,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

type Screen = "capture" | "analysis" | "archive" | "results";
type SourceType = "upload" | "camera";
type AnalysisMode = "demo" | "live";
type BottomBarActive = "archive" | "capture" | "upload";

type Detection = {
  id: string;
  title: string;
  code: string;
  severity: "Critical" | "High" | "Medium";
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
  confidence: number;
  bbox: { x: number; y: number; w: number; h: number } | null;
};

type ArchiveItem = {
  id: number;
  image: string;
  detections: Detection[];
  summary: string;
  source: string;
  date: string;
};

const fallbackDetections: Detection[] = [
  {
    id: "fallback-1",
    title: "No Hard Hat",
    code: "OSHA 1926.100",
    severity: "High",
    detail: "Visible worker without proper head protection in active zone.",
    icon: HardHat,
    confidence: 0.86,
    bbox: { x: 39, y: 10, w: 20, h: 36 },
  },
  {
    id: "fallback-2",
    title: "No Fall Protection",
    code: "OSHA 1926.501",
    severity: "Critical",
    detail: "Elevated work detected without compliant harness or guardrail.",
    icon: ShieldAlert,
    confidence: 0.91,
    bbox: { x: 18, y: 18, w: 66, h: 48 },
  },
  {
    id: "fallback-3",
    title: "Open Hole Hazard",
    code: "DOB §3301.7",
    severity: "High",
    detail: "Uncovered opening detected inside operational work path.",
    icon: AlertTriangle,
    confidence: 0.88,
    bbox: { x: 24, y: 74, w: 24, h: 16 },
  },
];

const stages = [
  "Uploading evidence",
  "Analyzing visual scene",
  "Matching safety code",
  "Building final report",
];

function PhoneShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-[370px] max-w-full rounded-[2.8rem] border border-white/10 bg-[#0B1020] p-2 shadow-[0_30px_120px_rgba(2,8,23,0.65)]">
      <div className="relative min-h-[760px] overflow-hidden rounded-[2.2rem] border border-white/10 bg-[#050816]">
        <div className="absolute left-1/2 top-0 z-30 h-6 w-40 -translate-x-1/2 rounded-b-3xl bg-black/70 backdrop-blur" />
        {children}
      </div>
    </div>
  );
}

function NavItem({
  icon: Icon,
  label,
  active = false,
  onClick,
  centered = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  onClick: () => void;
  centered?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 transition ${
        centered
          ? "h-16 w-16 -mt-8 rounded-full bg-white text-slate-950 shadow-lg"
          : active
          ? "text-white"
          : "text-white/55 hover:text-white/80"
      }`}
    >
      <Icon className={centered ? "h-6 w-6" : "h-5 w-5"} />
      <span className={centered ? "text-[10px] font-medium" : "text-[11px]"}>
        {label}
      </span>
    </button>
  );
}

function BottomBar({
  onArchive,
  onCapture,
  onUpload,
  active = "capture",
  archiveCount = 0,
}: {
  onArchive: () => void;
  onCapture: () => void;
  onUpload: () => void;
  active?: BottomBarActive;
  archiveCount?: number;
}) {
  return (
    <div className="absolute bottom-4 left-4 right-4 z-20">
      <div className="flex items-end justify-between rounded-[1.75rem] border border-white/10 bg-black/55 px-6 py-4 backdrop-blur-xl shadow-2xl">
        <div className="relative">
          <NavItem
            icon={FileText}
            label="Archive"
            active={active === "archive"}
            onClick={onArchive}
          />
          {archiveCount > 0 && (
            <div className="absolute -right-1 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-cyan-400 px-1 text-[10px] font-semibold text-slate-950">
              {archiveCount}
            </div>
          )}
        </div>

        <NavItem icon={Camera} label="Scan" centered onClick={onCapture} />

        <NavItem
          icon={Upload}
          label="Upload"
          active={active === "upload"}
          onClick={onUpload}
        />
      </div>
    </div>
  );
}

function getSeverityClasses(severity: Detection["severity"]) {
  if (severity === "Critical") {
    return "border-red-400/80 bg-red-500/10 text-red-200";
  }
  if (severity === "High") {
    return "border-amber-400/80 bg-amber-500/10 text-amber-200";
  }
  return "border-cyan-400/80 bg-cyan-500/10 text-cyan-200";
}

function getSeverityBadgeClasses(severity: Detection["severity"]) {
  if (severity === "Critical") {
    return "bg-red-100 text-red-700 hover:bg-red-100";
  }
  if (severity === "High") {
    return "bg-amber-100 text-amber-700 hover:bg-amber-100";
  }
  return "bg-cyan-100 text-cyan-700 hover:bg-cyan-100";
}

export default function BuildSafeAIPrototype() {
  const [screen, setScreen] = useState<Screen>("capture");
  const [progress, setProgress] = useState(0);
  const [image, setImage] = useState<string | null>(null);
  const [sourceType, setSourceType] = useState<SourceType>("upload");
  const [siteName] = useState("Downtown Tower — East Zone");
  const [reportReady, setReportReady] = useState(false);
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>("demo");
  const [analysisSource, setAnalysisSource] = useState("Not run yet");
  const [detections, setDetections] = useState<Detection[]>([]);
  const [summary, setSummary] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [archive, setArchive] = useState<ArchiveItem[]>([]);

  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("buildsafe-archive");
      if (saved) {
        setArchive(JSON.parse(saved));
      }
    } catch {
      // ignore localStorage errors
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("buildsafe-archive", JSON.stringify(archive));
    } catch {
      // ignore localStorage errors
    }
  }, [archive]);

  const criticalCount = useMemo(
    () => detections.filter((item) => item.severity === "Critical").length,
    [detections]
  );

  const highestConfidence = useMemo(() => {
    if (!detections.length) return "—";
    return `${Math.round(
      Math.max(...detections.map((item) => (item.confidence || 0) * 100))
    )}%`;
  }, [detections]);

  const activeModeLabel = analysisMode === "live" ? "Live mode" : "Demo mode";

  const normalizeDetection = (item: Partial<Detection>, index: number): Detection => ({
    id: item.id || `${item.title || "issue"}-${index}`,
    title: item.title || `Issue ${index + 1}`,
    code: item.code || "Code not available",
    severity: item.severity || "High",
    detail: item.detail || "No detail provided.",
    confidence: typeof item.confidence === "number" ? item.confidence : 0.7,
    bbox: item.bbox || null,
    icon:
      (item.title || "").toLowerCase().includes("hard hat")
        ? HardHat
        : (item.title || "").toLowerCase().includes("fall")
        ? ShieldAlert
        : AlertTriangle,
  });

  const saveToArchive = ({
    imageSrc,
    detectionList,
    textSummary,
    sourceLabel,
  }: {
    imageSrc: string;
    detectionList: Detection[];
    textSummary: string;
    sourceLabel: string;
  }) => {
    const item: ArchiveItem = {
      id: Date.now(),
      image: imageSrc,
      detections: detectionList,
      summary: textSummary,
      source: sourceLabel,
      date: new Date().toLocaleString(),
    };

    setArchive((prev) => [item, ...prev].slice(0, 20));
  };

  const handleImageFile = (file: File | undefined, type: SourceType) => {
    if (!file) return;

    setSourceType(type);
    setErrorMessage("");
    setReportReady(false);
    setDetections([]);
    setSummary("");
    setAnalysisSource("Not run yet");

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
      setScreen("capture");
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) =>
    handleImageFile(e.target.files?.[0], "upload");

  const handleCamera = (e: React.ChangeEvent<HTMLInputElement>) =>
    handleImageFile(e.target.files?.[0], "camera");

  const resetAll = () => {
    setScreen("capture");
    setProgress(0);
    setImage(null);
    setReportReady(false);
    setDetections([]);
    setSummary("");
    setErrorMessage("");
    setAnalysisSource("Not run yet");
  };

  const clearArchive = () => setArchive([]);

  const simulateProgress = () => {
    setProgress(0);
    const values = [12, 26, 41, 58, 74, 89];
    values.forEach((value, index) => {
      setTimeout(() => setProgress(value), (index + 1) * 260);
    });
  };

  const finishAnalysis = (
    normalized: Detection[],
    textSummary: string,
    sourceLabel: string
  ) => {
    setDetections(normalized);
    setSummary(textSummary);
    setAnalysisSource(sourceLabel);
    setProgress(100);
    setScreen("results");
    setReportReady(true);

    if (image) {
      saveToArchive({
        imageSrc: image,
        detectionList: normalized,
        textSummary,
        sourceLabel,
      });
    }
  };

  const runFallbackAnalysis = () => {
    const normalized = fallbackDetections.map(normalizeDetection);
    finishAnalysis(
      normalized,
      "Demo analysis completed successfully. Visible scaffold safety issues were highlighted for testing purposes.",
      "Fallback demo"
    );
  };

  const startAnalysis = async () => {
    if (!image) return;

    setScreen("analysis");
    setReportReady(false);
    setErrorMessage("");
    simulateProgress();

    if (analysisMode === "demo") {
      setTimeout(runFallbackAnalysis, 1700);
      return;
    }

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image,
          siteName,
          sourceType,
          prompt:
            "Inspect this construction image for visible safety violations. Return structured JSON with summary and detections.",
        }),
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();
      const normalized = Array.isArray(data?.detections)
        ? data.detections.map(normalizeDetection)
        : [];

      if (!normalized.length) {
        throw new Error("No detections returned from backend");
      }

      finishAnalysis(
        normalized,
        data?.summary || "Live analysis completed successfully.",
        "Live backend"
      );
    } catch {
      setErrorMessage(
        "Live analysis endpoint is not connected yet. Demo output is shown instead so the flow remains testable."
      );
      setTimeout(runFallbackAnalysis, 400);
    }
  };

  const reportText = `BUILD SAFE AI — INSPECTION REPORT

Site: ${siteName}
Source: ${sourceType === "camera" ? "Live Camera Capture" : "Uploaded Image"}
Analysis Source: ${analysisSource}
Detected Issues: ${detections.length}
Critical Issues: ${criticalCount}

Summary:
${summary || "No summary available."}

${detections
  .map(
    (item, index) =>
      `${index + 1}. ${item.title} | ${item.code} | Severity: ${item.severity} | Confidence: ${Math.round(
        (item.confidence || 0) * 100
      )}%
${item.detail}`
  )
  .join("\n\n")}
`;

  const downloadReport = () => {
    const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "buildsafe-inspection-report.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const bottomBarActive: BottomBarActive =
    screen === "archive"
      ? "archive"
      : sourceType === "upload"
      ? "upload"
      : "capture";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#12325f_0%,#09111f_38%,#03060f_100%)] px-4 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between rounded-[1.75rem] border border-white/10 bg-white/5 px-6 py-5 backdrop-blur-xl">
          <div>
            <div className="text-sm text-white/45">BuildSafe AI</div>
            <h1 className="mt-1 text-2xl font-semibold text-white">
              Simple safety inspection workflow
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAnalysisMode("demo")}
              className={`rounded-full px-3 py-2 text-sm transition ${
                analysisMode === "demo"
                  ? "bg-white text-slate-950"
                  : "bg-white/5 text-white/70 hover:bg-white/10"
              }`}
            >
              Demo
            </button>
            <button
              onClick={() => setAnalysisMode("live")}
              className={`rounded-full px-3 py-2 text-sm transition ${
                analysisMode === "live"
                  ? "bg-white text-slate-950"
                  : "bg-white/5 text-white/70 hover:bg-white/10"
              }`}
            >
              Live
            </button>
          </div>
        </div>

        <div className="grid gap-8 xl:grid-cols-[430px_1fr]">
          <PhoneShell>
            <AnimatePresence mode="wait">
              {screen === "capture" && (
                <motion.div
                  key="capture"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="relative min-h-[760px]"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.18),transparent_30%),linear-gradient(180deg,#071120_0%,#081426_40%,#06101d_100%)]" />

                  <div className="relative z-10 p-6 pt-12">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs uppercase tracking-[0.25em] text-white/40">
                          Inspection Capture
                        </div>
                        <h2 className="mt-2 text-3xl font-semibold">
                          Field Evidence
                        </h2>
                      </div>

                      {image && (
                        <button
                          onClick={resetAll}
                          className="rounded-full border border-white/10 bg-white/5 p-2 text-white/70 transition hover:bg-white/10"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="mt-6 overflow-hidden rounded-[2rem] border border-white/10 bg-black/30">
                      {image ? (
                        <div className="relative aspect-[9/13] w-full overflow-hidden bg-black">
                          <img
                            src={image}
                            alt="inspection preview"
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                          {detections.map((item) =>
                            item.bbox ? (
                              <div
                                key={item.id}
                                className={`absolute rounded-xl border-2 ${
                                  item.severity === "Critical"
                                    ? "border-red-400"
                                    : "border-amber-400"
                                }`}
                                style={{
                                  left: `${item.bbox.x}%`,
                                  top: `${item.bbox.y}%`,
                                  width: `${item.bbox.w}%`,
                                  height: `${item.bbox.h}%`,
                                }}
                              >
                                <div
                                  className={`-mt-7 inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold backdrop-blur ${getSeverityClasses(
                                    item.severity
                                  )}`}
                                >
                                  {item.title}
                                </div>
                              </div>
                            ) : null
                          )}

                          <div className="absolute left-4 right-4 top-4 flex items-center justify-between">
                            <div className="rounded-full bg-black/45 px-3 py-1 text-xs text-white/80 backdrop-blur">
                              {sourceType === "camera"
                                ? "Camera image"
                                : "Uploaded image"}
                            </div>
                            <div className="rounded-full bg-black/45 px-3 py-1 text-xs text-white/80 backdrop-blur">
                              {activeModeLabel}
                            </div>
                          </div>

                          <button
                            onClick={startAnalysis}
                            className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2 rounded-full bg-white px-5 py-3 text-sm font-medium text-slate-950 shadow-xl transition hover:bg-slate-100"
                          >
                            Analyze image
                          </button>
                        </div>
                      ) : (
                        <div className="relative aspect-[9/13] w-full overflow-hidden bg-[linear-gradient(180deg,#10233b_0%,#0d1b2f_22%,#223850_22%,#314963_42%,#17212f_42%,#0c1420_100%)]">
                          <div className="absolute inset-x-10 top-16 h-52 border-b-[14px] border-slate-500/80">
                            <div className="absolute left-6 top-0 h-full border-l-[8px] border-slate-400/80" />
                            <div className="absolute right-6 top-0 h-full border-l-[8px] border-slate-400/80" />
                            <div className="absolute left-0 right-0 top-28 border-t-[10px] border-slate-400/80" />
                            <div className="absolute bottom-0 left-0 right-0 border-t-[10px] border-slate-400/80" />
                          </div>
                          <div className="absolute left-1/2 top-20 h-10 w-10 -translate-x-1/2 rounded-full bg-amber-300 shadow-[0_0_40px_rgba(252,211,77,0.6)]" />
                          <div className="absolute left-1/2 top-28 h-28 w-14 -translate-x-1/2 rounded-t-full bg-slate-800" />
                          <div className="absolute left-1/2 top-44 h-20 w-24 -translate-x-1/2 rounded-2xl border-4 border-amber-300 bg-slate-700" />
                          <div className="absolute left-1/2 top-[20rem] h-24 w-8 -translate-x-7 rounded-full bg-slate-800" />
                          <div className="absolute left-1/2 top-[20rem] h-24 w-8 translate-x-1 rounded-full bg-slate-800" />

                          <div className="absolute bottom-5 left-5 right-5 rounded-[1.5rem] border border-white/10 bg-black/40 p-5 backdrop-blur-md">
                            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-white/75">
                              <Plus className="h-3.5 w-3.5" />
                              No image selected
                            </div>
                            <h3 className="mt-3 text-xl font-semibold text-white">
                              Upload or capture a site photo
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-white/60">
                              Keep it simple. Add an image, then run analysis.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <BottomBar
                      onArchive={() => setScreen("archive")}
                      onCapture={() => cameraInputRef.current?.click()}
                      onUpload={() => uploadInputRef.current?.click()}
                      active={bottomBarActive}
                      archiveCount={archive.length}
                    />

                    <input
                      ref={uploadInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleUpload}
                      className="hidden"
                    />

                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleCamera}
                      className="hidden"
                    />
                  </div>
                </motion.div>
              )}

              {screen === "analysis" && (
                <motion.div
                  key="analysis"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="relative min-h-[760px] overflow-hidden bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.18),transparent_26%),linear-gradient(180deg,#071020_0%,#09172b_45%,#060d18_100%)] px-6 pb-8 pt-14"
                >
                  <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:28px_28px]" />

                  <div className="relative z-10">
                    <button
                      onClick={() => setScreen("capture")}
                      className="mb-5 inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-white"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </button>

                    <div className="text-center">
                      <div className="mx-auto grid h-20 w-20 place-items-center rounded-[1.75rem] border border-cyan-400/20 bg-cyan-400/10 shadow-[0_0_40px_rgba(34,211,238,0.18)]">
                        <RefreshCw className="h-9 w-9 animate-spin text-cyan-300" />
                      </div>
                      <h2 className="mt-6 text-3xl font-semibold">
                        Analyzing Safety Scene
                      </h2>
                      <p className="mt-3 text-sm leading-6 text-white/60">
                        Running visual inspection logic, code correlation, and
                        report structuring.
                      </p>
                    </div>

                    <div className="mt-8 rounded-[1.75rem] border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                      <div className="mb-3 flex items-center justify-between text-sm text-white/65">
                        <span>Analysis progress</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-3" />
                    </div>

                    <div className="mt-6 space-y-3">
                      {stages.map((stage, index) => (
                        <div
                          key={stage}
                          className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`rounded-full p-2 ${
                                progress > index * 25
                                  ? "bg-emerald-400/15 text-emerald-300"
                                  : "bg-white/5 text-white/40"
                              }`}
                            >
                              {progress > index * 25 ? (
                                <CheckCircle2 className="h-4 w-4" />
                              ) : (
                                <ScanSearch className="h-4 w-4" />
                              )}
                            </div>
                            <span className="text-sm text-white/80">
                              {stage}
                            </span>
                          </div>
                          <span className="text-xs uppercase tracking-[0.2em] text-white/35">
                            {progress > index * 25 ? "Done" : "Pending"}
                          </span>
                        </div>
                      ))}
                    </div>

                    {errorMessage && (
                      <div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">
                        <div className="flex items-start gap-3">
                          <TriangleAlert className="mt-0.5 h-4 w-4" />
                          <span>{errorMessage}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {screen === "archive" && (
                <motion.div
                  key="archive"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-5 pt-12 text-white"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Archive</h2>
                    <div className="flex items-center gap-2">
                      {archive.length > 0 && (
                        <button
                          onClick={clearArchive}
                          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 transition hover:bg-white/10"
                        >
                          <Trash2 className="h-4 w-4" />
                          Clear
                        </button>
                      )}
                      <button
                        onClick={() => setScreen("capture")}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 transition hover:bg-white/10"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3 max-h-[620px] overflow-auto pr-1">
                    {archive.length === 0 && (
                      <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 text-center text-white/50 backdrop-blur-xl">
                        No reports yet
                      </div>
                    )}
                    {archive.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-[1.5rem] border border-white/10 bg-white/5 p-3 backdrop-blur-xl"
                      >
                        <img
                          src={item.image}
                          className="mb-3 h-36 w-full rounded-[1rem] object-cover"
                        />
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm text-white/80">
                              {item.date}
                            </div>
                            <div className="mt-1 text-xs text-cyan-300">
                              {item.source}
                            </div>
                          </div>
                          <Badge className="border-0 bg-white/10 text-white/80 hover:bg-white/10">
                            {item.detections?.length || 0} issues
                          </Badge>
                        </div>
                        <div className="mt-2 text-xs leading-5 text-white/55">
                          {item.summary}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {screen === "results" && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="relative min-h-[760px] bg-[linear-gradient(180deg,#0b1220_0%,#111827_100%)] p-5 pt-12 text-white"
                >
                  <div className="flex items-center justify-between gap-3">
                    <button
                      onClick={() => setScreen("capture")}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 shadow-sm transition hover:bg-white/10"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </button>
                    <div className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300">
                      Report Ready
                    </div>
                  </div>

                  <div className="mt-5 rounded-[1.8rem] border border-white/10 bg-white/5 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xs uppercase tracking-[0.22em] text-white/40">
                          Inspection Summary
                        </div>
                        <h2 className="mt-2 text-3xl font-semibold">
                          Violation Report
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-white/60">
                          {summary ||
                            "Structured output based on the selected visual evidence."}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-black/20 p-3">
                        <Siren className="h-6 w-6 text-red-500" />
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-4 gap-3">
                      <div className="rounded-2xl bg-black/20 p-3">
                        <div className="text-xs text-white/40">Issues</div>
                        <div className="mt-1 text-xl font-semibold">
                          {detections.length}
                        </div>
                      </div>
                      <div className="rounded-2xl bg-black/20 p-3">
                        <div className="text-xs text-white/40">Critical</div>
                        <div className="mt-1 text-xl font-semibold">
                          {criticalCount}
                        </div>
                      </div>
                      <div className="rounded-2xl bg-black/20 p-3">
                        <div className="text-xs text-white/40">
                          Top confidence
                        </div>
                        <div className="mt-1 text-sm font-semibold">
                          {highestConfidence}
                        </div>
                      </div>
                      <div className="rounded-2xl bg-black/20 p-3">
                        <div className="text-xs text-white/40">Source</div>
                        <div className="mt-1 text-sm font-semibold">
                          {analysisSource}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    {detections.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.id}
                          className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)] backdrop-blur-xl"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex gap-3">
                              <div className="rounded-2xl bg-black/20 p-3">
                                <Icon className="h-5 w-5 text-white/80" />
                              </div>
                              <div>
                                <div className="text-base font-semibold">
                                  {item.title}
                                </div>
                                <div className="mt-1 text-sm text-cyan-300">
                                  {item.code}
                                </div>
                                <p className="mt-2 text-sm leading-6 text-white/60">
                                  {item.detail}
                                </p>
                                <div className="mt-3 text-xs font-medium text-white/40">
                                  Confidence:{" "}
                                  {Math.round((item.confidence || 0) * 100)}%
                                </div>
                              </div>
                            </div>
                            <Badge
                              className={`rounded-full border-0 px-3 py-1 ${getSeverityBadgeClasses(
                                item.severity
                              )}`}
                            >
                              {item.severity}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <Button
                      onClick={downloadReport}
                      className="h-14 rounded-2xl border-0 bg-slate-900 text-base font-semibold text-white shadow-lg hover:bg-slate-800"
                    >
                      <Download className="mr-2 h-5 w-5" />
                      Download
                    </Button>
                    <Button
                      onClick={resetAll}
                      variant="outline"
                      className="h-14 rounded-2xl border-white/10 bg-white/5 text-base font-semibold text-white hover:bg-white/10"
                    >
                      New Scan
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </PhoneShell>

          <div className="space-y-4">
            <Card className="rounded-[1.75rem] border border-white/10 bg-white/5 text-white backdrop-blur-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-sm text-cyan-300">
                  <Sparkles className="h-4 w-4" />
                  Test-ready version
                </div>
                <div className="mt-2 text-lg font-semibold">
                  Archive, upload, capture, analyze
                </div>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  This version is cleaner, more stable, and easier to send for
                  demo testing. Archive now saves correctly and persists during
                  the session.
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-[1.75rem] border border-white/10 bg-white/5 text-white backdrop-blur-xl">
              <CardContent className="p-5">
                <div className="text-sm text-white/45">Analysis source</div>
                <div className="mt-2 text-lg font-semibold">
                  {analysisSource}
                </div>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  Demo mode is the safest for sharing right now. Live mode only
                  works when a real backend endpoint is connected.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
