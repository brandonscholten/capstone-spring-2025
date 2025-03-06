import React, { useState, useEffect } from "react";
import BoardGameCard from "../BoardGameCard";
import CreateBoardGameModal from "../CreateBoardGameModal";
import BoardGameModal from "../BoardGameModal";


// Helper function to check if a number is within a range string (e.g., "2-6" or "60-90")
function checkRangeMatch(value, filter) {
  const filterNum = parseInt(filter, 10);
  if (isNaN(filterNum)) return false;
  const match = value.match(/(\d+)\s*-\s*(\d+)/);
  if (match) {
    const min = parseInt(match[1], 10);
    const max = parseInt(match[2], 10);
    return filterNum >= min && filterNum <= max;
  } else {
    return parseInt(value, 10) === filterNum;
  }
}

export default function BoardGamesTab({ isAdmin, boardGames, fetchBoardGames, onAddBoardGame }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [hoveredEvent, setHoveredEvent] = useState(null);

  // Filter states
  const [filterTitle, setFilterTitle] = useState("");
  const [filterPlayers, setFilterPlayers] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("");
  const [filterDuration, setFilterDuration] = useState("");
  
  useEffect(() => {}, [boardGames]);

  // Apply filters
  const filteredBoardGames = boardGames.filter((game) => {
    const matchesTitle = game.title.toLowerCase().includes(filterTitle.toLowerCase());
    const matchesPlayers = filterPlayers ? checkRangeMatch(game.minplayers + "-" + game.maxplayers, filterPlayers) : true;
    const matchesDifficulty = filterDifficulty
      ? Math.abs(parseFloat(game.difficulty) - parseFloat(filterDifficulty)) <= 0.55
      : true;
    const matchesDuration = filterDuration ? checkRangeMatch(game.duration, filterDuration) : true;
    return matchesTitle && matchesPlayers && matchesDifficulty && matchesDuration;
  });

  const handleMouseEnter = (id) => {
    setHoveredEvent(id);
  };

  const handleMouseLeave = () => {
    setHoveredEvent(null);
  };

  return (
    <div className="w-full max-w-6xl bg-white shadow-md rounded-lg p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Filter Board Games</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input type="text" placeholder="Title" value={filterTitle} onChange={(e) => setFilterTitle(e.target.value)} className="p-2 border rounded" />
          <input type="text" placeholder="Number of Players" value={filterPlayers} onChange={(e) => setFilterPlayers(e.target.value)} className="p-2 border rounded" />
          <input type="text" placeholder="Difficulty" value={filterDifficulty} onChange={(e) => setFilterDifficulty(e.target.value)} className="p-2 border rounded" />
          <input type="text" placeholder="Time to Play (e.g., 60-90)" value={filterDuration} onChange={(e) => setFilterDuration(e.target.value)} className="p-2 border rounded" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {filteredBoardGames.map((game) => (
          <div
            key={game.id}
            onMouseEnter={() => handleMouseEnter(game.id)}
            onMouseLeave={handleMouseLeave}
            onClick={() => setSelectedGame(game)}
            className={`mx-auto relative transition-all duration-300 rounded-lg shadow-lg p-4 flex flex-col items-center overflow-hidden border border-gray-200 
              ${hoveredEvent === game.id ? "scale-105 transform" : "scale-95"}
              w-full sm:w-[80%] md:w-[60%] lg:w-[13vw]
            `}
          >
            <BoardGameCard game={game} />
          </div>
        ))}
      </div>
      {isModalOpen && <CreateBoardGameModal setIsModalOpen={setIsModalOpen} fetchBoardGames={fetchBoardGames} onAddBoardGame={onAddBoardGame}/>}
      {selectedGame && <BoardGameModal game={selectedGame} onClose={() => setSelectedGame(null)} />}
    </div>
  );
}
