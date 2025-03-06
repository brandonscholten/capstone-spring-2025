import { useState } from "react";
import CreateGameModal from "./createGame";

const mockEvents = [
  {
    id: 1,
    title: "Board Game Night",
    description: "Join us for an epic board game night!",
    time: "6:00 PM - 9:00 PM",
    game: "Catan",
    price: "$5",
    people: 8,
    image: "https://picsum.photos/200/300",
  },
  {
    id: 2,
    title: "D&D Campaign",
    description: "A one-shot D&D adventure!",
    time: "7:30 PM - 11:00 PM",
    game: "Dungeons & Dragons",
    price: "Free",
    people: 5,
    image: "https://picsum.photos/200/300",
  },
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
          </div>
          {/* Create Game Button (Top Right) */}
          {activeTab === "games" && (
            <button 
              onClick={() => {
                console.log("I'm genuinely baffled")
                setIsModalOpen(true)}}
              className="px-4 py-2 bg-[#942E2A] text-white rounded-lg"
            >
              Create Game
            </button>
          )}
        </div>

        {/* Events Tab */}
        {activeTab === "events" ? (
          <div>
            {mockEvents.map((event) => (
              <div key={event.id} className="mb-4 p-4 border rounded-lg shadow flex space-x-4">
                <img src={event.image} alt={event.title} className="w-24 h-24 rounded" />
                <div className="flex-1 flex">
                  <div className="w-1/2">
                    <h2 className="text-xl font-bold mb-2">{event.title}</h2>
                    <div className="grid gap-x-2">
                      <span className="font-semibold text-gray-700 text-left">Game: {event.game}</span>
                      <span className="font-semibold text-gray-700 text-left">Time: {event.time}</span>
                      <span className="font-semibold text-gray-700 text-left">Price: {event.price}</span>
                      <span className="font-semibold text-gray-700 text-left">Participants: {event.people}</span>
                    </div>
                    <button 
                      onClick={() => handleRSVP(event.id)} 
                      className="mt-4 px-4 py-2 bg-[#942E2A] text-white rounded"
                    >
                      RSVP
                    </button>
                  </div>
                  <div className="w-1/2 pl-4 border-l flex items-center">
                    <p>{event.description}</p>
                  </div>
                </div>
              </div>
            ))}
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
