import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface User {
  id: string;
  username: string;
  isGuest: boolean;
  totalMasteryPoints: number;
}

interface UserState {
  currentUser: User | null;
  allUsers: User[]; // Mock database
  login: (username: string) => { success: boolean; error?: string };
  register: (username: string) => { success: boolean; error?: string };
  logout: () => void;
  registerGuestScore: (username: string, points: number) => void;
  updateUserScore: (userId: string, points: number) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      allUsers: [],

      login: (username: string) => {
        const { allUsers } = get();
        const user = allUsers.find(u => u.username.toLowerCase() === username.toLowerCase());
        
        if (!user) {
          return { success: false, error: 'User not found' };
        }
        
        set({ currentUser: user });
        return { success: true };
      },

      register: (username: string) => {
        const { allUsers } = get();
        const exists = allUsers.find(u => u.username.toLowerCase() === username.toLowerCase());
        
        if (exists) {
          return { success: false, error: 'Username already taken' };
        }

        const newUser: User = {
          id: Math.random().toString(36).substring(7),
          username,
          isGuest: false,
          totalMasteryPoints: 0
        };

        set({ 
          allUsers: [...allUsers, newUser],
          currentUser: newUser
        });
        
        return { success: true };
      },

      logout: () => set({ currentUser: null }),

      registerGuestScore: (username: string, points: number) => {
        const { allUsers } = get();
        const guestUser: User = {
          id: `guest-${Math.random().toString(36).substring(7)}`,
          username: `${username} (Guest)`,
          isGuest: true,
          totalMasteryPoints: points
        };
        set({ allUsers: [...allUsers, guestUser] });
      },

      updateUserScore: (userId: string, points: number) => {
        const { allUsers, currentUser } = get();
        const updatedUsers = allUsers.map(u => 
          u.id === userId ? { ...u, totalMasteryPoints: u.totalMasteryPoints + points } : u
        );
        
        set({ allUsers: updatedUsers });
        
        if (currentUser?.id === userId) {
          set({ currentUser: { ...currentUser, totalMasteryPoints: currentUser.totalMasteryPoints + points } });
        }
      }
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
