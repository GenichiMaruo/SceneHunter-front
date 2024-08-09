import React, { useEffect, useState } from 'react';
import './GameResult.css';

function GameResult({ language, roomId }) {
  const [scores, setScores] = useState({
    gameMasterScore: 0,
    player1Score: 0,
    player2Score: 0,
  });

  useEffect(() => {
    const fetchPhotoScores = async () => {
      try {
        const response = await fetch(`https://sh.yashikota.com/api/photo_score?room_id=${roomId}`);
        if (response.ok) {
          const data = await response.json();
          setScores({
            gameMasterScore: data.gamemaster_score,
            player1Score: data.player1_score,
            player2Score: data.player2_score,
          });
        } else {
          console.error('Failed to fetch photo scores');
        }
      } catch (error) {
        console.error('Error fetching photo scores:', error);
      }
    };

    fetchPhotoScores();
  }, []);

  return (
    <div className="GameResult">
      <h2>{language === 'jp' ? 'ゲーム結果' : 'Game Results'}</h2>
      <div className="GameResult-section">
        <h3>{language === 'jp' ? 'ゲームマスターのスコア' : 'Game Master Score'}</h3>
        <p>{scores.gameMasterScore}</p>
      </div>
      <div className="GameResult-section">
        <h3>{language === 'jp' ? 'プレイヤー1のスコア' : 'Player 1 Score'}</h3>
        <p>{scores.player1Score}</p>
      </div>
      <div className="GameResult-section">
        <h3>{language === 'jp' ? 'プレイヤー2のスコア' : 'Player 2 Score'}</h3>
        <p>{scores.player2Score}</p>
      </div>
    </div>
  );
}

export default GameResult;
