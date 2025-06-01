import React, { useState, useEffect } from "react";

const Playlists = ({ accessToken }) => {
    const [playlists, setPlaylists] = useState([]);
    const [selectedPlaylist, setSelectedPlaylist] = useState(null);
    const [tracks, setTracks] = useState([]);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [likedTracks, setLikedTracks] = useState({}); // Store liked status

    useEffect(() => {
        if (!accessToken) return;

        const fetchPlaylists = async () => {
            try {
                const response = await fetch("https://api.spotify.com/v1/me/playlists", {
                    headers: { Authorization: `Bearer ${accessToken}` },
                });

                if (!response.ok) throw new Error("Failed to fetch playlists");

                const data = await response.json();
                setPlaylists(data.items);
            } catch (error) {
                console.error("Error fetching playlists:", error);
            }
        };

        fetchPlaylists();
    }, [accessToken]);

    const fetchPlaylistTracks = async (playlistId) => {
        if (!accessToken) {
            console.error("Access token is missing");
            return;
        }

        try {
            console.log(`Fetching tracks for playlist: ${playlistId}`);

            const response = await fetch(
                `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
                {
                    headers: { Authorization: `Bearer ${accessToken}` },
                }
            );

            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

            const data = await response.json();
            setTracks(data.items);
            setIsPopupOpen(true);

            // Fetch liked status for tracks
            const trackIds = data.items.map(item => item.track.id).join(",");
            checkLikedStatus(trackIds);
        } catch (error) {
            console.error("Error fetching tracks:", error);
            setTracks([]);
        }
    };

    const checkLikedStatus = async (trackIds) => {
        if (!accessToken || !trackIds) return;

        try {
            const response = await fetch(`https://api.spotify.com/v1/me/tracks/contains?ids=${trackIds}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (!response.ok) throw new Error("Failed to check liked status");

            const data = await response.json();
            const newLikedTracks = {};
            trackIds.split(",").forEach((id, index) => {
                newLikedTracks[id] = data[index];
            });

            setLikedTracks(newLikedTracks);
        } catch (error) {
            console.error("Error checking liked tracks:", error);
        }
    };

    const handlePlaylistClick = (playlist) => {
        setSelectedPlaylist(playlist);
        setTracks([]);
        fetchPlaylistTracks(playlist.id);
    };

    const closePopup = () => {
        setIsPopupOpen(false);
    };

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

            console.log("Track is now playing:", trackUri);
        } catch (error) {
            console.error("Error playing track:", error);
        }
    };

    const toggleLikeTrack = async (trackId) => {
        if (!accessToken || !trackId) return;
    
        const isCurrentlyLiked = likedTracks[trackId]; // Check current liked status
        const method = isCurrentlyLiked ? "DELETE" : "PUT";
    
        try {
            const response = await fetch(`https://api.spotify.com/v1/me/tracks?ids=${trackId}`, {
                method: method,
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            });
    
            if (!response.ok) {
                throw new Error(`Failed to update liked status: ${response.status}`);
            }
    
            console.log(`${isCurrentlyLiked ? "Removed from" : "Added to"} Liked Songs:`, trackId);
    
            // Update UI after successful response
            setLikedTracks(prev => ({
                ...prev,
                [trackId]: !isCurrentlyLiked, // Toggle the state
            }));
        } catch (error) {
            console.error("Error toggling like status:", error);
        }
    };
    

    return (
        <div>
            <h2>Your Playlists</h2>
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                gap: "20px",
                padding: "10px"
            }}>
                {playlists.map((playlist) => (
                    <div 
                        key={playlist.id} 
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            padding: "10px",
                            border: "1px solid #ddd",
                            borderRadius: "8px",
                            textAlign: "center",
                            boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                            cursor: "pointer"
                        }}
                        onClick={() => handlePlaylistClick(playlist)}
                    >
                        {playlist.images?.[0] && (
                            <img
                                src={playlist.images[0].url}
                                alt={playlist.name}
                                style={{
                                    width: "100px",
                                    height: "100px",
                                    borderRadius: "8px",
                                    marginBottom: "10px"
                                }}
                            />
                        )}
                        <span style={{ fontWeight: "bold" }}>{playlist.name}</span>
                    </div>
                ))}
            </div>

            {isPopupOpen && selectedPlaylist && (
                <div style={{
                    display: "block",
                    position: "fixed",
                    zIndex: 1,
                    left: 0,
                    top: 0,
                    width: "100%",
                    height: "100%",
                    backgroundColor: "rgba(0, 0, 0, 0.4)",
                    overflow: "auto"
                }} onClick={closePopup}>
                    <div style={{
                        backgroundColor: "#fff",
                        margin: "10% auto",
                        padding: "20px",
                        border: "1px solid #888",
                        width: "50%",
                        maxHeight: "70vh",
                        overflowY: "auto",
                        borderRadius: "8px"
                    }} onClick={(e) => e.stopPropagation()}>
                        <span style={{
                            color: "#aaa",
                            float: "right",
                            fontSize: "28px",
                            fontWeight: "bold",
                            cursor: "pointer"
                        }} onClick={closePopup}>&times;</span>
                        <h3>{selectedPlaylist.name}</h3>
                        <ul>
                            {tracks.map((item, index) => (
                                <li key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    {item.track && (
                                        <>
                                            <img 
                                                src={item.track.album.images[0]?.url} 
                                                alt={item.track.name} 
                                                style={{ width: '50px', height: '50px', borderRadius: '4px' }}
                                            />
                                            <span>{item.track.name} - {item.track.artists.map(artist => artist.name).join(", ")}</span>

                                            {/* Like Button */}
                                            <button 
                                                onClick={() => toggleLikeTrack(item.track.id)}
                                                style={{
                                                    fontSize: "20px",
                                                    cursor: "pointer",
                                                    background: "none",
                                                    border: "none",
                                                    color: likedTracks[item.track.id] ? "red" : "gray",
                                                }}
                                            >
                                                {likedTracks[item.track.id] ? "❤️" : "🤍"}
                                            </button>

                                            {/* Play Button */}
                                            <button 
                                                onClick={() => playTrack(item.track.uri)}
                                                style={{ marginLeft: 'auto', fontSize: '16px', cursor: 'pointer', background: 'none', border: 'none', color: 'blue' }}
                                            >▶</button>
                                        </>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Playlists;
