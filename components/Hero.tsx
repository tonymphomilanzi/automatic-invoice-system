"use client";

import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const Hero = () => {
  const container = useRef(null);
  const textTitle = useRef(null);
  const textSub = useRef(null);
  const imageReveal = useRef(null);

  useGSAP(() => {
    const tl = gsap.timeline();

    // 1. Reveal Image Container (Width 0 -> 100%)
    tl.to(imageReveal.current, {
      width: "100%",
      duration: 1.5,
      ease: "power4.inOut",
    })
    // 2. Scale the image inside slightly for parallax feel
    .from(".hero-img", {
      scale: 1.5,
      duration: 2,
      ease: "power2.out"
    }, "-=1.5")
    // 3. Reveal Text
    .from([textTitle.current, textSub.current], {
      y: 100,
      opacity: 0,
      duration: 1,
      stagger: 0.2,
      ease: "power3.out"
    }, "-=0.5");

  }, { scope: container });

  return (
    <section ref={container} className="relative h-screen w-full flex flex-col justify-center items-center overflow-hidden">
      
      {/* Background Image Container */}
      <div ref={imageReveal} className="absolute inset-0 w-0 h-full mx-auto overflow-hidden z-0">
        <div 
          className="hero-img w-full h-full bg-cover bg-center opacity-60"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=3270&auto=format&fit=crop")' }}
        ></div>
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Text Content */}
      <div className="relative z-10 text-center mix-blend-overlay px-4">
        <p ref={textSub} className="text-sm md:text-lg tracking-[0.5em] uppercase mb-4 text-white/90">
          The World Awaits
        </p>
        <h1 ref={textTitle} className="text-[15vw] md:text-[10vw] leading-[0.9] font-serif text-white">
          WANDER
        </h1>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white text-xs tracking-widest animate-bounce">
        SCROLL TO EXPLORE
      </div>
    </section>
  );
};

export default Hero;