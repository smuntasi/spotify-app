export const authEndpoint = "https://accounts.spotify.com/authorize";
const clientId = "3267424e555e4ef58f9d93280ebbeb1e";  
const redirectUri = "http://localhost:3000/callback";   // Ensure this matches in Spotify Developer Dashboard
const scopes = [
    "user-read-private",
    "user-read-playback-state",
    "user-read-recently-played",
    "user-modify-playback-state",
    "user-read-email",
    "playlist-read-private",
    "playlist-read-collaborative",
    "playlist-modify-public",
    "playlist-modify-private",
    "user-library-read",  
    "user-library-modify"
];

// Function to generate login URL
export const getSpotifyAuthUrl = () => {
    return `${authEndpoint}?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(
        redirectUri
    )}&scope=${encodeURIComponent(scopes.join(" "))}`;
};

// Function to extract token from URL after login
export const getTokenFromUrl = () => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    return params.get("access_token");
};
