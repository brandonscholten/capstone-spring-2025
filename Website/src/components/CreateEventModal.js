// src/components/CreateEventModal.jsx
import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import api from "../api/axiosClient";

// Helper: combine local YYYY-MM-DD + HH:MM into UTC ISO
function combineDateTime(date, time) {
  console.log(time)
  const dt = new Date(`${date}T${time}:00`);
  dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset());
  return dt.toISOString();
}


export default function CreateEventModal({
  setIsModalOpen,
  initialData,
  onSubmit,
  onDelete,
}) {
  // --- HOOKS: always run ---
  const initialStartDate = initialData?.startTime
    ? new Date(initialData.startTime).toLocaleDateString("en-CA")
    : "";
  const initialStartTime = initialData?.startTime
    ? new Date(initialData.startTime)
        .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
    : "";
  const initialEndDate = initialData?.endTime
    ? new Date(initialData.endTime).toLocaleDateString("en-CA")
    : "";
  const initialEndTime = initialData?.endTime
    ? new Date(initialData.endTime)
        .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
    : "";

  const [eventName, setEventName]       = useState(initialData?.title || "");
  const [startDate, setStartDate]       = useState(initialStartDate);
  const [startTime, setStartTime]       = useState(initialStartTime);
  const [endDate, setEndDate]           = useState(initialEndDate);
  const [endTime, setEndTime]           = useState(initialEndTime);
  const [description, setDescription]   = useState(initialData?.description || "");
  const [price, setPrice]               = useState(initialData?.price || "");
  const [imageUrl, setImageUrl]         = useState(initialData?.image || "");
  const [imageFile, setImageFile]       = useState(null);
  const [isRecurring, setIsRecurring]   = useState(initialData?.recurring || false);

  // Sync when initialData changes (edit mode)
  useEffect(() => {
    if (!initialData) return;
    setEventName(initialData.title || "");
    setStartDate(initialStartDate);
    setStartTime(initialStartTime);
    setEndDate(initialEndDate);
    setEndTime(initialEndTime);
    setDescription(initialData.description || "");
    setPrice(initialData.price || "");
    setImageUrl(initialData.image || "");
    setIsRecurring(initialData.recurring || false);
  }, [initialData, initialStartDate, initialStartTime, initialEndDate, initialEndTime]);

  // File → preview
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImageUrl("");
    }
  };
  const fileToBase64 = (file) =>
    new Promise((res, rej) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload  = () => res(reader.result);
      reader.onerror = (err) => rej(err);
    });

  // Save handler
  const handleSave = async () => {
    console.log(startDate, startTime, endDate, endTime);
    const isoStart = combineDateTime(startDate, startTime);
    const isoEnd   = combineDateTime(endDate,   endTime);

    let finalImage = imageUrl;
    if (imageFile) {
      try { finalImage = await fileToBase64(imageFile); }
      catch (err) { console.error("Image conversion failed:", err); }
    }

    const payload = {
      ...initialData,
      title:     eventName,
      startTime: isoStart,
      endTime:   isoEnd,
      description,
      price,
      image:     finalImage,
      recurring: isRecurring,
    };

    onSubmit(payload);
    setIsModalOpen(false);
  };

  // Delete handler
  const handleDelete = () => {
    if (window.confirm("Delete this event? This cannot be undone.")) {
      onDelete(initialData.id);
      setIsModalOpen(false);
    }
  };

  // --- PORTAL RENDER ---
  return ReactDOM.createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={() => setIsModalOpen(false)}
        className="fixed inset-0 bg-black  z-50"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.85)" }}
      />

      {/* Modal Panel */}
      <div
        onClick={() => setIsModalOpen(false)}
        className="fixed inset-0 flex items-center justify-center p-4 z-50"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-full overflow-auto p-6"
        >
          {/* Close “X” */}
          <button
            onClick={() => setIsModalOpen(false)}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
          >
            ✕
          </button>

          <h2 className="text-2xl font-bold mb-4 text-center">
            {initialData ? "Edit Event" : "Create Event"}
          </h2>

          <div className="grid grid-cols-2 gap-4">
            {/* Left */}
            <div>
              <label className="block mb-1">Event Name</label>
              <input
                type="text"
                className="w-full border p-2 rounded mb-2"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
              />

              <label className="block mb-1">Start Date</label>
              <input
                type="date"
                className="w-full border p-2 rounded mb-2"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />

              <label className="block mb-1">End Date</label>
              <input
                type="date"
                className="w-full border p-2 rounded mb-2"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              <label className="block mb-1">Start Time</label>
              <input
                type="time"
                className="w-full border p-2 rounded mb-2"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
              <label className="block mb-1">End Time</label>
              <input
                type="time"
                className="w-full border p-2 rounded mb-2"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />



              <label className="block mb-1">Price</label>
              <input
                type="text"
                className="w-full border p-2 rounded mb-2"
                placeholder="$0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />

              <label className="flex items-center mt-2">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                />
                Recurring Weekly
              </label>
            </div>

            {/* Right */}
            <div>
              <label className="block mb-1">Description</label>
              <textarea
                className="w-full border p-2 rounded mb-2 h-32"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              <label className="block mb-1">Event Image</label>
              <input
                type="file"
                accept="image/*"
                className="w-full mb-2"
                onChange={handleImageUpload}
              />

              {(imageFile || imageUrl) && (
                <img
                  src={imageFile ? URL.createObjectURL(imageFile) : imageUrl}
                  alt="Preview"
                  className="max-w-full rounded mb-2"
                />
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 mt-4">
            {initialData && (
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 text-white rounded"
              >
                Delete
              </button>
            )}
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-[#3C574D] text-white rounded-lg"
            >
              {initialData ? "Save Changes" : "Create Event"}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
