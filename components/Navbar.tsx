"use client";

import React, { useRef, useState } from 'react';
import { Menu, Search } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import SearchModal from './SearchModal'; // Import the new modal

const Navbar = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const navRef = useRef(null);
  const logoRef = useRef(null);

  useGSAP(() => {
    const tl = gsap.timeline();
    
    tl.to(navRef.current, {
      y: 0,
      opacity: 1,
      duration: 1.2,
      ease: "power4.out",
      delay: 0.2
    })
    .to(logoRef.current, {
      opacity: 1,
      letterSpacing: "0.3em",
      duration: 1.5,
      ease: "power3.out"
    }, "-=1");

  }, { scope: navRef });

  return (
    <>
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      <nav 
        ref={navRef} 
        className="fixed top-0 left-0 w-full z-50 px-8 py-6 flex justify-between items-center mix-blend-difference text-white opacity-0 -translate-y-12"
      >
        
        {/* Left: Menu */}
        <div className="group flex items-center gap-3 cursor-pointer">
          <div className="relative overflow-hidden h-6 w-6">
              <Menu className="absolute top-0 left-0 w-6 h-6 transform group-hover:-translate-y-full transition-transform duration-500 ease-[0.76, 0, 0.24, 1]" />
              <Menu className="absolute top-0 left-0 w-6 h-6 transform translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[0.76, 0, 0.24, 1]" />
          </div>
          <span className="hidden md:block text-xs font-bold tracking-[0.2em] uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-500 -translate-x-2 group-hover:translate-x-0">
            Menu
          </span>
        </div>

        {/* Center: Logo */}
        <div className="absolute left-1/2 -translate-x-1/2 text-center">
          <h1 
            ref={logoRef} 
            className="text-2xl md:text-3xl font-serif font-bold tracking-[0em] opacity-0 cursor-pointer hover:tracking-[0.1em] transition-all duration-700"
          >
            ZENITH
          </h1>
        </div>

        {/* Right: Search Trigger */}
        <div className="flex gap-8 items-center">
          {["DESTINATIONS", "JOURNAL"].map((item, i) => (
              <a key={i} href="#" className="hidden md:block text-[10px] tracking-[0.2em] font-bold uppercase hover:line-through decoration-white decoration-1 transition-all">
                  {item}
              </a>
          ))}
          <Search 
            onClick={() => setIsSearchOpen(true)} // Opens Modal
            className="w-5 h-5 cursor-pointer hover:scale-125 transition-transform duration-300" 
          />
        </div>
      </nav>
    </>
  );
};

export default Navbar;