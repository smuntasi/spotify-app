import React, { useState, useEffect } from "react";

const RecentlyPlayed = ({ accessToken }) => {
    const [recentTracks, setRecentTracks] = useState([]);

    useEffect(() => {
        if (!accessToken) return;

        const fetchRecentlyPlayed = async () => {
            try {
                const response = await fetch(
                    "https://api.spotify.com/v1/me/player/recently-played?limit=10",
                    {
                        headers: { Authorization: `Bearer ${accessToken}` },
                    }
                );

                if (!response.ok) throw new Error("Failed to fetch recently played songs");

                const data = await response.json();
                setRecentTracks(data.items);
            } catch (error) {
                console.error("Error fetching recently played tracks:", error);
            }
        };

        fetchRecentlyPlayed();
    }, [accessToken]);

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

    return (
        <div>
            <h2>Recently Played</h2>
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "20px",
                padding: "10px"
            }}>
                {recentTracks.map((item, index) => (
                    <div 
                        key={index} 
                        style={{
                            display: "flex",
                            alignItems: "center",
                            padding: "10px",
                            border: "1px solid #ddd",
                            borderRadius: "8px",
                            boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                        }}
                    >
                        <img
                            src={item.track.album.images[0]?.url}
                            alt={item.track.name}
                            style={{
                                width: "50px",
                                height: "50px",
                                borderRadius: "4px",
                                marginRight: "10px"
                            }}
                        />
                        <span>
                            <strong>{item.track.name}</strong> - {item.track.artists.map(artist => artist.name).join(", ")}
                        </span>
                        <button 
                            onClick={() => playTrack(item.track.uri)}
                            style={{
                                marginLeft: "auto",
                                fontSize: "16px",
                                cursor: "pointer",
                                background: "none",
                                border: "none",
                                color: "blue"
                            }}
                        >▶</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecentlyPlayed;
