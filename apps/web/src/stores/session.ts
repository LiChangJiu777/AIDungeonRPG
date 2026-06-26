import { create } from 'zustand';

interface User {
  id: string;
  username: string;
  email: string;
}

interface World {
  id: string;
  name: string;
  description: string;
  setting: string;
}

interface Session {
  id: string;
  worldId: string;
  status: string;
  turnNumber: number;
  createdAt: string;
  updatedAt: string;
  world?: World;
}

interface SessionState {
  user: User | null;
  sessions: Session[];
  currentSession: Session | null;
  worlds: World[];
  worldsLoaded: boolean;
  sessionsLoaded: boolean;
  setUser: (user: User | null) => void;
  setSessions: (sessions: Session[]) => void;
  setCurrentSession: (session: Session | null) => void;
  setWorlds: (worlds: World[]) => void;
  logout: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  sessions: [],
  currentSession: null,
  worlds: [],
  worldsLoaded: false,
  sessionsLoaded: false,

  setUser: (user) => set({ user }),
  setSessions: (sessions) => set({ sessions, sessionsLoaded: true }),
  setCurrentSession: (session) => set({ currentSession: session }),
  setWorlds: (worlds) => set({ worlds, worldsLoaded: true }),
  logout: () => {
    localStorage.removeItem('auth_token');
    set({ user: null, sessions: [], currentSession: null, worldsLoaded: false, sessionsLoaded: false });
  },
}));
