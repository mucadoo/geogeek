'use client';

import { clsx, type ClassValue } from 'clsx';
import { Home, Globe, BarChart3, Gamepad2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems =[
  { href: '/', label: 'HOME', icon: Home },
  { href: '/map', label: 'EXPLORER', icon: Globe },
  { href: '/rankings', label: 'RANKINGS', icon: BarChart3 },
  { href: '/games', label: 'GAMES', icon: Gamepad2 },
];

export default function Header() {
  const pathname = usePathname();
  
  // Determine if the current route should be fullscreen
  const isFullscreen = pathname === '/map' || (pathname.startsWith('/games/') && pathname !== '/games');

  return (
    <header className={cn(
      "w-full z-50 flex h-[90px] items-center transition-all duration-300",
      // If fullscreen, fix it to the top and let clicks pass through the invisible parts
      isFullscreen ? "fixed top-0 left-0 pointer-events-none" : "relative mx-auto max-w-[1400px]"
    )}>
      {/* The inner div restores pointer-events so the logo and buttons are still clickable! */}
      <div className="pointer-events-auto mx-auto flex w-full max-w-[1400px] items-center justify-between px-4">
        <Link href="/" className="transition-opacity hover:opacity-80">
          <Image 
            src="/media/logo.png" 
            alt="Geogeek logo" 
            width={140} 
            height={40}
            className="h-auto w-auto object-contain drop-shadow-md" 
            priority
          />      
        </Link>
        <nav>
          <ul className="flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              
              return (
                <li key={item.href}>
                  <Link 
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-[13px] tracking-widest uppercase transition-all duration-300 shadow-sm",
                      isActive 
                        ? "bg-white text-[#2c3e50] border border-gray-100" 
                        : "bg-white/70 backdrop-blur-md text-[#2c3e50]/75 hover:text-primary hover:bg-white"
                    )}
                  >
                    <Icon size={15} className={isActive ? "text-primary" : "text-[#2c3e50]/50"} />
                    <span className="hidden md:inline">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
