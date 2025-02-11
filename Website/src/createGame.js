import { useState } from "react";

export default function CreateGameModal({setIsModalOpen}) {
  return (
    <div className="relative">
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[600px] relative">
            {/* Close Button */}
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="absolute top-2 right-2 text-gray-600 hover:text-black"
            >
              ✕
            </button>

            {/* Modal Content */}
            <h2 className="text-2xl font-bold text-center mb-4">Create Game</h2>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Left Side Inputs */}
              <div>
                <label className="block mb-1 font-semibold">Game Name</label>
                <input type="text" className="w-full border p-2 rounded" />

                <label className="block mt-2 mb-1 font-semibold">Start Date</label>
                <div className="flex items-center border p-2 rounded">
                  <input type="date" className="w-full outline-none" />
                </div>

                <label className="block mt-2 mb-1 font-semibold">End Date</label>
                <div className="flex items-center border p-2 rounded">
                  <input type="date" className="w-full outline-none" />
                </div>

                <label className="block mt-2 mb-1 font-semibold">Start Time</label>
                <input type="time" className="w-full border p-2 rounded" />

                <label className="block mt-2 mb-1 font-semibold">End Time</label>
                <input type="time" className="w-full border p-2 rounded" />

                <label className="block mt-2 mb-1 font-semibold">Number of Players</label>
                <input type="number" className="w-full border p-2 rounded" />
              </div>

              {/* Right Side */}
              <div className="flex flex-col">
                <label className="block mb-1 font-semibold">Game Description</label>
                <textarea className="w-full border p-2 rounded h-32"></textarea>

                <label className="block mt-2 mb-1 font-semibold">Game Image</label>
                <div className="w-full h-32 border flex justify-center items-center cursor-pointer">
                  <span className="text-gray-500">Add Image</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="text-right mt-4">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-[#3C574D] text-white rounded-lg"
              >
                Save Game
              </button>
            </div>
          </div>
        </div>
    </div>
  );
}
