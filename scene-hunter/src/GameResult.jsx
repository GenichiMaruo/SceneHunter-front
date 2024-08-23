import React, { useState, useEffect } from 'react';
import './GameResult.css';

function GameResult({ token, apiUrl, language, isGameMaster, onComplete }) {
  const [score, setScore] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isGameMaster) {
      const fetchScore = async () => {
        try {
          const response = await fetch(`${apiUrl}/game/score`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            setScore(data.message);
          } else {
            console.error('Error fetching score');
            setError(language === 'ja' ? 'スコアを取得できませんでした。' : 'Could not fetch the score.');
          }
        } catch (error) {
          console.error('Error fetching score:', error);
          setError(language === 'ja' ? 'スコアを取得できませんでした。' : 'Could not fetch the score.');
        }
      };

      fetchScore();
    }
  }, [apiUrl, token, language, isGameMaster]);

  return (
    <div className="GameResult">
      <h1>{language === 'ja' ? '結果発表' : 'Results'}</h1>
      {isGameMaster ? (
        <div className="GameResult-message">
          {language === 'ja' ? 'あなたはゲームマスターです' : 'You are the Game Master'}
        </div>
      ) : (
        <>
          {error && <div className="GameResult-error">{error}</div>}
          {score !== null && (
            <div className="GameResult-score">
              {language === 'ja'
                ? `類似度は${parseFloat(score).toFixed(2)}%でした！`
                : `The similarity score is ${parseFloat(score).toFixed(2)}%!`}
            </div>
          )}
        </>
      )}
      <button onClick={onComplete}>
        {language === 'ja' ? '待機画面に戻る' : 'Return to Waiting Screen'}
      </button>
    </div>
  );
}

export default GameResult;
