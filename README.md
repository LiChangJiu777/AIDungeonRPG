# AI Dungeon Master 🐉

基于 LangGraph.js 多 Agent 架构的 AI 驱动开放世界文字 RPG 平台。

> 一个由 AI 驱动的沉浸式文字冒险游戏，支持多世界、多结局、动态剧情生成。

## 功能特色

✨ **AI 驱动叙事** — 基于 Deepseek 大语言模型，实时生成沉浸式剧情
🌍 **多世界支持** — 玄幻修仙、都市恋爱、悬疑探案、西方奇幻等多个世界
🎯 **主线任务** — 每个世界都有明确的终极目标，支持多重结局
🧠 **长期记忆** — 20 轮对话上下文，AI 记住你的选择和经历
👥 **角色互动** — NPC 拥有独立性格、背景和说话风格，对话沉浸感强
💡 **智能选项** — AI 根据当前场景推荐可行的行动，无需自己打字
🎮 **故事启端** — 新游戏自动生成开场剧情
📱 **移动端适配** — 支持手机浏览器访问

## 技术栈

| 层 | 技术 |
|------|------|
| 前端 | React + TypeScript + TailwindCSS + Zustand |
| 后端 | Fastify + TypeScript |
| 数据库 | PostgreSQL 16 + pgvector |
| 缓存 | Redis 7 |
| AI | LangGraph.js + Deepseek API |
| 构建 | pnpm + Turborepo |
| 部署 | Docker Compose / ngrok |

## 快速开始

### 环境要求

- Node.js 20+
- pnpm 9
- PostgreSQL 16 + pgvector
- Redis 7

### 本地开发

```bash
# 1. 安装依赖
pnpm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env，填入你的 LLM_API_KEY

# 3. 初始化数据库
cd apps/server
npx prisma migrate dev --name init
npx prisma db seed

# 4. 启动
cd ../..
pnpm dev
```

访问 http://localhost:3000

## 项目结构

```
ai-dungeon-rpg/
├── apps/
│   ├── web/              # React 前端
│   │   └── src/
│   │       ├── views/    # 页面 (登录/大厅/游戏)
│   │       ├── stores/   # Zustand 状态管理
│   │       ├── components/ # UI 组件
│   │       └── composables/ # SSE 流式连接
│   └── server/           # Fastify 后端
│       └── src/
│           ├── modules/  # DDD 领域模块
│           │   ├── narrative/  # 叙事引擎 (核心)
│           │   ├── world/      # 世界管理
│           │   ├── game/       # 游戏会话
│           │   ├── memory/     # 记忆系统
│           │   └── user/       # 用户认证
│           └── infrastructure/ # 基础设施
│               ├── ai/     # LLM 客户端
│               ├── queue/  # BullMQ 队列
│               └── cache/  # Redis 缓存
├── packages/
│   ├── shared/           # 共享类型/Schema/常量
│   └── agent-core/       # LangGraph.js Agent 运行时
├── docker/               # Docker Compose
└── prisma/               # 数据库 Schema + 种子数据
```

## 可用世界

| 世界 | 类型 | 说明 |
|------|------|------|
| 🗡️ 艾泽拉斯 | 西方奇幻 | 经典剑与魔法的世界 |
| ☯️ 青云仙途 | 玄幻修仙 | 灵气复苏，踏上修行之路 |
| ☯️ 魂穿之九天仙门 | 玄幻魂穿 | 穿越到异世界的废柴弟子 |
| 💕 心动咖啡馆 | 都市恋爱 | 咖啡馆里的温馨爱情故事 |
| 🔍 雾镇谜案 | 悬疑探案 | 浓雾小镇的连环失踪案 |

## 许可证

MIT
