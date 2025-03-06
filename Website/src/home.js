import { useState, useEffect } from "react";
import CreateGameModal from "./components/CreateGameModal";
import EventsTab from './components/Tabs/EventsTab'
import GamesTab from "./components/Tabs/GamesTab"
import CreateEventModal from "./components/CreateEventModal";
import BoardGamesTab from "./components/Tabs/BoardGamesTab";
import CreateBoardGameModal from "./components/CreateBoardGameModal";
import api from "./api/axiosClient";
export default function Home() {
  const [activeTab, setActiveTab] = useState("events");
  const [events, setEvents] = useState([]);
  const [games, setGames] = useState([]);
  const [boardGames, setBoardGames] = useState([]);
  const [isGameModalOpen, setIsGameModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isBoardGameModalOpen, setIsBoardGameModalOpen] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

// API Calls
  const fetchEvents = async () => {
    api.get("http://localhost:5000/events")
    .then((response) => setEvents(response.data))
    .catch((error) => console.error("Error fetching games:", error));
  };

  const fetchGames = async() => {
    api.get("http://localhost:5000/games")
    .then((response) => setGames(response.data))
    .catch((error) => console.error("Error fetching games:", error));
  };

  const fetchBoardGames = async () => {
    api.get("http://localhost:5000/catalogue")
    .then((response) => setBoardGames(response.data))
    .catch((error) => console.error("Error fetching games:", error));
  };

  const addBoardGame = async (newBoardGame) => {
    api.post("/catalogue", newBoardGame)
    .then(() => fetchBoardGames()) // Re-fetch board games after successful post
    .catch((error) => console.error("Error creating event:", error));
  }

  const addGame = async (newGame) => {
    api.post("/games", newGame)
    .then(() => fetchGames()) // Re-fetch games after successful POST
    .catch((error) => console.error("Error creating game:", error));
  }

  const deleteGame = async (gameId) => {
    api.delete("/games", { data: { id: gameId } }) // Axios DELETE requests use `data` to send body
    .then(() => fetchGames()) // Re-fetch games after successful delete
    .catch((error) => console.error("Error deleting game:", error));
  }

  const addEvent = async (eventData) => {
    api.post("/events", eventData)
    .then(() => fetchEvents()) // Re-fetch events after successful post
    .catch((error) => console.error("Error creating event:", error));
  }

  const deleteEvent = async (eventId) => {
    api.delete("/events", { data: { id: eventId } }) // Axios DELETE requests use `data` for sending body
      .then(() => fetchEvents()) // Re-fetch events after successful deletion
      .catch((error) => console.error("Error deleting event:", error));
  };

  const createBoardGame = async (newBoardGame) => {
    api.post("/catalogue", newBoardGame)
      .then(() => fetchBoardGames()) // Re-fetch board games after successful POST
      .catch((error) => console.error("Error creating board game:", error));
  };
  
  // Check for token and simulate admin check.
  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAdmin(true);
    // if (token) {
    //   setIsTokenValid(true);
    //   if (token === "admin") {
    //     setIsAdmin(true);
    //   }
    // }
  }, []);

  // Fetch events from the backend
  useEffect(() => {
    if (activeTab === "events") {
      fetchEvents();
    }
    else if (activeTab === "games") {
      fetchGames();
    }
    else if (activeTab === "boardgames") {
      fetchBoardGames();
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

          {activeTab === "events" && isAdmin && (
                    <button
                      onClick={() => setIsEventModalOpen(true)}
                      className="px-4 py-2 bg-[#942E2A] text-white rounded-lg"
                    >
                      Create Event
                    </button>
          )}

          {activeTab === "boardgames" && isAdmin && (
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
            <EventsTab events={events} isTokenValid={isAdmin} fetchEvents={fetchEvents}/>
        ) : activeTab === "games" ? (
          <GamesTab sortedGames={sortedGames} fetchGames={fetchGames}/>
        ) : activeTab === "boardgames" ? (
          <BoardGamesTab isAdmin={isAdmin} boardGames={boardGames} fetchBoardGames={fetchBoardGames} onAddBoardGame={(newBoardGame) => {addBoardGame(newBoardGame);}}/>
        ) : null}

        {/* Modals */}
        {isGameModalOpen && (
          <CreateGameModal
            setIsModalOpen={setIsGameModalOpen}
            onSubmit={(newGame) => { addGame(newGame)}}
            onDelete={(gameId) => {  deleteGame(gameId)}}
          />
        )}
        {isEventModalOpen && (
          <CreateEventModal
            setIsModalOpen={setIsEventModalOpen}
            onSubmit={(eventData) => {addEvent(eventData)}}
            onDelete={(eventData) => {deleteEvent(eventData.id)}}
          />
        )}

        {isBoardGameModalOpen && (
          <CreateBoardGameModal
            setIsModalOpen={setIsBoardGameModalOpen}
            onAddBoardGame={(newBoardGame) => {createBoardGame(newBoardGame)}}
          />
        )}
      </div>
    </div>
  );
}
