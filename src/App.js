import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import WelcomeScreen from "./components/WelcomeScreen";
import UserProfile from "./components/UserProfile";
import Playlists from "./components/Playlists";
import SearchSpotify from "./components/SearchSpotify";
import Tabs from "./components/Tabs";
import CurrentlyPlaying from "./components/CurrentlyPlaying";
import CreatePlaylist from "./components/CreatePlaylist";
import RecentlyPlayed from "./components/RecentlyPlayed";
import { getSpotifyAuthUrl, getTokenFromUrl } from "./spotifyAuth";
import Stats from "./components/Stats";
import Recommendations from "./components/Recommendations";
import PlaylistBuilder from "./components/PlaylistBuilder";



function App() {
    const [accessToken, setAccessToken] = useState(null);
    const [userData, setUserData] = useState(null);
    const [playlists, setPlaylists] = useState([]);
    const [selectedTab, setSelectedTab] = useState("Profile");

    // Extract access token from URL and store it
    useEffect(() => {
        let token = getTokenFromUrl();
        const storedToken = localStorage.getItem("spotifyToken");

        if (token) {
            console.log("🔍 New Token Retrieved:", token);
            setAccessToken(token);
            localStorage.setItem("spotifyToken", token);
            window.history.pushState({}, document.title, window.location.pathname); // Remove token from URL for security
        } else if (storedToken) {
            console.log("🔍 Using Stored Token:", storedToken);
            setAccessToken(storedToken);
        } else {
            console.log("🚨 No token found, redirecting to login.");
        }
    }, []);

    // Fetch user profile data
    useEffect(() => {
        if (accessToken) {
            console.log("🔍 Fetching user profile with token:", accessToken);

            fetch("https://api.spotify.com/v1/me", {
                headers: { Authorization: `Bearer ${accessToken}` },
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Spotify API error: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log("✅ User Data Received:", data);
                setUserData(data);
            })
            .catch(error => {
                console.error("🚨 Error fetching user data:", error);
                if (error.message.includes("401")) {
                    console.log("🚨 Token expired, logging out...");
                    localStorage.removeItem("spotifyToken");
                    setAccessToken(null);
                    window.location.href = getSpotifyAuthUrl();  // Force re-authentication
                }
            });
        }
    }, [accessToken]);

    // Fetch user playlists
    useEffect(() => {
        if (accessToken) {
            console.log("🔍 Fetching user playlists...");

            fetch("https://api.spotify.com/v1/me/playlists", {
                headers: { Authorization: `Bearer ${accessToken}` },  // ✅ Fixed Syntax Error
            })
            .then(response => response.json())
            .then(data => {
                console.log("✅ Playlists Received:", data);
                setPlaylists(data.items);
            })
            .catch(error => console.error("🚨 Error fetching playlists:", error));
        }
    }, [accessToken]);

    const handleTabChange = (tabName) => {
        setSelectedTab(tabName);
    };

    return (
        <Router>
            <div className="App bg-gray-900 min-h-screen text-white relative">
                {!accessToken ? (
                    <WelcomeScreen />
                ) : (
                    <div className="container mx-auto p-5">
                        {/* Tabs Component */}
                        <Tabs selectedTab={selectedTab} onTabChange={handleTabChange} />
                        {/* Create Playlist Button - Positioned Top Left */}
                        <div className="absolute top-4 left-4">
                            <CreatePlaylist accessToken={accessToken} />
                        </div>
                        {/* Inside your main UI, display Recently Played */}
                        <RecentlyPlayed accessToken={accessToken} />
                        {/* Currently Playing Component */}
                        <CurrentlyPlaying accessToken={accessToken} />

                        {/* Routes */}
                        <Routes>
                            <Route path="/" element={<Navigate to="/profile" />} />
                            <Route path="/profile" element={<UserProfile userData={userData} />} />
                            <Route path="/playlists" element={<Playlists playlists={playlists} accessToken={accessToken} />} />
                            <Route path="/search" element={<SearchSpotify accessToken={accessToken} />} />

                            <Route path="/stats" element={<Stats accessToken={accessToken} />} />
                            <Route path="/recommendations" element={<Recommendations accessToken={accessToken} />} />
                            <Route path="/playlist-builder" element={<PlaylistBuilder accessToken={accessToken} />} />
                        </Routes>
                    </div>
                )}
            </div>
        </Router>
    );
}

export default App;
