export interface Destination {
  id: string;
  name: string;
  sub: string;
  desc: string;
  img: string;
  lat: string;
  long: string;
}

export const destinations: Destination[] = [
  {
    id: "01",
    name: "Kyoto",
    sub: "The Ancient Capital",
    desc: "Immerse yourself in the quiet power of tradition. Where shadows play on bamboo paths and time stands still.",
    img: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=3270&auto=format&fit=crop",
    lat: "35.0116° N",
    long: "135.7681° E"
  },
  {
    id: "02",
    name: "Iceland",
    sub: "Fire & Ice",
    desc: "A landscape forged by the gods. Witness the raw, unfiltered beauty of nature at the edge of the world.",
    img: "https://images.unsplash.com/photo-1476610182048-b716b8518aae?q=80&w=3259&auto=format&fit=crop",
    lat: "64.9631° N",
    long: "19.0208° W"
  },
  {
    id: "03",
    name: "Tulum",
    sub: "Mayan Coast",
    desc: "Where the jungle meets the jade sea. A sanctuary for the soul, hidden away from the noise of modern life.",
    img: "https://images.unsplash.com/photo-1504541989296-167df755af3f?q=80&w=3000&auto=format&fit=crop",
    lat: "20.2114° N",
    long: "87.4654° W"
  },
  {
    id: "04",
    name: "Cinque Terre",
    sub: "Italian Riviera",
    desc: "Colorful villages clinging to rugged cliffs. A masterpiece of human resilience and Mediterranean beauty.",
    // NEW STABLE LINK
    img: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?q=80&w=3000&auto=format&fit=crop",
    lat: "44.1461° N",
    long: "9.6439° E"
  },
  {
    id: "05",
    name: "Santorini",
    sub: "Aegean Dream",
    desc: "White cycladic architecture clinging to volcanic cliffs. Watch the world's most famous sunset turn the ocean gold.",
    img: "https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=3000&auto=format&fit=crop",
    lat: "36.3932° N",
    long: "25.4615° E"
  },
  {
    id: "06",
    name: "Marrakech",
    sub: "Red City",
    desc: "A sensory explosion of spice, color, and texture. Lose yourself in the labyrinth of the Medina.",
    img: "https://images.unsplash.com/photo-1597212618440-806262de4f6b?q=80&w=3353&auto=format&fit=crop",
    lat: "31.6295° N",
    long: "7.9811° W"
  },
  {
    id: "07",
    name: "Maldives",
    sub: "Indian Ocean",
    desc: "Water so clear it looks like glass. The ultimate disconnect from reality, suspended over the blue abyss.",
    img: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?q=80&w=3265&auto=format&fit=crop",
    lat: "3.2028° N",
    long: "73.2207° E"
  }
];