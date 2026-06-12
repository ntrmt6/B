import { Upload } from 'lucide-react';

/**
 * App Component (Crystal Orange & Blue - Pure Tailwind)
 * Styled exclusively with Tailwind CSS utilities.
 */
const uploadBtn = () => {
  return (
    <div>
      <button 
        className="group relative px-10 py-4 bg-slate-950 rounded-xl font-bold transition-all duration-500 active:scale-95 overflow-hidden"
        onClick={() => console.log("Upload Initialized")}
      >
        {/* 1. Crystal Gradient Border: Pure Tailwind masking logic */}
        <span className="absolute inset-0 rounded-xl border-2 border-transparent bg-gradient-to-r from-orange-500 to-blue-500 [mask-image:linear-gradient(white,white)_padding-box,linear-gradient(white,white)] [mask-composite:exclude] opacity-70 animate-pulse"></span>
        
        {/* 2. Dual-Tone Glow: Layered Tailwind pulse animations with custom delays */}
        <span className="absolute inset-0 rounded-xl bg-orange-500/20 blur-xl animate-pulse"></span>
        <span className="absolute -inset-1 rounded-xl bg-blue-500/20 blur-2xl animate-pulse [animation-delay:1.5s]"></span>
        
        {/* 3. Luminous Content: Text and Icon */}
        <span className="relative z-10 flex items-center justify-center gap-3">
          <Upload className="w-5 h-5 text-orange-400 transition-all duration-500 group-hover:text-blue-300 group-hover:-translate-y-1 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
          <span className="tracking-[0.1em] uppercase text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-blue-400 group-hover:from-white group-hover:to-white transition-all duration-500">
            Upload Files
          </span>
        </span>

        {/* 4. Prismatic Reflection: Hover shimmer using Tailwind's transform/transition */}
        <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-20 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>

        {/* 5. Edge Highlights: Simulated refraction */}
        <span className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-orange-300/30 to-transparent"></span>
        <span className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-300/30 to-transparent"></span>
      </button>
    </div>
  );
};

export default uploadBtn; 