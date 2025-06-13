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
import PlaylistBuilder from "./components/CombinePlaylist";
import CallbackHandler from "./components/CallbackHandler";

function App() {
    const [accessToken, setAccessToken] = useState(null);
    const [userData, setUserData] = useState(null);
    const [playlists, setPlaylists] = useState([]);
    const [selectedTab, setSelectedTab] = useState("Profile");

    useEffect(() => {
        let token = getTokenFromUrl();
        const storedToken = localStorage.getItem("spotifyToken");

        if (token) {
            console.log("New Token Retrieved:", token);
            setAccessToken(token);
            localStorage.setItem("spotifyToken", token);
            window.history.pushState({}, document.title, window.location.pathname);
        } else if (storedToken) {
            console.log("Using Stored Token:", storedToken);
            setAccessToken(storedToken);
        } else {
            console.log("No token found, redirecting to login.");
        }
    }, []);

    useEffect(() => {
        if (accessToken) {
            console.log("Fetching user profile with token:", accessToken);

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
                console.log("User Data Received:", data);
                setUserData(data);
            })
            .catch(error => {
                console.error("Error fetching user data:", error);
                if (error.message.includes("401")) {
                    console.log("Token expired, logging out...");
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
            console.log("Fetching user playlists...");

            fetch("https://api.spotify.com/v1/me/playlists", {
                headers: { Authorization: `Bearer ${accessToken}` },
            })
            .then(response => response.json())
            .then(data => {
                console.log("Playlists Received:", data);
                setPlaylists(data.items);
            })
            .catch(error => console.error("Error fetching playlists:", error));
        }
    }, [accessToken]);

    useEffect(() => {
        const populateUserData = async () => {
            const endpoints = [
                "/user/profile",
                "/user/top-tracks",
                "/user/liked-tracks",
                "/user/recently-played",
                "/playlists/import",
                "/playlists/tracks",
                "/seeds/new-releases"
            ];
            for (const path of endpoints) {
                try {
                    const res = await fetch(`http://localhost:8000${path}`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ access_token: accessToken })
                    });
                    console.log(`Called ${path}`, await res.json());
                } catch (err) {
                    console.error(`Failed to call ${path}:`, err);
                }
            }
        };
        if (accessToken) {
            populateUserData();
        }
    }, [accessToken]);

    useEffect(() => {
        const refreshUserData = async () => {
            const syncEndpoints = [
                "/playlists/snapshots",
                "/playlists/prune"
            ];
            const enrichEndpoints = [
                { path: "/tracks/enrich", mode: "user" },
                { path: "/tracks/enrich", mode: "global" }
            ];
            for (const path of syncEndpoints) {
                try {
                    await fetch(`http://localhost:8000${path}`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ access_token: accessToken })
                    });
                    console.log(`Synced ${path}`);
                } catch (err) {
                    console.error(`Sync failed for ${path}:`, err);
                }
            }
            for (const { path, mode } of enrichEndpoints) {
                try {
                    await fetch(`http://localhost:8000${path}`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ access_token: accessToken, mode })
                    });
                    console.log(`Enriched metadata for ${mode}`);
                } catch (err) {
                    console.error(`Enrichment failed for ${mode}:`, err);
                }
            }
        };
        if (accessToken) {
            refreshUserData();
            const interval = setInterval(() => {
                refreshUserData();
            }, 10 * 60 * 1000);
            return () => clearInterval(interval);
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
                            <Route path="/callback" element={<CallbackHandler setAccessToken={setAccessToken} />} />

                            <Route path="/stats" element={<Stats accessToken={accessToken} />} />
                            <Route path="/recommendations" element={<Recommendations accessToken={accessToken} />} />
                            <Route path="/playlist-builder" element={<PlaylistBuilder playlists={playlists} accessToken={accessToken} />} />
                        </Routes>
                    </div>
                )}
            </div>
        </Router>
    );
}

export default App;
