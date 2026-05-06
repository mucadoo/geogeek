'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Home, Globe, BarChart3, Gamepad2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
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

  return (
    <header className="h-[90px] flex justify-between items-center px-4 w-full max-w-[1400px] mx-auto">
      <Link href="/" className="hover:opacity-80 transition-opacity">
        <Image 
          src="/media/logo.png" 
          alt="Geogeek logo" 
          width={140} 
          height={40}
          className="object-contain"
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
                    "flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-[13px] tracking-widest uppercase transition-all duration-300",
                    isActive 
                      ? "bg-white text-[#2c3e50] shadow-sm border border-gray-100" 
                      : "text-[#2c3e50]/75 hover:text-primary hover:bg-white/50"
                  )}
                >
                  <Icon size={15} className={isActive ? "text-primary" : "text-[#2c3e50]/50"} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
