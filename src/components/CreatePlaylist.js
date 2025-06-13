import React, { useState } from "react";

const CreatePlaylist = ({ accessToken }) => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [playlistName, setPlaylistName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [message, setMessage] = useState("");

  const handleCreatePlaylist = async () => {
    if (!playlistName) {
      setMessage("⚠️ Playlist name is required.");
      return;
    }

    try {
      const response = await fetch("https://api.spotify.com/v1/me/playlists", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: playlistName,
          public: isPublic,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Playlist created successfully!");
        setPlaylistName("");
        setImageUrl("");
        setIsPublic(true);
        setIsPopupOpen(false);
      } else {
        setMessage(`Error: ${data.error?.message}`);
      }
    } catch (error) {
      console.error("Error creating playlist:", error);
      setMessage("Error creating playlist.");
    }
  };

  return (
    <div>
      {/* Button to Open Popup */}
      <button
        className="absolute top-4 left-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        onClick={() => setIsPopupOpen(true)}
      >
        Create Playlist
      </button>

      {/* Popup for Creating Playlist */}
      {isPopupOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setIsPopupOpen(false)}
        >
          <div
            style={{
              backgroundColor: "#fff",
              padding: "20px",
              borderRadius: "10px",
              width: "400px",
              boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <span
              style={{
                float: "right",
                cursor: "pointer",
                fontSize: "20px",
                fontWeight: "bold",
              }}
              onClick={() => setIsPopupOpen(false)}
            >
              &times;
            </span>
            <h2>Create a New Playlist</h2>

            <input
              type="text"
              placeholder="Playlist Name"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                margin: "10px 0",
                borderRadius: "5px",
                border: "1px solid #ccc",
              }}
            />

            <input
              type="text"
              placeholder="Image URL (Optional)"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                margin: "10px 0",
                borderRadius: "5px",
                border: "1px solid #ccc",
              }}
            />

            <label style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <input
                type="checkbox"
                checked={isPublic}
                onChange={() => setIsPublic(!isPublic)}
              />
              Make Public
            </label>

            <button
              style={{
                width: "100%",
                backgroundColor: "blue",
                color: "white",
                padding: "10px",
                borderRadius: "5px",
                marginTop: "10px",
                cursor: "pointer",
              }}
              onClick={handleCreatePlaylist}
            >
              Create Playlist
            </button>

            {message && <p style={{ marginTop: "10px", color: "red" }}>{message}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatePlaylist;
