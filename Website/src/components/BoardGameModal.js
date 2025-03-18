import React from "react";
import DOMPurify from "dompurify";
import api from "../api/axiosClient";
export default function BoardGameModal({ isAdmin, game, onClose, fetchBoardGames}) {

  const handleDelete = async () => {
    try {
      await api.delete(`catalogue`, { data: { id: game.id } });
      if (fetchBoardGames) fetchBoardGames();
    } catch (error) {
      console.error("Error deleting game:", error);
    }
  };
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.85)" }}
      onClick={onClose}
    >
      {isAdmin && (<button 
        onClick={handleDelete} 
        className="absolute top-30 right-150 p-1 text-red-600 hover:text-red-800 transition"
      >
        🗑️
      </button>)}
      <div
        className="bg-white p-8 rounded-lg shadow-lg max-w-3xl w-full overflow-auto"
        onClick={(e) => e.stopPropagation()} // Prevents modal close on inner click
      >

        <img
          src={game.image}
          alt={game.title}
          className="w-full h-60 object-contain rounded mb-4"
        />
        <h2 className="text-2xl font-bold mb-4">{game.title}</h2>
        <p className="text-sm text-gray-600">Publisher: {game.publisher}</p>
        <p className="text-sm text-gray-600">Release Year: {game.releaseYear}</p>
        <p className="text-sm text-gray-600">Players: {game.players}</p>
        <p className="text-sm text-gray-600">Complexity: {game.difficulty}</p>
        <p className="text-sm text-gray-600">
          Time to Play: {game.duration} {game.duration.includes("mins") ? "" : "mins"}
        </p>
        <br></br>
        <div 
        className="h-40 mb-2 text-sm text-gray-800 scroll-hover"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(game.description) }}
      />
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-[#942E2A] text-white rounded"
        >
          Close
        </button>
      </div>
      </div>
  );
}
