import logo from './logo.svg';
import React from 'react';
import './App.css';
import Home from './components/Home';
import NavBar from './components/NavBar';

function App() {
  return (
    <div className="App">
      <NavBar />
      <h1>Yippee :D</h1>
      <Home />
    </div>
  );
}

export default App;
