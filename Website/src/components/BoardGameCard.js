import React from "react";
import DOMPurify from "dompurify";

export default function BoardGameCard({ game }) {


  return (
    <div className="relative p-4 border rounded-lg shadow-md bg-white">
      {/* Trash Icon */}

      <img 
        src={game.image} 
        alt={game.title} 
        className="w-full h-40 object-contain rounded mb-2" 
      />
      <h3 className="text-lg font-semibold">{game.title}</h3>
      <p className="text-sm text-gray-600">Publisher: {game.publisher}</p>
      <p className="text-sm text-gray-600">Release Year: {game.releaseYear}</p>
      <p className="text-sm text-gray-600">Players: {game.players}</p>
      <p className="text-sm text-gray-600">Complexity: {game.difficulty}</p>
      <p className="text-sm text-gray-600">Time to Play: {game.duration} mins</p>
      
      {/* Scrollable description container */}
      <div 
        className="h-40 mb-2 text-sm text-gray-800 scroll-hover overflow-y-auto"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(game.description) }}
      />
    </div>
  );
}
