'use client';

import { User as UserIcon, LogOut, UserCircle, LogIn } from 'lucide-react';
import React from 'react';

import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Link } from '@/i18n/routing';
import { useUserStore } from '@/store/useUserStore';

export default function UserMenu() {
  const { currentUser, logout } = useUserStore();

  if (!currentUser) {
    return (
      <Link
        href="/login"
        className="flex items-center gap-2 px-4 py-2.5 bg-[var(--card-bg)]/70 backdrop-blur-md rounded-full font-game-heading text-lg text-[var(--foreground)]/70 hover:text-[var(--primary)] hover:bg-[var(--card-bg)] border border-transparent transition-all shadow-sm outline-none"
      >
        <LogIn size={18} className="opacity-70" />
        <span className="hidden sm:inline">LOGIN</span>
      </Link>
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
        
        <DropdownMenuItem asChild>
          <Link href="/profile" className="w-full text-left px-4 py-2 rounded-xl font-game-mono text-xs transition-colors cursor-pointer outline-none text-[var(--foreground)] focus:bg-[var(--primary)]/10 focus:text-[var(--primary)] flex items-center gap-2 mb-1">
            <UserIcon size={14} />
            MY PROFILE
          </Link>
        </DropdownMenuItem>

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
