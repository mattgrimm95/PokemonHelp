import { Routes, Route } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import Layout from "./components/Layout";
import SplashScreen from "./pages/SplashScreen";
import Pokedex from "./pages/Pokedex";
import PokemonDetail from "./pages/PokemonDetail";
import LocationBrowser from "./pages/LocationBrowser";
import LocationDetail from "./pages/LocationDetail";
import TeamBuilder from "./pages/TeamBuilder";
import TypeChart from "./pages/TypeChart";
import WhosThatPokemon from "./pages/WhosThatPokemon";
import EvolutionExplorer from "./pages/EvolutionExplorer";

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route element={<Layout />}>
          <Route path="/pokedex" element={<Pokedex />} />
          <Route path="/pokedex/:id" element={<PokemonDetail />} />
          <Route path="/locations" element={<LocationBrowser />} />
          <Route path="/locations/:id" element={<LocationDetail />} />
          <Route path="/team-builder" element={<TeamBuilder />} />
          <Route path="/type-chart" element={<TypeChart />} />
          <Route path="/whos-that-pokemon" element={<WhosThatPokemon />} />
          <Route path="/evolution" element={<EvolutionExplorer />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}
