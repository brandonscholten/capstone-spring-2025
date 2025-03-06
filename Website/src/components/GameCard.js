import React, { useState } from "react";
import RSVPModal from "./RSVPModal";
import CreateGameModal from "./CreateGameModal";


  // Helper function to parse a date string in "YYYYMMDDTHHmmssZ" format.
  function parseEventDate(dateStr) {
    const formatted = dateStr.replace(
      /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/,
      "$1-$2-$3T$4:$5:$6Z"
    );
    return new Date(formatted);
  }
  
  // Helper function to add ordinal suffix to a day (1st, 2nd, 3rd, etc.)
  function addOrdinalSuffix(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }
  
  // Formats the game start and end times into displayable date and time strings.
  function formatEventDateTime(startTimeStr, endTimeStr) {
    const startDate = parseEventDate(startTimeStr);
    const endDate = parseEventDate(endTimeStr);
  
    // Format the date using short month and numeric day.
    const dateOptions = { month: "short", day: "numeric" };
    const startDateFormatted = startDate.toLocaleDateString("en-US", dateOptions);
    const endDateFormatted = endDate.toLocaleDateString("en-US", dateOptions);
  
    let dateDisplay = startDateFormatted;
    if (startDateFormatted !== endDateFormatted) {
      if (startDate.getMonth() === endDate.getMonth()) {
        const monthStr = startDate.toLocaleString("en-US", { month: "short" });
        const startDay = startDate.getDate();
        const endDay = endDate.getDate();
        dateDisplay = `${monthStr} ${addOrdinalSuffix(startDay)}-${addOrdinalSuffix(endDay)}`;
      } else {
        dateDisplay = `${startDateFormatted} - ${endDateFormatted}`;
      }
    }
  
    // Format the time into something like "6pm - 9pm"
    const timeOptions = { hour: "numeric", minute: "numeric", hour12: true };
    let startTimeFormatted = startDate.toLocaleTimeString("en-US", timeOptions);
    let endTimeFormatted = endDate.toLocaleTimeString("en-US", timeOptions);
  
    // Remove the minutes if they are :00 and convert to lowercase.
    startTimeFormatted = startTimeFormatted.replace(":00", "").toLowerCase();
    endTimeFormatted = endTimeFormatted.replace(":00", "").toLowerCase();
    const timeDisplay = `${startTimeFormatted} - ${endTimeFormatted}`;
  
    return { dateDisplay, timeDisplay };
  }
// Async function to verify the game password via an API call.
async function verifyGamePassword(gameId, password) {
  try {
    const response = await fetch("http://localhost:5000/games/verify-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ gameId, password }),
    });
    const data = await response.json();
    return data.isValid;
  } catch (error) {
    console.error("Error verifying password:", error);
    throw error;
  }
}

// Password verification modal component.
function PasswordVerifyModal({ gameId, onClose, onSuccess }) {
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
  
    const handleVerify = async () => {
      if (!password) {
        setError("Please enter a password.");
        return;
      }
      try {
        const isValid = await verifyGamePassword(gameId, password);
        if (isValid) {
          onSuccess();
          onClose();
        } else {
          setError("Incorrect password.");
        }
      } catch (err) {
        setError("Error verifying password. Please try again later.");
      }
    };
  
    return (
      <div className="fixed inset-0 flex justify-center items-center z-50" style={{ backgroundColor: "rgba(0, 0, 0, 0.85)" }}>
        <div className="bg-white p-6 rounded-lg shadow-lg w-[400px] relative">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-600 hover:text-black"
          >
            ✕
          </button>
          <h2 className="text-xl font-bold mb-4 text-center">Verify Password</h2>
          {error && <p className="text-red-500 mb-2">{error}</p>}
          <input
            type="password"
            className="w-full border p-2 rounded mb-4"
            placeholder="Enter game password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError(""); // Clear error as user types
            }}
          />
          <div className="flex justify-end">
            <button
              onClick={handleVerify}
              className="px-4 py-2 bg-[#942E2A] text-white rounded"
            >
              Verify
            </button>
          </div>
        </div>
      </div>
    );
  }

  

  export default function GameCard({ game, resetGames }) {
    const [isRSVPModalOpen, setRSVPModalOpen] = useState(false);
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
  
    // Handle edit click: check token or prompt for password via modal.
    const handleEdit = async () => {
      const token = null; // Replace with: localStorage.getItem("token")
      if (!token) {
        setPasswordModalOpen(true);
        return;
      }
      // If token exists, open edit modal directly.
      setEditModalOpen(true);
    };
  
    // Get the formatted date and time for display.
    const { dateDisplay, timeDisplay } = formatEventDateTime(game.startTime, game.endTime);
  
    return (
      <>
        <div
          key={game.id}
          className="relative mb-4 p-4 border rounded-lg shadow flex space-x-4"
        >
          {/* Edit Icon (always visible) */}
          <button
            onClick={handleEdit}
            className="absolute top-2 right-2 text-gray-600 hover:text-black"
            title="Edit Game"
          >
            ✏️
          </button>
  
          <div className="flex-1 flex">
            <div className="w-1/2">
              <h2 className="text-xl font-bold mb-2">{game.title}</h2>
              <div className="grid gap-y-1">
                <p>
                  <span className="font-semibold text-gray-700">Organizer:</span> {game.organizer}
                </p>
                <p>
                  <span className="font-semibold text-gray-700">Players:</span> {game.players}
                </p>
                <p>
                  <span className="font-semibold text-gray-700">Date:</span> {dateDisplay}
                </p>
                <p>
                  <span className="font-semibold text-gray-700">Time:</span> {timeDisplay}
                </p>
                <p>
                  <span className="font-semibold text-gray-700">Participants:</span> {game.participants ? game.organizer + ", " + game.participants : game.organizer}
                </p>
              </div>
              <button
                onClick={() => setRSVPModalOpen(true)}
                className="mt-4 px-4 py-2 bg-[#942E2A] text-white rounded"
              >
                RSVP
              </button>
            </div>
            <div className="w-1/2 pl-4 border-l flex items-center">
              <p>{game.description}</p>
            </div>
          </div>
        </div>
  
        {isRSVPModalOpen && (
          <RSVPModal
            isOpen={isRSVPModalOpen}
            onClose={() => setRSVPModalOpen(false)}
            eventData={game} // Passing game details to the modal.
            type={"game"}
            refresh={resetGames} // Refresh the games list after RSVP.
          />
        )}
        {isEditModalOpen && (
          <CreateGameModal
            setIsModalOpen={setEditModalOpen}
            initialData={game}
            onSubmit={(updatedGame) => {
              // Send an update call to the backend with updatedGame.
              console.log(updatedGame)
              fetch(`http://localhost:5000/games/${updatedGame.id}`, {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(updatedGame),
              })
                .then((res) => res.json())
                .then(()=> {resetGames()})
                .catch((error) => console.error("Error creating game:", error));
              setEditModalOpen(false);
            }}
            //FIX THIS IT'S INSECURE. ANYONE CAN HIT THIS API AND DELETE WITHOUT A PASSWORD
            //
            //
            //
            //
            onDelete={
              // Delete the game by id.
              (gameId) => {
                fetch(`http://localhost:5000/games`, {
                  method: "DELETE",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ id: gameId }),
                })
                  .then((res) => res.json())
                  .then(()=> {resetGames()})
                  .catch((error) => console.error("Error deleting game:", error));
                setEditModalOpen(false);
              }
            }
          />
        )}
        {isPasswordModalOpen && (
          <PasswordVerifyModal
            gameId={game.id}
            onClose={() => setPasswordModalOpen(false)}
            onSuccess={() => setEditModalOpen(true)}
          />
        )}
      </>
    );
  }
  
