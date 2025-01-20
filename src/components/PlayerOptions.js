import React, { useState } from "react";

function PlayerOptions({ onOptionsChange }) {
  const [numPokemon, setNumPokemon] = useState(10);
  const [explosionChance, setExplosionChance] = useState(0.1);

  const handleNumPokemonChange = (e) => {
    setNumPokemon(e.target.value);
    onOptionsChange({ numPokemon: e.target.value, explosionChance });
  };

  const handleExplosionChanceChange = (e) => {
    setExplosionChance(e.target.value);
    onOptionsChange({ numPokemon, explosionChance: e.target.value });
  };

  return (
    <div>
      <label>
        Number of Pokémon:
        <input
          type="number"
          value={numPokemon}
          onChange={handleNumPokemonChange}
        />
      </label>
      <label>
        Explosion Chance:
        <input
          type="number"
          step="0.01"
          value={explosionChance}
          onChange={handleExplosionChanceChange}
        />
      </label>
    </div>
  );
}

export default PlayerOptions;