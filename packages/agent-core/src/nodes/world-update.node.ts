import { type AgentState, type StateDiff } from '@ai-dungeon/shared';

export async function worldUpdateNode(state: AgentState): Promise<Partial<AgentState>> {
  const stateDiff: StateDiff = {
    locationChanged: false,
    entityChanges: [],
    eventsTriggered: [],
  };

  // 占位: Phase 2 实现
  // 1. 解析用户动作中的移动意图 → 更新 currentLocation
  // 2. 解析交互目标 → 更新 entity 状态
  // 3. 触发对应领域事件

  return { stateDiff };
}
