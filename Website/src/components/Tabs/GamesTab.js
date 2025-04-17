import GameCard from "../GameCard";
import { useState, useMemo } from "react";

export default function BoardGamesTab({ isAdmin, sortedGames, fetchGames }) {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Define filteredGames using useMemo to avoid unnecessary recalculations
  const filteredGames = useMemo(() => {
    return sortedGames.filter((game) =>
      game.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sortedGames, searchQuery]);
  
  return (
    <div>
      <div className="mb-4 flex items-center">
        <label htmlFor="game-search" className="mr-2 font-semibold text-gray-700">
          Search by Title:
        </label>
        <form autoComplete="off">
          <input
            type="text"
            id="game-search"
            name="searchQueryNoAutofill"
            placeholder="Enter game title..."
            autoComplete="off"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="p-2 border rounded w-64"
            aria-controls="search-results"
          />
        </form>
      </div>
      <div id="search-results" role="region" aria-live="polite">
        <p className="sr-only">Found {filteredGames.length} games matching your search.</p>
        {/* Games list */}
        {filteredGames.map((game) => (
          <GameCard 
            isAdmin={isAdmin} 
            game={game} 
            key={game.id} 
            resetGames={fetchGames}
          />
        ))}
      </div>
    </div>
  );
}