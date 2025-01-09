import React, { useState, useEffect, useRef } from 'react';
import './Something.css';
import "../App.css";

function Something() {
    const [pokemonImages, setPokemonImages] = useState([]);
    const kaboomAudioRef = useRef(null);
    const boundingBox = {
        top: 0,
        left: 0,
        width: window.innerWidth - 200,
        height: window.innerHeight - 200,
    };

    useEffect(() => {
        // Initialize Pokémon images
        const initialPokemonImages = [];
        for (let i = 1; i < 152; i++) {
            const newImageObj = {
                id: i,
                src: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${i}.png`,
                top: Math.random() * boundingBox.height + boundingBox.top,
                left: Math.random() * boundingBox.width + boundingBox.left,
            };
            initialPokemonImages.push(newImageObj);
        }
        setPokemonImages(initialPokemonImages);
    }, []);

    useEffect(() => {
        const intervalIds = {}; // Store intervals for each Pokémon

        pokemonImages.forEach((pokemon) => {
            if (!intervalIds[pokemon.id]) { // This runs for only ONE specific Pokémon... I don't want that...
                const movePokemon = () => {
                    const newTop = Math.random() * boundingBox.height + boundingBox.top;
                    const newLeft = Math.random() * boundingBox.width + boundingBox.left;

                    // Explosion logic (10% chance)
                    if (Math.random() < 0.1) {
                        if (kaboomAudioRef.current) {
                            const kaboomClone = kaboomAudioRef.current.cloneNode();
                            kaboomClone.play().catch((error) =>
                                console.error('Error playing kaboom audio:', error)
                            );
                        }

                        setPokemonImages((images) =>
                            images.filter((img) => img.id !== pokemon.id)
                        );
                        clearInterval(intervalIds[pokemon.id]); // Clear interval on explosion
                    } else {
                        setPokemonImages((images) =>
                            images.map((img) =>
                                img.id === pokemon.id
                                    ? { ...img, top: newTop, left: newLeft }
                                    : img
                            )
                        );
                    }
                };

                // Assign a random interval (1–3 seconds)
                const intervalId = setInterval(movePokemon, Math.random() * 2000 + 1000);
                intervalIds[pokemon.id] = intervalId;
            }
        });

        return () => {
            // Cleanup all intervals on unmount
            Object.values(intervalIds).forEach(clearInterval);
        };
    }, [pokemonImages]); // Update whenever `pokemonImages` changes

    return (
        <div className="App">
            <p className="warning-text">EPILEPSY AND SEIZURE WARNING</p>
            <div className="bounding-box">
                {pokemonImages.map((image) => (
                    <img
                        key={image.id}
                        src={image.src}
                        alt={`pokemon-${image.id}`}
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
            </div>
            <audio ref={kaboomAudioRef} src="/kaboom.mp3" />
        </div>
    );
}

export default Something;