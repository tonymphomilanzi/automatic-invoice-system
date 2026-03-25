import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import FeaturedGrid from "@/components/FeaturedGrid";
import Footer from "@/components/Footer";
import CustomCursor from "@/components/CustomCursor";

export default function Home() {
  return (
    <div className="bg-black min-h-screen">
      
      <CustomCursor />
      <Navbar />
      
      {/* 
         THE CURTAIN (Main Content)
         1. 'relative z-10' puts it ON TOP of the footer.
         2. 'bg-black' is required so you don't see the footer through it.
         3. 'mb-[100vh]' creates empty space at the bottom for the footer to show through.
         4. 'shadow-2xl' adds a nice drop shadow as it lifts up.
      */}
      <main className="relative z-10 bg-black mb-[100vh] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.8)]">
        <Hero />
        <FeaturedGrid />
      </main>

      {/* 
         THE REVEAL (Footer)
         1. 'fixed bottom-0' makes it stay put.
         2. 'z-0' puts it BEHIND the main content.
      */}
      <div className="fixed bottom-0 left-0 w-full h-screen z-0">
        <Footer />
      </div>

    </div>
  );
}