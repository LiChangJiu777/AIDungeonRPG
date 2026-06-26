import React, { useState, useEffect } from 'react';
import { useSessionStore } from './stores/session';
import { LoginView } from './views/LoginView';
import { LobbyView } from './views/LobbyView';
import { GameView } from './views/GameView';

type View = 'login' | 'lobby' | 'game';

export function App() {
  const [view, setView] = useState<View>('login');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const { user } = useSessionStore();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) setView('lobby');
  }, []);

  if (view === 'login') {
    return <LoginView onLogin={() => setView('lobby')} />;
  }

  if (view === 'lobby') {
    return (
      <LobbyView
        onEnterGame={(sessionId) => {
          setActiveSessionId(sessionId);
          setView('game');
        }}
        onLogout={() => {
          useSessionStore.getState().logout();
          setView('login');
        }}
      />
    );
  }

  return (
    <GameView
      sessionId={activeSessionId!}
      onBack={() => setView('lobby')}
    />
  );
}
