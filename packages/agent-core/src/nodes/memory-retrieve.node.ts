import { type AgentState, type MemoryItem } from '@ai-dungeon/shared';

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
  const memories: MemoryItem[] = [];

  // 占位: Phase 2 实现 pgvector 混合检索
  // 1. 语义检索: SELECT * FROM memories ORDER BY embedding <-> $1 LIMIT topK
  // 2. 时间衰减: 最近 N 条记忆, 按 recency 加权
  // 3. 重要性过滤: importance > threshold
  // 4. Reciprocal Rank Fusion (RRF) 合并排序

  return { memories };
}
