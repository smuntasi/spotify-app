import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import WelcomeScreen from "./components/WelcomeScreen";
import UserProfile from "./components/UserProfile";
import Playlists from "./components/Playlists";
import SearchSpotify from "./components/SearchSpotify";
import Tabs from "./components/Tabs";
import CurrentlyPlaying from "./components/CurrentlyPlaying";
import CreatePlaylist from "./components/CreatePlaylist";

function App() {
    const [accessToken, setAccessToken] = useState(null);
    const [userData, setUserData] = useState(null);
    const [playlists, setPlaylists] = useState([]);
    const [selectedTab, setSelectedTab] = useState("Profile");

    // Extract access token from URL after login
    useEffect(() => {
        const hash = window.location.hash;
        if (hash) {
            const params = new URLSearchParams(hash.substring(1));
            const token = params.get("access_token");
            if (token) {
                setAccessToken(token);
                window.history.pushState({}, document.title, window.location.pathname);
            }
        }
    }, []);

    // Fetch user profile data once accessToken is set
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

    // Fetch user playlists once accessToken is set
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
                        {/* Create Playlist Button - Positioned Top Left */}
                        <div className="absolute top-4 left-4">
                            <CreatePlaylist accessToken={accessToken} />
                        </div>
    
                        {/* Tabs Component */}
                        <Tabs selectedTab={selectedTab} onTabChange={handleTabChange} />
                        
                        {/* Currently Playing Component */}
                        <CurrentlyPlaying accessToken={accessToken} />
    
                        {/* Routes */}
                        <Routes>
                            <Route path="/" element={<Navigate to="/profile" />} />
                            <Route path="/profile" element={<UserProfile userData={userData} />} />
                            <Route path="/playlists" element={<Playlists playlists={playlists} accessToken={accessToken} />} />
                            <Route path="/search" element={<SearchSpotify accessToken={accessToken} />} />
                        </Routes>
                    </div>
                )}
            </div>
        </Router>
    );
    
}

export default App;
