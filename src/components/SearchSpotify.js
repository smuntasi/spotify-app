import React, { useState } from "react";

const SearchSpotify = ({ accessToken }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);

    const handleSearch = (e) => {
        e.preventDefault();

        if (!searchQuery) return;

        fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=track,artist,album`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        })
            .then((response) => response.json())
            .then((data) => {
                setSearchResults(data.tracks?.items || []);
            })
            .catch((error) => console.error("Error searching Spotify:", error));
    };

    return (
        <div>
            <h2>Search Spotify</h2>
            <form onSubmit={handleSearch}>
                <input
                    type="text"
                    placeholder="Search for songs, albums, or artists"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ padding: "5px", width: "300px", marginRight: "10px" }}
                />
                <button type="submit">Search</button>
            </form>

            {/* Display Search Results */}
            {searchResults.length > 0 && (
                <div>
                    <h3>Search Results</h3>
                    <ul>
                        {searchResults.map((item) => (
                            <li key={item.id} style={{ marginBottom: "10px" }}>
                                {item.album?.images?.[0] && (
                                    <img
                                        src={item.album.images[0].url}
                                        alt="Album Art"
                                        style={{ width: "50px", height: "50px", marginRight: "10px" }}
                                    />
                                )}
                                <strong>{item.name}</strong> by {item.artists.map((artist) => artist.name).join(", ")}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default SearchSpotify;
