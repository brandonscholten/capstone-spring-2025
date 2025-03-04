import React from "react";
import DOMPurify from "dompurify";

export default function BoardGameModal({ game, onClose }) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.85)" }}
      onClick={onClose}
    >
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
        <div
          className="mb-4 text-base text-gray-800"
          style={{ maxHeight: "300px" }} // Limit height, making description scrollable
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(game.description),
          }}
        />
        <p className="text-sm text-gray-600">Publisher: {game.publisher}</p>
        <p className="text-sm text-gray-600">Release Year: {game.releaseYear}</p>
        <p className="text-sm text-gray-600">Players: {game.players}</p>
        <p className="text-sm text-gray-600">Complexity: {game.difficulty}</p>
        <p className="text-sm text-gray-600">
          Time to Play: {game.duration} {game.duration.includes("mins") ? "" : "mins"}
        </p>
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
