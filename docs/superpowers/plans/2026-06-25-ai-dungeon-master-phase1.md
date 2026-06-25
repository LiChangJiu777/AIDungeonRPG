# AI Dungeon Master Phase 1 — 核心叙事引擎 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task.

**目标:** 构建 AI Dungeon Master 核心叙事引擎，实现「用户输入 → Agent 决策 → 流式故事输出」全链路

**架构:** pnpm monorepo + Fastify 模块化单体 + LangGraph.js Agent 编排 + pgvector 记忆检索 + SSE 流式输出

**技术栈:** pnpm, Turborepo, Fastify, Prisma, PostgreSQL+pgvector, Redis, BullMQ, LangGraph.js, React, TypeScript, TailwindCSS, Radix UI, Pinia, Docker Compose

**前置条件:** Docker Desktop 已安装并启用 WSL2 集成，或 WSL2 内已安装 Docker Engine

---

## 文件结构总览

```
ai-dungeon-rpg/
├── package.json                         # 根 package.json
├── pnpm-workspace.yaml                  # workspace 定义
├── turbo.json                           # Turborepo 配置
├── tsconfig.base.json                   # 基础 tsconfig
├── .env.example                         # 环境变量模板
├── .gitignore
├── docker/
│   └── compose.yml                      # Docker Compose
├── packages/
│   └── shared/
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts
│           ├── types/
│           │   ├── agent.ts             # Agent 状态/节点类型
│           │   ├── game.ts              # 游戏实体类型
│           │   └── api.ts               # API 请求/响应类型
│           ├── schemas/
│           │   └── api.schema.ts        # Zod schema
│           └── constants/
│               └── index.ts             # 常量
├── apps/
│   ├── server/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── Dockerfile
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── src/
│   │       ├── index.ts                 # 入口
│   │       ├── app.ts                   # Fastify 应用
│   │       ├── config.ts               # 配置管理
│   │       ├── modules/
│   │       │   ├── game/
│   │       │   │   ├── domain/
│   │       │   │   │   ├── entities.ts
│   │       │   │   │   └── events.ts
│   │       │   │   ├── application/
│   │       │   │   │   └── session.service.ts
│   │       │   │   ├── infrastructure/
│   │       │   │   │   └── session.repository.ts
│   │       │   │   └── interfaces/
│   │       │   │       └── session.routes.ts
│   │       │   ├── narrative/
│   │       │   │   ├── domain/
│   │       │   │   │   ├── entities.ts
│   │       │   │   │   └── events.ts
│   │       │   │   ├── application/
│   │       │   │   │   └── action.service.ts
│   │       │   │   ├── infrastructure/
│   │       │   │   │   └── narrative.agent.ts
│   │       │   │   └── interfaces/
│   │       │   │       ├── action.routes.ts
│   │       │   │       └── stream.routes.ts
│   │       │   ├── memory/
│   │       │   │   ├── domain/
│   │       │   │   │   └── entities.ts
│   │       │   │   ├── application/
│   │       │   │   │   └── memory.service.ts
│   │       │   │   ├── infrastructure/
│   │       │   │   │   ├── memory.repository.ts
│   │       │   │   │   └── memory.worker.ts    # BullMQ worker
│   │       │   │   └── interfaces/
│   │       │   │       └── memory.routes.ts
│   │       │   ├── world/
│   │       │   │   ├── domain/
│   │       │   │   │   ├── entities.ts
│   │       │   │   │   └── events.ts
│   │       │   │   ├── application/
│   │       │   │   │   └── world.service.ts
│   │       │   │   ├── infrastructure/
│   │       │   │   │   └── world.repository.ts
│   │       │   │   └── interfaces/
│   │       │   │       └── world.routes.ts
│   │       │   └── user/
│   │       │       ├── domain/
│   │       │       │   └── entities.ts
│   │       │       ├── application/
│   │       │       │   └── auth.service.ts
│   │       │       └── interfaces/
│   │       │           └── auth.routes.ts
│   │       └── infrastructure/
│   │           ├── database/
│   │           │   └── prisma.ts        # Prisma Client
│   │           ├── queue/
│   │           │   └── queue.ts         # BullMQ 配置
│   │           ├── cache/
│   │           │   └── redis.ts         # Redis 连接
│   │           └── ai/
│   │               └── llm.ts           # LLM Client
│   └── web/
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts
│       ├── index.html
│       ├── Dockerfile
│       └── src/
│           ├── main.tsx
│           ├── App.tsx
│           ├── stores/
│           │   ├── session.ts           # Pinia session store
│           │   └── game.ts             # Pinia game store
│           ├── components/
│           │   ├── ChatMessage.tsx
│           │   ├── ChatInput.tsx
│           │   ├── GameSidebar.tsx
│           │   └── ui/                  # Radix UI 组件
│           ├── views/
│           │   ├── GameView.tsx
│           │   ├── LobbyView.tsx
│           │   └── LoginView.tsx
│           ├── composables/
│           │   └── useSSE.ts
│           └── utils/
│               └── api.ts
```

---

### Task 1: pnpm Monorepo 初始化

**文件:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `tsconfig.base.json`
- Create: `.gitignore`
- Create: `.env.example`
- Create: 各 packages/apps 的 `package.json` 和 `tsconfig.json` (stub)

- [ ] **Step 1: 创建根配置**

```json
// package.json
{
  "name": "ai-dungeon-rpg",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "format": "prettier --write .",
    "db:migrate": "cd apps/server && npx prisma migrate dev",
    "db:generate": "cd apps/server && npx prisma generate",
    "db:seed": "cd apps/server && npx prisma db seed"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "prettier": "^3.2.0",
    "typescript": "^5.5.0"
  },
  "packageManager": "pnpm@9.4.0",
  "engines": {
    "node": ">=20.0.0"
  }
}
```

```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"
```

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [".env"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "dependsOn": ["^build"],
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "test": {}
  }
}
```

```json
// tsconfig.base.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist"
  }
}
```

```
# .gitignore
node_modules/
dist/
.env
*.log
.turbo/
```

```
# .env.example
# Database
DATABASE_URL=postgresql://dungeon:dungeon_pass@localhost:5432/ai_dungeon

# Redis
REDIS_URL=redis://localhost:6379/0

# LLM API
LLM_API_KEY=sk-your-api-key
LLM_MODEL=gpt-4o-mini
LLM_PROVIDER=openai

# Server
PORT=4000
HOST=0.0.0.0
JWT_SECRET=your-jwt-secret

# Vector
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIM=1536
```

- [ ] **Step 2: 创建 packages/shared stub**

```json
// packages/shared/package.json
{
  "name": "@ai-dungeon/shared",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsc",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0"
  }
}
```

```json
// packages/shared/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

```typescript
// packages/shared/src/index.ts
export * from './types/agent.js';
export * from './types/game.js';
export * from './types/api.js';
export * from './schemas/api.schema.js';
export * from './constants/index.js';
```

- [ ] **Step 3: 创建 packages/agent-core stub**

```json
// packages/agent-core/package.json
{
  "name": "@ai-dungeon/agent-core",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsc",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "@langchain/langgraph": "^0.2.0",
    "@langchain/core": "^0.3.0",
    "@langchain/openai": "^0.3.0",
    "@ai-dungeon/shared": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.5.0"
  }
}
```

```json
// packages/agent-core/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

- [ ] **Step 4: 创建 apps/server stub**

```json
// apps/server/package.json
{
  "name": "@ai-dungeon/server",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "fastify": "^4.28.0",
    "@fastify/cors": "^9.0.0",
    "@fastify/jwt": "^8.0.0",
    "@prisma/client": "^5.17.0",
    "ioredis": "^5.4.0",
    "bullmq": "^5.12.0",
    "zod": "^3.23.0",
    "@ai-dungeon/shared": "workspace:*",
    "@ai-dungeon/agent-core": "workspace:*"
  },
  "devDependencies": {
    "prisma": "^5.17.0",
    "tsx": "^4.16.0",
    "typescript": "^5.5.0",
    "@types/node": "^20.14.0"
  }
}
```

```json
// apps/server/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "module": "ESNext"
  },
  "include": ["src"]
}
```

- [ ] **Step 5: 创建 apps/web stub**

```json
// apps/web/package.json
{
  "name": "@ai-dungeon/web",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "pinia": "^2.2.0",
    "@radix-ui/react-dialog": "^1.1.0",
    "@radix-ui/react-scroll-area": "^1.1.0",
    "@radix-ui/react-slot": "^1.1.0",
    "tailwindcss": "^3.4.0",
    "clsx": "^2.1.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "typescript": "^5.5.0",
    "vite": "^5.4.0"
  }
}
```

```json
// apps/web/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "jsx": "react-jsx",
    "lib": ["ES2022", "DOM", "DOM.Iterable"]
  },
  "include": ["src"]
}
```

```typescript
// apps/web/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://server:4000',
    },
  },
});
```

- [ ] **Step 6: 安装依赖**

Run: `pnpm install`
Expected: 所有 workspace 包连接成功，依赖安装完成

- [ ] **Step 7: 初始化 git**

```bash
git init
git add -A
git commit -m "chore: initialize pnpm monorepo with turborepo"
```

---

### Task 2: 共享类型与 Schema (packages/shared)

**文件:**
- Modify: `packages/shared/src/types/agent.ts`
- Modify: `packages/shared/src/types/game.ts`
- Modify: `packages/shared/src/types/api.ts`
- Create: `packages/shared/src/schemas/api.schema.ts`
- Create: `packages/shared/src/constants/index.ts`

- [ ] **Step 1: 定义 Agent 类型**

```typescript
// packages/shared/src/types/agent.ts
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

// Agent Node types for LangGraph
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
```

- [ ] **Step 2: 定义游戏实体类型**

```typescript
// packages/shared/src/types/game.ts

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

// Re-export from agent for convenience
export type { GameEvent, StateDiff } from './agent.js';
```

- [ ] **Step 3: 定义 API 类型**

```typescript
// packages/shared/src/types/api.ts

// Request types
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

// SSE Event types
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

// Response types
export interface AuthResponse {
  token: string;
  user: UserProfile;
}

export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
}

// Import from game
import type { GameEvent, StateDiff } from './agent.js';
import type { UserProfile } from './game.js';
```

- [ ] **Step 4: 定义 Zod Schema**

```typescript
// packages/shared/src/schemas/api.schema.ts
import { z } from 'zod';

export const RegisterSchema = z.object({
  username: z.string().min(2).max(32),
  email: z.string().email(),
  password: z.string().min(6).max(128),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const CreateSessionSchema = z.object({
  worldId: z.string().min(1),
  characterName: z.string().min(1).max(32).optional(),
});

export const ActionSchema = z.object({
  input: z.string().min(1).max(2000),
});
```

- [ ] **Step 5: 定义常量**

```typescript
// packages/shared/src/constants/index.ts

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
    rules: {
      magic: true,
      technology: 'medieval',
      deities: 'pantheon',
    },
  },
  SCI_FI: {
    name: '星际边缘',
    description: '人类已经殖民银河系的科幻未来',
    setting: 'sci-fi',
    rules: {
      magic: false,
      technology: 'advanced',
      ftl: true,
    },
  },
} as const;

export const EMBEDDING_DIM = 1536;
export const MAX_HISTORY_TURNS = 50;
export const MEMORY_TOP_K = 5;
export const TOKEN_LIMIT_PER_TURN = 2048;
```

- [ ] **Step 6: 验证编译**

Run: `cd packages/shared && npx tsc --noEmit`
Expected: 无错误退出

---

### Task 3: Agent 核心运行时 (packages/agent-core)

**文件:**
- Create: `packages/agent-core/src/index.ts`
- Create: `packages/agent-core/src/nodes/supervisor.node.ts`
- Create: `packages/agent-core/src/nodes/memory-retrieve.node.ts`
- Create: `packages/agent-core/src/nodes/world-update.node.ts`
- Create: `packages/agent-core/src/nodes/narrator.node.ts`
- Create: `packages/agent-core/src/nodes/memory-store.node.ts`
- Create: `packages/agent-core/src/nodes/stream-output.node.ts`
- Create: `packages/agent-core/src/graph.ts`

- [ ] **Step 1: 定义 Supervisor Node**

```typescript
// packages/agent-core/src/nodes/supervisor.node.ts
import { type AgentState, type AgentIntent } from '@ai-dungeon/shared';

/**
 * Supervisor Node: 分析用户输入，判断意图（叙事/对话/探索/战斗）
 * 并路由到对应的处理流程。
 */
export async function supervisorNode(state: AgentState): Promise<Partial<AgentState>> {
  // 简单的规则路由 — Phase 1 使用关键词匹配，后续可升级为 LLM 分类
  const input = state.input.toLowerCase();
  let intent: AgentIntent = 'narrate';

  if (/战斗|攻击|砍|杀|射击|施放|火球|挥剑|射箭/i.test(input)) {
    intent = 'combat';
  } else if (/交谈|对话|问|说|告诉|询问|打探/i.test(input)) {
    intent = 'dialogue';
  } else if (/探索|查看|检查|调查|搜索|环顾|走|去|前往|向北|向南|向东|向西|进入|离开/i.test(input)) {
    intent = 'explore';
  }

  return {
    context: {
      ...state.context,
      intent,
    },
  };
}
```

- [ ] **Step 2: 定义 Memory Retrieve Node**

```typescript
// packages/agent-core/src/nodes/memory-retrieve.node.ts
import { type AgentState, type MemoryItem } from '@ai-dungeon/shared';

/**
 * MemoryRetrieve Node: 从向量数据库中检索相关记忆。
 * 当前为 stub 实现，后续注入真实 pgvector 查询。
 * 混合检索策略: 语义相似 + 时间衰减 + 重要性加权
 */
export interface MemoryRetrieveOptions {
  topK?: number;
  minImportance?: number;
  recentCount?: number;
}

export async function memoryRetrieveNode(
  state: AgentState,
  options?: MemoryRetrieveOptions,
): Promise<Partial<AgentState>> {
  const topK = options?.topK ?? 5;
  const recentCount = options?.recentCount ?? 10;

  // 占位: 真实实现通过 MemoryService 执行:
  // 1. 语义检索: SELECT * FROM memories ORDER BY embedding <-> $1 LIMIT topK
  // 2. 时间衰减: 最近 recentCount 条记忆
  // 3. 重要性过滤: importance > minImportance
  // 4. RRF 合并排序

  const memories: MemoryItem[] = [];

  return { memories };
}
```

- [ ] **Step 3: 定义 World Update Node**

```typescript
// packages/agent-core/src/nodes/world-update.node.ts
import { type AgentState, type StateDiff } from '@ai-dungeon/shared';

/**
 * WorldUpdate Node: 根据用户输入和语境，更新世界状态。
 * 计算状态差异，用于后续同步到前端和持久化。
 */
export async function worldUpdateNode(state: AgentState): Promise<Partial<AgentState>> {
  const stateDiff: StateDiff = {
    locationChanged: false,
    entityChanges: [],
    eventsTriggered: [],
  };

  // 占位: 真实实现通过 WorldService:
  // 1. 检查是否有移动意图 → 更新 location
  // 2. 检查是否有交互目标 → 更新 entity 状态
  // 3. 触发对应领域事件

  return { stateDiff };
}
```

- [ ] **Step 4: 定义 Narrator Node**

```typescript
// packages/agent-core/src/nodes/narrator.node.ts
import { type AgentState } from '@ai-dungeon/shared';

/**
 * Narrator Node: 核心叙事生成器。
 * 调用 LLM 生成故事文本，支持流式输出。
 * 
 * 生成策略:
 * 1. 构建包含世界状态、记忆、用户输入的 Prompt
 * 2. 调用 LLM chat.completions.stream API
 * 3. 逐个 Token 写入 state.narrativeTokens 用于 SSE 推送
 * 4. 检测结构化事件标记 (如 [COMBAT], [DISCOVERY]) 作为 GameEvent
 */
export interface NarratorNodeOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export async function narratorNode(
  state: AgentState,
  options?: NarratorNodeOptions,
): Promise<Partial<AgentState>> {
  const {
    model = 'gpt-4o-mini',
    temperature = 0.8,
    maxTokens = 2048,
  } = options ?? {};

  // 构建系统 Prompt
  const systemPrompt = buildNarratorPrompt(state);

  // 占位: 真实实现通过 LLM Client 流式调用:
  // const stream = await llm.streamChatCompletion({
  //   model, temperature, maxTokens,
  //   messages: [
  //     { role: 'system', content: systemPrompt },
  //     { role: 'user', content: state.input },
  //   ],
  // });
  //
  // for await (const chunk of stream) {
  //   const token = chunk.choices[0]?.delta?.content || '';
  //   narrativeTokens.push(token);
  // }
  //
  // // 从完整文本中解析 GameEvent
  // const events = parseGameEvents(fullNarrative);

  const narrativeTokens: string[] = [];
  const events = [];

  return {
    narrative: narrativeTokens.join(''),
    narrativeTokens,
    events,
  };
}

function buildNarratorPrompt(state: AgentState): string {
  const location = state.worldState.currentLocation;
  const entities = state.worldState.entities;
  const memories = state.memories;
  const recentHistory = state.context.recentHistory.slice(-5);

  return `你是 AI Dungeon Master，一个沉浸式开放世界文字 RPG 的叙事者。

## 当前场景
- 位置: ${location.name} — ${location.description}
- 出口: ${Object.keys(location.exits).join(', ')}
- 在场的实体: ${entities.map(e => e.name).join(', ')}

## 近期记忆
${memories.map(m => `- [${m.type}] ${m.content}`).join('\n')}

## 最近历史
${recentHistory.map(h => `玩家: ${h.input}\n叙事: ${h.output}`).join('\n')}

## 规则
1. 用生动的第二人称描述场景和事件
2. 每次回复 2-4 段，保持沉浸感
3. 玩家行动产生合理后果
4. 使用 [EVENT: type] 标记重要事件
5. 保持世界一致性和角色性格

## 玩家动作
${state.input}`;
}

function parseGameEvents(narrative: string): Array<{ type: string; title: string; description: string; data: Record<string, unknown> }> {
  const events: Array<{ type: string; title: string; description: string; data: Record<string, unknown> }> = [];
  const eventRegex = /\[EVENT:\s*(\w+)\]\s*(.*?)(?=\[EVENT|$)/gs;
  let match;

  while ((match = eventRegex.exec(narrative)) !== null) {
    events.push({
      type: match[1].toLowerCase(),
      title: match[1],
      description: match[2].trim(),
      data: {},
    });
  }

  return events;
}
```

- [ ] **Step 5: 定义 Stream Output Node**

```typescript
// packages/agent-core/src/nodes/stream-output.node.ts
import { type AgentState } from '@ai-dungeon/shared';
import { PassThrough } from 'node:stream';

/**
 * StreamOutput Node: 将生成的叙事和事件格式化为 SSE 数据，
 * 推送至前端的流通道。
 */
export async function streamOutputNode(state: AgentState): Promise<Partial<AgentState>> {
  // 占位: 真实实现通过 Fastify reply.raw 写入 SSE
  // for (const token of state.narrativeTokens) {
  //   sseStream.write({ event: 'token', data: token });
  // }
  // for (const event of state.events) {
  //   sseStream.write({ event: 'event', data: event });
  // }
  // if (state.stateDiff) {
  //   sseStream.write({ event: 'state', data: state.stateDiff });
  // }
  // sseStream.write({ event: 'complete', data: { turnNumber: state.turnNumber, tokensUsed } });

  return {};
}
```

- [ ] **Step 6: 定义 Memory Store Node**

```typescript
// packages/agent-core/src/nodes/memory-store.node.ts
import { type AgentState } from '@ai-dungeon/shared';

/**
 * MemoryStore Node: 将当前叙事结果持久化为记忆。
 * 通过 BullMQ 异步执行，避免阻塞主流程。
 */
export async function memoryStoreNode(state: AgentState): Promise<Partial<AgentState>> {
  // 占位: 真实实现通过 BullMQ 添加任务:
  // memoryQueue.add('store.memory', {
  //   entityId: state.context.playerEntityId,
  //   sessionId: state.sessionId,
  //   type: 'experience',
  //   content: state.narrative,
  //   importance: calculateImportance(state.input, state.narrative),
  // });

  return {};
}
```

- [ ] **Step 7: 定义 LangGraph StateGraph**

```typescript
// packages/agent-core/src/graph.ts
import {
  StateGraph,
  type StateGraphArgs,
  END,
} from '@langchain/langgraph';
import { type AgentState, AGENT_NODES, type AgentNodeType } from '@ai-dungeon/shared';
import { supervisorNode } from './nodes/supervisor.node.js';
import { memoryRetrieveNode } from './nodes/memory-retrieve.node.js';
import { worldUpdateNode } from './nodes/world-update.node.js';
import { narratorNode } from './nodes/narrator.node.js';
import { memoryStoreNode } from './nodes/memory-store.node.js';
import { streamOutputNode } from './nodes/stream-output.node.js';
import type { NarratorNodeOptions } from './nodes/narrator.node.js';

export interface GraphOptions {
  narrator?: NarratorNodeOptions;
}

/**
 * 构建 AI Dungeon Master 的 LangGraph StateGraph。
 * 
 * 执行流程:
 * Supervisor → MemoryRetrieve → WorldUpdate → Narrator → MemoryStore → StreamOutput → End
 */
export function buildDungeonGraph(options?: GraphOptions) {
  const graph = new StateGraph<AgentState>({
    channels: {
      input: { value: (a: string, b: string) => b ?? a },
      sessionId: { value: (a: string, b: string) => b ?? a },
      worldId: { value: (a: string, b: string) => b ?? a },
      userId: { value: (a: string, b: string) => b ?? a },
      turnNumber: { value: (a: number, b: number) => b ?? a },
      context: { value: (a: any, b: any) => ({ ...a, ...b }) },
      worldState: { value: (a: any, b: any) => ({ ...a, ...b }) },
      memories: { value: (a: any, b: any) => b ?? a },
      narrative: { value: (a: string, b: string) => b ?? a },
      narrativeTokens: { value: (a: string[], b: string[]) => [...a, ...b] },
      events: { value: (a: any[], b: any[]) => [...a, ...b] },
      stateDiff: { value: (a: any, b: any) => b ?? a },
      errors: { value: (a: string[], b: string[]) => [...a, ...b] },
    },
  } as unknown as StateGraphArgs<AgentState>)
    .addNode(AGENT_NODES.SUPERVISOR, async (state: AgentState) => supervisorNode(state))
    .addNode(AGENT_NODES.MEMORY_RETRIEVE, async (state: AgentState) => memoryRetrieveNode(state))
    .addNode(AGENT_NODES.WORLD_UPDATE, async (state: AgentState) => worldUpdateNode(state))
    .addNode(AGENT_NODES.NARRATOR, async (state: AgentState) => narratorNode(state, options?.narrator))
    .addNode(AGENT_NODES.MEMORY_STORE, async (state: AgentState) => memoryStoreNode(state))
    .addNode(AGENT_NODES.STREAM_OUTPUT, async (state: AgentState) => streamOutputNode(state))

    // 定义边
    .addEdge('__start__', AGENT_NODES.SUPERVISOR)
    .addEdge(AGENT_NODES.SUPERVISOR, AGENT_NODES.MEMORY_RETRIEVE)
    .addEdge(AGENT_NODES.MEMORY_RETRIEVE, AGENT_NODES.WORLD_UPDATE)
    .addEdge(AGENT_NODES.WORLD_UPDATE, AGENT_NODES.NARRATOR)
    .addEdge(AGENT_NODES.NARRATOR, AGENT_NODES.MEMORY_STORE)
    .addEdge(AGENT_NODES.MEMORY_STORE, AGENT_NODES.STREAM_OUTPUT)
    .addEdge(AGENT_NODES.STREAM_OUTPUT, END);

  return graph.compile();
}
```

- [ ] **Step 8: 编写 Agent Core 入口**

```typescript
// packages/agent-core/src/index.ts
export { buildDungeonGraph } from './graph.js';
export type { GraphOptions } from './graph.js';
export type { MemoryRetrieveOptions } from './nodes/memory-retrieve.node.js';
export type { NarratorNodeOptions } from './nodes/narrator.node.js';

export { supervisorNode } from './nodes/supervisor.node.js';
export { memoryRetrieveNode } from './nodes/memory-retrieve.node.js';
export { worldUpdateNode } from './nodes/world-update.node.js';
export { narratorNode } from './nodes/narrator.node.js';
export { memoryStoreNode } from './nodes/memory-store.node.js';
export { streamOutputNode } from './nodes/stream-output.node.js';
```

- [ ] **Step 9: 验证编译**

Run: `cd packages/agent-core && npx tsc --noEmit`
Expected: 无错误退出

---

### Task 4: 后端基础设施 (apps/server)

**文件:**
- Create: `apps/server/src/index.ts`
- Create: `apps/server/src/config.ts`
- Create: `apps/server/prisma/schema.prisma`
- Create: `apps/server/src/infrastructure/database/prisma.ts`
- Create: `apps/server/src/infrastructure/queue/queue.ts`
- Create: `apps/server/src/infrastructure/cache/redis.ts`
- Create: `apps/server/src/infrastructure/ai/llm.ts`

- [ ] **Step 1: 配置管理**

```typescript
// apps/server/src/config.ts
import 'dotenv/config';

export interface Config {
  port: number;
  host: string;
  database: {
    url: string;
  };
  redis: {
    url: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  llm: {
    apiKey: string;
    model: string;
    provider: 'openai' | 'anthropic';
    embeddingModel: string;
    embeddingDim: number;
  };
}

export const config: Config = {
  port: parseInt(process.env.PORT ?? '4000', 10),
  host: process.env.HOST ?? '0.0.0.0',
  database: {
    url: process.env.DATABASE_URL ?? 'postgresql://dungeon:dungeon_pass@localhost:5432/ai_dungeon',
  },
  redis: {
    url: process.env.REDIS_URL ?? 'redis://localhost:6379/0',
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
    expiresIn: '7d',
  },
  llm: {
    apiKey: process.env.LLM_API_KEY ?? '',
    model: process.env.LLM_MODEL ?? 'gpt-4o-mini',
    provider: (process.env.LLM_PROVIDER as 'openai' | 'anthropic') ?? 'openai',
    embeddingModel: process.env.EMBEDDING_MODEL ?? 'text-embedding-3-small',
    embeddingDim: parseInt(process.env.EMBEDDING_DIM ?? '1536', 10),
  },
};
```

- [ ] **Step 2: Prisma Schema**

```prisma
// apps/server/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum SessionStatus {
  ACTIVE
  PAUSED
  COMPLETED
}

model User {
  id        String          @id @default(cuid())
  username  String          @unique
  email     String          @unique
  password  String
  createdAt DateTime        @default(now())
  sessions  GameSession[]
}

model GameSession {
  id        String          @id @default(cuid())
  userId    String
  user      User            @relation(fields: [userId], references: [id])
  worldId   String
  world     World           @relation(fields: [worldId], references: [id])
  status    SessionStatus   @default(ACTIVE)
  turnCount Int             @default(0)
  createdAt DateTime         @default(now())
  updatedAt DateTime         @updatedAt
  turns     Turn[]
}

model World {
  id          String     @id @default(cuid())
  name        String
  description String
  setting     String
  rules       Json
  state       Json       @default("{}")
  createdAt   DateTime   @default(now())
  sessions    GameSession[]
  locations   Location[]
  entities    Entity[]
}

model Location {
  id          String   @id @default(cuid())
  worldId     String
  world       World    @relation(fields: [worldId], references: [id])
  name        String
  description String
  exits       Json
  metadata    Json     @default("{}")
  createdAt   DateTime @default(now())
}

model Turn {
  id         String   @id @default(cuid())
  sessionId  String
  session    GameSession @relation(fields: [sessionId], references: [id])
  input      String
  output     Json
  turnNumber Int
  tokensUsed Int      @default(0)
  createdAt  DateTime @default(now())
}

model Entity {
  id          String   @id @default(cuid())
  worldId     String
  world       World    @relation(fields: [worldId], references: [id])
  name        String
  type        String
  attributes  Json
  locationId  String?
  location    Location? @relation(fields: [locationId], references: [id])
  state       Json     @default("{}")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  memories    Memory[]
}

model Memory {
  id          String   @id @default(cuid())
  entityId    String
  entity      Entity   @relation(fields: [entityId], references: [id])
  sessionId   String
  type        String
  content     String
  importance  Float    @default(0.5)
  embedding   Unsupported("vector(1536)")?
  metadata    Json     @default("{}")
  createdAt   DateTime @default(now())
}

model Event {
  id          String   @id @default(cuid())
  worldId     String
  type        String
  title       String
  description String
  data        Json     @default("{}")
  isProcessed Boolean  @default(false)
  createdAt   DateTime @default(now())
}
```

- [ ] **Step 3: 创建数据库迁移 + 种子数据**

```bash
cd apps/server
npx prisma migrate dev --name init
```

```typescript
// apps/server/prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 创建默认奇幻世界
  const world = await prisma.world.create({
    data: {
      name: '艾泽拉斯',
      description: '一个充满魔法与龙的奇幻世界。古老的森林、险峻的山脉和神秘的遗迹等待着勇敢的冒险者。',
      setting: 'fantasy',
      rules: { magic: true, technology: 'medieval', deities: 'pantheon' },
      state: { timeOfDay: 'morning', weather: 'clear', season: 'spring' },
    },
  });

  // 创建初始地点
  const startLocation = await prisma.location.create({
    data: {
      worldId: world.id,
      name: '晨风村',
      description: '一个宁静的小村庄，坐落在青翠的山谷中。炊烟袅袅，村民们开始了一天的劳作。',
      exits: { north: '迷雾森林', east: '古老之路', south: '风吟平原' },
      metadata: { isSafe: true, population: 120 },
    },
  });

  const forest = await prisma.location.create({
    data: {
      worldId: world.id,
      name: '迷雾森林',
      description: '浓密的雾气笼罩着古老的树木，只有微弱的阳光能穿透层层树冠。远处传来不知名的鸟鸣。',
      exits: { south: '晨风村', east: '山丘遗迹' },
      metadata: { isSafe: false, danger: 'moderate' },
    },
  });

  // 创建玩家初始实体 (NPC 村民)
  await prisma.entity.create({
    data: {
      worldId: world.id,
      name: '铁匠托比',
      type: 'npc',
      locationId: startLocation.id,
      attributes: { strength: 14, charisma: 10, skills: ['锻造', '修理'] },
      state: { mood: 'friendly', shop: { hasWeapons: true } },
    },
  });

  console.log('Seed data created:', { world: world.id, locations: [startLocation.id, forest.id] });
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
```

```json
// apps/server/prisma/seed 配置 — 添加到 apps/server/package.json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

- [ ] **Step 4: Prisma Client 封装**

```typescript
// apps/server/src/infrastructure/database/prisma.ts
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
});

export async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log('Database connected');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
}
```

- [ ] **Step 5: Redis 连接**

```typescript
// apps/server/src/infrastructure/cache/redis.ts
import { Redis } from 'ioredis';
import { config } from '../../config.js';

export const redis = new Redis(config.redis.url, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

redis.on('connect', () => console.log('Redis connected'));
redis.on('error', (err) => console.error('Redis error:', err));
```

- [ ] **Step 6: BullMQ 队列**

```typescript
// apps/server/src/infrastructure/queue/queue.ts
import { Queue, Worker, type Job } from 'bullmq';
import { redis } from '../cache/redis.js';

// 队列定义
export const memoryQueue = new Queue('memory', { connection: redis });
export const worldQueue = new Queue('world', { connection: redis });

// Worker 定义
export const memoryWorker = new Worker('memory', async (job: Job) => {
  switch (job.name) {
    case 'store.memory':
      await handleStoreMemory(job.data);
      break;
    case 'embed.memory':
      await handleEmbedMemory(job.data);
      break;
  }
}, { connection: redis });

export const worldWorker = new Worker('world', async (job: Job) => {
  switch (job.name) {
    case 'evolve.world':
      await handleWorldEvolve(job.data);
      break;
    case 'schedule.event':
      await handleScheduleEvent(job.data);
      break;
  }
}, { connection: redis });

async function handleStoreMemory(data: any) {
  const { entityId, sessionId, type, content, importance } = data;
  // 通过 MemoryService 持久化
  const { memoryService } = await import('../../modules/memory/application/memory.service.js');
  await memoryService.storeMemory({ entityId, sessionId, type, content, importance });
}

async function handleEmbedMemory(data: any) {
  const { memoryId, content } = data;
  // 调用 LLM Embedding API → 更新 pgvector
  const { llm } = await import('../ai/llm.js');
  const embedding = await llm.embed(content);
  const { prisma } = await import('../database/prisma.js');
  await prisma.$executeRaw`
    UPDATE memories SET embedding = ${embedding}::vector WHERE id = ${memoryId}
  `;
}

async function handleWorldEvolve(_data: any) {
  // 世界状态被动演化
  const { worldService } = await import('../../modules/world/application/world.service.js');
  await worldService.evolveWorld();
}

async function handleScheduleEvent(_data: any) {
  // 定时事件触发
}

export async function closeQueues() {
  await memoryQueue.close();
  await worldQueue.close();
  await memoryWorker.close();
  await worldWorker.close();
}
```

- [ ] **Step 7: LLM Client**

```typescript
// apps/server/src/infrastructure/ai/llm.ts
import OpenAI from 'openai';
import { config } from '../../config.js';

class LLMClient {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: config.llm.apiKey,
    });
  }

  async *streamChat(options: {
    model?: string;
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    temperature?: number;
    maxTokens?: number;
  }): AsyncGenerator<string> {
    const stream = await this.client.chat.completions.create({
      model: options.model ?? config.llm.model,
      messages: options.messages,
      temperature: options.temperature ?? 0.8,
      max_tokens: options.maxTokens ?? 2048,
      stream: true,
    });

    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content || '';
      if (token) yield token;
    }
  }

  async embed(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: config.llm.embeddingModel,
      input: text,
    });
    return response.data[0].embedding;
  }
}

export const llm = new LLMClient();
```

- [ ] **Step 8: Fastify 应用入口**

```typescript
// apps/server/src/app.ts
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { config } from './config.js';
import { authRoutes } from './modules/user/interfaces/auth.routes.js';
import { sessionRoutes } from './modules/game/interfaces/session.routes.js';
import { actionRoutes } from './modules/narrative/interfaces/action.routes.js';
import { streamRoutes } from './modules/narrative/interfaces/stream.routes.js';
import { worldRoutes } from './modules/world/interfaces/world.routes.js';
import { memoryRoutes } from './modules/memory/interfaces/memory.routes.js';

export async function buildApp() {
  const app = Fastify({
    logger: true,
  });

  // 插件
  await app.register(cors, { origin: true });
  await app.register(jwt, { secret: config.jwt.secret });

  // 认证装饰器
  app.decorate('authenticate', async (request: any, reply: any) => {
    try {
      await request.jwtVerify();
    } catch {
      reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  // 注册路由
  await app.register(authRoutes, { prefix: '/api/v1/auth' });
  await app.register(sessionRoutes, { prefix: '/api/v1/sessions' });
  await app.register(actionRoutes, { prefix: '/api/v1' });
  await app.register(streamRoutes, { prefix: '/api/v1' });
  await app.register(worldRoutes, { prefix: '/api/v1/worlds' });
  await app.register(memoryRoutes, { prefix: '/api/v1' });

  // 健康检查
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  return app;
}
```

- [ ] **Step 9: 服务入口**

```typescript
// apps/server/src/index.ts
import { config } from './config.js';
import { buildApp } from './app.js';
import { connectDatabase } from './infrastructure/database/prisma.js';
import { redis } from './infrastructure/cache/redis.js';

async function main() {
  await connectDatabase();
  await redis.ping();

  const app = await buildApp();

  await app.listen({ port: config.port, host: config.host });
  console.log(`Server running on http://${config.host}:${config.port}`);
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
```

- [ ] **Step 10: 验证编译**

Run: `cd apps/server && npx tsc --noEmit`
Expected: 无错误退出

---

### Task 5: 后端业务模块

**文件:**
- Create: `apps/server/src/modules/user/application/auth.service.ts`
- Create: `apps/server/src/modules/user/interfaces/auth.routes.ts`
- Create: `apps/server/src/modules/game/domain/entities.ts`
- Create: `apps/server/src/modules/game/application/session.service.ts`
- Create: `apps/server/src/modules/game/interfaces/session.routes.ts`
- Create: `apps/server/src/modules/narrative/application/action.service.ts`
- Create: `apps/server/src/modules/narrative/interfaces/action.routes.ts`
- Create: `apps/server/src/modules/narrative/interfaces/stream.routes.ts`
- Create: `apps/server/src/modules/world/application/world.service.ts`
- Create: `apps/server/src/modules/world/interfaces/world.routes.ts`
- Create: `apps/server/src/modules/memory/application/memory.service.ts`
- Create: `apps/server/src/modules/memory/interfaces/memory.routes.ts`

- [ ] **Step 1: Auth 模块**

```typescript
// apps/server/src/modules/user/application/auth.service.ts
import { prisma } from '../../../infrastructure/database/prisma.js';
import { config } from '../../../config.js';
import type { UserProfile } from '@ai-dungeon/shared';

export const authService = {
  async register(username: string, email: string, password: string): Promise<{ token: string; user: UserProfile }> {
    const bcrypt = await import('bcryptjs');
    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { username, email, password: hashed },
    });

    const token = await this.generateToken(user.id);
    return { token, user: { id: user.id, username: user.username, email: user.email, createdAt: user.createdAt.toISOString() } };
  },

  async login(email: string, password: string): Promise<{ token: string; user: UserProfile }> {
    const bcrypt = await import('bcryptjs');
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('Invalid credentials');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error('Invalid credentials');

    const token = await this.generateToken(user.id);
    return { token, user: { id: user.id, username: user.username, email: user.email, createdAt: user.createdAt.toISOString() } };
  },

  async generateToken(userId: string): Promise<string> {
    const jwt = await import('jsonwebtoken');
    return jwt.sign({ sub: userId }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
  },

  async getProfile(userId: string): Promise<UserProfile> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');
    return { id: user.id, username: user.username, email: user.email, createdAt: user.createdAt.toISOString() };
  },
};
```

```typescript
// apps/server/src/modules/user/interfaces/auth.routes.ts
import type { FastifyInstance } from 'fastify';
import { authService } from '../application/auth.service.js';
import { RegisterSchema, LoginSchema } from '@ai-dungeon/shared';

export async function authRoutes(app: FastifyInstance) {
  app.post('/register', async (request, reply) => {
    const body = RegisterSchema.parse(request.body);
    try {
      const result = await authService.register(body.username, body.email, body.password);
      return reply.status(201).send(result);
    } catch (error: any) {
      return reply.status(400).send({ error: 'Registration failed', message: error.message });
    }
  });

  app.post('/login', async (request, reply) => {
    const body = LoginSchema.parse(request.body);
    try {
      const result = await authService.login(body.email, body.password);
      return reply.send(result);
    } catch (error: any) {
      return reply.status(401).send({ error: 'Login failed', message: error.message });
    }
  });
}
```

- [ ] **Step 2: Game Session 模块**

```typescript
// apps/server/src/modules/game/domain/entities.ts
export interface GameSessionEntity {
  id: string;
  userId: string;
  worldId: string;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  turnNumber: number;
  createdAt: Date;
  updatedAt: Date;
}
```

```typescript
// apps/server/src/modules/game/application/session.service.ts
import { prisma } from '../../../infrastructure/database/prisma.js';
import type { GameSessionData } from '@ai-dungeon/shared';
import type { GameSessionEntity } from '../domain/entities.js';

export const sessionService = {
  async create(userId: string, worldId: string): Promise<GameSessionData> {
    const session = await prisma.gameSession.create({
      data: { userId, worldId },
      include: { world: true },
    });

    // 创建玩家实体
    await prisma.entity.create({
      data: {
        worldId,
        name: '冒险者',
        type: 'player',
        locationId: (await prisma.location.findFirst({ where: { worldId } }))?.id,
        attributes: { strength: 10, dexterity: 10, intelligence: 10, charisma: 10, hp: 100, mp: 50 },
        state: { level: 1, xp: 0 },
      },
    });

    return toSessionData(session);
  },

  async list(userId: string): Promise<GameSessionData[]> {
    const sessions = await prisma.gameSession.findMany({
      where: { userId },
      include: { world: true },
      orderBy: { updatedAt: 'desc' },
    });
    return sessions.map(toSessionData);
  },

  async getById(sessionId: string, userId: string): Promise<GameSessionData | null> {
    const session = await prisma.gameSession.findFirst({
      where: { id: sessionId, userId },
      include: { world: true },
    });
    return session ? toSessionData(session) : null;
  },

  async delete(sessionId: string, userId: string): Promise<void> {
    await prisma.gameSession.deleteMany({
      where: { id: sessionId, userId },
    });
  },
};

function toSessionData(session: any): GameSessionData {
  return {
    id: session.id,
    userId: session.userId,
    worldId: session.worldId,
    status: session.status,
    turnNumber: session.turnCount,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
    world: session.world ? {
      id: session.world.id,
      name: session.world.name,
      description: session.world.description,
      setting: session.world.setting,
      rules: session.world.rules as Record<string, unknown>,
      state: session.world.state as Record<string, unknown>,
    } : undefined,
  };
}
```

```typescript
// apps/server/src/modules/game/interfaces/session.routes.ts
import type { FastifyInstance } from 'fastify';
import { sessionService } from '../application/session.service.js';
import { CreateSessionSchema } from '@ai-dungeon/shared';

export async function sessionRoutes(app: FastifyInstance) {
  app.addHook('preHandler', async (request: any, reply: any) => {
    try { await request.jwtVerify(); }
    catch { reply.status(401).send({ error: 'Unauthorized' }); }
  });

  app.post('/', async (request: any, reply) => {
    const body = CreateSessionSchema.parse(request.body);
    const session = await sessionService.create(request.user.sub, body.worldId);
    return reply.status(201).send(session);
  });

  app.get('/', async (request: any) => {
    return sessionService.list(request.user.sub);
  });

  app.get<{ Params: { id: string } }>('/:id', async (request: any, reply) => {
    const session = await sessionService.getById(request.params.id, request.user.sub);
    if (!session) return reply.status(404).send({ error: 'Session not found' });
    return session;
  });

  app.delete<{ Params: { id: string } }>('/:id', async (request: any, reply) => {
    await sessionService.delete(request.params.id, request.user.sub);
    return reply.status(204).send();
  });
}
```

- [ ] **Step 3: Narrative Action 模块**

```typescript
// apps/server/src/modules/narrative/application/action.service.ts
import { prisma } from '../../../infrastructure/database/prisma.js';
import { buildDungeonGraph } from '@ai-dungeon/agent-core';
import type { AgentState, SSEEvent } from '@ai-dungeon/shared';
import { llm } from '../../../infrastructure/ai/llm.js';

export interface ActionResult {
  turn: { turnNumber: number; tokensUsed: number };
  events: SSEEvent[];
}

/**
 * 处理玩家动作: 编排 Agent 图执行
 */
export const actionService = {
  async processAction(sessionId: string, userId: string, input: string): Promise<void> {
    // 加载会话和世界状态
    const session = await prisma.gameSession.findFirst({
      where: { id: sessionId, userId },
      include: { world: { include: { locations: true, entities: true } } },
    });

    if (!session) throw new Error('Session not found');

    const currentLocation = session.world.locations[0]; // 简化: 取第一个地点
    const entities = session.world.entities;

    // 构建 AgentState
    const state: AgentState = {
      input,
      sessionId: session.id,
      worldId: session.world.id,
      userId: session.userId,
      turnNumber: session.turnCount + 1,
      context: {
        currentLocationId: currentLocation.id,
        recentHistory: [], // 可加载最近回合
        playerEntityId: entities.find(e => e.type === 'player')?.id ?? '',
        intent: 'narrate',
      },
      worldState: {
        currentLocation: {
          id: currentLocation.id,
          name: currentLocation.name,
          description: currentLocation.description,
          exits: currentLocation.exits as Record<string, string>,
          entities: entities.filter(e => e.locationId === currentLocation.id).map(e => e.id),
        },
        entities: entities.map(e => ({
          id: e.id,
          name: e.name,
          type: e.type,
          attributes: e.attributes as Record<string, unknown>,
          locationId: e.locationId ?? '',
          state: e.state as Record<string, unknown>,
        })),
        globalState: session.world.state as Record<string, unknown>,
        recentEvents: [],
      },
      memories: [],
      narrative: '',
      narrativeTokens: [],
      events: [],
      stateDiff: null,
      errors: [],
    };

    // 替换 Narrator 节点为真实 LLM 调用
    const graph = buildDungeonGraph({
      narrator: { model: 'gpt-4o-mini', temperature: 0.8, maxTokens: 2048 },
    });

    // 以普通模式（非流式）运行
    const result = await graph.invoke(state);

    // 持久化 Turn
    await prisma.turn.create({
      data: {
        sessionId: session.id,
        input,
        output: {
          narrative: result.narrative,
          events: result.events,
          stateDiff: result.stateDiff,
        },
        turnNumber: session.turnCount + 1,
        tokensUsed: result.narrativeTokens.length,
      },
    });

    // 更新 session turn count
    await prisma.gameSession.update({
      where: { id: session.id },
      data: { turnCount: { increment: 1 } },
    });
  },

  /**
   * 流式处理玩家动作: 逐 Token 推送 SSE
   */
  async *processActionStream(
    sessionId: string,
    userId: string,
    input: string,
  ): AsyncGenerator<SSEEvent> {
    const session = await prisma.gameSession.findFirst({
      where: { id: sessionId, userId },
      include: { world: { include: { locations: true, entities: true } } },
    });

    if (!session) throw new Error('Session not found');

    const currentLocation = session.world.locations[0];
    const entities = session.world.entities;

    // 构建系统 Prompt
    const systemPrompt = `你是 AI Dungeon Master，一个沉浸式开放世界文字 RPG 的叙事者。

当前场景:
- 位置: ${currentLocation.name} — ${currentLocation.description}
- 出口: ${Object.keys(currentLocation.exits as Record<string, string>).join(', ')}

在场的实体: ${entities.filter(e => e.locationId === currentLocation.id).map(e => e.name).join(', ')}

规则:
1. 用生动的第二人称描述场景和事件
2. 每次回复 2-4 段，保持沉浸感
3. 玩家行动产生合理后果
4. 保持世界一致性和角色性格`;

    let fullNarrative = '';
    let tokensUsed = 0;

    // 流式调用 LLM
    const stream = llm.streamChat({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: input },
      ],
    });

    for await (const token of stream) {
      fullNarrative += token;
      tokensUsed++;
      yield { event: 'token', data: token };
    }

    // 持久化 Turn
    await prisma.turn.create({
      data: {
        sessionId: session.id,
        input,
        output: { narrative: fullNarrative, events: [], stateDiff: null },
        turnNumber: session.turnCount + 1,
        tokensUsed,
      },
    });

    await prisma.gameSession.update({
      where: { id: session.id },
      data: { turnCount: { increment: 1 } },
    });

    yield { event: 'complete', data: { turnNumber: session.turnCount + 1, tokensUsed } };
  },
};
```

- [ ] **Step 4: Action Routes**

```typescript
// apps/server/src/modules/narrative/interfaces/action.routes.ts
import type { FastifyInstance } from 'fastify';
import { actionService } from '../application/action.service.js';
import { ActionSchema } from '@ai-dungeon/shared';

export async function actionRoutes(app: FastifyInstance) {
  app.addHook('preHandler', async (request: any, reply: any) => {
    try { await request.jwtVerify(); }
    catch { reply.status(401).send({ error: 'Unauthorized' }); }
  });

  // 同步动作处理 (非流式)
  app.post<{ Params: { id: string } }>('/sessions/:id/actions', async (request: any, reply) => {
    const { id } = request.params;
    const body = ActionSchema.parse(request.body);

    // 202 Accepted — 异步处理
    reply.status(202).send({ status: 'processing' });

    // 实际处理 (不阻塞响应)
    actionService.processAction(id, request.user.sub, body.input).catch(console.error);
  });
}
```

- [ ] **Step 5: SSE Stream Routes**

```typescript
// apps/server/src/modules/narrative/interfaces/stream.routes.ts
import type { FastifyInstance } from 'fastify';
import { actionService } from '../application/action.service.js';
import { ActionSchema } from '@ai-dungeon/shared';

export async function streamRoutes(app: FastifyInstance) {
  app.addHook('preHandler', async (request: any, reply: any) => {
    try { await request.jwtVerify(); }
    catch { reply.status(401).send({ error: 'Unauthorized' }); }
  });

  // SSE 流式连接
  app.get<{ Params: { id: string } }>('/sessions/:id/stream', (request: any, reply: any) => {
    const { id } = request.params;

    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    // 保持连接
    const keepAlive = setInterval(() => {
      reply.raw.write(': keepalive\n\n');
    }, 15000);

    request.raw.on('close', () => {
      clearInterval(keepAlive);
    });
  });

  // 发送动作并流式接收响应
  app.post<{ Params: { id: string } }>('/sessions/:id/actions/stream', async (request: any, reply: any) => {
    const { id } = request.params;
    const body = ActionSchema.parse(request.body);

    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    try {
      const stream = actionService.processActionStream(id, request.user.sub, body.input);

      for await (const event of stream) {
        const line = `event: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`;
        reply.raw.write(line);
      }
    } catch (error: any) {
      const errorLine = `event: error\ndata: ${JSON.stringify({ code: 'PROCESSING_ERROR', message: error.message })}\n\n`;
      reply.raw.write(errorLine);
    }

    reply.raw.end();
  });
}
```

- [ ] **Step 6: World 模块**

```typescript
// apps/server/src/modules/world/application/world.service.ts
import { prisma } from '../../../infrastructure/database/prisma.js';
import type { WorldData, LocationData, EntityData } from '@ai-dungeon/shared';

export const worldService = {
  async list(): Promise<WorldData[]> {
    const worlds = await prisma.world.findMany();
    return worlds.map(w => ({
      id: w.id,
      name: w.name,
      description: w.description,
      setting: w.setting,
      rules: w.rules as Record<string, unknown>,
      state: w.state as Record<string, unknown>,
    }));
  },

  async getById(worldId: string): Promise<WorldData | null> {
    const world = await prisma.world.findUnique({ where: { id: worldId } });
    if (!world) return null;
    return {
      id: world.id,
      name: world.name,
      description: world.description,
      setting: world.setting,
      rules: world.rules as Record<string, unknown>,
      state: world.state as Record<string, unknown>,
    };
  },

  async getLocations(worldId: string): Promise<LocationData[]> {
    const locations = await prisma.location.findMany({ where: { worldId } });
    return locations.map(l => ({
      id: l.id,
      worldId: l.worldId,
      name: l.name,
      description: l.description,
      exits: l.exits as Record<string, string>,
      metadata: l.metadata as Record<string, unknown>,
    }));
  },

  async getEntities(worldId: string): Promise<EntityData[]> {
    const entities = await prisma.entity.findMany({ where: { worldId } });
    return entities.map(e => ({
      id: e.id,
      worldId: e.worldId,
      name: e.name,
      type: e.type,
      attributes: e.attributes as Record<string, unknown>,
      locationId: e.locationId,
      state: e.state as Record<string, unknown>,
    }));
  },

  async evolveWorld() {
    // BullMQ worker 调用: 世界状态演化
    // 例如: 时间推移、NPC 移动、随机事件等
  },
};
```

```typescript
// apps/server/src/modules/world/interfaces/world.routes.ts
import type { FastifyInstance } from 'fastify';
import { worldService } from '../application/world.service.js';

export async function worldRoutes(app: FastifyInstance) {
  app.get('/', async () => {
    return worldService.list();
  });

  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const world = await worldService.getById(request.params.id);
    if (!world) return reply.status(404).send({ error: 'World not found' });
    return world;
  });

  app.get<{ Params: { id: string } }>('/:id/locations', async (request) => {
    return worldService.getLocations(request.params.id);
  });

  app.get<{ Params: { id: string } }>('/:id/entities', async (request) => {
    return worldService.getEntities(request.params.id);
  });
}
```

- [ ] **Step 7: Memory 模块**

```typescript
// apps/server/src/modules/memory/application/memory.service.ts
import { prisma } from '../../../infrastructure/database/prisma.js';
import type { MemoryItem } from '@ai-dungeon/shared';

export const memoryService = {
  async storeMemory(data: {
    entityId: string;
    sessionId: string;
    type: string;
    content: string;
    importance: number;
  }): Promise<void> {
    await prisma.memory.create({ data });
  },

  async retrieveMemories(sessionId: string, topK: number = 5): Promise<MemoryItem[]> {
    // 基于时间和重要性的检索 (Phase 1: 无向量)
    const memories = await prisma.memory.findMany({
      where: { sessionId },
      orderBy: [{ importance: 'desc' }, { createdAt: 'desc' }],
      take: topK,
    });

    return memories.map(m => ({
      id: m.id,
      content: m.content,
      importance: m.importance,
      type: m.type as 'experience' | 'knowledge' | 'relationship',
      entityId: m.entityId,
      createdAt: m.createdAt.toISOString(),
    }));
  },

  async retrieveMemoriesByVector(
    sessionId: string,
    embedding: number[],
    topK: number = 5,
  ): Promise<MemoryItem[]> {
    // 向量检索 (需 pgvector)
    const memories = await prisma.$queryRaw`
      SELECT id, "entityId", "sessionId", type, content, importance, "createdAt",
             1 - (embedding <=> ${embedding}::vector) as similarity
      FROM memories
      WHERE "sessionId" = ${sessionId}
      ORDER BY similarity DESC
      LIMIT ${topK}
    ` as any[];

    return memories.map(m => ({
      id: m.id,
      content: m.content,
      importance: m.importance,
      type: m.type,
      entityId: m.entityId,
      createdAt: m.createdAt.toISOString(),
      similarity: m.similarity,
    }));
  },

  async getSessionHistory(sessionId: string): Promise<any[]> {
    const turns = await prisma.turn.findMany({
      where: { sessionId },
      orderBy: { turnNumber: 'asc' },
      take: 50,
    });

    return turns.map(t => ({
      id: t.id,
      turnNumber: t.turnNumber,
      input: t.input,
      output: t.output,
      createdAt: t.createdAt.toISOString(),
    }));
  },
};
```

```typescript
// apps/server/src/modules/memory/interfaces/memory.routes.ts
import type { FastifyInstance } from 'fastify';
import { memoryService } from '../application/memory.service.js';

export async function memoryRoutes(app: FastifyInstance) {
  app.addHook('preHandler', async (request: any, reply: any) => {
    try { await request.jwtVerify(); }
    catch { reply.status(401).send({ error: 'Unauthorized' }); }
  });

  app.get<{ Params: { id: string } }>('/sessions/:id/history', async (request: any) => {
    return memoryService.getSessionHistory(request.params.id);
  });

  app.get<{ Params: { id: string } }>('/sessions/:id/memories', async (request: any) => {
    return memoryService.retrieveMemories(request.params.id);
  });
}
```

---

### Task 6: 前端 React 应用 (apps/web)

**文件:**
- Create: `apps/web/src/main.tsx`
- Create: `apps/web/src/App.tsx`
- Create: `apps/web/index.html`
- Create: `apps/web/src/stores/session.ts`
- Create: `apps/web/src/stores/game.ts`
- Create: `apps/web/src/composables/useSSE.ts`
- Create: `apps/web/src/utils/api.ts`
- Create: `apps/web/src/views/LoginView.tsx`
- Create: `apps/web/src/views/LobbyView.tsx`
- Create: `apps/web/src/views/GameView.tsx`
- Create: `apps/web/src/components/ChatMessage.tsx`
- Create: `apps/web/src/components/ChatInput.tsx`
- Create: `apps/web/src/components/GameSidebar.tsx`
- Create: `apps/web/tailwind.config.js`
- Create: `apps/web/postcss.config.js`

- [ ] **Step 1: 入口文件**

```html
<!-- apps/web/index.html -->
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AI Dungeon Master</title>
  <link rel="icon" type="image/svg+xml" href="/vite.svg" />
</head>
<body class="bg-gray-950 text-gray-100">
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

```typescript
// apps/web/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createPinia } from 'pinia';
import { App } from './App';
import './index.css';

const pinia = createPinia();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

```css
/* apps/web/src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-gray-950 text-gray-100 antialiased;
  }
}

@layer components {
  .prose-dungeon {
    @apply leading-relaxed text-gray-200;
  }
  .prose-dungeon p {
    @apply mb-4;
  }
}
```

- [ ] **Step 2: API 工具**

```typescript
// apps/web/src/utils/api.ts
const API_BASE = '/api/v1';

let token: string | null = localStorage.getItem('auth_token');

export function setAuthToken(newToken: string | null) {
  token = newToken;
  if (newToken) localStorage.setItem('auth_token', newToken);
  else localStorage.removeItem('auth_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
}

export const api = {
  // Auth
  register: (data: { username: string; email: string; password: string }) =>
    request<{ token: string; user: any }>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) =>
    request<{ token: string; user: any }>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  // Sessions
  createSession: (worldId: string) =>
    request<any>('/sessions', { method: 'POST', body: JSON.stringify({ worldId }) }),
  listSessions: () => request<any[]>('/sessions'),
  getSession: (id: string) => request<any>(`/sessions/${id}`),
  deleteSession: (id: string) =>
    request<void>(`/sessions/${id}`, { method: 'DELETE' }),

  // Worlds
  listWorlds: () => request<any[]>('/worlds'),
  getWorld: (id: string) => request<any>(`/worlds/${id}`),
  getWorldLocations: (id: string) => request<any[]>(`/worlds/${id}/locations`),
  getWorldEntities: (id: string) => request<any[]>(`/worlds/${id}/entities`),

  // History
  getHistory: (sessionId: string) => request<any[]>(`/sessions/${sessionId}/history`),
  getMemories: (sessionId: string) => request<any[]>(`/sessions/${sessionId}/memories`),
};
```

- [ ] **Step 3: Pinia Stores**

```typescript
// apps/web/src/stores/session.ts
import { defineStore } from 'pinia';
import { api, setAuthToken } from '../utils/api';

interface User {
  id: string;
  username: string;
  email: string;
}

interface Session {
  id: string;
  worldId: string;
  status: string;
  turnNumber: number;
  createdAt: string;
  world?: { name: string; setting: string };
}

export const useSessionStore = defineStore('session', {
  state: () => ({
    user: null as User | null,
    sessions: [] as Session[],
    currentSession: null as Session | null,
    loading: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
  },

  actions: {
    async login(email: string, password: string) {
      const result = await api.login({ email, password });
      setAuthToken(result.token);
      this.user = result.user;
    },

    async register(username: string, email: string, password: string) {
      const result = await api.register({ username, email, password });
      setAuthToken(result.token);
      this.user = result.user;
    },

    logout() {
      setAuthToken(null);
      this.user = null;
      this.sessions = [];
      this.currentSession = null;
    },

    async loadSessions() {
      this.loading = true;
      try {
        this.sessions = await api.listSessions();
      } finally {
        this.loading = false;
      }
    },

    async createSession(worldId: string) {
      const session = await api.createSession(worldId);
      this.sessions.unshift(session);
      this.currentSession = session;
      return session;
    },

    async loadSession(id: string) {
      const session = await api.getSession(id);
      this.currentSession = session;
      return session;
    },

    async deleteSession(id: string) {
      await api.deleteSession(id);
      this.sessions = this.sessions.filter(s => s.id !== id);
      if (this.currentSession?.id === id) this.currentSession = null;
    },
  },
});
```

```typescript
// apps/web/src/stores/game.ts
import { defineStore } from 'pinia';

interface GameEvent {
  type: string;
  title: string;
  description: string;
}

interface Turn {
  input: string;
  narrative: string;
  events: GameEvent[];
  turnNumber: number;
}

export const useGameStore = defineStore('game', {
  state: () => ({
    turns: [] as Turn[],
    currentNarrative: '',
    isStreaming: false,
    currentEvents: [] as GameEvent[],
    error: null as string | null,
  }),

  getters: {
    recentHistory: (state) => state.turns.slice(-10),
  },

  actions: {
    startStreaming() {
      this.isStreaming = true;
      this.currentNarrative = '';
      this.currentEvents = [];
      this.error = null;
    },

    appendToken(token: string) {
      this.currentNarrative += token;
    },

    addEvent(event: GameEvent) {
      this.currentEvents.push(event);
    },

    completeTurn(input: string, turnNumber: number) {
      this.turns.push({
        input,
        narrative: this.currentNarrative,
        events: this.currentEvents,
        turnNumber,
      });
      this.isStreaming = false;
      this.currentNarrative = '';
      this.currentEvents = [];
    },

    setError(message: string) {
      this.error = message;
      this.isStreaming = false;
    },
  },
});
```

- [ ] **Step 4: SSE Composable**

```typescript
// apps/web/src/composables/useSSE.ts
import { useGameStore } from '../stores/game';
import type { SSEEvent } from '@ai-dungeon/shared';

const API_BASE = '/api/v1';

export function useSSE() {
  const gameStore = useGameStore();

  async function connectStream(sessionId: string, input: string) {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Not authenticated');

    gameStore.startStreaming();

    try {
      const response = await fetch(`${API_BASE}/sessions/${sessionId}/actions/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ input }),
      });

      if (!response.ok) {
        throw new Error(`Stream request failed: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let currentEvent = '';
        let currentData = '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            currentData = line.slice(6).trim();
          } else if (line === '') {
            // Empty line = event delimiter
            if (currentEvent && currentData) {
              handleEvent(currentEvent, currentData);
            }
            currentEvent = '';
            currentData = '';
          }
        }
      }
    } catch (error: any) {
      gameStore.setError(error.message);
    }
  }

  function handleEvent(eventType: string, rawData: string) {
    try {
      const data = JSON.parse(rawData);

      switch (eventType) {
        case 'token':
          gameStore.appendToken(data as string);
          break;
        case 'event':
          gameStore.addEvent(data);
          break;
        case 'state':
          // 可更新世界状态
          break;
        case 'error':
          gameStore.setError(data.message || 'Unknown error');
          break;
        case 'complete':
          // turn completed — narrative already streamed
          break;
      }
    } catch {
      // Ignore parse errors
    }
  }

  return { connectStream };
}
```

- [ ] **Step 5: React 组件 — App + 路由**

```typescript
// apps/web/src/App.tsx
import React, { useState } from 'react';
import { useSessionStore } from './stores/session';
import { LoginView } from './views/LoginView';
import { LobbyView } from './views/LobbyView';
import { GameView } from './views/GameView';

type View = 'login' | 'lobby' | 'game';

export function App() {
  const [view, setView] = useState<View>('login');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const sessionStore = useSessionStore();

  // 检查是否已登录
  React.useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      // 简单恢复 — 实际应验证 token 有效性
      setView('lobby');
    }
  }, []);

  if (view === 'login') {
    return (
      <LoginView
        onLogin={() => setView('lobby')}
      />
    );
  }

  if (view === 'lobby') {
    return (
      <LobbyView
        onEnterGame={(sessionId) => {
          setActiveSessionId(sessionId);
          setView('game');
        }}
        onLogout={() => {
          sessionStore.logout();
          setView('login');
        }}
      />
    );
  }

  return (
    <GameView
      sessionId={activeSessionId!}
      onBack={() => setView('lobby')}
    />
  );
}
```

- [ ] **Step 6: Login View**

```typescript
// apps/web/src/views/LoginView.tsx
import React, { useState } from 'react';
import { useSessionStore } from '../stores/session';

interface Props {
  onLogin: () => void;
}

export function LoginView({ onLogin }: Props) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const sessionStore = useSessionStore();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    try {
      if (isRegister) {
        await sessionStore.register(username, email, password);
      } else {
        await sessionStore.login(email, password);
      }
      onLogin();
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="w-full max-w-md p-8">
        <h1 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-purple-400 to-amber-300 bg-clip-text text-transparent">
          AI Dungeon Master
        </h1>
        <p className="text-gray-500 text-center mb-8">你的 AI 驱动的开放世界文字 RPG</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">用户名</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-100"
                placeholder="冒险者之名"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-100"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-100"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
          >
            {isRegister ? '注册' : '登录'}
          </button>
        </form>

        <p className="text-center mt-4 text-gray-500 text-sm">
          {isRegister ? '已有账号？' : '没有账号？'}
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-purple-400 hover:text-purple-300 ml-1"
          >
            {isRegister ? '登录' : '注册'}
          </button>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Lobby View**

```typescript
// apps/web/src/views/LobbyView.tsx
import React, { useEffect } from 'react';
import { useSessionStore } from '../stores/session';
import { api } from '../utils/api';

interface Props {
  onEnterGame: (sessionId: string) => void;
  onLogout: () => void;
}

interface World {
  id: string;
  name: string;
  description: string;
  setting: string;
}

export function LobbyView({ onEnterGame, onLogout }: Props) {
  const sessionStore = useSessionStore();
  const [worlds, setWorlds] = React.useState<World[]>([]);
  const [showNewGame, setShowNewGame] = React.useState(false);

  useEffect(() => {
    sessionStore.loadSessions();
    api.listWorlds().then(setWorlds).catch(console.error);
  }, []);

  async function createGame(worldId: string) {
    const session = await sessionStore.createSession(worldId);
    onEnterGame(session.id);
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-amber-300 bg-clip-text text-transparent">
            AI Dungeon Master
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-400">{sessionStore.user?.username}</span>
            <button
              onClick={onLogout}
              className="text-gray-500 hover:text-gray-300 text-sm"
            >
              退出
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Worlds Section */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">选择世界</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {worlds.map((world) => (
              <button
                key={world.id}
                onClick={() => createGame(world.id)}
                className="text-left p-6 bg-gray-900 border border-gray-800 rounded-xl hover:border-purple-700 transition-all group"
              >
                <h3 className="text-lg font-medium text-gray-200 group-hover:text-purple-300">{world.name}</h3>
                <p className="text-gray-500 text-sm mt-2">{world.description}</p>
                <span className="inline-block mt-3 text-xs px-2 py-1 bg-gray-800 rounded text-gray-400">
                  {world.setting}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Sessions Section */}
        <section>
          <h2 className="text-xl font-semibold mb-4">继续冒险</h2>
          {sessionStore.sessions.length === 0 ? (
            <p className="text-gray-500">还没有进行中的冒险</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sessionStore.sessions
                .filter(s => s.status === 'ACTIVE')
                .map((session) => (
                  <button
                    key={session.id}
                    onClick={() => onEnterGame(session.id)}
                    className="text-left p-4 bg-gray-900 border border-gray-800 rounded-xl hover:border-gray-700 transition-all"
                  >
                    <h3 className="font-medium text-gray-200">{session.world?.name ?? '未知世界'}</h3>
                    <p className="text-gray-500 text-sm mt-1">
                      回合 {session.turnNumber} · {session.world?.setting}
                    </p>
                  </button>
                ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
```

- [ ] **Step 8: Game View**

```typescript
// apps/web/src/views/GameView.tsx
import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../stores/game';
import { useSessionStore } from '../stores/session';
import { useSSE } from '../composables/useSSE';
import { ChatMessage } from '../components/ChatMessage';
import { ChatInput } from '../components/ChatInput';
import { GameSidebar } from '../components/GameSidebar';

interface Props {
  sessionId: string;
  onBack: () => void;
}

export function GameView({ sessionId, onBack }: Props) {
  const gameStore = useGameStore();
  const sessionStore = useSessionStore();
  const { connectStream } = useSSE();
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    sessionStore.loadSession(sessionId);
  }, [sessionId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gameStore.turns, gameStore.currentNarrative]);

  async function handleSend(input: string) {
    await connectStream(sessionId, input);
  }

  const currentSession = sessionStore.currentSession;

  return (
    <div className="h-screen flex bg-gray-950">
      {/* Sidebar */}
      <GameSidebar
        sessionName={currentSession?.world?.name ?? '冒险'}
        turnNumber={gameStore.turns.length + 1}
        events={gameStore.currentEvents}
        onBack={onBack}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {gameStore.turns.map((turn, i) => (
            <div key={i}>
              <div className="flex justify-end mb-2">
                <div className="bg-purple-900/50 border border-purple-800/50 rounded-lg px-4 py-2 max-w-[70%]">
                  <p className="text-purple-200">{turn.input}</p>
                </div>
              </div>
              <ChatMessage narrative={turn.narrative} events={turn.events} />
            </div>
          ))}

          {/* Streaming current turn */}
          {gameStore.isStreaming && (
            <div>
              <div className="flex justify-end mb-2">
                <div className="bg-purple-900/50 border border-purple-800/50 rounded-lg px-4 py-2 max-w-[70%]">
                  <p className="text-purple-200">{/* input is known */}</p>
                </div>
              </div>
              <ChatMessage
                narrative={gameStore.currentNarrative}
                events={gameStore.currentEvents}
                isStreaming
              />
            </div>
          )}

          {gameStore.error && (
            <div className="bg-red-900/30 border border-red-800/50 rounded-lg p-4">
              <p className="text-red-300">错误: {gameStore.error}</p>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        <ChatInput
          onSend={handleSend}
          disabled={gameStore.isStreaming}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 9: Chat Components**

```typescript
// apps/web/src/components/ChatMessage.tsx
import React from 'react';
import type { GameEvent } from '@ai-dungeon/shared';

interface Props {
  narrative: string;
  events: GameEvent[];
  isStreaming?: boolean;
}

export function ChatMessage({ narrative, events, isStreaming }: Props) {
  const paragraphs = narrative.split('\n').filter(Boolean);

  return (
    <div className="space-y-2">
      {paragraphs.map((p, i) => (
        <p key={i} className="text-gray-200 leading-relaxed">
          {p}
          {isStreaming && i === paragraphs.length - 1 && (
            <span className="inline-block w-2 h-4 bg-amber-400 ml-1 animate-pulse" />
          )}
        </p>
      ))}

      {events.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {events.map((event, i) => (
            <span
              key={i}
              className="text-xs px-2 py-1 rounded-full bg-amber-900/30 border border-amber-800/50 text-amber-300"
            >
              {event.title}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
```

```typescript
// apps/web/src/components/ChatInput.tsx
import React, { useState, useRef, useEffect } from 'react';

interface Props {
  onSend: (input: string) => void;
  disabled: boolean;
}

export function ChatInput({ onSend, disabled }: Props) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || disabled) return;
    onSend(input.trim());
    setInput('');
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-gray-800 p-4">
      <div className="flex gap-3">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="描述你的行动..."
          rows={2}
          disabled={disabled}
          className="flex-1 px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-100 placeholder-gray-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || !input.trim()}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-800 disabled:text-gray-600 rounded-xl font-medium transition-colors self-end"
        >
          {disabled ? '生成中...' : '发送'}
        </button>
      </div>
    </form>
  );
}
```

```typescript
// apps/web/src/components/GameSidebar.tsx
import React from 'react';
import type { GameEvent } from '@ai-dungeon/shared';

interface Props {
  sessionName: string;
  turnNumber: number;
  events: GameEvent[];
  onBack: () => void;
}

export function GameSidebar({ sessionName, turnNumber, events, onBack }: Props) {
  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
      <div className="p-4 border-b border-gray-800">
        <button
          onClick={onBack}
          className="text-gray-500 hover:text-gray-300 text-sm mb-3 block"
        >
          ← 返回大厅
        </button>
        <h2 className="font-semibold text-gray-200 truncate">{sessionName}</h2>
        <p className="text-gray-500 text-sm">回合 {turnNumber}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="text-sm font-medium text-gray-400 mb-3">最近事件</h3>
        {events.length === 0 ? (
          <p className="text-gray-600 text-sm">等待你的第一个行动...</p>
        ) : (
          <div className="space-y-2">
            {events.map((event, i) => (
              <div key={i} className="p-2 bg-gray-800 rounded-lg text-sm">
                <span className="text-amber-400 font-medium">{event.title}</span>
                <p className="text-gray-400 text-xs mt-1">{event.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
```

- [ ] **Step 10: TailwindCSS 配置**

```javascript
// apps/web/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gray: {
          950: '#0a0a0f',
        },
      },
    },
  },
  plugins: [],
};
```

```javascript
// apps/web/postcss.config.js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

---

### Task 7: Docker Compose 与部署配置

**文件:**
- Create: `docker/compose.yml`
- Create: `docker/nginx.conf`
- Create: `apps/server/Dockerfile`
- Create: `apps/web/Dockerfile`

- [ ] **Step 1: Docker Compose**

```yaml
# docker/compose.yml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      web:
        condition: service_started
      server:
        condition: service_started
    networks:
      - dungeon-net

  web:
    build:
      context: ../apps/web
      dockerfile: Dockerfile
    expose:
      - "3000"
    depends_on:
      - server
    networks:
      - dungeon-net

  server:
    build:
      context: ../apps/server
      dockerfile: Dockerfile
    expose:
      - "4000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    env_file:
      - ../.env
    networks:
      - dungeon-net

  postgres:
    image: pgvector/pgvector:pg16
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: ai_dungeon
      POSTGRES_USER: dungeon
      POSTGRES_PASSWORD: ${DB_PASSWORD:-dungeon_pass}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U dungeon -d ai_dungeon"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - dungeon-net

  redis:
    image: redis:7-alpine
    volumes:
      - redisdata:/data
    ports:
      - "6379:6379"
    networks:
      - dungeon-net

volumes:
  pgdata:
  redisdata:

networks:
  dungeon-net:
    driver: bridge
```

- [ ] **Step 2: Nginx 配置**

```nginx
# docker/nginx.conf
upstream web_upstream {
    server web:3000;
}

upstream server_upstream {
    server server:4000;
}

server {
    listen 80;
    
    # 前端静态资源
    location / {
        proxy_pass http://web_upstream;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # API 代理
    location /api/ {
        proxy_pass http://server_upstream;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        
        # SSE 支持
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 86400s;
        proxy_set_header Connection '';
        chunked_transfer_encoding on;
    }

    # WebSocket 支持 (后续使用)
    location /ws/ {
        proxy_pass http://server_upstream;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

- [ ] **Step 3: Server Dockerfile**

```dockerfile
# apps/server/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9 --activate

COPY package.json pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps/server/ apps/server/
COPY packages/ packages/

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @ai-dungeon/server build
RUN cd apps/server && npx prisma generate

FROM node:20-alpine AS runner

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9 --activate

COPY --from=builder /app/apps/server/dist ./dist
COPY --from=builder /app/apps/server/prisma ./prisma
COPY --from=builder /app/apps/server/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 4000

CMD ["node", "dist/index.js"]
```

- [ ] **Step 4: Web Dockerfile**

```dockerfile
# apps/web/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9 --activate

COPY package.json pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps/web/ apps/web/
COPY packages/ packages/

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @ai-dungeon/web build

FROM nginx:alpine AS runner

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
```

- [ ] **Step 5: Web Nginx 配置 (用于 Docker)**

```nginx
# apps/web/nginx.conf
server {
    listen 3000;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 反向代理
    location /api/ {
        proxy_pass http://server:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 86400s;
    }
}
```

- [ ] **Step 6: 验证完整构建**

```bash
# 从项目根目录
docker compose -f docker/compose.yml build
```

Expected: 所有镜像构建成功无错误

---

## 执行顺序与依赖关系

```
Task 1: Monorepo 初始化
  └── (所有后续任务依赖)
      ├── Task 2: 共享类型     ← Task 3, 4, 6 依赖
      ├── Task 3: Agent Core   ← Task 5 依赖
      ├── Task 4: 后端基础设施  ← Task 5 依赖
      │   └── Task 5: 后端业务模块  ← Task 6, 7 依赖
      ├── Task 6: 前端         ← Task 7 依赖
      └── Task 7: Docker 部署
```

**推荐执行方式:** Task 1 → 2 → 3 → 4 → 5 → 6 → 7 (顺序)
**可并行:** Task 2 和 Task 3 可并行

---

## 验证方法

1. **Task 1-3 完成**: `pnpm build` 全部通过
2. **Task 4 完成**: `docker compose up postgres redis` + `pnpm --filter @ai-dungeon/server dev` 服务启动
3. **Task 5 完成**: `curl localhost:4000/health` 返回 ok
4. **Task 6 完成**: `pnpm --filter @ai-dungeon/web dev` 访问 localhost:3000
5. **Task 7 完成**: `docker compose -f docker/compose.yml up` 全栈启动
6. **端到端测试**: 注册 → 创建游戏 → 发送动作 → SSE 流式接收叙事
