import React, { useState, useEffect, useRef } from "react";
import BoardGameCard from "../BoardGameCard";
import CreateBoardGameModal from "../CreateBoardGameModal";
import BoardGameModal from "../BoardGameModal";
import { FixedSizeGrid } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

// Remove the virtualization completely and use a simpler rendering strategy
export default function BoardGamesTab({ isAdmin, boardGames, fetchBoardGames, onAddBoardGame }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter states
  const [filterTitle, setFilterTitle] = useState("");
  const [filterPlayers, setFilterPlayers] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("");
  const [filterDuration, setFilterDuration] = useState("");
  
  // Tracks which cards have been flipped
  const [flippedCards, setFlippedCards] = useState(new Set());

  // Preload gradients before showing any content
  useEffect(() => {
    // Create a hidden element with the gradient to preload it
    const preloadEl = document.createElement('div');
    preloadEl.className = 'preload-gradient';
    preloadEl.style.position = 'absolute';
    preloadEl.style.opacity = '0';
    preloadEl.style.width = '1px';
    preloadEl.style.height = '1px';
    preloadEl.style.background = 'linear-gradient(to right, #576b1e, #8ea37e, #bdcc7a, #c4cad5, #d7c2cb, #f8aa68)';
    document.body.appendChild(preloadEl);
    
    // Remove loading state after a brief delay
    const timer = setTimeout(() => {
      setIsLoading(false);
      document.body.removeChild(preloadEl);
    }, 300);
    
    return () => {
      clearTimeout(timer);
      if (document.body.contains(preloadEl)) {
        document.body.removeChild(preloadEl);
      }
    };
  }, []);

  // Apply filters
  const filteredBoardGames = boardGames
    .filter((game) => {
      const matchesTitle = game.title.toLowerCase().includes(filterTitle.toLowerCase());
      const matchesPlayers = filterPlayers ? checkRangeMatch(game.players, filterPlayers) : true;
      const matchesDifficulty = filterDifficulty
        ? Math.abs(parseFloat(game.difficulty) - parseFloat(filterDifficulty)) <= 0.55
        : true;
      const matchesDuration = filterDuration ? checkRangeMatch(game.duration, filterDuration) : true;
      return matchesTitle && matchesPlayers && matchesDifficulty && matchesDuration;
    })
    .sort((a, b) => {
      const filterLower = filterTitle.toLowerCase();
      const aTitle = a.title.toLowerCase();
      const bTitle = b.title.toLowerCase();
      
      // Calculate the index position of filterTitle in each title
      const aIndex = aTitle.indexOf(filterLower);
      const bIndex = bTitle.indexOf(filterLower);
      
      // Lower index means a closer match to filterTitle
      return aIndex - bIndex;
    });

  // Mark cards as flipped
  const markCardAsFlipped = (gameId) => {
    setFlippedCards(prev => {
      const newSet = new Set(prev);
      newSet.add(gameId);
      return newSet;
    });
  };

  return (
    <div className="w-full max-w-6xl gradient-bg rounded-lg p-2">
      <div className="w-full bg-white shadow-md rounded-lg p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Filter Board Games</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input 
              type="text" 
              placeholder="Title" 
              value={filterTitle} 
              onChange={(e) => setFilterTitle(e.target.value)} 
              className="p-2 border rounded"
            />
            <input 
              type="text" 
              placeholder="Number of Players" 
              value={filterPlayers} 
              onChange={(e) => setFilterPlayers(e.target.value)} 
              className="p-2 border rounded"
            />
            <input 
              type="text" 
              placeholder="Difficulty" 
              value={filterDifficulty} 
              onChange={(e) => setFilterDifficulty(e.target.value)} 
              className="p-2 border rounded"
            />
            <input 
              type="text" 
              placeholder="Time to Play (e.g., 60-90)" 
              value={filterDuration} 
              onChange={(e) => setFilterDuration(e.target.value)} 
              className="p-2 border rounded"
            />
          </div>
        </div>

        {/* Replace virtualized grid with a simple grid */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#942E2A]"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-auto" style={{ maxHeight: '800px' }}>
            {filteredBoardGames.map(game => (
              <div 
                key={game.id}
                onClick={() => setSelectedGame(game)}
                className="relative board-game-card-container"
              >
                <BoardGameCard
                  isAdmin={isAdmin}
                  game={game}
                  alreadyFlipped={flippedCards.has(game.id)}
                  onFlip={() => markCardAsFlipped(game.id)}
                />
              </div>
            ))}
          </div>
        )}

        {isModalOpen && <CreateBoardGameModal setIsModalOpen={setIsModalOpen} fetchBoardGames={fetchBoardGames} onAddBoardGame={onAddBoardGame}/>}
        {selectedGame && <BoardGameModal fetchBoardGames={fetchBoardGames} isAdmin={isAdmin} game={selectedGame} onClose={() => setSelectedGame(null)} />}
      </div>
    </div>
  );
}

// Helper function remains the same
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