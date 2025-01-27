import React from "react";

const Playlists = ({ playlists }) => {
    if (!playlists || playlists.length === 0) return null;

    return (
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
    );
};

export default Playlists;
