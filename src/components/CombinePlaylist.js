import React, { useState } from "react";

const CombinePlaylists = ({ playlists, accessToken }) => {
  const [playlist1, setPlaylist1] = useState("");
  const [playlist2, setPlaylist2] = useState("");
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [status, setStatus] = useState("");

  const handleCombine = async () => {
    if (!playlist1 || !playlist2 || !newPlaylistName) {
      setStatus("Please select two playlists and enter a name.");
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/playlists/combine", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          access_token: accessToken,
          playlist_ids: [playlist1, playlist2],
          playlist_name: newPlaylistName,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setStatus(`Playlist combined! New Playlist: ${newPlaylistName}`);
      } else {
        setStatus(`Error: ${data.detail}`);
      }
    } catch (err) {
      console.error("Combine error:", err);
      setStatus("Error combining playlists.");
    }
  };

  if (!playlists) {
    return <p>Loading playlists...</p>;
  }

  return (
    <div className="bg-gray-800 p-6 rounded shadow-md text-white max-w-xl mx-auto mt-8">
      <h2 className="text-xl font-bold mb-4">🎧 Combine Playlists</h2>

      <div className="mb-4">
        <label>Select First Playlist:</label>
        <select
          className="text-black p-2 rounded w-full"
          value={playlist1}
          onChange={(e) => setPlaylist1(e.target.value)}
        >
          <option value="">Select Playlist</option>
          {(playlists || []).map((pl) => (
            <option key={pl.id} value={pl.id}>
              {pl.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label>Select Second Playlist:</label>
        <select
          className="text-black p-2 rounded w-full"
          value={playlist2}
          onChange={(e) => setPlaylist2(e.target.value)}
        >
          <option value="">Select Playlist</option>
          {(playlists || []).map((pl) => (
            <option key={pl.id} value={pl.id}>
              {pl.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label>New Playlist Name:</label>
        <input
          type="text"
          className="text-black p-2 rounded w-full"
          value={newPlaylistName}
          onChange={(e) => setNewPlaylistName(e.target.value)}
        />
      </div>

      <button
        className="bg-green-600 px-4 py-2 rounded hover:bg-green-700"
        onClick={handleCombine}
      >
        Combine Playlists
      </button>

      {status && <p className="mt-4">{status}</p>}
    </div>
  );
};

export default CombinePlaylists;
