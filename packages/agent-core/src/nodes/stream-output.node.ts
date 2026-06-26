import { type AgentState } from '@ai-dungeon/shared';

export async function streamOutputNode(state: AgentState): Promise<Partial<AgentState>> {
  // 占位: Phase 2 写入 SSE 流
  // for (const token of state.narrativeTokens) {
  //   sseStream.write({ event: 'token', data: token });
  // }
  // for (const event of state.events) {
  //   sseStream.write({ event: 'event', data: event });
  // }
  // sseStream.write({ event: 'complete', data: { turnNumber: state.turnNumber, tokensUsed } });

  return {};
}
