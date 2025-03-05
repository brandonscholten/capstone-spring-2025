import { useState, useEffect } from "react";
import CreateGameModal from "./components/createGame";
import EventCard from "./components/EventCard";
import GameCard from "./components/GameCard";
import CreateEventModal from "./components/CreateEventModal";
import BoardGamesTab from "./components/BoardGamesTab";
import CreateBoardGameModal from "./components/CreateBoardGameModal";

export default function Home() {
  const [activeTab, setActiveTab] = useState("events");
  const [events, setEvents] = useState([]);
  const [games, setGames] = useState([]);
  const [boardGames, setBoardGames] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isGameModalOpen, setIsGameModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isBoardGameModalOpen, setIsBoardGameModalOpen] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);


  // Check for token and simulate admin check.
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsTokenValid(true);
      if (token === "admin") {
        setIsAdmin(true);
      }
    }
  }, []);

  // Fetch events from the backend
  useEffect(() => {
    if (activeTab === "events") {
      fetch("http://localhost:5000/events")
        .then((res) => res.json())
        .then((data) => setEvents(data))
        .catch((err) => console.error("Error fetching events:", err));
    }
  }, [activeTab]);

  const fetchBoardGames = async () => {
    try {
      const res = await fetch("http://localhost:5000/catalogue");
      const data = await res.json();
      setBoardGames(data); // Ensure this updates state properly
    } catch (error) {
      console.error("Error fetching board games:", error);
    }
  };
  
  const resetEvents = () => {
    fetch("http://localhost:5000/events")
    .then((res) => res.json())
    .then((data) => setEvents(data))
    .catch((err) => console.error("Error fetching events:", err));
  }
  // Fetch games (for the "games" tab)
  useEffect(() => {
    if (activeTab === "games") {
      fetch("http://localhost:5000/games")
        .then((res) => res.json())
        .then((data) => setGames(data))
        .catch((err) => console.error("Error fetching games:", err));
    }
  }, [activeTab]);

  const resetGames = () => {
    fetch("http://localhost:5000/games")
    .then((res) => res.json())
    .then((data) => setGames(data))
    .catch((err) => console.error("Error fetching games:", err));
  }
  // Fetch board games (catalogue) for the "boardgames" tab
  useEffect(() => {
    if (activeTab === "boardgames") {
      fetch("http://localhost:5000/catalogue")
        .then((res) => res.json())
        .then((data) => setBoardGames(data))
        .catch((err) => console.error("Error fetching board games:", err));
    }
  }, [activeTab]);

  // Optionally sort the games array (here simply by title)
  const sortedGames = [...games].sort((a, b) => a.title.localeCompare(b.title));

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
              {events.map((event) => (
                <EventCard event={event} key={event.id} isValid={isTokenValid} resetEvents={resetEvents}/>
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
              .filter((game) =>
                game.title.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((game) => (
                <GameCard game={game} key={game.id} resetGames={resetGames}/>
              ))}
          </div>
        ) : activeTab === "boardgames" ? (
          <BoardGamesTab isAdmin={isAdmin} boardGames={boardGames} fetchBoardGames={fetchBoardGames} onAddBoardGame={(newBoardGame) => {
              fetch("http://localhost:5000/catalogue", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(newBoardGame),
              })
                .then((res) => res.json())
                .then(() => fetchBoardGames())
                .then((data) => {
                  // Optionally, update your state to add the new event.
                  console.log("Event created:", data);
                  // You might re-fetch events from the backend here.
                })
                .catch((error) => console.error("Error creating event:", error));
            }}/>
        ) : null}

        {/* Modals */}
        {isGameModalOpen && (
          <CreateGameModal
            setIsModalOpen={setIsGameModalOpen}
            onSubmit={(newGame) => {
              fetch("http://localhost:5000/games", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(newGame),
              })
                .then((res) => res.json())
                .then(()=> {resetGames()})
                .then((data) => {
                  // Optionally, update your state to add the new game.
                  console.log("Game created:", data);
                  // You might re-fetch games from the backend here.
                })
                .catch((error) => console.error("Error creating game:", error));
            }}
            onDelete={(gameId) => {
              // Similar logic for deletion if needed
              fetch("http://localhost:5000/games", {
                method: "DELETE",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ id: gameId }),
              })
                .then((res) => res.json())
                .then(()=> {resetGames()})
                .then((data) => {
                  console.log("Game deleted:", data);
                })
                .catch((error) => console.error("Error deleting game:", error));
            }}
          />
        )}
        {isEventModalOpen && (
          <CreateEventModal
            setIsModalOpen={setIsEventModalOpen}
            onSubmit={(eventData) => {
              fetch("http://localhost:5000/events", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(eventData),
              })
                .then((res) => res.json())
                .then(() => { resetEvents(); })
                .then((data) => {
                  // Optionally, update your state to add the new event.
                  console.log("Event created:", data);
                  // You might re-fetch events from the backend here.
                })
                .catch((error) => console.error("Error creating event:", error));
            }}
            onDelete={(eventData) => {
              // Similar logic for deletion if needed
              fetch("http://localhost:5000/events", {
                method: "DELETE",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ id: eventData.id }),
              })
                .then((res) => res.json())
                .then(() => { resetEvents(); })
                .then((data) => {
                  console.log("Event deleted:", data);
                })
                .catch((error) => console.error("Error deleting event:", error));
            }}
          />
        )}

        {isBoardGameModalOpen && (
          <CreateBoardGameModal
            setIsModalOpen={setIsBoardGameModalOpen}
            onAddBoardGame={(newBoardGame) => {
              fetch("http://localhost:5000/catalogue", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(newBoardGame),
              })
                .then((res) => res.json())
                .then(() => fetchBoardGames())
                .then((data) => {
                  // Optionally, update your state to add the new event.
                  console.log("Event created:", data);
                  // You might re-fetch events from the backend here.
                })
                .catch((error) => console.error("Error creating event:", error));
            }}
          />
        )}
      </div>
    </div>
  );
}
