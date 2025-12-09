import React from 'react';

interface OverlayProps {
  isTreeForm: boolean;
  toggleForm: () => void;
}

export const Overlay: React.FC<OverlayProps> = ({ isTreeForm, toggleForm }) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8 z-10">
      
      {/* Top Bar: Removed Music Button */}
      <div className="absolute top-8 right-8 pointer-events-auto">
        {/* Placeholder for future top-right elements if needed */}
      </div>

      {/* Header */}
      <header className="flex flex-col items-center mt-4 opacity-90 pointer-events-none">
        <h3 className="text-[#c5a059] text-sm tracking-[0.3em] font-serif uppercase mb-2">
          🍅🍅🍅
        </h3>
        <h1 className="text-white text-4xl md:text-6xl font-serif text-center" style={{ fontFamily: '"Cinzel", serif' }}>
          MERRY TOMATOMAS
        </h1>
      </header>

      {/* Center Prompt (Hidden when tree is formed) */}
      <div className={`flex-1 flex items-center justify-center transition-opacity duration-1000 ${isTreeForm ? 'opacity-0' : 'opacity-100'}`}>
        <p className="text-[#8baaa0] text-lg font-light italic tracking-wider">
          "Chaos precedes beauty..."
        </p>
      </div>

      {/* Footer Controls */}
      <footer className="flex flex-col items-center mb-8 pointer-events-auto">
        <button
          onClick={toggleForm}
          className="group relative px-8 py-3 bg-transparent overflow-hidden rounded-full transition-all duration-300 hover:scale-105"
        >
          {/* Custom Gold Gradient Border */}
          <div className="absolute inset-0 rounded-full border border-[#c5a059] opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="absolute inset-0 rounded-full border border-[#c5a059] scale-110 opacity-0 group-hover:scale-100 group-hover:opacity-30 transition-all duration-500 blur-sm" />
          
          <div className="relative flex items-center gap-3">
             <span className="text-[#c5a059] font-serif tracking-widest text-sm uppercase group-hover:text-white transition-colors duration-300">
               {isTreeForm ? '小茄专属🎄' : '点亮圣诞树'}
             </span>
             {/* Icon */}
             <div className={`w-2 h-2 rounded-full bg-[#c5a059] transition-all duration-500 ${isTreeForm ? 'shadow-[0_0_10px_#c5a059]' : ''}`} />
          </div>
        </button>
      </footer>
    </div>
  );
};