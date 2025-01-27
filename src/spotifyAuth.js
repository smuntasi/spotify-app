export const authEndpoint = "https://accounts.spotify.com/authorize";
const clientId = "3267424e555e4ef58f9d93280ebbeb1e"; // Replace with your Spotify Client ID
const redirectUri = "http://localhost:3000/callback";
const scopes = [
    "user-read-private",
    "user-read-email",
    "playlist-read-private",
];

export const getSpotifyAuthUrl = () => {
    return `${authEndpoint}?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(
        redirectUri
    )}&scope=${encodeURIComponent(scopes.join(" "))}`;
};
