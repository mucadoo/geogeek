import React from 'react';
import Link from 'next/link';
import { Map, Trophy, Play } from 'lucide-react';

const games = [
  {
    id: 'us-states',
    title: 'US States Quiz',
    description: 'How well do you know the United States? Guess the highlighted states on the map!',
    icon: Map,
    href: '/games/us-states',
    color: 'bg-blue-500',
  },
];

export default function GamesPage() {
  return (
    <main className="max-w-[1400px] mx-auto px-4 py-12">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Geography Games</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Test your knowledge and challenge yourself with our interactive geography quizzes.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {games.map((game) => {
          const Icon = game.icon;
          return (
            <Link 
              key={game.id} 
              href={game.href}
              className="group relative bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className={`${game.color} w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform`}>
                <Icon size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">{game.title}</h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                {game.description}
              </p>
              <div className="flex items-center gap-2 text-primary font-bold group-hover:gap-3 transition-all">
                <Play size={20} fill="currentColor" />
                PLAY NOW
              </div>
            </Link>
          );
        })}
        
        {/* Placeholder for future games */}
        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-8 flex flex-col items-center justify-center text-center">
          <div className="bg-gray-200 w-16 h-16 rounded-2xl flex items-center justify-center text-gray-400 mb-6">
            <Trophy size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-400 mb-2">More Games Coming Soon</h2>
          <p className="text-gray-400">Stay tuned for more geography challenges!</p>
        </div>
      </div>
    </main>
  );
}
