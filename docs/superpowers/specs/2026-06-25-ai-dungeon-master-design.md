# AI Dungeon Master — 生产级多 Agent 文字 RPG 平台设计

> 版本：v1.0
> 日期：2026-06-25
> 状态：已批准

## 1. 概述

基于 LangGraph.js 构建多 Agent 协作框架，实现开放世界文字 RPG 的动态剧情生成。采用 PostgreSQL + pgvector 构建长期记忆系统，通过事件驱动架构维护世界状态，实现 NPC 持久化记忆、动态任务生成和世界自主演化。

### 核心原则

- **模块化单体**：初期作为单体部署，通过 DDD 分包保持模块边界清晰，为后续拆分预留空间
- **事件驱动**：所有 Agent 操作通过 Domain Events 解耦，异步写入通过 BullMQ
- **类型安全**：全栈 TypeScript，共享类型通过 monorepo package
- **流式优先**：Narrator 输出通过 SSE 逐 Token 推送，前端实时渲染

## 2. 技术栈

| 层级 | 技术 | 用途 |
|------|------|------|
| 运行时 | Node.js 20+ | 全栈 JavaScript |
| 包管理 | pnpm + Turborepo | Monorepo 管理 |
| 前端框架 | React + TypeScript | UI |
| 样式 | TailwindCSS | 原子化样式 |
| UI 组件 | Radix UI | 无障碍原语组件 |
| 状态管理 | Pinia | 前端状态 |
| 后端框架 | Fastify | REST + SSE |
| ORM | Prisma | 数据库映射、迁移 |
| 数据库 | PostgreSQL 16 + pgvector | 关系数据 + 向量检索 |
| 缓存 | Redis 7 | 会话、限流、缓存 |
| 队列 | BullMQ | 异步任务 |
| Agent | LangGraph.js | 多 Agent 有向图编排 |
| AI | OpenAI / Anthropic API | LLM 推理 |
| 部署 | Docker Compose | 容器编排 |

## 3. Monorepo 结构

```
ai-dungeon-rpg/
├── apps/
│   ├── web/                        # React 前端
│   │   ├── src/
│   │   │   ├── stores/             # Pinia stores
│   │   │   ├── components/         # 通用组件
│   │   │   ├── views/              # 页面
│   │   │   ├── composables/        # 逻辑复用 (SSE client)
│   │   │   └── utils/
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── package.json
│   └── server/                     # Fastify 后端
│       └── src/
│           ├── modules/            # DDD 领域模块
│           │   ├── narrative/      # 叙事
│           │   ├── memory/         # 记忆
│           │   ├── world/          # 世界
│           │   ├── user/           # 用户/认证
│           │   └── game/           # 游戏会话
│           ├── infrastructure/     # 基础设施
│           │   ├── database/       # Prisma Client
│           │   ├── queue/          # BullMQ
│           │   ├── cache/          # Redis
│           │   └── ai/             # LLM Client
│           ├── interfaces/         # 接口层
│           │   ├── api/            # REST 路由
│           │   └── sse/            # SSE 流式输出
│           ├── app.ts              # 应用入口
│           └── config.ts           # 配置
├── packages/
│   ├── shared/                     # 共享类型、Schema、常量
│   │   ├── src/
│   │   │   ├── types/              # TypeScript 类型
│   │   │   ├── schemas/            # Zod Schema
│   │   │   └── constants/          # 常量
│   │   ├── tsconfig.json
│   │   └── package.json
│   └── agent-core/                 # LangGraph.js Agent 运行时
│       └── src/
│           ├── graph.ts            # StateGraph 定义
│           ├── nodes/              # Graph 节点
│           │   ├── supervisor.node.ts
│           │   ├── narrator.node.ts
│           │   ├── memory-retrieve.node.ts
│           │   ├── memory-store.node.ts
│           │   ├── world-update.node.ts
│           │   └── stream-output.node.ts
│           ├── base-agent.ts       # Agent 基类
│           └── stream.ts           # 流式输出适配
├── docker/
│   └── compose.yml                 # Docker Compose
├── pnpm-workspace.yaml
├── package.json
├── turbo.json
└── tsconfig.base.json
```

## 4. DDD 模块架构

每个模块遵循四层结构（以 `narrative` 为例）：

```
modules/narrative/
├── domain/
│   ├── entities/           # 领域实体
│   ├── value-objects/      # 值对象
│   ├── events/             # 领域事件
│   └── services/           # 领域服务
├── application/
│   ├── commands/           # 命令处理
│   └── queries/            # 查询处理
├── infrastructure/
│   ├── agent/              # LangGraph Agent 适配
│   └── persistence/        # Prisma 仓储实现
└── interfaces/
    └── api/                # REST/SSE 接口适配器
```

## 5. Agent 架构

### LangGraph.js StateGraph 编排

```
                     ┌─────────────┐
                     │  Start      │
                     │ (用户输入)    │
                     └──────┬──────┘
                            ▼
                     ┌──────────────┐
                     │  Supervisor   │
                     │ (意图路由)     │
                     └──────┬───────┘
                            │
                ┌───────────┼───────────┐
                │           │           │
          narrate       dialogue    explore
                │           │           │
                ▼           ▼           ▼
         ┌───────────────────────────────────┐
         │       MemoryRetrieve Node         │
         │  (混合检索: pgvector + 时间衰减)   │
         └───────────────┬───────────────────┘
                         ▼
         ┌───────────────────────────────────┐
         │        WorldUpdate Node           │
         │  (更新世界状态, 生成 Diff)         │
         └───────────────┬───────────────────┘
                         ▼
         ┌───────────────────────────────────┐
         │        Narrator Node              │
         │  (LLM 流式生成 → Token 流)         │
         └───────────────┬───────────────────┘
                         ▼
         ┌───────────────────────────────────┐
         │        MemoryStore Node           │
         │  (异步 BullMQ: 持久化 + 向量化)    │
         └───────────────┬───────────────────┘
                         ▼
         ┌───────────────────────────────────┐
         │       StreamOutput Node           │
         │  (SSE → 前端实时渲染)              │
         └───────────────┬───────────────────┘
                         ▼
                     ┌──────────┐
                     │   End    │
                     └──────────┘
```

### Agent 职责

| Agent | 职责 | 同步/异步 |
|-------|------|-----------|
| Supervisor | 意图识别、路由分发 | 同步 |
| MemoryRetrieve | 语义检索、混合排序 | 同步 |
| Narrator | 故事生成、流式输出 | 同步(流) |
| WorldUpdate | 世界状态变更 | 同步 |
| MemoryStore | 记忆持久化、向量化 | 异步(BullMQ) |
| StreamOutput | SSE 推送格式化 | 同步 |

### 混合记忆检索

```
输入: 用户动作 + 当前上下文

1. 语义检索 (pgvector, cosine distance, top_k=10)
2. 时间衰减检索 (最近 50 条, 按 recency 加权)
3. 重要性检索 (importance > 0.7)

→ Reciprocal Rank Fusion (RRF) 合并
→ 取 top_5 作为 Memomry 上下文注入 Narrator
```

## 6. 数据模型

### Prisma Schema 核心模型

```prisma
model User {
  id        String   @id @default(cuid())
  username  String   @unique
  email     String   @unique
  createdAt DateTime @default(now())
  sessions  GameSession[]
}

model GameSession {
  id         String        @id @default(cuid())
  userId     String
  user       User          @relation(fields: [userId], references: [id])
  worldId    String
  world      World         @relation(fields: [worldId], references: [id])
  status     SessionStatus @default(ACTIVE)
  createdAt  DateTime      @default(now())
  updatedAt  DateTime      @updatedAt
  turns      Turn[]
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
  id          String    @id @default(cuid())
  entityId    String
  entity      Entity    @relation(fields: [entityId], references: [id])
  sessionId   String
  type        String
  content     String
  importance  Float     @default(0.5)
  embedding   Vector?   // pgvector
  metadata    Json      @default("{}")
  createdAt   DateTime  @default(now())
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

## 7. API 设计

### REST 端点

```
POST   /api/v1/sessions                    # 创建会话
GET    /api/v1/sessions                    # 列表
GET    /api/v1/sessions/:id                # 详情
POST   /api/v1/sessions/:id/actions        # 玩家动作 (202 异步)
DELETE /api/v1/sessions/:id                # 删除

GET    /api/v1/sessions/:id/stream         # SSE 流连接
GET    /api/v1/sessions/:id/history        # 历史记录
GET    /api/v1/sessions/:id/memories       # 记忆检索

GET    /api/v1/worlds                      # 世界列表
GET    /api/v1/worlds/:id                  # 世界详情
GET    /api/v1/worlds/:id/locations       # 地点列表
GET    /api/v1/worlds/:id/entities        # 实体列表

POST   /api/v1/auth/register              # 注册
POST   /api/v1/auth/login                 # 登录
GET    /api/v1/users/me                   # 当前用户
```

### SSE 流协议

| event 类型 | 数据格式 | 说明 |
|-----------|---------|------|
| `token` | `string` | 逐 Token 文本 |
| `event` | `GameEvent` | 游戏事件 (战斗/发现/对话) |
| `state` | `StateDiff` | 世界状态差异 |
| `error` | `{ code, message }` | 错误 |
| `complete` | `{ turnNumber, tokensUsed }` | 回合完成 |

## 8. 事件驱动架构

```
同步流 (LangGraph Graph):
  用户输入 → Supervisor → MemoryRetrieve → WorldUpdate
    → Narrator(流) → StreamOutput → 用户

异步流 (BullMQ Queue):
  memory.store:     Narrator 完成后异步持久化记忆 + 向量化
  world.evolve:     世界被动演化 (NPC 行为、环境变化)
  notification:     推送通知 (可选)
```

## 9. Docker Compose

```yaml
services:
  nginx:
    image: nginx:alpine
    ports: ["80:80"]
    volumes: [./docker/nginx.conf:/etc/nginx/conf.d/default.conf]
    depends_on: [web, server]

  web:
    build: ./apps/web
    expose: ["3000"]

  server:
    build: ./apps/server
    expose: ["4000"]
    depends_on: [postgres, redis]
    env_file: .env

  postgres:
    image: pgvector/pgvector:pg16
    volumes: [pgdata:/var/lib/postgresql/data]
    ports: ["5432:5432"]
    environment:
      POSTGRES_DB: ai_dungeon
      POSTGRES_USER: dungeon
      POSTGRES_PASSWORD: ${DB_PASSWORD}

  redis:
    image: redis:7-alpine
    volumes: [redisdata:/data]
    ports: ["6379:6379"]

volumes:
  pgdata:
  redisdata:
```

## 10. 水平扩展策略

- **Server 无状态**：所有持久状态存储在 PostgreSQL/Redis，实例可任意扩展
- **SSE 亲和性**：通过 Nginx sticky session 或 Redis Pub/Sub 广播保持连接
- **PostgreSQL**：支持主从复制，pgvector 索引并行查询
- **Redis**：可扩展为 Redis Cluster，支持缓存和队列分离

## 11. 第一阶段范围 (MVP)

仅包含核心叙事循环：

1. **后端基础设施**: Fastify + Prisma + Redis + BullMQ 启动
2. **AI Agent 系统**: Narrator + MemoryRetrieve + Narrator(LLM) + WorldUpdate + MemoryStore(BullMQ)
3. **API**: `POST /actions` + `GET /stream` + 用户认证
4. **前端**: 聊天界面 + SSE 流式渲染 + 游戏创建
5. **部署**: Docker Compose 单机运行

Phase 2+ 将加入 Combat、Quest、NPC、Relationship 等扩展 Agent。

## 12. 关键类型定义

```typescript
// @shared/types/agent.ts
interface AgentState {
  input: string;
  sessionId: string;
  context: SessionContext;
  worldState: WorldState;
  memories: MemoryItem[];
  narrative: string;
  events: GameEvent[];
  stream: ReadableStream<string>;
}

interface SessionContext {
  userId: string;
  worldId: string;
  turnNumber: number;
  history: TurnSummary[];
}

interface WorldState {
  currentLocation: LocationInfo;
  entities: EntityInfo[];
  globalState: Record<string, unknown>;
  recentEvents: GameEvent[];
}

interface MemoryItem {
  id: string;
  content: string;
  importance: number;
  type: string;
  timestamp: Date;
  similarity: number;
}

interface GameEvent {
  type: 'combat' | 'discovery' | 'dialogue' | 'quest' | 'ambient';
  title: string;
  description: string;
  data: Record<string, unknown>;
}

// @shared/types/api.ts
interface ActionRequest {
  input: string;
  metadata?: Record<string, unknown>;
}

interface SSEEvent {
  event: 'token' | 'event' | 'state' | 'error' | 'complete';
  data: unknown;
  id?: string;
}
```
