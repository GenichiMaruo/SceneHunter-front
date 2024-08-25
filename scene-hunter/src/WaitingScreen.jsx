import React from 'react';
import './WaitingScreen.css';

function WaitingScreen({ language, isGameMaster }) {
  return (
    <div className="WaitingScreen">
      <div className="WaitingScreen-content">
        <div className="WaitingScreen-spinner"></div>
        <p className="WaitingScreen-text">
          {isGameMaster
            ? (language === 'ja' ? '他のプレイヤーが撮影中です。お待ちください...' : 'The game master is taking a photo. Please wait...')
            : (language === 'ja' ? 'ゲームマスターが撮影中です。お待ちください...' : 'Another player is taking a photo. Please wait...')}
        </p>
      </div>
    </div>
  );
}

export default WaitingScreen;
