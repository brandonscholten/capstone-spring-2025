import { useState, useEffect } from "react";
import CreateGameModal from "./components/createGame";
import EventCard from "./components/EventCard";
import GameCard from "./components/GameCard";
import CreateEventModal from "./components/CreateEventModal";
import BoardGamesTab from "./components/BoardGamesTab";
import CreateBoardGameModal from "./components/CreateBoardGameModal";

const mockEvents = [
  {
    id: 1,
    title: "Board Game Night",
    description:
      "Join us for an epic board game night! This will be a fun and engaging experience where players can trade, build, and strategize.",
    startTime: "20250303T190000Z",
    endTime: "20250303T230000Z",
    game: "Catan",
    price: "$5",
    people: 8,
    image: "https://picsum.photos/200/300?random=1",
  },
  {
    id: 2,
    title: "Strategy Showdown",
    description:
      "Challenge your mind with a night of strategic gameplay and intense competition.",
    startTime: "20250304T180000Z",
    endTime: "20250304T210000Z",
    game: "Risk",
    price: "$10",
    people: 6,
    image: "https://picsum.photos/200/300?random=2",
  },
  {
    id: 3,
    title: "Family Game Fiesta",
    description:
      "Bring the family together for a night of fun games and laughter.",
    startTime: "20250305T170000Z",
    endTime: "20250305T200000Z",
    game: "Monopoly",
    price: "$8",
    people: 4,
    image: "https://picsum.photos/200/300?random=3",
  },
  {
    id: 4,
    title: "Dice Roll Tournament",
    description:
      "Roll the dice and test your luck in this thrilling tournament.",
    startTime: "20250306T190000Z",
    endTime: "20250306T220000Z",
    game: "Yahtzee",
    price: "$7",
    people: 10,
    image: "https://picsum.photos/200/300?random=4",
  },
  {
    id: 5,
    title: "Card Game Social",
    description:
      "Gather with friends for an evening of classic and modern card games.",
    startTime: "20250307T200000Z",
    endTime: "20250307T230000Z",
    game: "Poker",
    price: "$12",
    people: 5,
    image: "https://picsum.photos/200/300?random=5",
  },
  {
    id: 6,
    title: "Role-Playing Quest",
    description:
      "Embark on an immersive role-playing adventure filled with mystery and excitement.",
    startTime: "20250308T170000Z",
    endTime: "20250308T230000Z",
    game: "Dungeons & Dragons",
    price: "$15",
    people: 8,
    image: "https://picsum.photos/200/300?random=6",
  },
  {
    id: 7,
    title: "Trivia Challenge Night",
    description:
      "Test your knowledge and compete for fun prizes in this trivia challenge.",
    startTime: "20250309T180000Z",
    endTime: "20250309T210000Z",
    game: "Trivial Pursuit",
    price: "$5",
    people: 7,
    image: "https://picsum.photos/200/300?random=7",
  },
  {
    id: 8,
    title: "Puzzle Challenge",
    description:
      "Solve puzzles and compete in this fun and brain-teasing event.",
    startTime: "20250310T190000Z",
    endTime: "20250310T220000Z",
    game: "Scrabble",
    price: "$6",
    people: 6,
    image: "https://picsum.photos/200/300?random=8",
  },
];

const mockGames = [
  {
    id: 1,
    title: "Catan",
    organizer: "Alice",
    players: 4,
    description: "Build settlements, trade resources, and dominate Catan!",
    startTime: "20250303T180000Z",
    endTime: "20250303T210000Z",
    participants: ["Alice", "Bob", "Charlie"],
  },
  {
    id: 2,
    title: "D&D One-Shot",
    organizer: "Dave",
    players: 5,
    description: "A thrilling dungeon-crawling experience!",
    startTime: "20250304T193000Z",
    endTime: "20250304T223000Z",
    participants: ["Dave", "Eve"],
  },
  {
    id: 3,
    title: "Chess Tournament",
    organizer: "Frank",
    players: 2,
    description: "Test your strategic skills in a quick game of chess.",
    startTime: "20250305T170000Z",
    endTime: "20250305T190000Z",
    participants: ["Frank", "Grace"],
  },
  {
    id: 4,
    title: "Poker Night",
    organizer: "Helen",
    players: 6,
    description: "Bluff your way to victory in this exciting poker game.",
    startTime: "20250306T200000Z",
    endTime: "20250306T230000Z",
    participants: ["Helen", "Ivy", "Jack"],
  },
  {
    id: 5,
    title: "Scrabble Showdown",
    organizer: "Kevin",
    players: 4,
    description:
      "Wordsmiths unite for a battle of letters and strategy.",
    startTime: "20250307T180000Z",
    endTime: "20250307T210000Z",
    participants: ["Kevin", "Laura", "Mike", "Nina"],
  },
  {
    id: 6,
    title: "Trivia Challenge",
    organizer: "Olivia",
    players: 8,
    description: "Test your knowledge in this fast-paced trivia night.",
    startTime: "20250308T190000Z",
    endTime: "20250308T220000Z",
    participants: ["Olivia", "Paul", "Quincy", "Rita"],
  },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState("events");
  const [rsvpData, setRsvpData] = useState({});
  const [sortBy, setSortBy] = useState("title");
  const [searchQuery, setSearchQuery] = useState("");
  const [isGameModalOpen, setIsGameModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBoardGameModalOpen, setIsBoardGameModalOpen] = useState(false);
  // Check for token and simulate admin check.
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsTokenValid(true);
      // Simulate admin check (for example, token === "admin")
      if (token === "admin") {
        setIsAdmin(true);
      }
    }
  }, []);

  const handleRSVP = (eventId) => {
    const name = prompt("Enter your name:");
    const email = prompt("Enter your email:");
    const discord = prompt("Enter your Discord username (optional):");

    if (name && email) {
      setRsvpData((prev) => ({ ...prev, [eventId]: { name, email, discord } }));
      alert("RSVP successful!");
    }
  };

  const sortedGames = [...mockGames].sort((a, b) => {
    if (sortBy === "players") return b.players - a.players;
    if (sortBy === "time") return a.time.localeCompare(b.time);
    return a.title.localeCompare(b.title);
  });

  return (
    <div className="flex justify-center min-h-screen bg-gray-100 p-4 relative">
      <div className="w-full max-w-4xl bg-white shadow-md rounded-lg p-6">
        {/* Tabs */}
        <div className="border-b border-black mb-4 flex justify-between items-center">
          <div className="flex">
            <button 
              onClick={() => setActiveTab("events")}
              className={`px-4 py-2 rounded-t-lg border ${
                activeTab === "events"
                  ? "bg-[#942E2A] text-white border-t border-l border-r border-[#942E2A] font-semibold"
                  : "bg-white text-black border-black"
              }`}
            >
              Events
            </button>
            <button 
              onClick={() => setActiveTab("games")}
              className={`px-4 py-2 rounded-t-lg border ${
                activeTab === "games"
                  ? "bg-[#942E2A] text-white border-t border-l border-r border-[#942E2A] font-semibold"
                  : "bg-white text-black border-black"
              }`}
            >
              Games
            </button>
            <button 
              onClick={() => setActiveTab("boardgames")}
              className={`px-4 py-2 rounded-t-lg border ${
                activeTab === "boardgames"
                  ? "bg-[#942E2A] text-white border-t border-l border-r border-[#942E2A] font-semibold"
                  : "bg-white text-black border-black"
              }`}
            >
              Board Games
            </button>
          </div>
          {/* Create Buttons */}
          {activeTab === "games" && (
            <button 
              onClick={() => setIsGameModalOpen(true)}
              className="px-4 py-2 bg-[#942E2A] text-white rounded-lg"
            >
              Create Game
            </button>
          )}
          {activeTab === "events" && isTokenValid && (
            <button 
              onClick={() => setIsEventModalOpen(true)}
              className="px-4 py-2 bg-[#942E2A] text-white rounded-lg"
            >
              Create Event
            </button>
          )}
          {activeTab === "boardgames" && isTokenValid && (
            <button 
              onClick={() => setIsBoardGameModalOpen(true)}
              className="px-4 py-2 bg-[#942E2A] text-white rounded-lg"
            >
              Add Game
            </button>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === "events" ? (
          <div className="w-full max-w-6xl bg-white shadow-md rounded-lg p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {mockEvents.map((event) => (
                <EventCard event={event} key={event.id} isValid={isTokenValid} />
              ))}
            </div>
          </div>
        ) : activeTab === "games" ? (
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
              .filter((game) => game.title.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((game) => (
                <GameCard game={game} rsvpData={rsvpData} onRSVP={handleRSVP} key={game.id} />
              ))}
          </div>
        ) : activeTab === "boardgames" ? (
          <BoardGamesTab isAdmin={isAdmin} />
        ) : null}

        {/* Modals */}
        {isGameModalOpen && (
          <CreateGameModal 
            setIsModalOpen={setIsGameModalOpen} 
            onClose={() => setIsGameModalOpen(false)} 
          />
        )}
        {isEventModalOpen && (
          <CreateEventModal 
            setIsModalOpen={setIsEventModalOpen} 
            onClose={() => setIsEventModalOpen(false)} 
          />
        )}
        {isBoardGameModalOpen && (
          <CreateBoardGameModal 
            setIsModalOpen={setIsBoardGameModalOpen} 
            onClose={() => setIsBoardGameModalOpen(false)} 
          />
        )}
      </div>
    </div>
  );
}
