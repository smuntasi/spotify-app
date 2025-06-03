import React, { useState, useEffect } from "react";

const PlaylistBuilder = ({ accessToken }) => {
  const [playlists, setPlaylists] = useState([]);
  const [playlist1, setPlaylist1] = useState(null);
  const [playlist2, setPlaylist2] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!accessToken) return;
    fetch("https://api.spotify.com/v1/me/playlists", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => res.json())
      .then((data) => setPlaylists(data.items || []))
      .catch((err) => console.error("Error fetching playlists:", err));
  }, [accessToken]);

  const handleCombine = async () => {
    if (!playlist1 || !playlist2 || playlist1 === playlist2) {
      setMessage("⚠️ Please select two different playlists.");
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/api/playlists/combine", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ playlist1_id: playlist1, playlist2_id: playlist2 }),
      });

      if (!response.ok) throw new Error("Failed to combine playlists");
      const data = await response.json();
      setMessage(`✅ Combined playlist created: ${data.name}`);
    } catch (error) {
      console.error("Error combining playlists:", error);
      setMessage("❌ Failed to combine playlists");
    }
  };

  return (
    <div className="text-white p-6">
      <h2 className="text-2xl font-bold mb-4">Playlist Builder</h2>
      <p className="mb-4">Select two playlists to combine:</p>
      <div className="mb-4">
        <select onChange={(e) => setPlaylist1(e.target.value)} className="mr-4 bg-gray-800 p-2 rounded">
          <option value="">Select First Playlist</option>
          {playlists.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <select onChange={(e) => setPlaylist2(e.target.value)} className="bg-gray-800 p-2 rounded">
          <option value="">Select Second Playlist</option>
          {playlists.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>
      <button onClick={handleCombine} className="bg-green-500 px-4 py-2 rounded hover:bg-green-600">
        Combine Playlists
      </button>
      {message && <p className="mt-4">{message}</p>}
    </div>
  );
};

export default PlaylistBuilder;
