import React, { useEffect, useState } from "react";

const Recommendations = ({ accessToken }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  const playTrack = async (trackUri) => {
    if (!accessToken) {
      console.error("Access token is missing.");
      return;
    }

    try {
      const response = await fetch("https://api.spotify.com/v1/me/player/play", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uris: [trackUri] }),
      });

      if (!response.ok) {
        throw new Error(`Failed to play track: ${response.status}`);
      }

      console.log("Playing:", trackUri);
    } catch (error) {
      console.error("Error playing track:", error);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const recRes = await fetch(`http://localhost:8000/recommendations?access_token=${accessToken}`);
      const recData = await recRes.json();
      const ids = recData.recommendations;

      if (ids.length === 0) {
        setRecommendations([]);
        setLoading(false);
        return;
      }

      const tracksRes = await fetch(`https://api.spotify.com/v1/tracks?ids=${ids.join(",")}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const tracksData = await tracksRes.json();
      setRecommendations(tracksData.tracks || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      setLoading(false);
    }
  };

  const buildPlaylist = async () => {
  try {
    const trackIds = recommendations.map((track) => track.id);
    const res = await fetch("http://localhost:8000/playlists/build", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        access_token: accessToken,
        track_ids: trackIds,
        playlist_name: "AI Recommended Mix"
      }),
    });

    const data = await res.json();
    if (res.ok) {
      alert(`✅ Playlist created! View it on Spotify: https://open.spotify.com/playlist/${data.playlist_id}`);
    } else {
      throw new Error(data.detail || "Failed to create playlist");
    }
  } catch (err) {
    console.error("🚨 Error creating playlist:", err);
    alert("Something went wrong creating the playlist.");
  }
};

  useEffect(() => {
    if (accessToken) fetchRecommendations();
  }, [accessToken]);

  if (loading) return <p>Loading recommendations...</p>;

  return (
    <div style={{ padding: "1rem" }}>
      <h2>Recommended Tracks</h2>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: "1rem",
        marginBottom: "2rem"
      }}>
        {recommendations.map((track) => (
          <div key={track.id} style={{
            background: "#1f2937",
            padding: "1rem",
            borderRadius: "8px",
            textAlign: "center",
          }}>
            {track.album?.images?.[0] && (
              <img
                src={track.album.images[0].url}
                alt={track.name}
                style={{ width: "100%", borderRadius: "4px" }}
              />
            )}
            <h4 style={{ margin: "0.5rem 0" }}>{track.name}</h4>
            <p style={{ margin: "0", fontSize: "0.9rem", color: "#aaa" }}>
              {track.artists.map((a) => a.name).join(", ")}
            </p>
            <button
              onClick={() => playTrack(track.uri)}
              style={{
                marginTop: "0.5rem",
                padding: "0.4rem 1rem",
                backgroundColor: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              ▶ Play
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={buildPlaylist}
        style={{
          padding: "0.6rem 1.2rem",
          backgroundColor: "#3b82f6",
          color: "white",
          fontSize: "1rem",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer"
        }}
      >
        🎧 Build Playlist From These
      </button>
    </div>
  );
};

export default Recommendations;
