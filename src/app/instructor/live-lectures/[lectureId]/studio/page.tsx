"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { startWhipStream } from "@/lib/live-streaming-client";
import { Mic, MicOff, MonitorUp, ScreenShare, StopCircle, Video } from "lucide-react";

interface LectureDetail {
  id: string;
  title: string;
  status: "SCHEDULED" | "READY" | "LIVE" | "PROCESSING" | "RECORDED" | "FAILED";
  scheduledAt: string;
  course?: { title?: string };
  instructor?: { fullName?: string };
}

export default function InstructorLiveStudioPage() {
  const params = useParams<{ lectureId: string }>();
  const router = useRouter();
  const lectureId = params.lectureId;
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const micAudioRef = useRef<HTMLAudioElement | null>(null);
  const [lecture, setLecture] = useState<LectureDetail | null>(null);
  const [microphoneEnabled, setMicrophoneEnabled] = useState(true);
  const [screenEnabled, setScreenEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isLiveStarted, setIsLiveStarted] = useState(false);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  const formatElapsed = useMemo(() => {
    const hours = Math.floor(elapsedSeconds / 3600);
    const minutes = Math.floor((elapsedSeconds % 3600) / 60);
    const seconds = elapsedSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }, [elapsedSeconds]);

  const loadLecture = async () => {
    try {
      const res = await fetch(`/api/live-lectures/${lectureId}`);
      const json = await res.json();
      if (res.ok && json.success) {
        const data = json.data.lecture;
        setLecture(data);
        setIsLiveStarted(data.status === "LIVE");
        if (data.status === "LIVE") {
          setElapsedSeconds(Math.max(0, Math.floor((Date.now() - new Date(data.startedAt || data.scheduledAt).getTime()) / 1000)));
        }
      }
    } catch (error) {
      console.error("Failed to load lecture studio:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLecture();
  }, [lectureId]);

  useEffect(() => {
    if (!isLiveStarted) return;
    const timer = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isLiveStarted]);

  const ensureMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audio = new Audio();
      audio.srcObject = stream;
      audio.play();
      micAudioRef.current = audio;
      micStreamRef.current = stream;
      setMicrophoneEnabled(true);
    } catch {
      setStatusMessage("يجب السماح باستخدام الميكروفون لبدء المحاضرة.");
      setMicrophoneEnabled(false);
    }
  };

  const ensureScreen = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      screenStreamRef.current = stream;
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = stream;
      }
      setScreenEnabled(true);
    } catch {
      setStatusMessage("يجب السماح بمشاركة الشاشة لبدء البث.");
      setScreenEnabled(false);
    }
  };

  const toggleMicrophone = async () => {
    if (!microphoneEnabled) {
      await ensureMic();
      return;
    }
    if (micAudioRef.current?.srcObject) {
      const tracks = (micAudioRef.current.srcObject as MediaStream).getAudioTracks();
      tracks.forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    setMicrophoneEnabled(false);
  };

  const toggleScreen = async () => {
    if (!screenEnabled) {
      await ensureScreen();
      return;
    }
    const videoEl = screenVideoRef.current;
    if (videoEl?.srcObject) {
      const tracks = (videoEl.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      screenStreamRef.current = null;
      videoEl.srcObject = null;
    }
    setScreenEnabled(false);
  };

  const startLecture = async () => {
    try {
      await ensureMic();
      await ensureScreen();

      const res = await fetch(`/api/live-lectures/${lectureId}/start`, { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "تعذر بدء المحاضرة المباشرة");
      }

      const gatewayUrl = process.env.NEXT_PUBLIC_LIVE_STREAM_GATEWAY_URL || "http://localhost:8555";
      const combinedAudioTracks = [...(micStreamRef.current?.getAudioTracks() ?? []), ...(screenStreamRef.current?.getAudioTracks() ?? [])];
      const combinedVideoTracks = [...(screenStreamRef.current?.getVideoTracks() ?? [])];

      if (!combinedAudioTracks.length && !combinedVideoTracks.length) {
        throw new Error("يجب تفعيل الميكروفون أو شاشة العرض قبل إرسال البث الحقيقي.");
      }

      const combinedStream = new MediaStream([
        ...combinedVideoTracks,
        ...combinedAudioTracks,
      ]);

      await startWhipStream({
        endpoint: `${gatewayUrl}/whip`,
        mediaStream: combinedStream,
      });

      setIsLiveStarted(true);
      setStatusMessage("🔴 LIVE");
      await loadLecture();
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "تعذر بدء البث.");
    }
  };

  const endLecture = async () => {
    try {
      const res = await fetch(`/api/live-lectures/${lectureId}/end`, { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "تعذر إنهاء المحاضرة");
      }

      await loadLecture();
      router.push("/instructor/live-lectures");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "تعذر إنهاء البث.");
    }
  };

  if (isLoading || !lecture) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500" dir="rtl">جاري تحميل استوديو المحاضرة...</div>;
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">LIVE STUDIO</h1>
          <p className="text-sm text-slate-500">{lecture.title}</p>
        </div>
        <Badge className={lecture.status === "LIVE" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"}>
          {lecture.status === "LIVE" ? "LIVE 🔴" : lecture.status}
        </Badge>
      </div>

      {statusMessage && (
        <Alert className="border-amber-200 bg-amber-50 text-amber-800">
          <AlertDescription>{statusMessage}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-slate-200 bg-slate-950 p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between text-white">
            <div className="flex items-center gap-2 text-sm font-bold">
              <Video className="h-4 w-4 text-red-500" />
              <span>Screen Preview</span>
            </div>
            <span className="text-xs text-slate-300">{formatElapsed}</span>
          </div>
          <div className="aspect-video w-full overflow-hidden rounded-2xl bg-slate-900 border border-slate-700">
            <video ref={screenVideoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
          </div>
        </div>

        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
            <span className="text-sm font-bold text-slate-700">Microphone</span>
            <button
              onClick={toggleMicrophone}
              className={`flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold ${microphoneEnabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}
            >
              {microphoneEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              {microphoneEnabled ? "ON" : "OFF"}
            </button>
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
            <span className="text-sm font-bold text-slate-700">Screen Sharing</span>
            <button
              onClick={toggleScreen}
              className={`flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold ${screenEnabled ? "bg-violet-100 text-violet-700" : "bg-slate-200 text-slate-600"}`}
            >
              {screenEnabled ? <MonitorUp className="h-4 w-4" /> : <ScreenShare className="h-4 w-4" />}
              {screenEnabled ? "ON" : "OFF"}
            </button>
          </div>

          <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-center">
            <div className="text-3xl font-black text-red-600">{isLiveStarted ? "🔴 LIVE" : "OFFLINE"}</div>
            <div className="mt-2 text-sm font-bold text-red-700">{formatElapsed}</div>
          </div>

          <div className="flex gap-3 flex-wrap">
            {!isLiveStarted ? (
              <Button onClick={startLecture} className="flex-1 bg-[#2563EB] hover:bg-blue-700 text-white font-bold">
                Start Live
              </Button>
            ) : (
              <Button onClick={endLecture} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold">
                <StopCircle className="h-4 w-4 ml-1" />
                End Lecture
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
