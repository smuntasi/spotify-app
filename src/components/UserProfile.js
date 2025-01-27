import React from "react";

const UserProfile = ({ userData }) => {
    if (!userData) return null;

    return (
        <div>
            <h1>Welcome, {userData?.display_name}</h1>
            {userData?.images?.[0] && (
                <img
                    src={userData.images[0].url}
                    alt="Profile"
                    style={{ borderRadius: "50%", width: "100px" }}
                />
            )}
            <p>Email: {userData?.email}</p>
            <p>Followers: {userData?.followers?.total}</p>
        </div>
    );
};

export default UserProfile;
