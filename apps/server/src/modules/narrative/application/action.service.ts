import { prisma } from '../../../infrastructure/database/prisma.js';
import { llm } from '../../../infrastructure/ai/llm.js';
import type { SSEEvent } from '@ai-dungeon/shared';

function buildIntroPrompt(world: any, location: any, entities: any[]): string {
  const npcNames = entities
    .filter((e: any) => e.locationId === location.id && e.type === 'npc')
    .map((e: any) => e.name)
    .join('、');
  const rules = (world?.rules ?? {}) as Record<string, unknown>;
  const storyGoal = (rules.storyGoal as string) || '';

  return `你是一位文字 RPG 的叙事者。请为玩家的新冒险写一段故事启端。

## 世界背景
${world.description}
${storyGoal ? `\n## 最终目标\n${storyGoal}` : ''}

## 起始地点
${location.name} — ${location.description}

## 初始 NPC
${npcNames || '暂无'}

## 要求
1. 用一段话描写场景氛围，让玩家身临其境
2. 引入第一个线索或冲突，暗示最终目标的方向
3. 用第二人称「你」
4. 50-100 字左右，简洁有力
5. 最后以「你打算怎么做？」结尾
6. **不要加任何标题符号或标记**`;
}

export const actionService = {
  async *generateIntro(
    sessionId: string,
    userId: string,
  ): AsyncGenerator<SSEEvent> {
    const session = await prisma.gameSession.findFirst({
      where: { id: sessionId, userId },
      include: { world: { include: { locations: true, entities: true } } },
    });
    if (!session) throw new Error('Session not found');

    const location = session.world.locations[0];
    const entities = session.world.entities;
    const prompt = buildIntroPrompt(session.world, location, entities);

    let fullNarrative = '';
    let tokensUsed = 0;
    const stream = llm.streamChat({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.85,
      maxTokens: 300,
    });

    for await (const token of stream) {
      fullNarrative += token;
      tokensUsed++;
      yield { event: 'token', data: token };
    }

    // 作为第一回合保存
    await prisma.turn.create({
      data: {
        sessionId: session.id,
        input: '开始冒险',
        output: { narrative: fullNarrative, events: [], stateDiff: null },
        turnNumber: 0,
        tokensUsed,
      },
    });

    yield { event: 'complete', data: { turnNumber: 0, tokensUsed } };
  },
  async processAction(sessionId: string, userId: string, input: string): Promise<void> {
    const session = await prisma.gameSession.findFirst({
      where: { id: sessionId, userId },
      include: { world: { include: { locations: true, entities: true } } },
    });
    if (!session) throw new Error('Session not found');

    const location = session.world.locations[0];
    const entities = session.world.entities;
    const recentTurns = await prisma.turn.findMany({
      where: { sessionId: session.id },
      orderBy: { turnNumber: 'desc' }, take: 5,
    });
    recentTurns.reverse();
    const systemPrompt = buildNarratorPrompt(location, entities, [], session.world, recentTurns);

    let fullNarrative = '';
    let tokensUsed = 0;
    const stream = llm.streamChat({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: input },
      ],
    });

    for await (const token of stream) {
      fullNarrative += token;
      tokensUsed++;
    }

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
  },

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

    const location = session.world.locations[0];
    const entities = session.world.entities;

    // 加载最近回合，保持上下文连贯
    const recentTurns = await prisma.turn.findMany({
      where: { sessionId: session.id },
      orderBy: { turnNumber: 'desc' },
      take: 20,
    });
    recentTurns.reverse();

    const systemPrompt = buildNarratorPrompt(location, entities, [], session.world, recentTurns);

    let fullNarrative = '';
    let tokensUsed = 0;
    const stream = llm.streamChat({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: input },
      ],
    });

    let storyEnded = false;
    for await (const token of stream) {
      fullNarrative += token;
      tokensUsed++;
      if (fullNarrative.includes('【终章】')) storyEnded = true;
      yield { event: 'token', data: token };
    }

    // 检测故事是否终结
    const cleanNarrative = fullNarrative.replace('【终章】', '').trim();

    await prisma.turn.create({
      data: {
        sessionId: session.id,
        input,
        output: { narrative: cleanNarrative, events: [], stateDiff: null },
        turnNumber: session.turnCount + 1,
        tokensUsed,
      },
    });

    if (storyEnded) {
      await prisma.gameSession.update({
        where: { id: session.id },
        data: { status: 'COMPLETED', turnCount: { increment: 1 } },
      });
      yield { event: 'state', data: { storyEnded: true } as any };
      return;
    }

    await prisma.gameSession.update({
      where: { id: session.id },
      data: { turnCount: { increment: 1 } },
    });

    yield { event: 'complete', data: { turnNumber: session.turnCount + 1, tokensUsed } };
  },
};

function buildNarratorPrompt(location: any, entities: any[], _memories: any[], world?: any, recentTurns?: any[]): string {
  const exitNames = location.exits
    ? Object.keys(location.exits as Record<string, string>).join(', ')
    : 'none';
  const rules = (world?.rules ?? {}) as Record<string, unknown>;
  const storyGoal = (rules.storyGoal as string) || '';

  // 玩家角色信息
  const playerEntity = entities.find((e: any) => e.type === 'player');
  const playerName = playerEntity?.name || '你';
  const playerDesc = (playerEntity?.state as any)?.characterDesc || '';
  const playerInfo = playerDesc ? `\n你的角色设定：${playerDesc}` : '';

  const npcDetails = entities
    .filter((e: any) => e.locationId === location.id && e.type === 'npc')
    .map((e: any) => {
      const a = e.attributes as Record<string, string> || {};
      return `【${e.name}】${a.appearance || ''}
  性格：${a.personality || '未知'}
  说话风格：${a.dialogue_style || '正常'}
  背景：${a.background || ''}
  当前状态：${(e.state as any)?.mood || '平静'}
  知道的信息：${a.knows || ''}`;
    })
    .join('\n\n');

  // 最近发生的事
  const historyBlock = recentTurns && recentTurns.length > 0
    ? recentTurns.map(t => `玩家：${t.input}\n叙事：${((t.output as any)?.narrative as string)?.slice(0, 200) || ''}`).join('\n\n')
    : '';

  const goalDirective = storyGoal
    ? `## 主线任务（必须遵守）
这个世界的最终目标是：${storyGoal}

每写一段回复前，先问自己：
1. 这段回复让玩家离主线目标更近了吗？
2. 如果答案是「否」，那这段回复必须包含至少一项以下内容：
   - 指向主线的新线索
   - 能推动主线的 NPC 对话
   - 揭示世界观的突发事件
   - 引导玩家前往关键地点的提示
3. 不允许出现与主线完全无关的纯闲聊`
    : '';

  return `你是一位文字 RPG 叙事者。你的唯一使命是让玩家体验一个有始有终的故事。用中文叙述。

${goalDirective}

## 铁律（违反会破坏游戏体验）
1. **剧情必须推进**：每段回复都必须让故事向前走。如果连续 2 轮玩家在闲聊，让 NPC 主动提及关键信息，或让周围发生意外事件
2. **NPC 是工具人**：NPC 存在的意义是推动剧情。他们可以闲聊一两句，但必须很快切入正题透露信息
3. **对话要有信息量**：NPC 开口必须带出至少一条有用信息（线索、警告、请求、秘密），不能纯寒暄
4. **世界是活的**：即使聊天，窗外也有动静、远处有声音、手机有消息——这些都要和主线有关
5. **用第二人称「${playerName}」**
6. **上下连贯**：NPC 的状态和说过的话必须和上一轮一致${playerInfo}

## 当前场景
**地点**：${location.name} — ${location.description}
**可前往方向**：${exitNames}
**在场**：${npcDetails || '无'}

## 最近发生的事
${historyBlock || '冒险刚刚开始'}

## 输出要求
- 场景没变不要重复写环境，直接推进
- 对话简短有力，避免「你说道」「你问」
- NPC 之间对话写成玩家旁观的场景
- 每次回复结尾暗示下一步方向
- 纯文本，不要标题和标记`;
}
