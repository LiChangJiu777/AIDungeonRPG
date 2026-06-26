import { type AgentState, type GameEvent, AGENT_NODES } from '@ai-dungeon/shared';

export interface NarratorNodeOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export async function narratorNode(
  state: AgentState,
  options?: NarratorNodeOptions,
): Promise<Partial<AgentState>> {
  const systemPrompt = buildNarratorPrompt(state);
  const narrativeTokens: string[] = [];
  const events: GameEvent[] = [];

  // 占位: Phase 2 通过 LLM Client 流式调用
  // const stream = await llm.streamChat({
  //   model: options?.model ?? 'gpt-4o-mini',
  //   messages: [
  //     { role: 'system', content: systemPrompt },
  //     { role: 'user', content: state.input },
  //   ],
  //   temperature: options?.temperature ?? 0.8,
  //   maxTokens: options?.maxTokens ?? 2048,
  // });
  // for await (const token of stream) { narrativeTokens.push(token); }

  const fullNarrative = narrativeTokens.join('');

  return {
    narrative: fullNarrative,
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
4. 保持世界一致性和角色性格

## 玩家动作
${state.input}`;
}
