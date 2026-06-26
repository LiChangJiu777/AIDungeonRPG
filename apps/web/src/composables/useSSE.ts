import { useGameStore } from '../stores/game';
import { getToken } from '../utils/api';

const API_BASE = '/api/v1';

export function useSSE() {
  const gameStore = useGameStore();

  async function connectStream(sessionId: string, input: string) {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');

    gameStore.startStreaming();

    try {
      const response = await fetch(`${API_BASE}/sessions/${sessionId}/actions/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ input }),
      });

      if (!response.ok) throw new Error(`Stream failed: ${response.statusText}`);
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let streamEnded = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) { streamEnded = true; break; }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let currentEvent = '';
        let currentData = '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            currentData = line.slice(6).trim();
          } else if (line === '') {
            if (currentEvent && currentData) handleEvent(currentEvent, currentData, input);
            currentEvent = '';
            currentData = '';
          }
        }
      }

      // 流结束，确保完成
      if (!streamEnded) return;
      const finalState = useGameStore.getState();
      if (finalState.isStreaming && finalState.currentNarrative) {
        finalState.completeTurn(input, finalState.turns.length + 1);
      }
    } catch (error: any) {
      // 出错时也尝试完成当前已生成的内容
      const errState = useGameStore.getState();
      if (errState.currentNarrative) {
        errState.completeTurn(input, errState.turns.length + 1);
      } else {
        gameStore.setError(error.message);
      }
    }
  }

  function handleEvent(eventType: string, rawData: string, input?: string) {
    try {
      const data = JSON.parse(rawData);
      switch (eventType) {
        case 'token':
          gameStore.appendToken(data);
          break;
        case 'event':
          gameStore.addEvent(data);
          break;
        case 'state':
          if (data?.storyEnded) useGameStore.getState().setStoryEnded();
          break;
        case 'complete':
          useGameStore.getState().completeTurn(input ?? '', data.turnNumber || 0);
          break;
        case 'error':
          gameStore.setError(data.message || 'Unknown error');
          break;
      }
    } catch { /* ignore parse errors */ }
  }

  async function fetchIntro(sessionId: string) {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');

    gameStore.startStreaming();
    let fullText = '';

    try {
      const response = await fetch(`${API_BASE}/sessions/${sessionId}/intro`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok || !response.body) throw new Error('Intro failed');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let currentEvent = '';
        let currentData = '';

        for (const line of lines) {
          if (line.startsWith('event: ')) currentEvent = line.slice(7).trim();
          else if (line.startsWith('data: ')) currentData = line.slice(6).trim();
          else if (line === '' && currentEvent && currentData) {
            try {
              const data = JSON.parse(currentData);
              if (currentEvent === 'token') {
                fullText += data;
                gameStore.appendToken(data);
              } else if (currentEvent === 'complete') {
                // 完成: 作为第一回合保存
              }
            } catch { /* ignore */ }
            currentEvent = '';
            currentData = '';
          }
        }
      }

      // 故事启端完成 → 无输入地加入回合
      const s = useGameStore.getState();
      s.setSuggestions(['环顾四周', '向前探索', '和附近的人交谈']);
      s.completeTurn('', 0);
    } catch (error: any) {
      gameStore.setError(error.message);
    }
  }

  return { connectStream, fetchIntro };
}
