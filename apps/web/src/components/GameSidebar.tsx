import React from 'react';

interface GameEvent {
  type: string;
  title: string;
  description: string;
}

interface Props {
  sessionName: string;
  turnNumber: number;
  events: GameEvent[];
  onBack: () => void;
  open: boolean;
  onToggle: () => void;
}

export function GameSidebar({ sessionName, turnNumber, events, onBack, open, onToggle }: Props) {
  return (
    <>
      {/* 移动端：遮罩层 */}
      {open && (
        <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={onToggle} />
      )}

      {/* 侧栏：移动端从左侧滑入，桌面端固定显示 */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-40
        w-64 bg-gray-900 border-r border-gray-800
        flex flex-col flex-shrink-0
        transition-transform duration-200
        ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-4 border-b border-gray-800">
          <button onClick={onBack}
            className="text-gray-500 hover:text-gray-300 text-sm mb-3 transition-colors block">
            ← 返回大厅
          </button>
          <h2 className="font-semibold text-gray-200 truncate">{sessionName}</h2>
          <p className="text-gray-500 text-sm mt-1">回合 {turnNumber}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
          <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider text-xs">事件日志</h3>
          {events.length === 0 ? (
            <p className="text-gray-600 text-sm">等待冒险开始...</p>
          ) : (
            <div className="space-y-2">
              {events.map((event, i) => (
                <div key={i} className="p-2.5 bg-gray-800/50 rounded-lg border border-gray-800">
                  <span className="text-amber-400 text-xs font-medium">⚡ {event.title}</span>
                  <p className="text-gray-400 text-xs mt-1">{event.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
