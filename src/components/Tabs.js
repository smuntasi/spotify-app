import React, { useState } from "react";
import { Link } from "react-router-dom";

const Tabs = () => {
  const [selectedTab, setSelectedTab] = useState("Profile");

  const tabs = [
    { name: "Profile", path: "/profile" },
    { name: "Playlists", path: "/playlists" },
    { name: "Search", path: "/search" },
    { name: "Stats", path: "/stats" },
    { name: "Recommendations", path: "/recommendations" },
  ];
  

  return (
    <div className="tabs-container">
      <div className="tabs">
        {tabs.map((tab) => (
          <Link
            key={tab.name}
            to={tab.path}
            className={`tab ${
              selectedTab === tab.name ? "tab--active" : ""
            }`}
            onClick={() => setSelectedTab(tab.name)}
          >
            {tab.name}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Tabs;
