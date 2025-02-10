import React, { useState, useEffect } from "react";

const CurrentlyPlaying = ({ accessToken }) => {
    const [currentTrack, setCurrentTrack] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false); // Track play/pause state

    const fetchCurrentlyPlaying = async () => {
        if (!accessToken) {
            console.error("Access token is missing.");
            return;
        }

        try {
            const response = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            if (response.status === 204) {
                console.log("No content - nothing is currently playing.");
                setCurrentTrack(null);
                return;
            }

            if (!response.ok) {
                throw new Error(`Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            setCurrentTrack(data);
            setIsPlaying(data.is_playing); // Set initial play/pause state
        } catch (err) {
            console.error("Error fetching currently playing track:", err);
        }
    };

    const togglePlayPause = async () => {
        if (!accessToken) {
            console.error("Access token is missing.");
            return;
        }

        try {
            const endpoint = isPlaying
                ? "https://api.spotify.com/v1/me/player/pause"
                : "https://api.spotify.com/v1/me/player/play";

            const response = await fetch(endpoint, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to toggle playback: ${response.status}`);
            }

            setIsPlaying(!isPlaying); // Toggle play/pause state
        } catch (err) {
            console.error("Error toggling play/pause:", err);
        }
    };

    const skipToNext = async () => {
        if (!accessToken) {
            console.error("Access token is missing.");
            return;
        }

        try {
            const response = await fetch("https://api.spotify.com/v1/me/player/next", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to skip to next track: ${response.status}`);
            }

            fetchCurrentlyPlaying(); // Refresh the currently playing track
        } catch (err) {
            console.error("Error skipping to next track:", err);
        }
    };

    const skipToPrevious = async () => {
        if (!accessToken) {
            console.error("Access token is missing.");
            return;
        }

        try {
            const response = await fetch("https://api.spotify.com/v1/me/player/previous", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to skip to previous track: ${response.status}`);
            }

            fetchCurrentlyPlaying(); // Refresh the currently playing track
        } catch (err) {
            console.error("Error skipping to previous track:", err);
        }
    };

    useEffect(() => {
        fetchCurrentlyPlaying();
        const interval = setInterval(fetchCurrentlyPlaying, 2000); // Update every 2 seconds
        return () => clearInterval(interval);
    }, [accessToken]);

    if (!currentTrack || !currentTrack.item) {
        return (
            <div
                style={{
                    position: "fixed",
                    top: "10px",
                    right: "10px",
                    background: "linear-gradient(to right, #A020F0, #6a0dad)", // Purple gradient
                    color: "white",
                    padding: "10px",
                    borderRadius: "8px",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                    width: "300px",
                }}
            >
                <p style={{ fontWeight: "bold", marginBottom: "5px", textAlign: "left" }}>Currently Playing:</p>
                <p>No track currently playing.</p>
            </div>
        );
    }

    return (
        <div
            style={{
                position: "fixed",
                top: "10px",
                right: "10px",
                background: "linear-gradient(to right, #A020F0, #6a0dad)", // Purple gradient
                color: "white",
                padding: "10px",
                borderRadius: "8px",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                display: "flex",
                flexDirection: "column", 
                alignItems: "center", 
                width: "300px",
            }}
        >
            <img
                src={currentTrack.item.album.images[0]?.url}
                alt={currentTrack.item.name}
                style={{ width: "50px", height: "50px", borderRadius: "4px", marginBottom: "10px" }}
            />
            <div style={{ textAlign: "center", marginBottom: "10px" }}>
                <p style={{ fontWeight: "bold" }}>Currently Playing:</p>
                <p style={{ fontWeight: "bold" }}>{currentTrack.item.name}</p>
                <p>{currentTrack.item.artists.map((artist) => artist.name).join(", ")}</p>
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
                <button
                    onClick={skipToPrevious}
                    style={{
                        padding: "10px 20px",
                        backgroundColor: "white",
                        color: "#A020F0",
                        fontWeight: "bold",
                        borderRadius: "8px",
                        border: "none",
                        cursor: "pointer",
                    }}
                >
                    Prev
                </button>
                <button
                    onClick={togglePlayPause}
                    style={{
                        padding: "10px 20px",
                        backgroundColor: "white",
                        color: "#A020F0",
                        fontWeight: "bold",
                        borderRadius: "8px",
                        border: "none",
                        cursor: "pointer",
                    }}
                >
                    {isPlaying ? "Pause" : "Play"}
                </button>
                <button
                    onClick={skipToNext}
                    style={{
                        padding: "10px 20px",
                        backgroundColor: "white",
                        color: "#A020F0",
                        fontWeight: "bold",
                        borderRadius: "8px",
                        border: "none",
                        cursor: "pointer",
                    }}
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default CurrentlyPlaying;
