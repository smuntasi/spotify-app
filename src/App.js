import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import WelcomeScreen from "./components/WelcomeScreen";
import UserProfile from "./components/UserProfile";
import Playlists from "./components/Playlists";
import SearchSpotify from "./components/SearchSpotify";
import CurrentlyPlaying from "./components/CurrentlyPlaying"; // Import the CurrentlyPlaying component

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
                localStorage.setItem("spotifyAccessToken", token); // Store token in localStorage
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
        <Router>
            <div className="App bg-gray-900 min-h-screen text-white relative">
                {/* Display Currently Playing */}
                {accessToken && <CurrentlyPlaying accessToken={accessToken} />}
                
                {!accessToken ? (
                    <WelcomeScreen />
                ) : (
                    <div className="container mx-auto p-5">
                        <nav className="flex space-x-6 border-b border-gray-700 pb-3 mb-5">
                            <Link to="/profile" className="hover:text-green-400">
                                | Profile |
                            </Link>
                            <Link to="/playlists" className="hover:text-green-400">
                                | Playlists |
                            </Link>
                            <Link to="/search" className="hover:text-green-400">
                                | Search |
                            </Link>
                        </nav>

                        <Routes>
                            <Route path="/profile" element={<UserProfile userData={userData} />} />
                            <Route path="/playlists" element={<Playlists playlists={playlists} />} />
                            <Route path="/search" element={<SearchSpotify accessToken={accessToken} />} />
                        </Routes>
                    </div>
                )}
            </div>
        </Router>
    );
}

export default App;
