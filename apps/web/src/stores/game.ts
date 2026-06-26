import { create } from 'zustand';

interface GameEvent {
  type: string;
  title: string;
  description: string;
}

interface Turn {
  input: string;
  narrative: string;
  events: GameEvent[];
  turnNumber: number;
}

interface GameState {
  turns: Turn[];
  currentNarrative: string;
  isStreaming: boolean;
  currentEvents: GameEvent[];
  suggestions: string[];
  storyEnded: boolean;
  error: string | null;
  startStreaming: () => void;
  appendToken: (token: string) => void;
  addEvent: (event: GameEvent) => void;
  completeTurn: (input: string, turnNumber: number) => void;
  setError: (message: string) => void;
  setSuggestions: (suggestions: string[]) => void;
  setStoryEnded: () => void;
  loadHistory: (history: Array<{ input: string; output: { narrative: string; events: GameEvent[] }; turnNumber: number }>) => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  turns: [],
  currentNarrative: '',
  isStreaming: false,
  currentEvents: [],
  suggestions: [],
  storyEnded: false,
  error: null,

  startStreaming: () => set({ isStreaming: true, currentNarrative: '', currentEvents: [], error: null }),

  appendToken: (token) => set((s) => ({ currentNarrative: s.currentNarrative + token })),

  addEvent: (event) => set((s) => ({ currentEvents: [...s.currentEvents, event] })),

  completeTurn: (input, turnNumber) => {
    const { currentNarrative, currentEvents } = get();
    set((s) => ({
      turns: [...s.turns, { input, narrative: currentNarrative, events: currentEvents, turnNumber }],
      isStreaming: false,
      currentNarrative: '',
      currentEvents: [],
    }));
  },

  loadHistory: (history) => set({
    turns: history.map(h => ({
      input: h.input,
      narrative: h.output?.narrative ?? '',
      events: h.output?.events ?? [],
      turnNumber: h.turnNumber,
    })),
  }),

  setSuggestions: (suggestions) => set({ suggestions }),
  setStoryEnded: () => set({ storyEnded: true }),

  reset: () => set({
    turns: [],
    currentNarrative: '',
    isStreaming: false,
    currentEvents: [],
    suggestions: [],
    storyEnded: false,
    error: null,
  }),

  setError: (message) => set({ error: message, isStreaming: false }),
}));
