export type AgentIntent = 'narrate' | 'dialogue' | 'explore' | 'combat';

export interface AgentState {
  input: string;
  sessionId: string;
  worldId: string;
  userId: string;
  turnNumber: number;
  context: SessionContext;
  worldState: WorldState;
  memories: MemoryItem[];
  narrative: string;
  narrativeTokens: string[];
  events: GameEvent[];
  stateDiff: StateDiff | null;
  errors: string[];
}

export interface SessionContext {
  currentLocationId: string;
  recentHistory: TurnSummary[];
  playerEntityId: string;
  intent: AgentIntent;
}

export interface TurnSummary {
  turnNumber: number;
  input: string;
  output: string;
  events: string[];
}

export interface WorldState {
  currentLocation: LocationInfo;
  entities: EntityInfo[];
  globalState: Record<string, unknown>;
  recentEvents: GameEvent[];
}

export interface LocationInfo {
  id: string;
  name: string;
  description: string;
  exits: Record<string, string>;
  entities: string[];
}

export interface EntityInfo {
  id: string;
  name: string;
  type: string;
  attributes: Record<string, unknown>;
  locationId: string;
  state: Record<string, unknown>;
}

export interface MemoryItem {
  id: string;
  content: string;
  importance: number;
  type: 'experience' | 'knowledge' | 'relationship';
  entityId: string;
  createdAt: string;
  similarity?: number;
}

export interface GameEvent {
  type: 'combat' | 'discovery' | 'dialogue' | 'quest' | 'ambient';
  title: string;
  description: string;
  data: Record<string, unknown>;
}

export interface StateDiff {
  locationChanged?: boolean;
  newLocationId?: string;
  entityChanges?: Array<{ id: string; attribute: string; oldValue: unknown; newValue: unknown }>;
  eventsTriggered?: GameEvent[];
}

export type AgentNodeType =
  | 'supervisor'
  | 'memory_retrieve'
  | 'world_update'
  | 'narrator'
  | 'memory_store'
  | 'stream_output';

export interface AgentNodeConfig {
  name: AgentNodeType;
  description: string;
}
