import type { GameEvent, StateDiff } from './agent.js';
import type { UserProfile } from './game.js';

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateSessionRequest {
  worldId: string;
  characterName?: string;
}

export interface ActionRequest {
  input: string;
}

export type SSEEventType = 'token' | 'event' | 'state' | 'error' | 'complete';

export interface SSEBaseEvent {
  event: SSEEventType;
  id?: string;
}

export interface SSETokenEvent extends SSEBaseEvent {
  event: 'token';
  data: string;
}

export interface SSEGameEvent extends SSEBaseEvent {
  event: 'event';
  data: GameEvent;
}

export interface SSEStateEvent extends SSEBaseEvent {
  event: 'state';
  data: StateDiff;
}

export interface SSEErrorEvent extends SSEBaseEvent {
  event: 'error';
  data: { code: string; message: string };
}

export interface SSECompleteEvent extends SSEBaseEvent {
  event: 'complete';
  data: { turnNumber: number; tokensUsed: number };
}

export type SSEEvent = SSETokenEvent | SSEGameEvent | SSEStateEvent | SSEErrorEvent | SSECompleteEvent;

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
}
