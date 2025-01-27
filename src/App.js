import React, { useState, useEffect } from "react";
import { getSpotifyAuthUrl } from "./spotifyAuth";

function App() {
    const [accessToken, setAccessToken] = useState(null);
    const [userData, setUserData] = useState(null);
    const [playlists, setPlaylists] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);

    // Extract access token from URL after login
    useEffect(() => {
        const hash = window.location.hash;
        if (hash) {
            const params = new URLSearchParams(hash.substring(1));
            const token = params.get("access_token");
            if (token) {
                setAccessToken(token);
                window.location.hash = ""; // Clear the hash
            }
        }
    }, []);

    // Fetch user profile data
    useEffect(() => {
        if (accessToken) {
            fetch("https://api.spotify.com/v1/me", {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            })
                .then((response) => response.json())
                .then((data) => setUserData(data))
                .catch((error) => console.error("Error fetching user data:", error));
        }
    }, [accessToken]);

    // Fetch user playlists
    useEffect(() => {
        if (accessToken) {
            fetch("https://api.spotify.com/v1/me/playlists", {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            })
                .then((response) => response.json())
                .then((data) => setPlaylists(data.items))
                .catch((error) => console.error("Error fetching playlists:", error));
        }
    }, [accessToken]);

    // Handle Search
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
        <div className="App">
            {!accessToken ? (
                <a href={getSpotifyAuthUrl()}>Log in with Spotify</a>
            ) : (
                <div>
                    <h1>Welcome, {userData?.display_name}</h1>
                    {userData?.images?.[0] && (
                        <img
                            src={userData.images[0].url}
                            alt="Profile"
                            style={{ borderRadius: "50%", width: "100px" }}
                        />
                    )}
                    <p>Email: {userData?.email}</p>
                    <p>Followers: {userData?.followers?.total}</p>

                    {/* Search Section */}
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
                    </div>

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

                    {/* Display Playlists */}
                    {playlists.length > 0 && (
                        <div>
                            <h2>Your Playlists</h2>
                            <ul>
                                {playlists.map((playlist) => (
                                    <li key={playlist.id} style={{ marginBottom: "10px" }}>
                                        {playlist.images?.[0] && (
                                            <img
                                                src={playlist.images[0].url}
                                                alt="Playlist Cover"
                                                style={{
                                                    width: "50px",
                                                    height: "50px",
                                                    marginRight: "10px",
                                                }}
                                            />
                                        )}
                                        {playlist.name}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default App;
