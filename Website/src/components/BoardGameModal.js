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
      <div
        className="bg-white p-8 rounded-lg shadow-lg max-w-3xl w-full overflow-auto relative"
        onClick={(e) => e.stopPropagation()} // Prevents modal close on inner click
      >
        {/* Close button in top-right corner */}
        <button 
			onClick={onClose}
			className="absolute top-2 right-2 px-2 py-1 rounded group hover:scale-105 transition-all"
		>
			<span className="relative z-10 text-white">✕</span>
			<span className="absolute inset-0 bg-[#942E2A] rounded"></span>
			<span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-[#576b1e] via-[#8ea37e] via-[#bdcc7a] via-[#c4cad5] via-[#d7c2cb] to-[#f8aa68] bg-[length:200%_100%] group-hover:animate-gradient rounded"></span>
		</button>
        
        {/* Delete button for admin */}
        {isAdmin && (
          <button 
            onClick={handleDelete} 
            className="absolute top-2 right-12 p-1 text-red-600 hover:text-red-800 transition"
          >
            🗑️
          </button>
        )}

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
        {/* Removed the old close button from here */}
      </div>
    </div>
  );
}