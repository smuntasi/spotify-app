import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getTokenFromUrl } from "../spotifyAuth";

const CallbackHandler = ({ setAccessToken }) => {
    const navigate = useNavigate();

    useEffect(() => {
        const token = getTokenFromUrl();
        if (token) {
            localStorage.setItem("spotifyToken", token);
            setAccessToken(token);
        }

        navigate("/");
    }, [setAccessToken, navigate]);

    return null; 
};

export default CallbackHandler;
