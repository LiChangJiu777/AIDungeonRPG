import { prisma } from '../../../infrastructure/database/prisma.js';
import { llm } from '../../../infrastructure/ai/llm.js';

export const suggestionService = {
  async getSuggestions(sessionId: string, userId: string): Promise<string[]> {
    const session = await prisma.gameSession.findFirst({
      where: { id: sessionId, userId },
      include: {
        world: { include: { locations: true, entities: true } },
        turns: { orderBy: { turnNumber: 'desc' }, take: 20 },
      },
    });
    if (!session) return ['环顾四周', '向前探索'];

    const location = session.world.locations[0];
    const entities = session.world.entities;
    const recentTurns = session.turns.reverse();

    const npcNames = entities
      .filter((e: any) => e.locationId === location.id)
      .map((e: any) => e.name);

    // 构建最近对话摘要
    const recentSummary = recentTurns.slice(-5).map(t => {
      const narrative = ((t.output as any)?.narrative as string) || '';
      return `【玩家】${t.input}\n【叙事】${narrative.slice(0, 100)}`;
    }).join('\n\n');

    const prompt = `根据当前场景和最近发生的事，推荐 3 个合理的下一步行动。

要求：
- 每个行动 4-10 个中文字
- 纯 JSON 数组输出
- 必须紧密贴合当前场景和最近发生的事
- 如果刚才在和 NPC 对话，选项应该和该 NPC 当前的话题相关
- 如果有新的线索出现，应该包含调查该线索的选项
- 默认包含 1 个探索/前往其他地方的选项
- 不要输出其他内容

场景：${location.name}
在场的角色：${npcNames.join('、') || '无'}

最近发生：
${recentSummary || '冒险刚刚开始'}`;

    try {
      let result = '';
      const stream = llm.streamChat({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        maxTokens: 200,
      });

      for await (const token of stream) {
        result += token;
      }

      const cleaned = result.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      const suggestions = JSON.parse(cleaned);
      if (Array.isArray(suggestions) && suggestions.length >= 2) {
        return suggestions.slice(0, 4);
      }
    } catch { /* fall through */ }

    // 根据最近一轮对话生成备选
    const lastTurn = recentTurns[recentTurns.length - 1];
    if (lastTurn) {
      const lastNarrative = ((lastTurn.output as any)?.narrative as string) || '';
      if (lastNarrative.includes('问') || lastNarrative.includes('说') || lastNarrative.includes('聊')) {
        return ['继续刚才的话题', '转移话题', '环顾四周', '离开这里'];
      }
    }
    return ['环顾四周', '向前探索', '查看背包', '交谈'];
  },
};
