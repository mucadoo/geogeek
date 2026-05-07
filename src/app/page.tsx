import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="container-custom flex-grow flex items-center justify-center animate-in fade-in duration-1000 -mt-10">
        <div className="flex flex-col md:flex-row gap-16 items-center w-full max-w-[1000px]">
          
          {/* Left Column - Clean Image Presentation */}
          <div className="flex-1 w-full bg-white rounded-3xl p-6 shadow-[0_10px_40px_rgba(0,0,0,0.05)] border border-gray-100 relative group">
            <Image 
              src="/media/main_argentina.png" 
              alt="Interactive Map Preview" 
              width={500} 
              height={400}
              className="w-full h-auto object-cover rounded-xl group-hover:scale-[1.02] transition-transform duration-500"
              priority
            />
          </div>

          {/* Right Column - Text & Call to Action */}
          <div className="flex-1 flex flex-col items-start text-left">
            <h1 className="text-[42px] font-medium text-[#2c3e50] mb-6 tracking-tight leading-tight">
              About us
            </h1>
            <p className="text-[16px] leading-relaxed text-gray-500 mb-8 font-light">
              Welcome to <strong className="text-[#2c3e50] font-medium">GeoGeek</strong>! Here we breathe geography. 
              Created with the intention of teaching a more interactive geography, GeoGeek has an explorers map that will allow the user to have a better knowledge of the world political territory, besides curiosity and geographical rankings. Do not waste time and start to explore!
            </p>
            <Link href="/map" className="text-[#2c3e50] font-medium flex items-center gap-2 hover:text-primary transition-colors group">
              Explore the Map <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>

        </div>
    </main>
  );
}
