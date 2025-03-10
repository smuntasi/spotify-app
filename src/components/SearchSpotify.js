import React, { useState } from "react";
import AddToPlaylist from "./AddToPlaylist";

const SearchSpotify = ({ accessToken }) => {
    console.log("Access Token in SearchSpotify:", accessToken);

    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);

    const handleSearch = (e) => {
        e.preventDefault();

        if (!searchQuery) return;

        fetch(
            `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=track`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        )
            .then((response) => response.json())
            .then((data) => {
                setSearchResults(data.tracks?.items || []);
            })
            .catch((error) => console.error("Error searching Spotify:", error));
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

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Search Spotify</h2>
            <form onSubmit={handleSearch} className="mb-4">
                <input
                    type="text"
                    placeholder="Search for songs"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-gray-700 text-white p-2 rounded w-80 mr-4"
                />
                <button
                    type="submit"
                    className="bg-green-500 px-4 py-2 rounded hover:bg-green-600"
                >
                    Search
                </button>
            </form>

            {searchResults.length > 0 && (
                <div style={{
                    backgroundColor: "#fff",
                    padding: "20px",
                    border: "1px solid #888",
                    width: "50%",
                    maxHeight: "70vh",
                    overflowY: "auto",
                    borderRadius: "8px"
                }}>
                    <h3>Search Results</h3>
                    <ul>
                        {searchResults.map((track, index) => (
                            <li key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.3s', hover: { background: '#ddd' } }}>
                                {track.album.images[0] && (
                                    <img 
                                        src={track.album.images[0].url} 
                                        alt={track.name} 
                                        style={{ width: '50px', height: '50px', borderRadius: '4px' }}
                                    />
                                )}
                                <span>{track.name} - {track.artists.map(artist => artist.name).join(", ")}</span>
                                <button 
                                    onClick={() => playTrack(track.uri)}
                                    style={{ marginLeft: 'auto', fontSize: '16px', cursor: 'pointer', background: 'none', border: 'none', color: 'blue' }}
                                >▶</button>
                                <AddToPlaylist accessToken={accessToken} trackUri={track.uri} />
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default SearchSpotify;
