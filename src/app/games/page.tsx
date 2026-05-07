import { Map, Trophy, Play } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

const games = [
  {
    id: 'us-states',
    title: 'US States Quiz',
    description: 'How well do you know the United States? Guess the highlighted states on the map!',
    icon: Map,
    href: '/games/us-states',
    color: 'bg-blue-500',
  },
  {
    id: 'brazil-states',
    title: 'Brazil States Quiz',
    description: 'Test your knowledge of the Brazilian territory! Can you name all the states?',
    icon: Map,
    href: '/games/brazil-states',
    color: 'bg-green-600',
  },
  {
    id: 'italy-regions',
    title: 'Italy Regions Quiz',
    description: 'Explore the regions of Italy, from Piedmont to Sicily. How many can you name?',
    icon: Map,
    href: '/games/italy-regions',
    color: 'bg-red-500',
  },
  {
    id: 'france-regions',
    title: 'France Regions Quiz',
    description: 'From Brittany to Corsica, test your knowledge of the 18 regions of France!',
    icon: Map,
    href: '/games/france-regions',
    color: 'bg-indigo-600',
  },
  {
    id: 'canada-provinces',
    title: 'Canada Provinces Quiz',
    description: 'How many Canadian provinces and territories do you know? Give it a try, eh!',
    icon: Map,
    href: '/games/canada-provinces',
    color: 'bg-red-600',
  },
  {
    id: 'australia-states',
    title: 'Australia States Quiz',
    description: 'Test your knowledge of the land down under! Can you name all Australian states?',
    icon: Map,
    href: '/games/australia-states',
    color: 'bg-blue-700',
  },
];

export default function GamesPage() {
  return (
    <main className="mx-auto max-w-[1400px] px-4 py-12">
      <header className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-extrabold text-gray-900">Geography Games</h1>
        <p className="mx-auto max-w-2xl text-lg text-gray-600">
          Test your knowledge and challenge yourself with our interactive geography quizzes.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => {
          const Icon = game.icon;
          return (
            <Link 
              key={game.id} 
              href={game.href}
              className="group relative rounded-3xl border border-gray-100 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className={`${game.color} mb-6 flex h-16 w-16 items-center justify-center rounded-2xl text-white transition-transform group-hover:scale-110`}>
                <Icon size={32} />
              </div>
              <h2 className="mb-3 text-2xl font-bold text-gray-800">{game.title}</h2>
              <p className="mb-8 leading-relaxed text-gray-600">
                {game.description}
              </p>
              <div className="text-primary flex items-center gap-2 font-bold transition-all group-hover:gap-3">
                <Play size={20} fill="currentColor" />
                PLAY NOW
              </div>
            </Link>
          );
        })}
        
        {/* Placeholder for future games */}
        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50 p-8 text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-200 text-gray-400">
            <Trophy size={32} />
          </div>
          <h2 className="mb-2 text-xl font-bold text-gray-400">More Games Coming Soon</h2>
          <p className="text-gray-400">Stay tuned for more geography challenges!</p>
        </div>
      </div>
    </main>
  );
}
