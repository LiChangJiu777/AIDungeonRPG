import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../stores/game';
import { useSessionStore } from '../stores/session';
import { useSSE } from '../composables/useSSE';
import { ChatMessage } from '../components/ChatMessage';
import { ChatInput } from '../components/ChatInput';
import { GameSidebar } from '../components/GameSidebar';
import { api } from '../utils/api';

interface Props {
  sessionId: string;
  onBack: () => void;
}

export function GameView({ sessionId, onBack }: Props) {
  const gameStore = useGameStore();
  const { currentSession, setCurrentSession } = useSessionStore();
  const { connectStream, fetchIntro } = useSSE();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const introStarted = useRef(false);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  // 进入会话时：重置状态 + 加载历史 + 初始选项
  useEffect(() => {
    gameStore.reset();
    introStarted.current = false;
    api.getSession(sessionId).then(setCurrentSession).catch(console.error);
    api.getHistory(sessionId).then((history: any[]) => {
      if (history && history.length > 0) {
        gameStore.loadHistory(history);
      } else if (!introStarted.current) {
        introStarted.current = true;
        fetchIntro(sessionId);
      }
    }).catch(console.error);
    api.getSuggestions(sessionId).then((res) => {
      useGameStore.getState().setSuggestions(res.suggestions);
    }).catch(() => {});
  }, [sessionId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gameStore.turns, gameStore.currentNarrative]);

  async function handleSend(input: string) {
    await connectStream(sessionId, input);
    const state = useGameStore.getState();
    if (state.currentNarrative) {
      state.completeTurn(input, state.turns.length + 1);
    }
    api.getSuggestions(sessionId).then((res) => {
      useGameStore.getState().setSuggestions(res.suggestions);
    }).catch(() => {});
  }

  return (
    <div className="h-screen flex bg-gray-950">
      <GameSidebar
        sessionName={currentSession?.world?.name ?? '冒险'}
        turnNumber={gameStore.turns.length + 1}
        events={gameStore.currentEvents}
        onBack={onBack}
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* 移动端顶部栏 */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-400 hover:text-gray-200 text-xl">
            ☰
          </button>
          <h1 className="text-sm font-medium text-gray-200 truncate flex-1">
            {currentSession?.world?.name ?? '冒险'}
          </h1>
          <span className="text-xs text-gray-500">第 {gameStore.turns.length + 1} 回合</span>
        </div>

        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6 scrollbar-thin">
          {gameStore.turns.map((turn, i) => (
            <div key={i}>
              {turn.input && (
                <div className="flex justify-end mb-3">
                  <div className="bg-purple-900/40 border border-purple-800/30 rounded-2xl px-5 py-3 max-w-[70%]">
                    <p className="text-purple-200">{turn.input}</p>
                  </div>
                </div>
              )}
              <ChatMessage narrative={turn.narrative} events={turn.events} />
            </div>
          ))}

          {/* Streaming */}
          {gameStore.isStreaming && (
            <div>
              <div className="flex justify-end mb-3">
                <div className="bg-purple-900/40 border border-purple-800/30 rounded-2xl px-5 py-3 max-w-[70%]">
                  <p className="text-purple-200">...</p>
                </div>
              </div>
              <ChatMessage narrative={gameStore.currentNarrative} events={gameStore.currentEvents} isStreaming />
            </div>
          )}

          {gameStore.error && (
            <div className="bg-red-900/20 border border-red-800/30 rounded-xl p-4">
              <p className="text-red-300 text-sm">⚠ {gameStore.error}</p>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* AI 智能选项 */}
        {!gameStore.isStreaming && !gameStore.storyEnded && gameStore.suggestions.length > 0 && (
          <div className="px-6 pb-3">
            <div className="flex gap-2 flex-wrap">
              {gameStore.suggestions.map((action, i) => (
                <button key={i} onClick={() => handleSend(action)}
                  className="text-sm px-4 py-2 bg-gray-800 hover:bg-purple-900/40 border border-gray-700 hover:border-purple-700/50 rounded-xl text-gray-400 hover:text-purple-200 transition-all">
                  {action}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 故事结局 */}
        {gameStore.storyEnded && (
          <div className="px-6 pb-4">
            <div className="bg-gradient-to-r from-amber-900/20 via-purple-900/20 to-amber-900/20 border border-amber-700/30 rounded-2xl p-6 text-center">
              <p className="text-3xl mb-2">🏆</p>
              <p className="text-amber-300 text-lg font-semibold mb-1">故事终章</p>
              <p className="text-gray-500 text-sm">你的冒险到此告一段落</p>
              <div className="flex gap-3 justify-center mt-5">
                <button onClick={onBack}
                  className="px-5 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-gray-300 transition-all text-sm">
                  返回大厅
                </button>
              </div>
            </div>
          </div>
        )}

        {!gameStore.storyEnded && <ChatInput onSend={handleSend} disabled={gameStore.isStreaming} />}
      </div>
    </div>
  );
}
