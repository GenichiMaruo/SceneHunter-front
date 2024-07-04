// src/GameScreen.js
import React from 'react';
import './GameScreen.css';
import { ReactComponent as GameScreenLogo } from './background.svg';

function GameScreen({ language }) {
  return (
    <div className="GameScreen">
      <GameScreenLogo className="GameScreen-logo" />
      <header className="GameScreen-header">
        <div className="GameScreen-title">
          <h2 className="GameScreen-room">{language === 'jp' ? '部屋番号' : 'Room Number:'}</h2>
          <p className="GameScreen-roomCode">123456</p>
        </div>
        <div className="GameScreen-qr">
          <img src="qr-code.png" alt="QR Code" />
        </div>
      </header>
      <main className="GameScreen-main">
        <input type="text" placeholder="URL" className="GameScreen-url" />
        <div className="GameScreen-participants">
          <h3>{language === 'jp' ? '参加者' : 'Participants'}</h3>
          <ul>
            <li>master <span role="img" aria-label="crown">👑</span></li>
            <li>hoge1</li>
            <li>hoge2</li>
            <li>hoge3</li>
            <li>hoge4</li>
          </ul>
        </div>
        <button className="GameScreen-startButton">
          {language === 'jp' ? 'このメンバーでゲームを始める' : 'Start the game with these members'}
        </button>
      </main>
    </div>
  );
}

export default GameScreen;
