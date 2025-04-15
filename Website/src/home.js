import { useState, useEffect } from "react";
import CreateGameModal from "./components/CreateGameModal";
import EventsTab from "./components/Tabs/EventsTab";
import GamesTab from "./components/Tabs/GamesTab";
import CreateEventModal from "./components/CreateEventModal";
import BoardGamesTab from "./components/Tabs/BoardGamesTab";
import CreateBoardGameModal from "./components/CreateBoardGameModal";
import LoginModal from "./components/LoginModal";
import api from "./api/axiosClient";

export default function Home() {
  const [activeTab, setActiveTab] = useState(
    () => localStorage.getItem("activeTab") || "events"
  );

  // API Calls
  const [events, setEvents] = useState([]);
  const [games, setGames] = useState([]);
  const [boardGames, setBoardGames] = useState([]);
  const [isGameModalOpen, setIsGameModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isBoardGameModalOpen, setIsBoardGameModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginFailed, setLoginFailed] = useState(false);

  useEffect(() => {
    localStorage.setItem("activeTab", activeTab);
  }, [activeTab]);

  const fetchEvents = async () => {
    try {
      const response = await api.get("/events");
      setEvents(response.data);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const fetchGames = async () => {
    try {
      const response = await api.get("/games");
      setGames(response.data);
    } catch (error) {
      console.error("Error fetching games:", error);
    }
  };

  const fetchBoardGames = async () => {
    try {
      const response = await api.get("/catalogue");
      setBoardGames(response.data);
    } catch (error) {
      console.error("Error fetching board games:", error);
    }
  };

  const addBoardGame = async (newBoardGame) => {
    try {
      await api.post("/catalogue", newBoardGame);
      fetchBoardGames();
    } catch (error) {
      console.error("Error creating board game:", error);
    }
  };

  const addGame = async (newGame) => {
    try {
      await api.post("/games", newGame);
      fetchGames();
    } catch (error) {
      console.error("Error creating game:", error);
    }
  };

  const deleteGame = async (gameId) => {
    try {
      await api.delete("/games", { data: { id: gameId } });
      fetchGames();
    } catch (error) {
      console.error("Error deleting game:", error);
    }
  };

  const addEvent = async (eventData) => {
    try {
      await api.post("/events", eventData);
      fetchEvents();
    } catch (error) {
      console.error("Error creating event:", error);
    }
  };

  const deleteEvent = async (eventId) => {
    try {
      await api.delete("/events", { data: { id: eventId } });
      fetchEvents();
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  const createBoardGame = async (newBoardGame) => {
    try {
      await api.post("/catalogue", newBoardGame);
      fetchBoardGames();
    } catch (error) {
      console.error("Error creating board game:", error);
    }
  };

  const handleLogin = async (username, password) => {
    try {
      const response = await api.post("/login", { username, password });
      const token = response.data;
      localStorage.setItem("token", token);
    } catch (error) {
      localStorage.setItem("token", null);
      setLoginFailed(true);
    }
  };

  // Token validation and admin check
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const validateToken = async () => {
        try {
          const response = await api.post("/validate-session", { token });
          if (response.data === true) {
            setIsAdmin(true);
          }
        } catch (error) {
          console.error("Token validation failed:", error);
        }
      };
      validateToken();
    }
  }, []);

  // Fetch data based on the active tab
  useEffect(() => {
    if (activeTab === "events") {
      fetchEvents();
    } else if (activeTab === "games") {
      fetchGames();
    } else if (activeTab === "boardgames") {
      fetchBoardGames();
    }
  }, [activeTab]);

  // Optionally sort the games array (here simply by title)
  const sortedGames = [...games].sort((a, b) =>
    a.title.localeCompare(b.title)
  );

  return (
    <div className="flex justify-center min-h-screen bg-gray-100 p-4 relative">
      <div className="w-full max-w-4xl bg-white shadow-md rounded-lg p-6 relative">
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
          <div className="flex gap-2">
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="px-4 py-2 text-sm text-[#942E2A] border border-[#942E2A] rounded hover:bg-[#942E2A] hover:text-white transition"
            >
              Admin Login
            </button>
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
        </div>

        {/* Tab Content */}
        {activeTab === "events" ? (
          <EventsTab events={events} isAdmin={isAdmin} fetchEvents={fetchEvents} />
        ) : activeTab === "games" ? (
          <GamesTab isAdmin={isAdmin} sortedGames={sortedGames} fetchGames={fetchGames} />
        ) : activeTab === "boardgames" ? (
          <BoardGamesTab
            isAdmin={isAdmin}
            boardGames={boardGames}
            fetchBoardGames={fetchBoardGames}
            onAddBoardGame={(newBoardGame) => addBoardGame(newBoardGame)}
          />
        ) : null}

        {/* Modals */}
        {isGameModalOpen && (
          <CreateGameModal
            setIsModalOpen={setIsGameModalOpen}
            onSubmit={(newGame) => addGame(newGame)}
            onDelete={(gameId) => deleteGame(gameId)}
          />
        )}
        {isEventModalOpen && (
          <CreateEventModal
            setIsModalOpen={setIsEventModalOpen}
            onSubmit={(eventData) => addEvent(eventData)}
            onDelete={(eventData) => deleteEvent(eventData.id)}
          />
        )}
        {isBoardGameModalOpen && (
          <CreateBoardGameModal
            setIsModalOpen={setIsBoardGameModalOpen}
            onAddBoardGame={(newBoardGame) => createBoardGame(newBoardGame)}
          />
        )}
        {isLoginModalOpen && (
          <LoginModal
            setIsModalOpen={setIsLoginModalOpen}
            handleLogin={handleLogin}
            failed={loginFailed}
          />
        )}
      </div>
    </div>
  );
}
