import React, { useState } from "react";

function Dropdown({ options, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(null);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  const handleSelect = (value) => {
    setSelectedValue(value);
    onSelect(value);
    setIsOpen(false); // Close dropdown after selection
  };

  return (
    <div className="dropdown" style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={toggleOpen}
        style={{
          backgroundColor: "#333",
          color: "white",
          padding: "10px 16px",
          fontSize: "16px",
          border: "none",
          cursor: "pointer",
          borderRadius: "5px",
        }}
      >
        {selectedValue || "Select a Playlist"}
      </button>
      {isOpen && (
        <ul
          className="menu"
          style={{
            position: "absolute",
            backgroundColor: "#f9f9f9",
            minWidth: "200px",
            boxShadow: "0px 8px 16px rgba(0, 0, 0, 0.2)",
            zIndex: 1,
            listStyle: "none",
            padding: "0",
            margin: "0",
          }}
        >
          {options.map((option) => (
            <li
              key={option.value}
              onClick={() => handleSelect(option.value)}
              style={{
                color: "black",
                padding: "10px 16px",
                cursor: "pointer",
                backgroundColor: "#fff",
                borderBottom: "1px solid #ddd",
              }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = "#ddd")}
              onMouseLeave={(e) => (e.target.style.backgroundColor = "#fff")}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Dropdown;
