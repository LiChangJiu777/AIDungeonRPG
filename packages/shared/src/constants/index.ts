export const API_PREFIX = '/api/v1';

export const SSE_EVENTS = {
  TOKEN: 'token',
  EVENT: 'event',
  STATE: 'state',
  ERROR: 'error',
  COMPLETE: 'complete',
} as const;

export const AGENT_NODES = {
  SUPERVISOR: 'supervisor',
  MEMORY_RETRIEVE: 'memory_retrieve',
  WORLD_UPDATE: 'world_update',
  NARRATOR: 'narrator',
  MEMORY_STORE: 'memory_store',
  STREAM_OUTPUT: 'stream_output',
} as const;

export const MEMORY_TYPES = {
  EXPERIENCE: 'experience',
  KNOWLEDGE: 'knowledge',
  RELATIONSHIP: 'relationship',
} as const;

export const DEFAULT_WORLDS = {
  FANTASY: {
    name: '艾泽拉斯',
    description: '一个充满魔法与龙的奇幻世界',
    setting: 'fantasy',
    rules: { magic: true, technology: 'medieval', deities: 'pantheon' },
  },
  SCI_FI: {
    name: '星际边缘',
    description: '人类已经殖民银河系的科幻未来',
    setting: 'sci-fi',
    rules: { magic: false, technology: 'advanced', ftl: true },
  },
} as const;

export const EMBEDDING_DIM = 1536;
export const MAX_HISTORY_TURNS = 50;
export const MEMORY_TOP_K = 5;
export const TOKEN_LIMIT_PER_TURN = 2048;
