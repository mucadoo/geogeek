import { create } from 'zustand';

export interface User {
  id: string;
  username: string;
  totalMasteryPoints: number;
}

interface SubmitScoreParams {
  gameKey: string;
  score: number;
  totalToGuess: number;
  masteryPoints: number;
  difficulty: string;
}

interface ActionResult {
  success: boolean;
  error?: string;
}

interface UserState {
  currentUser: User | null;
  status: 'idle' | 'loading' | 'ready';
  hydrate: () => Promise<void>;
  login: (username: string, password: string) => Promise<ActionResult>;
  register: (username: string, password: string) => Promise<ActionResult>;
  logout: () => Promise<void>;
  updateUsername: (newUsername: string) => Promise<ActionResult>;
  deleteAccount: () => Promise<void>;
  submitScore: (params: SubmitScoreParams) => Promise<ActionResult>;
}

async function parseJson(res: Response): Promise<Record<string, unknown>> {
  return res.json().catch(() => ({}));
}

export const useUserStore = create<UserState>()((set, get) => ({
  currentUser: null,
  status: 'idle',

  // Session lives server-side in an httpOnly cookie, so on load we ask the
  // server who's signed in rather than trusting anything persisted locally.
  hydrate: async () => {
    if (get().status !== 'idle') return;
    set({ status: 'loading' });
    try {
      const res = await fetch('/api/auth/me');
      const data = await parseJson(res);
      set({ currentUser: (data.user as User | null) ?? null, status: 'ready' });
    } catch {
      set({ status: 'ready' });
    }
  },

  login: async (username, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await parseJson(res);
    if (!res.ok) return { success: false, error: (data.error as string) || 'Login failed' };
    set({ currentUser: data.user as User, status: 'ready' });
    return { success: true };
  },

  register: async (username, password) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await parseJson(res);
    if (!res.ok) return { success: false, error: (data.error as string) || 'Registration failed' };
    set({ currentUser: data.user as User, status: 'ready' });
    return { success: true };
  },

  logout: async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    set({ currentUser: null });
  },

  updateUsername: async (newUsername) => {
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: newUsername }),
    });
    const data = await parseJson(res);
    if (!res.ok) return { success: false, error: (data.error as string) || 'Update failed' };
    set({ currentUser: data.user as User });
    return { success: true };
  },

  deleteAccount: async () => {
    await fetch('/api/profile', { method: 'DELETE' });
    set({ currentUser: null });
  },

  submitScore: async (params) => {
    if (!get().currentUser) return { success: false, error: 'Not signed in' };
    const res = await fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await parseJson(res);
    if (!res.ok) return { success: false, error: (data.error as string) || 'Failed to save score' };
    if (data.user) set({ currentUser: data.user as User });
    return { success: true };
  },
}));
