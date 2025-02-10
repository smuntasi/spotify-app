import React, { useState } from "react";
import AddToPlaylist from "./AddToPlaylist";

const SearchSpotify = ({ accessToken }) => {
    console.log("Access Token in SearchSpotify:", accessToken);

    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [selectedTrackUri, setSelectedTrackUri] = useState(null);

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

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Search Spotify</h2>
            <form onSubmit={handleSearch}>
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
                <ul className="mt-4">
                    {searchResults.map((track) => (
                        <li key={track.id} className="mb-4">
                            <div className="flex items-center space-x-4">
                                {track.album.images[0] && (
                                    <img
                                        src={track.album.images[0].url}
                                        alt="Album Art"
                                        className="w-16 h-16"
                                    />
                                )}
                                <div>
                                    <p className="text-white font-bold">
                                        {track.name}
                                    </p>
                                    <p className="text-gray-400">
                                        {track.artists
                                            .map((artist) => artist.name)
                                            .join(", ")}
                                    </p>
                                    {/* Render AddToPlaylist directly for each track */}
                                    <AddToPlaylist
                                        accessToken={accessToken}
                                        trackUri={track.uri}
                                    />
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default SearchSpotify;
