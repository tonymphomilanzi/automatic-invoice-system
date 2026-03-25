"use client";

import React from 'react';

const Footer = () => {
  return (
    <footer className="h-screen w-full bg-black text-white flex flex-col justify-between px-6 md:px-12 py-10 relative overflow-hidden">
      
      {/* 1. TOP SECTION: Inputs & Socials (Push to top) */}
      <div className="flex flex-col md:flex-row justify-between items-start w-full relative z-20 pt-10 md:pt-20">
        
        {/* Left: Newsletter */}
        <div className="w-full md:w-1/3">
          <h3 className="text-3xl md:text-5xl font-serif leading-tight">
            Ready to <span className="italic text-neutral-500">vanish?</span> into the unknown.
          </h3>
          
          <div className="relative group max-w-sm">
            <input 
              type="email" 
              placeholder="Email Address" 
              className="w-full bg-transparent border-b border-white/20 py-4 text-lg font-serif outline-none placeholder:text-neutral-700 group-hover:border-white transition-colors duration-500"
            />
            <button className="absolute right-0 top-4 text-xs uppercase tracking-widest text-neutral-500 group-hover:text-white transition-colors duration-300">
              Join
            </button>
          </div>
        </div>

        {/* Right: Socials */}
        <div className="mt-10 md:mt-0 flex gap-8">
             <a href="#" className="hover:text-neutral-400 transition-colors transform hover:scale-110 duration-300">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
             </a>
             <a href="#" className="hover:text-neutral-400 transition-colors transform hover:scale-110 duration-300">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l11.733 16h4.267l-11.733 -16z" /><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" /></svg>
             </a>
             <a href="#" className="hover:text-neutral-400 transition-colors transform hover:scale-110 duration-300">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
             </a>
        </div>
      </div>

      {/* 2. CENTER SECTION: Massive Video Text (Centers itself automatically) */}
      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
        <div className="relative w-full text-center">
            
            {/* 
               THE TRICK: 
               1. Text color is transparent.
               2. WebkitTextStroke gives it an outline.
               3. The video sits BEHIND it.
            */}
            <h1 
                className="text-[22vw] mt-10 font-serif font-black leading-none tracking-tighter text-transparent select-none"
                style={{ WebkitTextStroke: '2px rgba(255,255,255,0.5)' }}
            >
              ZENITH
            </h1>

            {/* The Video Layer - Sits behind text */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[40%] -z-10 overflow-hidden rounded-full blur-[100px] opacity-50">
                 {/* This creates a glow behind the text */}
                 <div className="w-full h-full bg-blue-900/40"></div>
            </div>
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-20 opacity-40 mix-blend-screen">
            {/* The actual video element */}
            </div>

        </div>
      </div>

      {/* 3. BOTTOM SECTION: Copyright (Push to bottom) */}
      <div className="flex justify-between items-end border-t border-white/10 pt-6 relative z-20">
        <div className="text-[10px] text-neutral-500 uppercase tracking-widest">
          © {new Date().getFullYear()} Zenith | All rights reserved
        </div>
        <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="text-xs text-white uppercase tracking-widest hover:text-neutral-400 transition-colors"
        >
          Back to Top
        </button>
      </div>

    </footer>
  );
};

export default Footer;