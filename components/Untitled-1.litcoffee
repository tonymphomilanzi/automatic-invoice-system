# ZENITH | Infinite Generative Travel Engine

<img width="960" height="421" alt="Image" src="https://github.com/user-attachments/assets/be7f949e-ead8-4f2b-804b-b61bdeee5e97" />

## 🚀 The Vision

**ZENITH** is not just a travel portfolio; it is a **Generative UI (GenUI) Concept** designed to reimagine how users discover luxury destinations. 

Unlike static travel sites, Zenith is built to be an **"AI Concierge"**. The interface is designed to be fluid, immersive, and reactive. It utilizes advanced animation orchestrations to create a cinematic experience that feels more like a film than a website.

**Live Demo:** [Insert your Vercel Link Here]

---

## 🛠 Tech Stack & Architecture

This project was built with a focus on **performance**, **scalability**, and **visual fidelity**.

### Core
- **Framework:** [Next.js 16](https://nextjs.org/) (App Router, Server Components)
- **Language:** [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) (Utility-first, responsive design)

### Animation & Interaction
- **Orchestration:** [GSAP (GreenSock)](https://gsap.com/)
- **Scroll Logic:** GSAP ScrollTrigger
- **Micro-interactions:** Custom hooks for magnetic cursors and parallax effects.

### Design Patterns
- **Atomic Design:** Modular component architecture (`/components`, `/data`, `/hooks`).
- **Data-Driven UI:** UI is decoupled from content, allowing for easy CMS integration.
- **Glassmorphism:** Advanced backdrop-blur and mix-blend-mode techniques.

---

## ✨ Key Features

### 1. Immersive Parallax Gallery
A custom-built vertical scroll experience where images move at different speeds relative to the viewport (`scrub: true`). This creates a sense of depth and 3D space without WebGL overhead.

### 2. Kinetic Typography (Masked Reveals)
Headlines utilize a "Masked Reveal" technique. Text elements are rendered inside overflow-hidden containers and translated smoothly into view, eliminating layout shifts (CLS) and providing a premium feel.

### 3. Dynamic Color Bleed
Using GSAP ScrollTrigger, images transition from a cinematic grayscale to full color as they enter the center of the user's focus. This guides the user's eye and reduces visual noise.

### 4. Custom Interaction Layer
- **Magnetic Navigation:** Navbar items react to proximity.
- **Fluid Cursor:** A custom WebGL-style cursor that lags organically behind mouse movement with a difference-blend mode for visibility on all backgrounds.

---

## 🔮 Future Roadmap (The AI Integration)

The current version represents the **Frontend MVP**. The following features are currently in development:

- [ ] **OpenAI Integration:** Generate custom itineraries based on user "Mood" input (e.g., "Quiet", "Adventure").
- [ ] **Supabase Backend:** User authentication to save/favorite destinations.
- [ ] **Dynamic Data Injection:** Replacing static JSON data with live fetches from the Unsplash API based on AI keywords.
- [ ] **RAG Implementation:** Retrieval-Augmented Generation to fetch real-time flight data for generated trips.

---

## 📦 Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/zenith-travel.git