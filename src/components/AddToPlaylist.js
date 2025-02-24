import React, { useState, useEffect } from "react";

const AddToPlaylist = ({ accessToken, trackUri }) => {
  const [playlists, setPlaylists] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch user playlists
  useEffect(() => {
    if (accessToken) {
      fetch("https://api.spotify.com/v1/me/playlists", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
        .then((response) => response.json())
        .then((data) => {
          setPlaylists(data.items);
        })
        .catch((error) => console.error("Error fetching playlists:", error));
    }
  }, [accessToken]);

  // Add track to playlist
  const handleAddToPlaylist = async (playlistId) => {
    if (!playlistId || !trackUri) {
      setSuccessMessage("Please select a playlist.");
      return;
    }

    try {
      const response = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ uris: [trackUri] }),
        }
      );

      if (response.ok) {
        setSuccessMessage("✅ Track added successfully!");
      } else {
        const data = await response.json();
        setSuccessMessage(`❌ Failed to add track: ${data.error?.message}`);
      }
    } catch (error) {
      console.error("Error adding track:", error);
      setSuccessMessage("❌ Error adding track. Check console.");
    }

    setIsDropdownOpen(false); // Close dropdown after adding track
  };

  return (
    <div className="relative">
      <button
        className="bg-green-500 px-4 py-2 rounded hover:bg-green-600"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        Add to Playlist
      </button>

      {isDropdownOpen && playlists.length > 0 && (
        <div className="absolute bg-gray-800 text-white mt-2 p-2 rounded shadow-lg w-56">
          {playlists.map((playlist) => (
            <button
              key={playlist.id}
              className="block w-full text-left px-4 py-2 hover:bg-gray-700"
              onClick={() => handleAddToPlaylist(playlist.id)}
            >
              {playlist.name}
            </button>
          ))}
        </div>
      )}

      {successMessage && <p className="mt-2">{successMessage}</p>}
    </div>
  );
};

export default AddToPlaylist;
