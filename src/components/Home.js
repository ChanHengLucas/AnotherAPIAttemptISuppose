import React, { useState, useEffect, useRef } from 'react';
import './Home.css';

// Main problem: scrolling doesn't work (Fixed with adjusted bounding box dimensions)

function Home() {
  const [random, setRandom] = useState(Math.floor(Math.random() * 1025) + 1);
  const [specificPokemonImage, setSpecificPokemonImage] = useState(`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${random}.png`);
  const [specificPokemonCry, setSpecificPokemonCry] = useState(`/cries-main/cries/pokemon/latest/${random}.ogg`);
  const [pokemonImages, setPokemonImages] = useState([]);
  const [intervalId, setIntervalId] = useState(null);
  const [pokemonInfo, setPokemonInfo] = useState(null);
  const [userInteracted, setUserInteracted] = useState(false);
  const [spawnInterval, setSpawnInterval] = useState(1000); // Default spawn interval
  const audioRef = useRef(null);
  const kaboomAudioRef = useRef(null);

  // Store references to Pokémon DOM elements
  const pokemonRefs = useRef({});

  // Define the bounding box dimensions
  const boundingBox = {
    top: 120, // Top offset
    left: 50, // Left offset
    width: window.innerWidth - 180, // Width of the bounding box
    height: window.innerHeight - 290 // Height of the bounding box
  };

  useEffect(() => { 
    if (intervalId) {
      const interval = setInterval(() => {
        const newRandom = Math.floor(Math.random() * 1025) + 1;
        // const newRandom = 131;
        const newImage = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${newRandom}.png`;
        const newCry = `/cries-main/cries/pokemon/latest/${newRandom}.ogg`;
        setRandom(newRandom);
        setSpecificPokemonImage(newImage);
        setSpecificPokemonCry(newCry);

        const newImageObj = { // Creating new Pokémon image
          id: Math.random().toString(36).substring(2), // Generating unique ID
          src: newImage,
          top: Math.random() * boundingBox.height + boundingBox.top, // Initial top position
          left: Math.random() * boundingBox.width + boundingBox.left, // Initial left position
          moveInterval: null, // Placeholder for movement interval
        };

        setPokemonImages((prevImages) => [...prevImages, newImageObj]);

        const moveInterval = setInterval(() => { // Move the Pokémon image (Modified)
          const newTop = Math.random() * boundingBox.height + boundingBox.top;
          const newLeft = Math.random() * boundingBox.width + boundingBox.left;

          // Update DOM styles directly for smooth animation (aka preventing random teleportation)
          // This ensures the Pokémon moves smoothly from its current position to the new position
          // Even when another Pokémon explodes, the remaining Pokémon will still move smoothly and remain unaffected
          const pokemonRef = pokemonRefs.current[newImageObj.id];
          if (pokemonRef) {
            pokemonRef.style.top = `${newTop}px`;
            pokemonRef.style.left = `${newLeft}px`;
          }

          // Handle explosion logic
          if (Math.random() < 0.1) {
            if (kaboomAudioRef.current) {
              const kaboomClone = kaboomAudioRef.current.cloneNode();
              kaboomClone.play().catch((error) => console.error('Error playing kaboom audio:', error));
            }
            clearInterval(moveInterval);

            // Change the image to explosion.gif
            if (pokemonRef) {
              pokemonRef.src = '/explosion.gif';
            }

            // Remove the Pokémon image after showing the explosion.gif for a split second
            setTimeout(() => {
              setPokemonImages((images) => images.filter((img) => img.id !== newImageObj.id));
            }, 600); // Show explosion.gif for 600ms
          }
        }, Math.random() * 2000 + 1000);

        // Attach the interval to the Pokémon object
        newImageObj.moveInterval = moveInterval;
      }, spawnInterval);

      return () => clearInterval(interval);
    }
  }, [intervalId, spawnInterval]);

  useEffect(() => {
    if (userInteracted && audioRef.current) {
      audioRef.current.src = specificPokemonCry;
      const clone = audioRef.current.cloneNode(); // Ensures the audio can be played multiple times
      clone.play().catch((error) => console.error('Error playing audio:', error));
    }
  }, [specificPokemonCry, userInteracted]);

  const start = () => {
    if (!intervalId) {
      setUserInteracted(true);
      setIntervalId(true);
    }
  };

  const stop = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    //   fetchPokemonInfo(random); // Disabled temporarily
    //   pokemonImages.forEach((image) => clearInterval(image.moveInterval)); // Disabled so the Pokémon can explode even when stopped
    }
  };

  const fetchPokemonInfo = async (id) => {
    try {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`);
      const data = await response.json();
      const flavorTextEntry = data.flavor_text_entries?.find((entry) => entry.language.name === 'en');
      setPokemonInfo({
        name: data.name,
        types: data.types.map((typeInfo) => typeInfo.type.name).join(', '),
        description: flavorTextEntry ? flavorTextEntry.flavor_text : 'No description available.',
      });
    } catch (error) {
      console.error('Error fetching Pokémon info:', error);
    }
  };

  const handleSpawnIntervalChange = (event) => {
    setSpawnInterval(Number(event.target.value));
  };

  const handleSpawnIntervalSubmit = (event) => {
    event.preventDefault();
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(true); // Restart the interval with the new spawn interval
    }
  };

  return (
    <div className="yes">
      <p>EPILEPSY AND SEIZURE WARNING: DO NOT CLICK START UNLESS YOU REALLY WANT TO FIND OUT</p>
      <button onClick={start}>Start</button>
      {' '}
      <button onClick={stop}>Stop</button>
      <br/><br/>
      <form onSubmit={handleSpawnIntervalSubmit}>
        <label className="yes">
          Spawn Interval (ms):{' '}
          <input type="number" value={spawnInterval} onChange={handleSpawnIntervalChange} />
        </label>
        {' '}
        <button type="submit">Set Interval</button>
      </form>
      {pokemonImages.map((image) => (
        <img
          key={image.id}
          ref={(el) => (pokemonRefs.current[image.id] = el)} // Store reference to DOM element
          src={image.src}
          alt="pokemon"
          height="100px"
          width="100px"
          style={{
            position: 'absolute',
            top: `${image.top}px`,
            left: `${image.left}px`,
            transition: 'top 1s ease, left 1s ease',
          }}
          draggable
        />
      ))}
      {pokemonInfo && (
        <div className="pokemon-info">
          <h2>{pokemonInfo.name}</h2>
          <p>Types: {pokemonInfo.types}</p>
          <p>Description: {pokemonInfo.description}</p>
        </div>
      )}
      <audio ref={audioRef}>
        <source src={specificPokemonCry} type="audio/ogg" />
        Your browser does not support the audio element.
      </audio>
      <audio ref={kaboomAudioRef} src="/kaboom.mp3" />
    </div>
  );
}

export default Home;


// ANOTHER IDEA: MAKE A BATTLE ROYALE OF THE 1025 POKEMON AND LET THEM FIGHT TILL ONLY ONE REMAINS
// IDEA: MAKE A LEADERBOARD GIVEN PREDICTION OF WHO WILL WIN (POSITIONS 1 to 1025)
// LIVE UPDATE LEADERBOARD

// ADD A FIELD FOR NUMBER OF PLAYERS AND THEIR CHOICES AFTERWARDS