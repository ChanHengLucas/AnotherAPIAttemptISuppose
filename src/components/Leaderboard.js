import React from "react";

function Leaderboard({ leaderboard }) {
  return (
    <div>
      <h2>Leaderboard</h2>
      <ul>
        {leaderboard.map((entry) => (
          <li key={entry.name}>
            {entry.position}. {entry.name} - {entry.time}s
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Leaderboard;