import React, { useState, useEffect } from "react";
import BoardGameCard from "../BoardGameCard";
import CreateBoardGameModal from "../CreateBoardGameModal";
import BoardGameModal from "../BoardGameModal";
import { FixedSizeGrid } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

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

  // Add column calculation
  const [columnCount, setColumnCount] = useState(3);

  // Tracks which cards have been flipped
  const [flippedCards, setFlippedCards] = useState(new Set());

  // Recalculate column count on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1200) setColumnCount(3);
      else if (window.innerWidth >= 768) setColumnCount(2);
      else setColumnCount(1);
    };
    
    handleResize(); // Set initial value
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  useEffect(() => {}, [boardGames]);

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

  // Calculate row count based on filtered items and columns
  const rowCount = Math.ceil(filteredBoardGames.length / columnCount);

  // Mark cards as flipped
  const markCardAsFlipped = (gameId) => {
    setFlippedCards(prev => {
      const newSet = new Set(prev);
      newSet.add(gameId);
      return newSet;
    });
  };
  
  // Grid cell renderer - combines your existing functionality with virtualization
  const Cell = ({ columnIndex, rowIndex, style }) => {
    const index = rowIndex * columnCount + columnIndex;
    
    // Don't render anything for empty cells
    if (index >= filteredBoardGames.length) return null;
    
    const game = filteredBoardGames[index];

    return (
      <div
        style={{
          ...style,
          padding: '12px',
		  display: 'flex',     
      	justifyContent: 'center', 
      	alignItems: 'center'  
        }}
        key={game.id}
        onClick={() => setSelectedGame(game)}
        className="relative"
      >
        <BoardGameCard 
          isAdmin={isAdmin} 
          game={game} 
          alreadyFlipped={flippedCards.has(game.id)}
          onFlip={() => markCardAsFlipped(game.id)}
        />
      </div>
    );
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

      {/*virtualized grid to help with performance*/}
      <div style={{ height: 800 }}> {/* Fixed height container */}
        <AutoSizer>
          {({ width }) => (
            <FixedSizeGrid
              className="boardgames-grid"
              columnCount={columnCount}
              columnWidth={width / columnCount}
              height={800}
              rowCount={rowCount}
              rowHeight={520} // Adjust based on your card height
              width={width}
              overscanRowCount={1}
            >
              {Cell}
            </FixedSizeGrid>
          )}
        </AutoSizer>
      </div>

      {isModalOpen && <CreateBoardGameModal setIsModalOpen={setIsModalOpen} fetchBoardGames={fetchBoardGames} onAddBoardGame={onAddBoardGame}/>}
      {selectedGame && <BoardGameModal fetchBoardGames={fetchBoardGames} isAdmin={isAdmin} game={selectedGame} onClose={() => setSelectedGame(null)} />}
    </div>
  );
}