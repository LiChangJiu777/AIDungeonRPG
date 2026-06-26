import { type AgentState } from '@ai-dungeon/shared';

export async function memoryStoreNode(state: AgentState): Promise<Partial<AgentState>> {
  // 占位: Phase 2 通过 BullMQ 异步持久化
  // memoryQueue.add('store.memory', {
  //   entityId: state.context.playerEntityId,
  //   sessionId: state.sessionId,
  //   type: 'experience',
  //   content: state.narrative,
  //   importance: calculateImportance(state.input, state.narrative),
  // });

  return {};
}
