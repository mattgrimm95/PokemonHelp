import { Link, useLocation } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/pokedex", label: "Pokedex", icon: "📖" },
  { to: "/locations", label: "Map", icon: "🗺️" },
  { to: "/team-builder", label: "Team", icon: "⚔️" },
  { to: "/type-chart", label: "Types", icon: "🎯" },
  { to: "/whos-that-pokemon", label: "Quiz", icon: "❓" },
  { to: "/evolution", label: "Evolution", icon: "🔄" },
];

export default function Navbar() {
  const location = useLocation();

  return (
    <nav className="bg-gradient-to-r from-fire-dark to-fire-red shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center h-14 gap-1">
          <Link
            to="/"
            className="font-retro text-white text-xs mr-4 hover:text-fire-gold transition-colors shrink-0"
          >
            PokemonHelp
          </Link>
          <div className="flex gap-1 overflow-x-auto">
            {NAV_ITEMS.map(item => {
              const active = location.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                    active
                      ? "bg-white/20 text-white"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <span>{item.icon}</span>
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
