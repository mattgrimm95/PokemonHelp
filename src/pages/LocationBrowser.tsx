import { useState } from "react";
import { Link } from "react-router-dom";
import { FRLG_LOCATIONS, LOCATION_CATEGORIES } from "../data/frlg-locations";

const CATEGORY_ICONS: Record<string, string> = {
  town: "🏘️",
  city: "🏙️",
  route: "🛤️",
  dungeon: "🏔️",
  landmark: "🏛️",
};

export default function LocationBrowser() {
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [search, setSearch] = useState("");

  const filtered = FRLG_LOCATIONS.filter(loc => {
    const matchCategory = !categoryFilter || loc.category === categoryFilter;
    const matchSearch = !search || loc.displayName.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="animate-fade-in-up">
      <h1 className="font-retro text-xl text-fire-dark mb-4">Location Map</h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Search locations..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-fire-red/30 focus:border-fire-red transition-all text-sm"
        />
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setCategoryFilter("")}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${!categoryFilter ? "bg-fire-red text-white shadow" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}
          >
            All
          </button>
          {LOCATION_CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setCategoryFilter(cat.key === categoryFilter ? "" : cat.key)}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${categoryFilter === cat.key ? "bg-fire-red text-white shadow" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}
            >
              {CATEGORY_ICONS[cat.key]} {cat.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-3">{filtered.length} locations</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {filtered.map(loc => (
          <Link
            key={loc.id}
            to={`/locations/${loc.id}`}
            className="group bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 overflow-hidden border border-gray-100 p-4"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{CATEGORY_ICONS[loc.category]}</span>
              <div>
                <h3 className="font-bold text-sm text-gray-800 group-hover:text-fire-red transition-colors">
                  {loc.displayName}
                </h3>
                <p className="text-xs text-gray-400 capitalize">{loc.category}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
