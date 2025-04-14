import { useState, useEffect } from "react";
import CreateGameModal from "./components/CreateGameModal";
import EventsTab from './components/Tabs/EventsTab'
import GamesTab from "./components/Tabs/GamesTab"
import CreateEventModal from "./components/CreateEventModal";
import BoardGamesTab from "./components/Tabs/BoardGamesTab";
import CreateBoardGameModal from "./components/CreateBoardGameModal";
import api from "./api/axiosClient";
export default function Home() {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("activeTab") || "events";
  });// API Calls
  const [events, setEvents] = useState([]);
  const [games, setGames] = useState([]);
  const [boardGames, setBoardGames] = useState([]);
  const [isGameModalOpen, setIsGameModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isBoardGameModalOpen, setIsBoardGameModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
      localStorage.setItem("activeTab", activeTab);
    }, [activeTab]);

  const fetchEvents = async () => {
    api.get("/events")
    .then((response) => setEvents(response.data))
    .catch((error) => console.error("Error fetching games:", error));
  };

  const fetchGames = async() => {
    api.get("/games")
    .then((response) => setGames(response.data))
    .catch((error) => console.error("Error fetching games:", error));
  };

  const fetchBoardGames = async () => {
    api.get("/catalogue")
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
			className={`px-4 py-2 rounded-t-lg border relative group transition-all ${
				activeTab === "events"
				? "bg-[#942E2A] text-white border-t border-l border-r border-[#942E2A] font-semibold"
				: "bg-white text-black border-black hover:scale-105"
			}`}
			>
			<span className="relative z-10">Events</span>
			{activeTab !== "events" && (
				<>
				<span className="absolute inset-0 bg-white rounded-t-lg"></span>
				<span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-[#576b1e] via-[#8ea37e] via-[#bdcc7a] via-[#c4cad5] via-[#d7c2cb] to-[#f8aa68] bg-[length:200%_100%] group-hover:animate-gradient rounded-t-lg"></span>
				</>
			)}
			</button>

			<button
			onClick={() => setActiveTab("games")}
			className={`px-4 py-2 rounded-t-lg border relative group transition-all ${
				activeTab === "games"
				? "bg-[#942E2A] text-white border-t border-l border-r border-[#942E2A] font-semibold"
				: "bg-white text-black border-black hover:scale-105"
			}`}
			>
			<span className="relative z-10">Games</span>
			{activeTab !== "games" && (
				<>
				<span className="absolute inset-0 bg-white rounded-t-lg"></span>
				<span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-[#576b1e] via-[#8ea37e] via-[#bdcc7a] via-[#c4cad5] via-[#d7c2cb] to-[#f8aa68] bg-[length:200%_100%] group-hover:animate-gradient rounded-t-lg"></span>
				</>
			)}
			</button>

			<button
			onClick={() => setActiveTab("boardgames")}
			className={`px-4 py-2 rounded-t-lg border relative group transition-all ${
				activeTab === "boardgames"
				? "bg-[#942E2A] text-white border-t border-l border-r border-[#942E2A] font-semibold"
				: "bg-white text-black border-black hover:scale-105"
			}`}
			>
			<span className="relative z-10">Board Games</span>
			{activeTab !== "boardgames" && (
				<>
				<span className="absolute inset-0 bg-white rounded-t-lg"></span>
				<span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-[#576b1e] via-[#8ea37e] via-[#bdcc7a] via-[#c4cad5] via-[#d7c2cb] to-[#f8aa68] bg-[length:200%_100%] group-hover:animate-gradient rounded-t-lg"></span>
				</>
			)}
			</button>
		


          </div>
          {/* Create Buttons */}
		  {activeTab === "games" && (
			<button
				onClick={() => setIsGameModalOpen(true)}
				className="px-4 py-2 bg-[#942E2A] text-white rounded-lg hover:scale-105 transition-all group relative"
			>
				<span className="relative z-10">Create Game</span>
				<span className="absolute inset-0 bg-[#942E2A] rounded-lg"></span>
				<span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-[#576b1e] via-[#8ea37e] via-[#bdcc7a] via-[#c4cad5] via-[#d7c2cb] to-[#f8aa68] bg-[length:200%_100%] group-hover:animate-gradient rounded-lg"></span>
			</button>
		)}

			{activeTab === "events" && isAdmin && (
			<button
				onClick={() => setIsEventModalOpen(true)}
				className="px-4 py-2 bg-[#942E2A] text-white rounded-lg hover:scale-105 transition-all group relative"
			>
				<span className="relative z-10">Create Event</span>
				<span className="absolute inset-0 bg-[#942E2A] rounded-lg"></span>
				<span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-[#576b1e] via-[#8ea37e] via-[#bdcc7a] via-[#c4cad5] via-[#d7c2cb] to-[#f8aa68] bg-[length:200%_100%] group-hover:animate-gradient rounded-lg"></span>
			</button>
			)}

		{activeTab === "boardgames" && isAdmin && (
			<button
				onClick={() => setIsBoardGameModalOpen(true)}
				className="px-4 py-2 bg-[#942E2A] text-white rounded-lg hover:scale-105 transition-all group relative"
			>
				<span className="relative z-10">Add Game</span>
				<span className="absolute inset-0 bg-[#942E2A] rounded-lg"></span>
				<span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-[#576b1e] via-[#8ea37e] via-[#bdcc7a] via-[#c4cad5] via-[#d7c2cb] to-[#f8aa68] bg-[length:200%_100%] group-hover:animate-gradient rounded-lg"></span>
			</button>
		)}
        </div>

        {/* Tab Content */}
        {activeTab === "events" ? (
            <EventsTab events={events} isAdmin={isAdmin} fetchEvents={fetchEvents}/>
        ) : activeTab === "games" ? (
          <GamesTab isAdmin={isAdmin} sortedGames={sortedGames} fetchGames={fetchGames}/>
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
