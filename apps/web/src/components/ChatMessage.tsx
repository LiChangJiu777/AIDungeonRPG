import React from 'react';

interface GameEvent {
  type: string;
  title: string;
  description: string;
}

interface Props {
  narrative: string;
  events: GameEvent[];
  isStreaming?: boolean;
}

// 用码点判断，彻底避免编码问题
function isQuote(c: number): boolean {
  return c === 0x22       // " QUOTATION MARK
    || c === 0x201C       // " LEFT DOUBLE QUOTATION MARK
    || c === 0x201D       // " RIGHT DOUBLE QUOTATION MARK
    || c === 0x300C       // 「
    || c === 0x300D       // 」
    || c === 0x300E       // 『
    || c === 0x300F       // 』
    || c === 0xFF02;      // ＂ FULLWIDTH
}

function firstQuoteIdx(text: string): number {
  for (let i = 0; i < text.length; i++) {
    if (isQuote(text.charCodeAt(i))) return i;
  }
  return -1;
}

function lastQuoteIdx(text: string): number {
  for (let i = text.length - 1; i >= 0; i--) {
    if (isQuote(text.charCodeAt(i))) return i;
  }
  return -1;
}

function startsWithQuote(text: string): boolean { return text.length > 0 && isQuote(text.charCodeAt(0)); }
function endsWithQuote(text: string): boolean { return text.length > 0 && isQuote(text.charCodeAt(text.length - 1)); }
function hasQuote(text: string): boolean { return firstQuoteIdx(text) >= 0; }

export function ChatMessage({ narrative, events, isStreaming }: Props) {
  const paragraphs = narrative.split('\n').filter(Boolean);

  return (
    <div className="space-y-2">
      {paragraphs.map((p, i) => {
        const t = p.trim();
        if (!t) return null;

        // 纯对话行 — 以引号开头和结尾
        if (startsWithQuote(t) && endsWithQuote(t)) {
          return (
            <div key={i} className="pl-4 border-l-2 border-amber-500/60 my-3">
              <p className="text-amber-200 text-base md:text-lg leading-relaxed font-serif tracking-wide">
                {t}
                {isStreaming && i === paragraphs.length - 1 && (
                  <span className="inline-block w-2 h-4 bg-amber-400 ml-1 rounded-sm animate-pulse" />
                )}
              </p>
            </div>
          );
        }

        // 叙述中含对话
        if (hasQuote(t)) {
          const parts: Array<{ d: boolean; text: string }> = [];
          let buf = '';
          let inQ = false;
          for (let ci = 0; ci < t.length; ci++) {
            if (isQuote(t.charCodeAt(ci))) {
              if (!inQ) {
                if (buf) parts.push({ d: false, text: buf });
                buf = t[ci];
                inQ = true;
              } else {
                buf += t[ci];
                parts.push({ d: true, text: buf });
                buf = '';
                inQ = false;
              }
            } else {
              buf += t[ci];
            }
          }
          if (buf) parts.push({ d: inQ, text: buf });

          return (
            <p key={i} className="text-gray-200 leading-relaxed">
              {parts.map((seg, j) =>
                seg.d ? (
                  <span key={j} className="text-amber-200 font-serif tracking-wide">{seg.text}</span>
                ) : (
                  <span key={j}>{seg.text}</span>
                )
              )}
              {isStreaming && i === paragraphs.length - 1 && (
                <span className="inline-block w-2 h-4 bg-amber-400 ml-1 rounded-sm animate-pulse" />
              )}
            </p>
          );
        }

        return (
          <p key={i} className="text-gray-200 leading-relaxed">
            {t}
            {isStreaming && i === paragraphs.length - 1 && (
              <span className="inline-block w-2 h-4 bg-amber-400 ml-1 rounded-sm animate-pulse" />
            )}
          </p>
        );
      })}

      {events.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {events.map((event, i) => (
            <span key={i}
              className="text-xs px-3 py-1 rounded-full bg-amber-900/30 border border-amber-800/40 text-amber-300">
              ⚡ {event.title}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
