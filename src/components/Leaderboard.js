import React from "react";

function Leaderboard({ leaderboard }) {
  return (
    <div className="leaderboard">
      <h2>Leaderboard</h2>
      <ul>
        {leaderboard.map((entry, index) => (
          <li key={index}>
            {entry.name}: {entry.time} seconds
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Leaderboard;