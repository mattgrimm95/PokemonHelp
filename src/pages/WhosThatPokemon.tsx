import { useState, useCallback, useEffect } from "react";
import { KANTO_DEX } from "../data/frlg-pokemon";
import { getOfficialArtwork, formatName } from "../services/pokeapi";

type Difficulty = "easy" | "medium" | "hard";

function makeConfetti() {
  return Array.from({ length: 30 }, (_, i) => ({
    color: ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8"][i % 6],
    left: Math.random() * 100,
    duration: 1 + Math.random() * 2,
    delay: Math.random() * 0.5,
    rotation: Math.random() * 360,
  }));
}

function getRandomPokemon(exclude?: number) {
  let pick: typeof KANTO_DEX[0];
  do {
    pick = KANTO_DEX[Math.floor(Math.random() * KANTO_DEX.length)];
  } while (pick.id === exclude);
  return pick;
}

function generateChoices(correctId: number): typeof KANTO_DEX[0][] {
  const correct = KANTO_DEX.find(p => p.id === correctId)!;
  const wrong = new Set<number>([correctId]);
  const choices = [correct];
  while (choices.length < 4) {
    const pick = getRandomPokemon();
    if (!wrong.has(pick.id)) {
      wrong.add(pick.id);
      choices.push(pick);
    }
  }
  return choices.sort(() => Math.random() - 0.5);
}

export default function WhosThatPokemon() {
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [currentPokemon, setCurrentPokemon] = useState(getRandomPokemon);
  const [choices, setChoices] = useState(() => generateChoices(currentPokemon.id));
  const [revealed, setRevealed] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiPieces] = useState(makeConfetti);

  const nextRound = useCallback(() => {
    const next = getRandomPokemon(currentPokemon.id);
    setCurrentPokemon(next);
    setChoices(generateChoices(next.id));
    setRevealed(false);
    setSelectedId(null);
    setShowConfetti(false);
  }, [currentPokemon.id]);

  const handleGuess = useCallback((id: number) => {
    if (revealed) return;
    setSelectedId(id);
    setRevealed(true);
    const isCorrect = id === currentPokemon.id;
    setScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
    if (isCorrect) {
      setShowConfetti(true);
    }
  }, [revealed, currentPokemon.id]);

  useEffect(() => {
    if (revealed) {
      const timer = setTimeout(nextRound, 2500);
      return () => clearTimeout(timer);
    }
  }, [revealed, nextRound]);

  const imageSize = difficulty === "hard" ? "w-32 h-32" : difficulty === "easy" ? "w-56 h-56" : "w-44 h-44";

  return (
    <div className="animate-fade-in-up">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h1 className="font-retro text-xl text-fire-dark">Who's That Pokémon?</h1>
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-lg px-3 py-1.5 shadow text-sm">
            <span className="text-gray-500">Score: </span>
            <span className="font-bold text-fire-red">{score.correct}</span>
            <span className="text-gray-400">/{score.total}</span>
          </div>
          <select
            value={difficulty}
            onChange={e => setDifficulty(e.target.value as Difficulty)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white shadow text-sm"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Silhouette area */}
        <div className="bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center py-10 relative overflow-hidden">
          {/* Confetti */}
          {showConfetti && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {confettiPieces.map((p, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-sm"
                  style={{
                    backgroundColor: p.color,
                    left: `${p.left}%`,
                    top: `-5%`,
                    animation: `float ${p.duration}s linear forwards`,
                    animationDelay: `${p.delay}s`,
                    transform: `rotate(${p.rotation}deg)`,
                  }}
                />
              ))}
            </div>
          )}

          <div className="relative">
            <img
              src={getOfficialArtwork(currentPokemon.id)}
              alt={revealed ? currentPokemon.name : "Mystery Pokemon"}
              className={`${imageSize} object-contain transition-all duration-500 drop-shadow-2xl ${
                revealed ? "brightness-100 scale-110" : "brightness-0"
              }`}
            />
            {!revealed && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-retro text-white/20 text-3xl">?</span>
              </div>
            )}
          </div>
        </div>

        {/* Answer area */}
        <div className="p-6">
          {difficulty === "easy" && !revealed && (
            <p className="text-center text-sm text-gray-500 mb-3">
              Hint: This is a {currentPokemon.id <= 50 ? "low" : currentPokemon.id <= 100 ? "mid" : "high"}-number Pokémon
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
            {choices.map(choice => {
              let btnClass = "bg-gray-100 hover:bg-gray-200 text-gray-800";
              if (revealed) {
                if (choice.id === currentPokemon.id) {
                  btnClass = "bg-green-500 text-white scale-105 shadow-lg";
                } else if (choice.id === selectedId) {
                  btnClass = "bg-red-500 text-white";
                } else {
                  btnClass = "bg-gray-100 text-gray-400";
                }
              }
              return (
                <button
                  key={choice.id}
                  onClick={() => handleGuess(choice.id)}
                  disabled={revealed}
                  className={`px-4 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${btnClass}`}
                >
                  {formatName(choice.name)}
                </button>
              );
            })}
          </div>

          {revealed && (
            <div className="text-center mt-4 animate-fade-in-up">
              {selectedId === currentPokemon.id ? (
                <p className="font-retro text-sm text-green-600">Correct! 🎉</p>
              ) : (
                <p className="font-retro text-sm text-red-500">
                  It's {formatName(currentPokemon.name)}!
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">Next round in a moment...</p>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => { setScore({ correct: 0, total: 0 }); nextRound(); }}
        className="mt-4 text-sm text-gray-400 hover:text-gray-600 transition-colors"
      >
        Reset Score
      </button>
    </div>
  );
}
