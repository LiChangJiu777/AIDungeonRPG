const API_BASE = '/api/v1';

let token: string | null = localStorage.getItem('auth_token');

export function setAuthToken(newToken: string | null) {
  token = newToken;
  if (newToken) localStorage.setItem('auth_token', newToken);
  else localStorage.removeItem('auth_token');
}

export function getToken(): string | null {
  return token;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // 只在有 body 时设置 Content-Type
  if (options.body) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
    throw new Error(error.message);
  }

  // 处理 204 No Content
  if (response.status === 204) return undefined as T;

  return response.json();
}

export const api = {
  register: (data: { username: string; email: string; password: string }) =>
    request<{ token: string; user: any }>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    request<{ token: string; user: any }>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  createSession: (worldId: string, characterName?: string, characterDesc?: string) =>
    request<any>('/sessions', { method: 'POST', body: JSON.stringify({ worldId, characterName, characterDesc }) }),

  listSessions: () => request<any[]>('/sessions'),

  getSession: (id: string) => request<any>(`/sessions/${id}`),

  deleteSession: (id: string) =>
    request<void>(`/sessions/${id}`, { method: 'DELETE' }),

  listWorlds: () => request<any[]>('/worlds'),

  getWorld: (id: string) => request<any>(`/worlds/${id}`),

  createWorld: (data: { name: string; description: string; setting: string; storyGoal?: string }) =>
    request<any>('/worlds', { method: 'POST', body: JSON.stringify(data) }),

  createWorldNpcs: (worldId: string, npcs: Array<{ name: string; personality: string }>) =>
    request<any>(`/worlds/${worldId}/npcs`, { method: 'POST', body: JSON.stringify({ npcs }) }),

  updateWorld: (id: string, data: { name?: string; description?: string; storyGoal?: string }) =>
    request<any>(`/worlds/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  deleteWorld: (id: string) =>
    request<{ success: boolean }>(`/worlds/${id}`, { method: 'DELETE' }),

  getIntro: (sessionId: string) => `/api/v1/sessions/${sessionId}/intro`,

  getSuggestions: (sessionId: string) => request<{ suggestions: string[] }>(`/sessions/${sessionId}/suggestions`),

  getHistory: (sessionId: string) => request<any[]>(`/sessions/${sessionId}/history`),
  getMemories: (sessionId: string) => request<any[]>(`/sessions/${sessionId}/memories`),
};
