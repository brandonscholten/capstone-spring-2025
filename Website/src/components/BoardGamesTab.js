import React, { useState } from "react";
import BoardGameCard from "./BoardGameCard";
import CreateBoardGameModal from "./CreateBoardGameModal";
import BoardGameModal from "./BoardGameModal"; // Import the modal

const mockBoardGames = [
  {
    id: 1,
    title: "Chess",
    description:
      "Chess is a two-player, abstract strategy board game that represents medieval warfare on an 8x8 board with alternating light and dark squares. Opposing pieces, traditionally designated White and Black, are initially lined up on either side. Each type of piece has a unique form of movement and capturing occurs when a piece occupies the square of an opposing piece. Players take turns moving one of their pieces in an attempt to capture, attack, defend, or develop their positions. Chess games can end in checkmate, resignation, or one of several types of draws.<br/><br/>Chess is one of the most popular games in the world, played by millions at home, in clubs, online, by correspondence, and in tournaments. The game has its origins in the Indian game Chaturanga and evolved through the centuries into its current form.",
    publisher: "Various",
    releaseYear: 1475,
    image: "https://picsum.photos/200/300?random=9",
    players: "2",
    difficulty: "1.2",
    duration: "60-90",
  },
  {
    id: 2,
    title: "Checkers",
    description: "Simple and engaging board game.",
    publisher: "Various",
    releaseYear: 1100,
    image: "https://picsum.photos/200/300?random=10",
    players: "2",
    difficulty: "Easy",
    duration: "30-45",
  },
  {
    id: 3,
    title: "Go",
    description: "Ancient game of territory control.",
    publisher: "Various",
    releaseYear: 2000,
    image: "https://picsum.photos/200/300?random=11",
    players: "2",
    difficulty: "Hard",
    duration: "90-120",
  },
  {
    id: 4,
    title: "Scrabble",
    description: "Word game for vocabulary lovers.",
    publisher: "Hasbro",
    releaseYear: 1938,
    image: "https://picsum.photos/200/300?random=12",
    players: "2-4",
    difficulty: "Medium",
    duration: "60-90",
  },
  {
    id: 5,
    title: "Monopoly",
    description: "Real estate trading game.",
    publisher: "Hasbro",
    releaseYear: 1935,
    image: "https://picsum.photos/200/300?random=13",
    players: "2-6",
    difficulty: "Medium",
    duration: "90-120",
  },
  {
    id: 6,
    title: "Risk",
    description: "Conquer the world!",
    publisher: "Hasbro",
    releaseYear: 1957,
    image: "https://picsum.photos/200/300?random=14",
    players: "2-6",
    difficulty: "Medium",
    duration: "60-120",
  },
];

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

export default function BoardGamesTab({ isAdmin }) {
  const [boardGames, setBoardGames] = useState(mockBoardGames);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [hoveredEvent, setHoveredEvent] = useState(null);

  // Filter states
  const [filterTitle, setFilterTitle] = useState("");
  const [filterPlayers, setFilterPlayers] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("");
  const [filterDuration, setFilterDuration] = useState("");

  const handleAddBoardGame = (newBoardGame) => {
    setBoardGames([...boardGames, newBoardGame]);
  };

  // Apply filters
  const filteredBoardGames = boardGames.filter((game) => {
    const matchesTitle = game.title.toLowerCase().includes(filterTitle.toLowerCase());
    const matchesPlayers = filterPlayers
      ? checkRangeMatch(game.players, filterPlayers)
      : true;
    const matchesDifficulty = filterDifficulty
      ? Math.abs(parseFloat(game.difficulty) - parseFloat(filterDifficulty)) <= 0.55
      : true;
    const matchesDuration = filterDuration
      ? checkRangeMatch(game.duration, filterDuration)
      : true;
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
      {isAdmin && (
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-[#942E2A] text-white rounded-lg mb-4"
        >
          Create Board Game
        </button>
      )}
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
      {isModalOpen && (
        <CreateBoardGameModal
          setIsModalOpen={setIsModalOpen}
          onAddBoardGame={handleAddBoardGame}
        />
      )}
      {selectedGame && (
        <BoardGameModal
          game={selectedGame}
          onClose={() => setSelectedGame(null)}
        />
      )}
    </div>
  );
}
