import React, { useState, useEffect, useRef } from "react";
import "./Something.css";
import "../App.css";
import { v4 as uuidv4 } from "uuid";
import Leaderboard from "./Leaderboard";

function Something() {
  const [pokemonImages, setPokemonImages] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [allPokemonDead, setAllPokemonDead] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const kaboomAudioRef = useRef(null);
  const pokemonRefs = useRef({});
  const timers = useRef({});
  const startTime = useRef(null);
  const explodedPokemon = useRef(new Set());

  const EXPLOSION_CHANCE = 0.1;
  const MIN_DELAY = 1000; // 1s
  const MAX_DELAY = 3000; // 3s
  const numberOfPokemon = 1026;

  const boundingBox = {
    top: 0,
    left: 0,
    width: window.innerWidth - 200,
    height: window.innerHeight - 200,
  };

  // Fetch Pokémon on mount
  useEffect(() => {
    (async function fetchAllPokemon() {
      console.log("Creating Pokémon with names...");
      const initial = [];
      for (let i = 1; i < numberOfPokemon; i++) {
        try {
          const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${i}`);
          const data = await response.json();
          initial.push({
            id: uuidv4(),
            name: data.name,
            src: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${i}.png`,
            top: Math.random() * boundingBox.height + boundingBox.top,
            left: Math.random() * boundingBox.width + boundingBox.left,
            isExploding: false, // NEW: track explosion state
          });
        } catch (error) {
          console.error(`Failed to fetch data for Pokémon id=${i}:`, error);
        }
      }
      setPokemonImages(initial);
    })();
  }, []);

  // Start timer
  useEffect(() => {
    if (isRunning) {
      startTime.current = Date.now();
      console.log("[SetupTimers] Scheduling timers for all Pokémon...");
      setPokemonImages((current) => {
        current.forEach((poke) => {
          scheduleNextMove(poke.id);
        });
        return current;
      });
    } else {
      console.log("[Cleanup] Clearing all timers...");
      Object.values(timers.current).forEach((timerId) => clearTimeout(timerId));
      timers.current = {};
    }
  }, [isRunning]);

  // Schedule the next move for a Pokémon
  const scheduleNextMove = (id) => {
    if (!isRunning) return;
    const delay = Math.random() * (MAX_DELAY - MIN_DELAY) + MIN_DELAY;
    timers.current[id] = setTimeout(() => movePokemon(id), delay);
  };

  // Move (or explode) the Pokémon
  const movePokemon = (id) => {
    setPokemonImages((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx === -1) {
        console.warn(`[movePokemon] Pokémon id=${id} not found.`);
        return prev;
      }

      const poke = prev[idx];
      const newTop = Math.random() * boundingBox.height + boundingBox.top;
      const newLeft = Math.random() * boundingBox.width + boundingBox.left;
      const updatedPokemons = [...prev];

      // If it explodes
      if (Math.random() < EXPLOSION_CHANCE && !explodedPokemon.current.has(id)) {
        console.warn(`[movePokemon] Pokémon id=${id} exploded!`);
        explodedPokemon.current.add(id); // mark it as exploded

        // Play explosion sound
        if (kaboomAudioRef.current) {
          const kaboomClone = kaboomAudioRef.current.cloneNode();
          kaboomClone
            .play()
            .then(() => console.log("[movePokemon] Explosion sound played."))
            .catch((err) => console.error("[movePokemon] Sound play error:", err));
        }

        // Clear its timer
        clearTimeout(timers.current[id]);
        delete timers.current[id];

        // Mark it as exploding (switch to explosion GIF in the render)
        updatedPokemons[idx] = {
          ...poke,
          isExploding: true,
        };

        // Remove from state AFTER 600ms (so user sees the explosion GIF)
        setTimeout(() => {
          setPokemonImages((curr2) => {
            const remainingPokemons = curr2.filter((p) => p.id !== id);
            if (remainingPokemons.length === 0) {
              setAllPokemonDead(true);
            }
            return remainingPokemons;
          });
        }, 600);

        // Add to the leaderboard
        setLeaderboard((prevLB) => [
          ...prevLB,
          {
            name: poke.name,
            time: ((Date.now() - startTime.current) / 1000).toFixed(2),
          },
        ]);

        return updatedPokemons;
      }

      // If no explosion, just move it
      updatedPokemons[idx] = {
        ...poke,
        top: newTop,
        left: newLeft,
      };
      scheduleNextMove(id);
      return updatedPokemons;
    });
  };

  // Reset everything
  const resetPokemon = async () => {
    console.log("Resetting Pokémon...");
    const initial = [];
    for (let i = 1; i < numberOfPokemon; i++) {
      try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${i}`);
        const data = await response.json();
        initial.push({
          id: uuidv4(),
          name: data.name,
          src: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${i}.png`,
          top: Math.random() * boundingBox.height + boundingBox.top,
          left: Math.random() * boundingBox.width + boundingBox.left,
          isExploding: false,
        });
      } catch (error) {
        console.error(`Failed to fetch data for Pokémon id=${i}:`, error);
      }
    }
    setPokemonImages(initial);
    setAllPokemonDead(false);
    setIsRunning(false);
    setLeaderboard([]);
    explodedPokemon.current.clear();
  };

  return (
    <div className="App">
      <p className="warning-text">
        EPILEPSY AND SEIZURE WARNING: DO NOT CLICK START :D
      </p>

      <button onClick={() => setIsRunning(true)} style={{ marginBottom: "15px" }}>
        Start
      </button>
      {" "}
      {allPokemonDead && <button onClick={resetPokemon}>Reset</button>}
      {" "}
      <button onClick={() => setShowLeaderboard(!showLeaderboard)}>
        {showLeaderboard ? "Hide Leaderboard" : "Show Leaderboard"}
      </button>

      {showLeaderboard && (
        <div className="leaderboard-popup">
          <Leaderboard leaderboard={leaderboard.sort((a, b) => b.time - a.time)} />
          <button onClick={() => setShowLeaderboard(false)}>Close</button>
        </div>
      )}

      <div
        className="bounding-box"
        style={{
          position: "relative",
          width: boundingBox.width,
          height: boundingBox.height,
          border: "2px solid red",
          overflow: "auto",
        }}
      >
        {pokemonImages.map((poke) => (
          <img
            key={poke.id}
            ref={(el) => (pokemonRefs.current[poke.id] = el)}
            // Dynamically switch to explosion GIF if isExploding is true
            src={poke.isExploding ? "/explosion.gif" : poke.src}
            alt={`pokemon-${poke.name}`}
            style={{
              position: "absolute",
              top: `${poke.top}px`,
              left: `${poke.left}px`,
              transition: "top 1s ease, left 1s ease",
            }}
            width={80}
            height={80}
            draggable
          />
        ))}
      </div>

      <audio ref={kaboomAudioRef} src="/kaboom.mp3" />
    </div>
  );
}

export default Something;

// Current problem: Closing leaderboard would result in an error???