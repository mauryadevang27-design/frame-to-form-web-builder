// WebRTC P2P Mesh Manager for TogetherTube Video Calling

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export interface WebRTCManagerCallbacks {
  onLocalStream?: (stream: MediaStream) => void;
  onRemoteStream?: (participantId: string, stream: MediaStream) => void;
  onRemoteLeave?: (participantId: string) => void;
  onError?: (err: Error) => void;
}

export class WebRTCManager {
  private localStream: MediaStream | null = null;
  private peers = new Map<string, RTCPeerConnection>();
  private remoteStreams = new Map<string, MediaStream>();
  private myId: string;
  private sendSignal: (signal: any) => void;
  private callbacks: WebRTCManagerCallbacks;
  private isAudioEnabled = true;
  private isVideoEnabled = true;
  private isActive = false;

  constructor(
    myId: string,
    sendSignal: (signal: any) => void,
    callbacks: WebRTCManagerCallbacks = {},
  ) {
    this.myId = myId;
    this.sendSignal = sendSignal;
    this.callbacks = callbacks;
  }

  public async startCall(): Promise<MediaStream | null> {
    if (this.isActive && this.localStream) return this.localStream;
    try {
      if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
        this.localStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: { width: { ideal: 640 }, height: { ideal: 360 } },
        });
        this.isActive = true;
        this.callbacks.onLocalStream?.(this.localStream);
        return this.localStream;
      }
    } catch (err: any) {
      console.warn("[WebRTC] Media access warning:", err);
      // Fallback: create mock audio/video tracks or notify
      this.callbacks.onError?.(err);
    }
    return null;
  }

  public toggleAudio(): boolean {
    if (!this.localStream) return false;
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      this.isAudioEnabled = audioTrack.enabled;
    }
    return this.isAudioEnabled;
  }

  public toggleVideo(): boolean {
    if (!this.localStream) return false;
    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      this.isVideoEnabled = videoTrack.enabled;
    }
    return this.isVideoEnabled;
  }

  public getAudioEnabled(): boolean {
    return this.isAudioEnabled;
  }

  public getVideoEnabled(): boolean {
    return this.isVideoEnabled;
  }

  public getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  public getRemoteStreams(): Map<string, MediaStream> {
    return this.remoteStreams;
  }

  // Create call to remote peer
  public async callPeer(remoteParticipantId: string) {
    if (remoteParticipantId === this.myId || this.peers.has(remoteParticipantId)) return;

    const peer = this.createPeerConnection(remoteParticipantId);
    this.peers.set(remoteParticipantId, peer);

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        peer.addTrack(track, this.localStream!);
      });
    }

    try {
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      this.sendSignal({
        type: "offer",
        to: remoteParticipantId,
        from: this.myId,
        sdp: offer,
      });
    } catch (e: any) {
      console.error("[WebRTC] Offer error:", e);
    }
  }

  // Handle incoming WebRTC signal
  public async handleSignal(signal: any) {
    const fromId = signal.from;
    if (!fromId || fromId === this.myId) return;

    if (signal.type === "offer") {
      let peer = this.peers.get(fromId);
      if (!peer) {
        peer = this.createPeerConnection(fromId);
        this.peers.set(fromId, peer);
      }

      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => {
          peer.addTrack(track, this.localStream!);
        });
      }

      await peer.setRemoteDescription(new RTCSessionDescription(signal.sdp));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      this.sendSignal({
        type: "answer",
        to: fromId,
        from: this.myId,
        sdp: answer,
      });
    } else if (signal.type === "answer") {
      const peer = this.peers.get(fromId);
      if (peer) {
        await peer.setRemoteDescription(new RTCSessionDescription(signal.sdp));
      }
    } else if (signal.type === "ice-candidate" && signal.candidate) {
      const peer = this.peers.get(fromId);
      if (peer) {
        try {
          await peer.addIceCandidate(new RTCIceCandidate(signal.candidate));
        } catch (e) {
          console.warn("[WebRTC] ICE candidate error:", e);
        }
      }
    }
  }

  private createPeerConnection(remoteId: string): RTCPeerConnection {
    const peer = new RTCPeerConnection(ICE_SERVERS);

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal({
          type: "ice-candidate",
          to: remoteId,
          from: this.myId,
          candidate: event.candidate,
        });
      }
    };

    peer.ontrack = (event) => {
      const stream = event.streams[0] || new MediaStream([event.track]);
      this.remoteStreams.set(remoteId, stream);
      this.callbacks.onRemoteStream?.(remoteId, stream);
    };

    peer.onconnectionstatechange = () => {
      if (peer.connectionState === "disconnected" || peer.connectionState === "failed") {
        this.removePeer(remoteId);
      }
    };

    return peer;
  }

  public removePeer(remoteId: string) {
    const peer = this.peers.get(remoteId);
    if (peer) {
      peer.close();
      this.peers.delete(remoteId);
    }
    this.remoteStreams.delete(remoteId);
    this.callbacks.onRemoteLeave?.(remoteId);
  }

  public stopCall() {
    this.isActive = false;
    for (const [id] of this.peers) {
      this.removePeer(id);
    }
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }
  }
}
