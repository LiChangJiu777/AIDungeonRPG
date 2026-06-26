import { StateGraph, END } from '@langchain/langgraph';
import { type AgentState, AGENT_NODES } from '@ai-dungeon/shared';
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

export function buildDungeonGraph(options?: GraphOptions) {
  // Channel configuration for state reducers
  const channelConfig = {
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
  };

  const graph = new StateGraph<AgentState>({ channels: channelConfig } as any)
    .addNode(AGENT_NODES.SUPERVISOR, async (state: AgentState) => supervisorNode(state))
    .addNode(AGENT_NODES.MEMORY_RETRIEVE, async (state: AgentState) => memoryRetrieveNode(state))
    .addNode(AGENT_NODES.WORLD_UPDATE, async (state: AgentState) => worldUpdateNode(state))
    .addNode(AGENT_NODES.NARRATOR, async (state: AgentState) => narratorNode(state, options?.narrator))
    .addNode(AGENT_NODES.MEMORY_STORE, async (state: AgentState) => memoryStoreNode(state))
    .addNode(AGENT_NODES.STREAM_OUTPUT, async (state: AgentState) => streamOutputNode(state))

    .addEdge('__start__', AGENT_NODES.SUPERVISOR)
    .addEdge(AGENT_NODES.SUPERVISOR, AGENT_NODES.MEMORY_RETRIEVE)
    .addEdge(AGENT_NODES.MEMORY_RETRIEVE, AGENT_NODES.WORLD_UPDATE)
    .addEdge(AGENT_NODES.WORLD_UPDATE, AGENT_NODES.NARRATOR)
    .addEdge(AGENT_NODES.NARRATOR, AGENT_NODES.MEMORY_STORE)
    .addEdge(AGENT_NODES.MEMORY_STORE, AGENT_NODES.STREAM_OUTPUT)
    .addEdge(AGENT_NODES.STREAM_OUTPUT, END);

  return graph.compile();
}
