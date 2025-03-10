import React, { useEffect } from "react";

const UserProfile = ({ userData }) => {
    useEffect(() => {
        if (!userData) return;

        fetch("https://lgklvdjdgpjbunzcdxio.supabase.co/users/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "access_token": process.env.API_KEY
            },
            body: JSON.stringify({
                user_id: userData.id,
                display_name: userData.display_name,
                email: userData.email,
                country: userData.countrygk
            })
        })
        .then(response => response.json())
        .then(data => console.log("Server response:", data))
        .catch(error => console.error("Error:", error));
    }, [userData]); // Runs only when userData changes

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
