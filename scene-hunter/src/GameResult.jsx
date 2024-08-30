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
            setError(language === 'jp' ? 'スコアを取得できませんでした。' : 'Could not fetch the score.');
          }
        } catch (error) {
          console.error('Error fetching score:', error);
          setError(language === 'jp' ? 'スコアを取得できませんでした。' : 'Could not fetch the score.');
        }
      };

      fetchScore();
    }
  }, [apiUrl, token, language, isGameMaster]);

  return (
    <div className="w-full h-100svh min-h-[100svh] flex flex-col items-center justify-center text-center overflow-hidden">
      <header className="w-full h-[13svh] bg-[#4ACEFF] bg-opacity-35"></header>
      
      <div className="w-full flex flex-col flex-grow relative bg-[#E7E7E7]">
        <h1>{language === 'jp' ? '結果発表' : 'Results'}</h1>
        {!isGameMaster ? (
          <div className="GameResult-message">
            {language === 'jp' ? 'あなたはゲームマスターです' : 'You are the Game Master'}
          </div>
        ) : (
          <>
            {error && <div className="GameResult-error">{error}</div>}
            {score !== null && (
              <div className="GameResult-score">
                {language === 'jp'
                  ? `類似度は${score}%でした！`
                  : `The similarity score is ${score}%!`}
              </div>
            )}
          </>
        )}
        <button onClick={onComplete}>
          {language === 'jp' ? '待機画面に戻る' : 'Return to Waiting Screen'}
        </button>

        
      </div>

      <footer className="flex justify-center items-center w-full h-[13svh] bg-[#4ACEFF] bg-opacity-35">
        <p className="text-[4svw]">© 2024 Scene Hunter</p>
      </footer>



    </div>
  );
}

export default GameResult;
