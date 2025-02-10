import React, { useState, useEffect } from "react";
import Dropdown from "./Dropdown";

const AddToPlaylist = ({ accessToken, trackUri }) => {
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState("");
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
          setPlaylists(
            data.items.map((playlist) => ({
              label: playlist.name,
              value: playlist.id,
            }))
          );
        })
        .catch((error) => console.error("Error fetching playlists:", error));
    }
  }, [accessToken]);

  // Add track to playlist
  const handleAddToPlaylist = async () => {
    if (!selectedPlaylist || !trackUri) {
      setSuccessMessage("Please select a playlist and a song.");
      return;
    }

    try {
      const response = await fetch(
        `https://api.spotify.com/v1/playlists/${selectedPlaylist}/tracks`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ uris: [trackUri] }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage("✅ Track added successfully!");
      } else {
        setSuccessMessage(`❌ Failed to add track: ${data.error?.message}`);
      }
    } catch (error) {
      console.error("Error adding track:", error);
      setSuccessMessage("❌ Error adding track. Check console.");
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg text-white">
      <h3 className="text-lg font-bold mb-2">Add to Playlist</h3>

      {playlists.length > 0 ? (
        <>
          <Dropdown
            options={playlists}
            onSelect={(value) => setSelectedPlaylist(value)}
          />
          <button
            className="bg-green-500 px-4 py-2 rounded hover:bg-green-600 mt-4"
            onClick={handleAddToPlaylist}
          >
            Add to Playlist
          </button>
          {successMessage && <p className="mt-4">{successMessage}</p>}
        </>
      ) : (
        <p>Loading playlists...</p>
      )}
    </div>
  );
};

export default AddToPlaylist;
