import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { currentPosition } from "../lib/playback";
import { SELF_ID } from "../mock/data";
import type { CreateRoomInput, RoomService } from "../services/room-service";
import type { ConnectionState, PlaybackState, Room, RoomEvent, Screen } from "../types";

export type EndReason = "you_ended" | "you_left" | "host_ended";

export interface Preferences {
  notifyPresence: boolean;
}

export interface SessionState {
  screen: Screen;
  direction: "forward" | "back";
  history: Screen[];
  displayName: string;
  prefs: Preferences;
  room: Room | null;
  connection: ConnectionState;
  hostOnline: boolean;
  inviteCode: string | null;
  endReason: EndReason | null;
  endedRoomName: string | null;
}

type Action =
  | { type: "go"; screen: Screen }
  | { type: "back" }
  | { type: "home" }
  | { type: "enter_room"; room: Room }
  | { type: "open_invite"; code: string }
  | { type: "exit_room"; reason: EndReason }
  | { type: "event"; event: RoomEvent }
  | { type: "set_playback"; playback: PlaybackState }
  | { type: "set_name"; name: string }
  | { type: "set_prefs"; prefs: Partial<Preferences> };

const initialState: SessionState = {
  screen: "home",
  direction: "forward",
  history: ["home"],
  displayName: "Devang",
  prefs: { notifyPresence: true },
  room: null,
  connection: "connected",
  hostOnline: true,
  inviteCode: null,
  endReason: null,
  endedRoomName: null,
};

function reducer(state: SessionState, action: Action): SessionState {
  switch (action.type) {
    case "go":
      if (state.screen === action.screen) return state;
      return {
        ...state,
        screen: action.screen,
        direction: "forward",
        history: [...state.history, action.screen],
      };
    case "back": {
      if (state.history.length < 2) return state;
      const history = state.history.slice(0, -1);
      return { ...state, history, screen: history[history.length - 1]!, direction: "back" };
    }
    case "home":
      return { ...state, screen: "home", history: ["home"], direction: "back", inviteCode: null };
    case "enter_room":
      return {
        ...state,
        room: action.room,
        connection: "connecting",
        hostOnline: true,
        screen: "room",
        history: ["room"],
        direction: "forward",
        inviteCode: null,
      };
    case "open_invite":
      return {
        ...state,
        inviteCode: action.code,
        screen: "invite",
        history: ["home", "invite"],
        direction: "forward",
      };
    case "exit_room":
      return {
        ...state,
        endedRoomName: state.room?.name ?? null,
        room: null,
        endReason: action.reason,
        screen: "ended",
        history: ["ended"],
        direction: "forward",
      };
    case "set_playback":
      return state.room ? { ...state, room: { ...state.room, playback: action.playback } } : state;
    case "set_name":
      return { ...state, displayName: action.name };
    case "set_prefs":
      return { ...state, prefs: { ...state.prefs, ...action.prefs } };
    case "event":
      return applyEvent(state, action.event);
  }
}

function applyEvent(state: SessionState, event: RoomEvent): SessionState {
  const room = state.room;
  if (event.type === "connection") return { ...state, connection: event.state };
  if (!room) return state;
  switch (event.type) {
    case "participant_joined":
      if (room.participants.some((p) => p.id === event.participant.id)) return state;
      return {
        ...state,
        room: { ...room, participants: [...room.participants, event.participant] },
      };
    case "participant_left":
      return {
        ...state,
        room: {
          ...room,
          participants: room.participants.filter((p) => p.id !== event.participantId),
        },
      };
    case "host_presence": {
      const participants = room.participants.map((p) =>
        p.id === room.hostId
          ? { ...p, status: event.online ? ("online" as const) : ("offline" as const) }
          : p,
      );
      const duration = room.video?.durationSec ?? 0;
      const playback = event.online
        ? room.playback
        : {
            isPlaying: false,
            positionSec: currentPosition(room.playback, duration),
            updatedAt: Date.now(),
          };
      return { ...state, hostOnline: event.online, room: { ...room, participants, playback } };
    }
    case "video_changed":
      return {
        ...state,
        room: {
          ...room,
          video: event.video,
          playback: { isPlaying: false, positionSec: 0, updatedAt: Date.now() },
        },
      };
    case "playback":
      return { ...state, room: { ...room, playback: event.playback } };
    case "room_ended":
      return reducer(state, { type: "exit_room", reason: "host_ended" });
  }
}

export interface SessionCallbacks {
  /** Called before an event is applied, with the state it is applied to. */
  onEvent?: ((event: RoomEvent, prev: SessionState) => void) | undefined;
}

export function useTogetherTube(service: RoomService, callbacks: SessionCallbacks = {}) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  const emit = useCallback((event: RoomEvent) => {
    callbacksRef.current.onEvent?.(event, stateRef.current);
    dispatch({ type: "event", event });
  }, []);

  const roomCode = state.room?.code;

  // Live subscription for the active room.
  useEffect(() => {
    if (!roomCode) return;
    return service.subscribe(roomCode, emit);
  }, [roomCode, service, emit]);

  // "Connecting to sync server" handshake after entering a room (mock latency).
  useEffect(() => {
    if (state.connection !== "connecting" || !roomCode) return;
    const t = setTimeout(
      () => dispatch({ type: "event", event: { type: "connection", state: "connected" } }),
      1200,
    );
    return () => clearTimeout(t);
  }, [state.connection, roomCode]);

  // Mock reconnection: a live transport would emit "connected" itself.
  useEffect(() => {
    if (state.connection !== "reconnecting" || !roomCode) return;
    const t = setTimeout(() => emit({ type: "connection", state: "connected" }), 2000);
    return () => clearTimeout(t);
  }, [state.connection, roomCode, emit]);

  const isHost = !!state.room && state.room.hostId === SELF_ID;

  const actions = useMemo(
    () => ({
      go: (screen: Screen) => dispatch({ type: "go", screen }),
      back: () => dispatch({ type: "back" }),
      home: () => dispatch({ type: "home" }),
      openInvite: (code: string) => dispatch({ type: "open_invite", code }),
      createRoom: (input: Omit<CreateRoomInput, "displayName">) =>
        service.createRoom({ ...input, displayName: stateRef.current.displayName }),
      previewRoom: (code: string) => service.previewRoom(code),
      joinRoom: (code: string) => service.joinRoom(code, stateRef.current.displayName),
      enterRoom: (room: Room) => dispatch({ type: "enter_room", room }),
      leaveRoom: async () => {
        const room = stateRef.current.room;
        if (room) await service.leaveRoom(room.code);
        dispatch({ type: "exit_room", reason: "you_left" });
      },
      endRoom: async () => {
        const room = stateRef.current.room;
        if (room) await service.endRoom(room.code);
        dispatch({ type: "exit_room", reason: "you_ended" });
      },
      /** Host only. */
      setPlayback: (next: { isPlaying?: boolean | undefined; seekBy?: number }) => {
        const room = stateRef.current.room;
        if (!room || room.hostId !== SELF_ID || !room.video) return;
        const pos = currentPosition(room.playback, room.video.durationSec);
        const positionSec = Math.min(room.video.durationSec, Math.max(0, pos + (next.seekBy ?? 0)));
        const playback: PlaybackState = {
          isPlaying: next.isPlaying ?? room.playback.isPlaying,
          positionSec,
          updatedAt: Date.now(),
        };
        dispatch({ type: "set_playback", playback });
        void service.updatePlayback(room.code, playback);
      },
      reconnect: () =>
        dispatch({ type: "event", event: { type: "connection", state: "reconnecting" } }),
      setDisplayName: (name: string) => dispatch({ type: "set_name", name }),
      setPrefs: (prefs: Partial<Preferences>) => dispatch({ type: "set_prefs", prefs }),
      /** Entry point for live transports and the prototype controls. */
      emit,
    }),
    [service, emit],
  );

  return { state, isHost, actions };
}

export type TogetherTubeSession = ReturnType<typeof useTogetherTube>;
