"use client";

import React, { useRef } from 'react';
import { X, ArrowRight } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchModal = ({ isOpen, onClose }: SearchModalProps) => {
  const container = useRef(null);

  useGSAP(() => {
    if (isOpen) {
      // Open Animation
      gsap.to(container.current, {
        opacity: 1,
        pointerEvents: "all",
        duration: 0.5,
        ease: "power3.out"
      });
      
      // Animate Input elements up
      gsap.from(".search-item", {
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "power3.out",
        delay: 0.2
      });
    } else {
      // Close Animation
      gsap.to(container.current, {
        opacity: 0,
        pointerEvents: "none",
        duration: 0.5,
        ease: "power3.in"
      });
    }
  }, [isOpen]);

  return (
    <div 
      ref={container} 
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col justify-center items-center opacity-0 pointer-events-none"
    >
      {/* Close Button */}
      <button 
        onClick={onClose} 
        className="absolute top-8 right-8 text-white hover:rotate-90 transition-transform duration-500"
      >
        <X className="w-10 h-10" />
      </button>

      <div className="w-full max-w-4xl px-6">
        <label className="search-item block text-sm tracking-[0.3em] uppercase text-neutral-500 mb-4">
          Where to next?
        </label>
        
        <div className="search-item relative border-b border-white/20 pb-4">
          <input 
            type="text" 
            placeholder="Type a destination..." 
            className="w-full bg-transparent text-5xl md:text-7xl font-serif text-white outline-none placeholder:text-neutral-700"
            autoFocus={isOpen}
          />
          <ArrowRight className="absolute right-0 bottom-6 w-8 h-8 text-white opacity-50" />
        </div>

        <div className="search-item mt-12 flex gap-6 text-sm text-neutral-400">
          <span>SUGGESTED:</span>
          <button className="hover:text-white transition-colors uppercase tracking-widest">Tokyo</button>
          <button className="hover:text-white transition-colors uppercase tracking-widest">Paris</button>
          <button className="hover:text-white transition-colors uppercase tracking-widest">Bali</button>
        </div>
      </div>
    </div>
  );
};

export default SearchModal;