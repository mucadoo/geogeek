'use client';

import { User as UserIcon, LogOut, UserCircle } from 'lucide-react';
import React, { useState } from 'react';

import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/store/useUserStore';

export default function UserMenu() {
  const { currentUser, login, logout } = useUserStore();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [username, setUsername] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      login(username.trim());
      setIsLoginOpen(false);
      setUsername('');
    }
  };

  if (!currentUser) {
    return (
      <div className="flex items-center gap-2">
        {isLoginOpen ? (
          <form onSubmit={handleLogin} className="flex items-center gap-2 animate-in slide-in-from-right-2 duration-300">
            <input
              autoFocus
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username..."
              className="px-4 py-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-full font-game-mono text-xs outline-none focus:border-[var(--primary)] transition-all w-32 md:w-40"
            />
            <button 
              type="submit"
              className="bg-[var(--primary)] text-white p-2.5 rounded-full hover:scale-105 transition-all shadow-sm"
            >
              <UserIcon size={18} />
            </button>
            <button 
              type="button"
              onClick={() => setIsLoginOpen(false)}
              className="text-slate-400 hover:text-slate-600 px-2 font-game-mono text-[10px] uppercase"
            >
              Cancel
            </button>
          </form>
        ) : (
          <button
            onClick={() => setIsLoginOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[var(--card-bg)]/70 backdrop-blur-md rounded-full font-game-heading text-lg text-[var(--foreground)]/70 hover:text-[var(--primary)] hover:bg-[var(--card-bg)] border border-transparent transition-all shadow-sm outline-none"
          >
            <UserIcon size={18} className="opacity-70" />
            <span className="hidden sm:inline">LOGIN</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-[var(--card-bg)]/70 backdrop-blur-md rounded-full font-game-heading text-lg text-[var(--primary)] border border-[var(--primary)]/20 transition-all shadow-sm outline-none">
          <UserCircle size={18} />
          <span>{currentUser.username}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-[var(--card-bg)] rounded-2xl shadow-xl border border-[var(--card-border)] p-1 z-[100]">
        <div className="px-4 py-3 border-b border-[var(--card-border)] mb-1">
          <p className="text-[10px] text-slate-400 font-game-mono uppercase tracking-widest">Mastery Points</p>
          <p className="text-lg font-game-heading text-[var(--primary)]">{currentUser.totalMasteryPoints.toLocaleString()}</p>
        </div>
        <DropdownMenuItem
          onClick={logout}
          className="w-full text-left px-4 py-2 rounded-xl font-game-mono text-xs transition-colors cursor-pointer outline-none text-red-500 focus:bg-red-500/10 focus:text-red-500 flex items-center gap-2"
        >
          <LogOut size={14} />
          LOGOUT
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
