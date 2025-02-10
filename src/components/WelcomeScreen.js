import React, { useEffect } from "react";
import { getSpotifyAuthUrl } from "../spotifyAuth";

const WelcomeScreen = () => {
    useEffect(() => {
        // Align text content to center using JavaScript
        const element = document.getElementById("welcome-container");
        element.style.position = "absolute";
        element.style.top = "50%";
        element.style.left = "50%";
        element.style.transform = "translate(-50%, -50%)";
        element.style.textAlign = "center";
    }, []);

    return (
        <div
            id="welcome-container"
            style={{
                backgroundColor: "#FFD1DC",
                width: "100%",
                height: "100vh",
                color: "white",
            }}
        >
            <h1 style={{ fontSize: "3rem", marginBottom: "20px", color: "#2b4f21" }}>
                Welcome to Spotify
            </h1>
            <a
                href={getSpotifyAuthUrl()}
                style={{
                    backgroundColor: "#000000",
                    padding: "15px 30px",
                    fontSize: "1.5rem",
                    borderRadius: "10px",
                    color: "white",
                    textDecoration: "none",
                    fontWeight: "bold",
                }}
            >
                Log In
            </a>
        </div>
    );
};

export default WelcomeScreen;
