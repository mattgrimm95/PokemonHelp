import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

const FEATURES = [
  { to: "/pokedex", label: "Pokédex", icon: "📖", desc: "Browse all 151 Kanto Pokémon", color: "from-red-500 to-orange-500" },
  { to: "/locations", label: "Location Map", icon: "🗺️", desc: "Explore every route and city", color: "from-green-500 to-emerald-500" },
  { to: "/team-builder", label: "Team Builder", icon: "⚔️", desc: "Build your dream team", color: "from-blue-500 to-indigo-500" },
  { to: "/type-chart", label: "Type Chart", icon: "🎯", desc: "What beats what?", color: "from-purple-500 to-pink-500" },
  { to: "/whos-that-pokemon", label: "Who's That Pokémon?", icon: "❓", desc: "Test your knowledge!", color: "from-yellow-500 to-amber-500" },
  { to: "/evolution", label: "Evolution Explorer", icon: "🔄", desc: "See how Pokémon evolve", color: "from-cyan-500 to-blue-500" },
  { to: "/battle-chart", label: "Battle Chart", icon: "💥", desc: "Check move effectiveness", color: "from-rose-500 to-red-500" },
];

const STARTER_IDS = [6, 3, 9];

function makeParticles() {
  return Array.from({ length: 20 }, (_, i) => ({
    width: Math.random() * 8 + 4,
    height: Math.random() * 8 + 4,
    left: Math.random() * 100,
    color: ["#FF8F00", "#FFD54F", "#FF5252"][i % 3],
    duration: 3 + Math.random() * 4,
    delay: Math.random() * 3,
  }));
}

export default function SplashScreen() {
  const [loaded, setLoaded] = useState(false);
  const [particles] = useState(makeParticles);

  useEffect(() => {
    requestAnimationFrame(() => setLoaded(true));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-fire-dark via-fire-red to-fire-orange overflow-hidden relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-20"
            style={{
              width: `${p.width}px`,
              height: `${p.height}px`,
              left: `${p.left}%`,
              bottom: `-10%`,
              backgroundColor: p.color,
              animation: `float ${p.duration}s ease-in-out infinite`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8">
        <div className={`text-center mb-8 transition-all duration-1000 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-10"}`}>
          <h1 className="font-retro text-3xl sm:text-4xl md:text-5xl text-white mb-3 drop-shadow-lg">
            PokémonHelp
          </h1>
          <p className="text-white/80 text-lg sm:text-xl font-medium">
            Your FireRed & LeafGreen Companion
          </p>
        </div>

        <div className={`flex items-end justify-center gap-4 mb-10 transition-all duration-1000 delay-300 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          {STARTER_IDS.map((id, i) => (
            <img
              key={id}
              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`}
              alt="starter"
              className={`drop-shadow-2xl ${i === 0 ? "w-28 sm:w-36 md:w-44 animate-float" : i === 1 ? "w-24 sm:w-32 md:w-40 animate-float [animation-delay:1s]" : "w-28 sm:w-36 md:w-44 animate-float [animation-delay:0.5s]"}`}
              loading="eager"
            />
          ))}
        </div>

        <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-4xl w-full transition-all duration-1000 delay-500 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          {FEATURES.map((f, i) => (
            <Link
              key={f.to}
              to={f.to}
              className="group bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 sm:p-5 text-center hover:bg-white/20 hover:scale-105 transition-all duration-300 hover:shadow-xl animate-fade-in-up"
              style={{ animationDelay: `${600 + i * 100}ms` }}
            >
              <div className="text-3xl sm:text-4xl mb-2 group-hover:scale-110 transition-transform">{f.icon}</div>
              <h2 className="font-retro text-[10px] sm:text-xs text-white mb-1">{f.label}</h2>
              <p className="text-white/60 text-xs hidden sm:block">{f.desc}</p>
            </Link>
          ))}
        </div>

        <p className={`mt-10 text-white/40 text-xs font-retro transition-all duration-1000 delay-1000 ${loaded ? "opacity-100" : "opacity-0"}`}>
          Gotta Catch 'Em All!
        </p>
      </div>
    </div>
  );
}
