import React, { useState, useEffect } from "react";
import { getSpotifyAuthUrl } from "./spotifyAuth";
import UserProfile from "./components/UserProfile";
import SearchSpotify from "./components/SearchSpotify";
import Playlists from "./components/Playlists";

function App() {
    const [accessToken, setAccessToken] = useState(null);
    const [userData, setUserData] = useState(null);
    const [playlists, setPlaylists] = useState([]);

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

    return (
        <div className="App bg-gray-900 min-h-screen flex">
            {!accessToken ? (
                <div className="flex flex-col items-center justify-center w-full">
                    <h1 className="text-5xl font-bold mb-8 text-center">Welcome to Spotify</h1>
                    <a
                        href={getSpotifyAuthUrl()}
                        className="bg-green-500 px-8 py-4 rounded-full text-2xl font-bold hover:bg-green-600 transition"
                    >
                        Log In
                    </a>
                </div>
            ) : (
                <div className="container mx-auto">
                    <UserProfile userData={userData} />
                    <SearchSpotify accessToken={accessToken} />
                    <Playlists playlists={playlists} />
                </div>
            )}
        </div>
    );
}

export default App;
