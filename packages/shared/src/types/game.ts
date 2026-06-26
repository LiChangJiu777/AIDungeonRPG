import type { GameEvent, StateDiff } from './agent.js';

// Re-export from agent for convenience
export type { GameEvent, StateDiff };

export type SessionStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

export interface GameSessionData {
  id: string;
  userId: string;
  worldId: string;
  status: SessionStatus;
  turnNumber: number;
  createdAt: string;
  updatedAt: string;
  world?: WorldData;
}

export interface WorldData {
  id: string;
  name: string;
  description: string;
  setting: string;
  rules: Record<string, unknown>;
  state: Record<string, unknown>;
}

export interface LocationData {
  id: string;
  worldId: string;
  name: string;
  description: string;
  exits: Record<string, string>;
  metadata: Record<string, unknown>;
}

export interface TurnData {
  id: string;
  sessionId: string;
  input: string;
  output: TurnOutput;
  turnNumber: number;
  tokensUsed: number;
  createdAt: string;
}

export interface TurnOutput {
  narrative: string;
  events: GameEvent[];
  stateDiff: StateDiff | null;
}

export interface EntityData {
  id: string;
  worldId: string;
  name: string;
  type: string;
  attributes: Record<string, unknown>;
  locationId: string | null;
  state: Record<string, unknown>;
}

export interface MemoryData {
  id: string;
  entityId: string;
  sessionId: string;
  type: string;
  content: string;
  importance: number;
  createdAt: string;
}
