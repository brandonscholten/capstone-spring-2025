import { useState } from "react";
import CreateGameModal from "./createGame";

const mockEvents = [
  {
    id: 1,
    title: "Board Game Night",
    description: "Join us for an epic board game night! This will be a fun and engaging experience where players can trade, build, and strategize.",
    time: "6:00 PM - 9:00 PM",
    game: "Catan",
    price: "$5",
    people: 8,
    image: "https://picsum.photos/200/300",
  },
  {
    id: 2,
    title: "D&D Campaign",
    description: "A one-shot D&D adventure filled with mystery, action, and adventure! Perfect for beginners and veterans alike.",
    time: "7:30 PM - 11:00 PM",
    game: "Dungeons & Dragons",
    price: "Free",
    people: 5,
    image: "https://picsum.photos/200/300",
  },
  {
    id: 7,
    title: "Trivia Night",
    description: "Test your knowledge across various categories in an exciting trivia competition!",
    time: "7:00 PM - 9:00 PM",
    game: "Trivia",
    price: "Free",
    people: 20,
    image: "https://picsum.photos/200/300",
  },
  {
    id: 8,
    title: "Mafia Game Night",
    description: "Can you survive the night? A thrilling social deduction game where deception is key.",
    time: "8:00 PM - 10:30 PM",
    game: "Mafia",
    price: "$5",
    people: 15,
    image: "https://picsum.photos/200/300",
  },
  {
    id: 9,
    title: "Codenames Tournament",
    description: "Work with your team to find the right words while avoiding the enemy’s traps!",
    time: "6:00 PM - 8:30 PM",
    game: "Codenames",
    price: "$10",
    people: 8,
    image: "https://picsum.photos/200/300",
  },
  {
    id: 10,
    title: "Risk Strategy Night",
    description: "Dominate the world in this intense game of strategy and alliances!",
    time: "5:30 PM - 10:00 PM",
    game: "Risk",
    price: "$7",
    people: 6,
    image: "https://picsum.photos/200/300",
  },
  {
    id: 11,
    title: "Werewolf Night",
    description: "A night of hidden roles, strategy, and intense discussions. Can you uncover the werewolves?",
    time: "9:00 PM - 11:30 PM",
    game: "Werewolf",
    price: "$5",
    people: 12,
    image: "https://picsum.photos/200/300",
  },
  {
    id: 12,
    title: "Jackbox Party Games",
    description: "Join us for a fun and hilarious night of digital party games!",
    time: "7:30 PM - 10:00 PM",
    game: "Jackbox",
    price: "Free",
    people: 10,
    image: "https://picsum.photos/200/300",
  }
];

const mockGames = [
  {
    id: 1,
    title: "Catan",
    organizer: "Alice",
    players: 4,
    description: "Build settlements, trade resources, and dominate Catan!",
    time: "6:00 PM",
    participants: ["Alice", "Bob", "Charlie"],
  },
  {
    id: 2,
    title: "D&D One-Shot",
    organizer: "Dave",
    players: 5,
    description: "A thrilling dungeon-crawling experience!",
    time: "7:30 PM",
    participants: ["Dave", "Eve"],
  },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState("events");
  const [rsvpData, setRsvpData] = useState({});
  const [sortBy, setSortBy] = useState("title");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hoveredEvent, setHoveredEvent] = useState(null);
  const [hoverTimeout, setHoverTimeout] = useState(null);

  const handleMouseEnter = (eventId) => {
    const timeout = setTimeout(() => {
      setHoveredEvent(eventId);
    }, 250); 
    setHoverTimeout(timeout);
  };

  const handleMouseLeave = () => {
    clearTimeout(hoverTimeout);
    setHoveredEvent(null);
  };
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
      <div className="w-full max-w-4xl bg-white header-spacer shadow-md rounded-lg p-6">
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
          </div>
          {/* Create Game Button (Top Right) */}
          {activeTab === "games" && (
            <button 
              onClick={() => {
                setIsModalOpen(true)}}
              className="px-4 py-2 bg-[#942E2A] text-white rounded-lg"
            >
              Create Game
            </button>
          )}
        </div>

        {/* Events Tab */}
        {activeTab === "events" ? (

          <div className="w-full max-w-4xl gradient-bg shadow-md rounded-lg p-6">
            <div className="grid bg-white grid-cols-3 gap-6">
          {mockEvents.map((event) => (
            <div
              key={event.id}
              onMouseEnter={() => handleMouseEnter(event.id)}
              onMouseLeave={handleMouseLeave}
              className={`mx-auto relative transition-all duration-300 rounded-lg shadow-lg p-4 flex flex-col items-center overflow-hidden border border-gray-200 
                ${hoveredEvent === event.id ? "w-[20vw] scale-105 transform -translate-x-5" : "w-[17vw] scale-95"}
              `}
            >
              <img
                src={event.image}
                alt={event.title}
                className={`w-full h-40 object-cover rounded-lg transition-all duration-300 
                  ${hoveredEvent === event.id ? "h-48" : "h-40"}
                `}
              />
              <div className="mt-4 text-center w-full">
                <h2 className="text-xl font-bold mb-2">{event.title}</h2>
                <p className="text-gray-700 font-semibold">Game: {event.game}</p>
                <p className="text-gray-700 font-semibold">Date: {event.date}</p>
                <p className="text-gray-700 font-semibold">Time: {event.time}</p>
                <p className="text-gray-700 font-semibold">Price: {event.price}</p>
                <p className="text-gray-500 text-sm mt-2">
                  {hoveredEvent === event.id
                    ? event.description
                    : event.description.substring(0, 50) + "..."}
                </p>
                <button className="relative mt-4 px-4 py-2 text-white rounded hover:scale-105 transition-all overflow-hidden group">
				<span className="relative z-10">RSVP</span>
				<span className="absolute inset-0 bg-[#942E2A]"></span>
				<span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-[#576b1e] via-[#8ea37e] via-[#bdcc7a] via-[#c4cad5] via-[#d7c2cb] to-[#f8aa68] bg-[length:200%_100%] group-hover:animate-gradient"></span>
                </button>
              </div>
            </div>
          ))}

          </div>
          </div>
        ) : (
          <div>
            <div className="mb-4 flex items-center">
              <label className="mr-2 font-semibold text-gray-700">Search by Title:</label>
              <input 
                type="text" 
                placeholder="Enter game title..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
                className="p-2 border rounded w-64"
              />
            </div>

            {sortedGames
              .filter((game) => game.title.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((game) => (
                <div key={game.id} className="mb-4 p-4 border rounded-lg shadow flex space-x-4">
                  <div className="flex-1 flex">
                    <div className="w-1/2">
                      <h2 className="text-xl font-bold mb-2">{game.title}</h2>
                      <div className="grid gap-y-1">
                        <p><span className="font-semibold text-gray-700">Organizer:</span> {game.organizer}</p>
                        <p><span className="font-semibold text-gray-700">Players:</span> {game.players}</p>
                        <p><span className="font-semibold text-gray-700">Time:</span> {game.time}</p>
                        <p><span className="font-semibold text-gray-700">Participants:</span> {game.participants.join(", ")}</p>
                      </div>
                      <button onClick={() => handleRSVP(game.id)} className="mt-4 px-4 py-2 bg-[#942E2A] text-white rounded">
                        RSVP
                      </button>
                    </div>
                    <div className="w-1/2 pl-4 border-l flex items-center">
                      <p>{game.description}</p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Create Game Modal */}
        {isModalOpen && <CreateGameModal setIsModalOpen={setIsModalOpen} onClose={() => setIsModalOpen(false)} />}
      </div>
    </div>
  );
}
