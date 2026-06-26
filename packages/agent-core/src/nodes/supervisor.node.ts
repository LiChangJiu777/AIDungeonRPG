import { type AgentState, type AgentIntent } from '@ai-dungeon/shared';

export async function supervisorNode(state: AgentState): Promise<Partial<AgentState>> {
  const input = state.input.toLowerCase();
  let intent: AgentIntent = 'narrate';

  if (/战斗|攻击|砍|杀|射击|施放|火球|挥剑|射箭|combat|attack|strike|slash|fire|cast|blast|shoot/i.test(input)) {
    intent = 'combat';
  } else if (/交谈|对话|问|说|告诉|询问|打探|talk|speak|ask|tell|converse|say/i.test(input)) {
    intent = 'dialogue';
  } else if (/探索|查看|检查|调查|搜索|环顾|走|去|前往|向北|向南|向东|向西|进入|离开|look|examine|search|explore|go|walk|move|enter|leave|north|south|east|west/i.test(input)) {
    intent = 'explore';
  }

  return {
    context: {
      ...state.context,
      intent,
    },
  };
}
