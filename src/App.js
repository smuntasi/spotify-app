import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import WelcomeScreen from "./components/WelcomeScreen";
import UserProfile from "./components/UserProfile";
import Playlists from "./components/Playlists";
import SearchSpotify from "./components/SearchSpotify";
import Tabs from "./components/Tabs";
import CurrentlyPlaying from "./components/CurrentlyPlaying";

function App() {
    const [accessToken, setAccessToken] = useState(null);
    const [userData, setUserData] = useState(null);
    const [playlists, setPlaylists] = useState([]);
    const [selectedTab, setSelectedTab] = useState("Profile"); // To auto-select the profile tab

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
                        {/* Pass selectedTab and handleTabChange to Tabs component */}
                        <Tabs selectedTab={selectedTab} onTabChange={handleTabChange} />
                        <CurrentlyPlaying accessToken={accessToken} />

                        {/* Auto redirect to /profile */}
                        <Routes>
                            <Route
                                path="/"
                                element={<Navigate to="/profile" />}
                            />
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
