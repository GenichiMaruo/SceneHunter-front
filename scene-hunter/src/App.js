// src/App.js
import React, { useState } from 'react';
import './App.css';
import { ReactComponent as Background } from './background.svg';
import GameScreen from './GameScreen';

function App() {
  const [language, setLanguage] = useState('jp');
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [screen, setScreen] = useState('main');

  const handleLanguageChange = (event) => {
    setLanguage(event.target.value);
  };

  const handleCreateClick = () => {
    setShowCreateInput(true);
    setShowJoinInput(false);
  };

  const handleJoinClick = () => {
    setShowJoinInput(true);
    setShowCreateInput(false);
  };

  const handleCreateInputChange = (event) => {
    setPlayerName(event.target.value);
  };

  const handleJoinInputChange = (event) => {
    setRoomNumber(event.target.value);
  };

  const handleEnterRoom = () => {
    setShowJoinInput(false);
    setShowCreateInput(true);
  };

  const handleEnterPlayerName = () => {
    // Handle player name submission and transition to game screen
    console.log(`Player name entered: ${playerName}`);
    setScreen('game');
  };

  return (
    <div className="App">
      {screen === 'main' ? (
        <>
          <div className="App-background">
            <Background />
          </div>
          <header className="App-header">
            <h1 className="App-title">Scene Hunter</h1>
            <p className="App-subtitle">Spot the Image from the Clues!</p>
            <div className="App-buttons">
              {showCreateInput ? (
                <>
                  <input
                    type="text"
                    value={playerName}
                    onChange={handleCreateInputChange}
                    placeholder={language === 'jp' ? 'プレイヤー名を入力' : 'Enter player name'}
                    autoFocus
                  />
                  <button className="App-button" onClick={handleEnterPlayerName}>
                    {language === 'jp' ? '入力' : 'Enter'}
                  </button>
                </>
              ) : showJoinInput ? (
                <>
                  <input
                    type="text"
                    value={roomNumber}
                    onChange={handleJoinInputChange}
                    placeholder={language === 'jp' ? '部屋番号を入力' : 'Enter room number'}
                    autoFocus
                  />
                  <button className="App-button" onClick={handleEnterRoom}>
                    {language === 'jp' ? '入力' : 'Enter'}
                  </button>
                </>
              ) : (
                <>
                  <button className="App-button" onClick={handleCreateClick}>
                    {language === 'jp' ? '作成' : 'Create'}
                  </button>
                  <button className="App-button" onClick={handleJoinClick}>
                    {language === 'jp' ? '参加' : 'Join'}
                  </button>
                </>
              )}
            </div>
          </header>
          <div className="App-language">
            <select value={language} onChange={handleLanguageChange}>
              <option value="jp">日本語</option>
              <option value="en">English</option>
            </select>
          </div>
          <footer className="App-footer">
            <p>© 2024 Scene Hunter</p>
          </footer>
        </>
      ) : (
        <GameScreen language={language} />
      )}
    </div>
  );
}

export default App;
