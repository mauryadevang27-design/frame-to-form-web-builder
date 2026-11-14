import React, { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Mic, MicOff, PhoneCall, PhoneOff, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Participant } from "../types";
import type { WebRTCManager } from "../webrtc/webrtc-manager";

interface VideoCallViewProps {
  manager: WebRTCManager | null;
  participants: Participant[];
  currentUserId: string;
  className?: string;
}

export function VideoCallView({ manager, participants, currentUserId, className }: VideoCallViewProps) {
  const [inCall, setInCall] = useState(false);
  const [micActive, setMicActive] = useState(true);
  const [videoActive, setVideoActive] = useState(true);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const localVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!manager) return;
    const stream = manager.getLocalStream();
    if (stream) {
      setInCall(true);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    }
  }, [manager]);

  const handleToggleCall = async () => {
    if (!manager) return;
    if (inCall) {
      manager.stopCall();
      setInCall(false);
      setRemoteStreams(new Map());
    } else {
      const stream = await manager.startCall();
      if (stream) {
        setInCall(true);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        // Auto-call other participants in the room
        participants.forEach((p) => {
          if (p.id !== currentUserId) {
            manager.callPeer(p.id);
          }
        });
      }
    }
  };

  const toggleMic = () => {
    if (manager) {
      const enabled = manager.toggleAudio();
      setMicActive(enabled);
    }
  };

  const toggleVideo = () => {
    if (manager) {
      const enabled = manager.toggleVideo();
      setVideoActive(enabled);
    }
  };

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col justify-between p-3.5", className)}>
      {/* Video Grid */}
      <div className="grid flex-1 grid-cols-1 gap-2.5 overflow-y-auto sm:grid-cols-2">
        {/* Local Stream Card */}
        <div className="relative flex min-h-[160px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={cn(
              "h-full w-full object-cover transform -scale-x-100",
              (!inCall || !videoActive) && "hidden",
            )}
          />
          {(!inCall || !videoActive) && (
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-primary">
                <User className="size-7" />
              </div>
              <span className="text-[11.5px] font-medium text-muted-foreground">
                {inCall ? "Camera off" : "Camera inactive"}
              </span>
            </div>
          )}

          <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-lg bg-background/80 px-2 py-1 backdrop-blur-md">
            <span className="text-[10.5px] font-medium text-foreground">You</span>
            {!micActive && inCall && <MicOff className="size-3 text-destructive" />}
          </div>
        </div>

        {/* Remote Participants */}
        {participants
          .filter((p) => p.id !== currentUserId)
          .map((p) => {
            const stream = remoteStreams.get(p.id);
            return (
              <RemoteVideoCard
                key={p.id}
                participant={p}
                stream={stream || null}
              />
            );
          })}
      </div>

      {/* Control Bar */}
      <div className="mt-3.5 flex shrink-0 items-center justify-center gap-3 rounded-2xl border border-border bg-surface/90 p-2.5 shadow-popup backdrop-blur-md">
        {inCall ? (
          <>
            <Button
              variant={micActive ? "surface" : "danger"}
              size="icon"
              onClick={toggleMic}
              className="size-11 rounded-full transition-transform hover:scale-105"
              aria-label="Toggle Microphone"
            >
              {micActive ? <Mic className="size-5" /> : <MicOff className="size-5" />}
            </Button>
            <Button
              variant={videoActive ? "surface" : "danger"}
              size="icon"
              onClick={toggleVideo}
              className="size-11 rounded-full transition-transform hover:scale-105"
              aria-label="Toggle Camera"
            >
              {videoActive ? <Camera className="size-5" /> : <CameraOff className="size-5" />}
            </Button>
            <Button
              variant="danger"
              size="icon"
              onClick={handleToggleCall}
              className="size-11 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-transform hover:scale-105"
              aria-label="Leave Call"
            >
              <PhoneOff className="size-5" />
            </Button>
          </>
        ) : (
          <Button
            variant="primary"
            className="w-full h-11 rounded-xl gap-2 font-medium"
            onClick={handleToggleCall}
          >
            <PhoneCall className="size-4" />
            Start Video Call
          </Button>
        )}
      </div>
    </div>
  );
}

function RemoteVideoCard({
  participant,
  stream,
}: {
  participant: Participant;
  stream: MediaStream | null;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative flex min-h-[160px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
      {stream ? (
        <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
      ) : (
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="flex size-14 items-center justify-center rounded-full bg-surface border border-border-strong text-muted-foreground">
            <Users className="size-7" />
          </div>
          <span className="text-[11.5px] font-medium text-muted-foreground">
            {participant.name}
          </span>
          <span className="text-[9.5px] text-subtle-foreground">Connecting audio/video...</span>
        </div>
      )}

      <div className="absolute bottom-2 left-2 rounded-lg bg-background/80 px-2 py-1 backdrop-blur-md">
        <span className="text-[10.5px] font-medium text-foreground">{participant.name}</span>
      </div>
    </div>
  );
}
