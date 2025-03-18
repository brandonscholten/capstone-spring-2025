import GameCard from "../GameCard";
import { useState } from "react";

export default function BoardGamesTab({ isAdmin, sortedGames, fetchGames }) {
export default function GamesTab({ sortedGames, fetchGames, isAdmin }) {
  const [searchQuery, setSearchQuery] = useState("");
    return (
        <div>
        <div className="mb-4 flex items-center">
            <label className="mr-2 font-semibold text-gray-700">
            Search by Title:
            </label>
            <form autoComplete="off">
            <input
                type="text"
                name="searchQueryNoAutofill"
                placeholder="Enter game title..."
                autoComplete="off"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="p-2 border rounded w-64"
            />
            </form>
        </div>
        {sortedGames
            .filter((game) =>
            game.title.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((game) => (
            <GameCard isAdmin={isAdmin} game={game} key={game.id} resetGames={fetchGames}/>
            ))}
        </div>
    )
}
