import React, { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";

function Something() {
  const [pokemonImages, setPokemonImages] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [allPokemonDead, setAllPokemonDead] = useState(false);

  const [leaderboard, setLeaderboard] = useState([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const timers = useRef({});
  const explodedPokemon = useRef(new Set());
  const startTime = useRef(null);

  const kaboomAudioRef = useRef(null);

  const EXPLOSION_CHANCE = 0.1;
  const MIN_DELAY = 1000;
  const MAX_DELAY = 3000;
  const numberOfPokemon = 1026; // 1025 Pokémon

  // Bounding box values
  const VISIBLE_BOX_WIDTH = 1400;
  const VISIBLE_BOX_HEIGHT = 600;
  const ACTUAL_ROAM_WIDTH = 1350;
  const ACTUAL_ROAM_HEIGHT = 550;

  const boundingBox = {
    top: 0,
    left: 0,
    width: ACTUAL_ROAM_WIDTH,
    height: ACTUAL_ROAM_HEIGHT,
  };

  // Player inputs
  const [numberOfPlayers, setNumberOfPlayers] = useState(1);
  const [playerNames, setPlayerNames] = useState([""]);
  const [filterTexts, setFilterTexts] = useState([""]);
  const [playerSelections, setPlayerSelections] = useState([""]);

  // Use effect to fetch all Pokémon
  useEffect(() => {
    (async function fetchAllPokemon() {
      console.log("[fetchAllPokemon] Creating all 1025 Pokémon...");
      const initial = [];
      for (let i = 1; i <= numberOfPokemon; i++) {
        try {
          const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${i}`);
          const data = await response.json();
          const spriteUrl =
            data.sprites?.front_default ||
            `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${i}.png`;
          initial.push({
            id: uuidv4(),
            name: data.name,
            src: spriteUrl,
            top: Math.random() * boundingBox.height + boundingBox.top,
            left: Math.random() * boundingBox.width + boundingBox.left,
            isExploding: false,
          });
        } catch (err) {
          console.error(`Failed to fetch data for Pokémon #${i}:`, err);
        }
      }
      setPokemonImages(initial);
    })();
  }, []);

  // Use effect to schedule movement for each Pokémon
  useEffect(() => {
    if (isRunning) {
      startTime.current = Date.now();
      console.log("[Game Start] Scheduling timers for all Pokémon...");
      setPokemonImages((current) => {
        current.forEach((poke) => scheduleNextMove(poke.id));
        return current;
      });
    } else {
      console.log("[Game Stop] Clearing all timers...");
      Object.values(timers.current).forEach((timerId) => clearTimeout(timerId));
      timers.current = {};
    }
  }, [isRunning]);

  // Movement and explosion logic
  const scheduleNextMove = (id) => {
    if (!isRunning) return;
    const delay = Math.random() * (MAX_DELAY - MIN_DELAY) + MIN_DELAY;
    timers.current[id] = setTimeout(() => movePokemon(id), delay);
  };

  const movePokemon = (id) => {
    setPokemonImages((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx === -1) return prev; // not found => exploded

      const poke = prev[idx];
      const updated = [...prev];

      // Explosion chance
      if (Math.random() < EXPLOSION_CHANCE && !explodedPokemon.current.has(id)) {
        explodedPokemon.current.add(id);
        console.warn(`[movePokemon] Pokémon "${poke.name}" exploded!`);

        // Explosion sound
        if (kaboomAudioRef.current) {
          const kaboomClone = kaboomAudioRef.current.cloneNode();
          kaboomClone.play().catch((err) => {
            console.error("Explosion sound error:", err);
          });
        }

        // Mark as exploding => show gif
        updated[idx] = { ...poke, isExploding: true };

        // Clear timer
        clearTimeout(timers.current[id]);
        delete timers.current[id];

        // Remove from array after 600 ms
        setTimeout(() => {
          setPokemonImages((curr2) => {
            const remaining = curr2.filter((p) => p.id !== id);
            if (remaining.length === 0) setAllPokemonDead(true);
            return remaining;
          });
        }, 600);

        // Add to global leaderboard
        const timeSurvived = ((Date.now() - startTime.current) / 1000).toFixed(2);
        setLeaderboard((prevLB) => {
          const newLB = [...prevLB, { name: poke.name, time: timeSurvived }];
          newLB.sort((a, b) => b.time - a.time);
          newLB.forEach((entry, index) => {
            entry.position = index + 1;
          });
          return newLB;
        });

        return updated;
      }

      // Otherwise => random move
      const newTop = Math.random() * boundingBox.height + boundingBox.top;
      const newLeft = Math.random() * boundingBox.width + boundingBox.left;
      updated[idx] = { ...poke, top: newTop, left: newLeft };

      scheduleNextMove(id);
      return updated;
    });
  };

  // Player inputs
  const handleNumberOfPlayersChange = (e) => { // Number of players => Objects with player array values
    const num = Number(e.target.value);
    setNumberOfPlayers(num);
    setPlayerNames(Array(num).fill(""));
    setFilterTexts(Array(num).fill(""));
    setPlayerSelections(Array(num).fill(""));
  };

  const handlePlayerNameChange = (index, value) => { // Player names
    setPlayerNames((prev) => {
      const arr = [...prev];
      arr[index] = value;
      return arr;
    });
  };

  const handleFilterTextChange = (index, value) => { // Filter texts
    setFilterTexts((prev) => {
      const arr = [...prev];
      arr[index] = value;
      return arr;
    });
  };

  const handlePlayerSelection = (index, value) => { // Player selections
    setPlayerSelections((prev) => {
      const arr = [...prev];
      arr[index] = value;
      return arr;
    });
  };

  // Buttons
  const handleStart = () => {
    setIsRunning(true);
  };

  const handleStop = () => {
    setIsRunning(false);
  };

  const handleReset = async () => {
    console.log("[handleReset] Resetting all Pokémon...");
    setIsRunning(false);
    setAllPokemonDead(false);
    setLeaderboard([]);
    explodedPokemon.current.clear();
    Object.values(timers.current).forEach(clearTimeout);

    // Refetch
    const initial = [];
    for (let i = 1; i <= numberOfPokemon; i++) {
      try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${i}`);
        const data = await response.json();
        const spriteUrl =
          data.sprites?.front_default ||
          `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${i}.png`;

        initial.push({
          id: uuidv4(),
          name: data.name,
          src: spriteUrl,
          top: Math.random() * boundingBox.height + boundingBox.top,
          left: Math.random() * boundingBox.width + boundingBox.left,
          isExploding: false,
        });
      } catch (err) {
        console.error(`Failed to fetch data for Pokémon #${i}:`, err);
      }
    }
    setPokemonImages(initial);
  };

    // Player leaderboard
    function computePlayerLeaderboard() {
      const results = playerSelections.map((chosenName, i) => {
        const pName = playerNames[i] || `Player ${i + 1}`;
        if (!chosenName) {
          return {
            playerIndex: i,
            playerName: pName,
            pokemonName: "",
            survivalTime: -1,
            mainLBPosition: null,
          };
        }
        // Find in the main LB
        const lbEntry = leaderboard.find((entry) => entry.name === chosenName);
        if (!lbEntry) {
          // Not exploded yet => treat as still alive (inf time)
          return {
            playerIndex: i,
            playerName: pName,
            pokemonName: chosenName,
            survivalTime: Number.POSITIVE_INFINITY,
            mainLBPosition: "??", // Not exploded yet => rank unknown
          };
        }
        // Exploded, return time and leaderboard position
        return {
          playerIndex: i,
          playerName: pName,
          pokemonName: chosenName,
          survivalTime: parseFloat(lbEntry.time),
          mainLBPosition: lbEntry.position,
        };
      });
  
      // Sort by survivalTime => the longer the better
      results.sort((a, b) => b.survivalTime - a.survivalTime);
  
      // Assigning rank among players
      return results.map((item, idx) => {
        return {
          ...item,
          playerRank: idx + 1,
        };
      });
    }
  
    function renderPlayerLeaderboard() {
      const sortedPlayers = computePlayerLeaderboard();
  
      return sortedPlayers.map((player) => {
        const {
          playerRank,
          playerName,
          pokemonName,
          mainLBPosition,
          survivalTime,
        } = player;
  
        if (pokemonName === "") {
          return (
            <div key={player.playerIndex} style={{ marginBottom: "4px" }}>
              {playerRank}) {playerName}: No Pokémon chosen
            </div>
          );
        }
        // If mainLBPosition is "??", it means the Pokémon has not exploded yet => no rank
        const rankPart = mainLBPosition === null ? "??" : mainLBPosition;
        return (
          <div key={player.playerIndex} style={{ marginBottom: "4px" }}>
            {playerRank}) {playerName}: {pokemonName} (Position: {rankPart})
          </div>
        );
      });
    }
  
  // Rendering for the main page
  return (
    <div
      className="App"
      style={{
        minHeight: "100vh",
        padding: "20px",
        overflowY: 'scroll',
      }}
    >
      <h1>Just a Random Game</h1>
      <p>EPILEPSY AND SEIZURE WARNING: Press "Start" to begin.</p>

      {/* Player setup */}
      {!isRunning && !allPokemonDead && (
        <div
          style={{
            marginBottom: "20px",
            padding: "10px",
            border: "1px solid #ccc",
            maxWidth: "600px",
          }}
        >
          <label style={{ display: "block", marginBottom: "8px" }}>
            Number of Players:{" "}
            <input
              type="number"
              min="1"
              max={numberOfPokemon}
              value={numberOfPlayers}
              onChange={handleNumberOfPlayersChange}
              style={{ width: "60px", marginLeft: "8px" }}
            />
          </label>

          {Array.from({ length: numberOfPlayers }).map((_, idx) => (
            <div
              key={idx}
              style={{
                marginTop: "10px",
                borderBottom: "1px dashed #ccc",
                paddingBottom: "10px",
              }}
            >
              <div style={{ marginBottom: "6px" }}>
                <label>
                  Player {idx + 1} Name:{" "}
                  <input
                    type="text"
                    value={playerNames[idx] || ""}
                    onChange={(e) => handlePlayerNameChange(idx, e.target.value)}
                    placeholder={`Player ${idx + 1}`}
                    style={{ marginLeft: "5px" }}
                  />
                </label>
              </div>

              <label>
                Pokémon Filter:{" "}
                <input
                  type="text"
                  value={filterTexts[idx] || ""}
                  onChange={(e) => handleFilterTextChange(idx, e.target.value)}
                  placeholder="Filter by name"
                  style={{ margin: "0 10px" }}
                />
                <select
                  value={playerSelections[idx] || ""}
                  onChange={(e) => handlePlayerSelection(idx, e.target.value)}
                  style={{ width: "150px" }}
                >
                  <option value="">-- Select Pokémon --</option>
                  {pokemonImages
                    .filter((p) =>
                      p.name.startsWith(
                        (filterTexts[idx] || "").toLowerCase()
                      )
                    )
                    .map((p) => (
                      <option
                        key={p.id}
                        value={p.name}
                        disabled={playerSelections.includes(p.name)}
                      >
                        {p.name}
                      </option>
                    ))}
                </select>
              </label>
            </div>
          ))}

          <div style={{ marginTop: "15px" }}>
            <button
              onClick={handleStart}
              disabled={
                playerSelections.some((sel) => sel === "") ||
                new Set(playerSelections).size < playerSelections.length
              }
            >
              Start
            </button>
          </div>
        </div>
      )}

      {/* Game Control Buttons */}
      <div style={{ marginBottom: "15px" }}>
        {isRunning && (
          <button onClick={handleStop} style={{ marginRight: "10px" }}>
            Stop
          </button>
        )}
        <button onClick={handleReset} style={{ marginRight: "10px" }}>
          Reset
        </button>
        <button onClick={() => setShowLeaderboard((prev) => !prev)}>
          {showLeaderboard ? "Hide" : "Show"} Leaderboard
        </button>
      </div>

      {/* All dead? */}
      {allPokemonDead && (
        <div style={{ marginBottom: "10px", fontWeight: "bold" }}>
          <p>ALL POKÉMON HAVE EXPLODED!</p>
        </div>
      )}

      {/* Leaderboards */}
      {showLeaderboard && (
        <div
          style={{
            display: "flex",
            gap: "20px",
            marginBottom: "20px",
            flexWrap: "wrap",
          }}
        >
          {/* Main Leaderboard */}
          <div
            style={{
              flex: "1 1 300px",
              background: "#eee",
              padding: "10px",
              border: "1px solid #999",
            }}
          >
            <h3>Explosion Leaderboard (All Pokémon)</h3>
            {leaderboard.length === 0 && <p>No Pokémon exploded yet.</p>}
            {leaderboard.length > 0 && (
              <table
                border="1"
                cellPadding="5"
                style={{ borderCollapse: "collapse", width: "100%" }}
              >
                <thead>
                  <tr>
                    <th>Position</th>
                    <th>Pokémon</th>
                    <th>Time (s)</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry) => (
                    <tr key={entry.name}>
                      <td>{entry.position}</td>
                      <td>{entry.name}</td>
                      <td>{entry.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Player Leaderboard */}
          <div
            style={{
              flex: "1 1 300px",
              background: "#f5f5f5",
              padding: "10px",
              border: "1px solid #999",
            }}
          >
            <h3>Player Leaderboard</h3>
            {renderPlayerLeaderboard()}
          </div>
        </div>
      )}

      {/* Bounding Box */}
      <div
        style={{
          position: "relative",
          width: `${VISIBLE_BOX_WIDTH}px`,
          height: `${VISIBLE_BOX_HEIGHT}px`,
          border: "2px solid red",
          overflow: "auto",
          marginBottom: "300px", // extra space below the bounding box
        }}
      >
        <div
          style={{
            position: "relative",
            width: `${ACTUAL_ROAM_WIDTH}px`,
            height: `${ACTUAL_ROAM_HEIGHT}px`,
          }}
        >
          {pokemonImages.map((poke) => (
            <img
              key={poke.id}
              src={poke.isExploding ? "/explosion.gif" : poke.src}
              alt={poke.name}
              style={{
                position: "absolute",
                top: `${poke.top}px`,
                left: `${poke.left}px`,
                transition: "top 1s, left 1s",
              }}
              width={70}
              height={70}
            />
          ))}
        </div>
      </div>

      {/* Explosion Sound */}
      <audio ref={kaboomAudioRef} src="/kaboom.mp3" />
    </div>
  );
}

export default Something;
