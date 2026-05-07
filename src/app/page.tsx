import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="container-custom animate-in fade-in -mt-10 flex flex-grow items-center justify-center duration-1000">
        <div className="flex w-full max-w-[1000px] flex-col items-center gap-16 md:flex-row">
          
          {/* Left Column - Clean Image Presentation */}
          <div className="group relative w-full flex-1 rounded-3xl border border-gray-100 bg-white p-6 shadow-[0_10px_40px_rgba(0,0,0,0.05)]">
            <Image 
              src="/media/main_argentina.png" 
              alt="Interactive Map Preview" 
              width={500} 
              height={400}
              className="h-auto w-full rounded-xl object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              priority
            />
          </div>

          {/* Right Column - Text & Call to Action */}
          <div className="flex flex-1 flex-col items-start text-left">
            <h1 className="mb-6 text-[42px] leading-tight font-medium tracking-tight text-[#2c3e50]">
              About us
            </h1>
            <p className="mb-8 text-[16px] leading-relaxed font-light text-gray-500">
              Welcome to <strong className="font-medium text-[#2c3e50]">GeoGeek</strong>! Here we breathe geography. 
              Created with the intention of teaching a more interactive geography, GeoGeek has an explorers map that will allow the user to have a better knowledge of the world political territory, besides curiosity and geographical rankings. Do not waste time and start to explore!
            </p>
            <Link href="/map" className="hover:text-primary group flex items-center gap-2 font-medium text-[#2c3e50] transition-colors">
              Explore the Map <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>

        </div>
    </main>
  );
}
