import React, { useState, useEffect } from 'react';
import './GameResult.css';

function GameResult({ isDemo, token, apiUrl, language, isGameMaster, currentUserId, onComplete }) {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [rank, setRank] = useState(null); // 順位を保持するためのステート

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        if (isDemo) {
          // デモモードの場合はダミーデータをセット
          setUsers([
            { id: 'user1', name: 'User 1', score: { similarity: 90 } },
            { id: 'user2', name: 'User 2', score: { similarity: 80 } },
            { id: 'user3', name: 'User 3', score: { similarity: 70 } },
          ]);
          setRank(1); // デモモードの場合は1位とする
          return;
        } else {
          const response = await fetch(`${apiUrl}/room/users`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            const userList = Object.values(data.users);
            setUsers(userList);
            // 自分のスコアを見つけて順位を計算
            const sortedUsers = userList
              .filter(user => user.score.similarity !== undefined) // スコアが存在するユーザーだけをフィルタリング
              .sort((a, b) => b.score.similarity - a.score.similarity); // スコアで降順ソート
            const userRank = sortedUsers.findIndex(user => user.id === currentUserId) + 1; // 順位を取得
            setRank(userRank);
          } else {
            console.error('Error fetching users');
            setError(language === 'ja' ? 'ユーザー情報を取得できませんでした。' : 'Could not fetch user information.');
          }
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        setError(language === 'jp' ? 'ユーザー情報を取得できませんでした。' : 'Could not fetch user information.');
      }
    };

    fetchUsers();
  }, [apiUrl, token, language, currentUserId]);

  return (
    <div className="w-full h-100svh min-h-[100svh] flex flex-col items-center justify-center text-center overflow-hidden">
      <header className="w-full h-[13svh] bg-[#4ACEFF] bg-opacity-35"></header>

      <div className="w-full flex flex-col flex-grow relative bg-[#E7E7E7]">
        <div className="GameResult">
          <h1>{language === 'jp' ? '結果発表' : 'Results'}</h1>
          {error && <div className="GameResult-error">{error}</div>}
          {users.length > 0 && (
            <div className="GameResult-scores">
              {users.map(user => (
                <div key={user.id} className="GameResult-user">
                  <div className="GameResult-userName">
                    {language === 'jp' ? `${user.name}の類似度:` : `${user.name}'s Similarity:`}
                  </div>
                  <div className="GameResult-userScore">
                    {user.score.similarity !== undefined
                      ? `${user.score.similarity}%`
                      : language === 'jp'
                        ? 'スコアなし'
                        : 'No Score'}
                  </div>
                </div>
              ))}
            </div>
          )}
          {isGameMaster ? (
            <>
              <div className="GameResult-message">
                {language === 'jp' ? 'あなたはゲームマスターです' : 'You are the Game Master'}
              </div>
            </>
          ) : (
            <>
              {rank && (
                <div className="GameResult-rank">
                  {language === 'jp'
                    ? `あなたの順位は${rank}位です。`
                    : `Your rank is ${rank}.`}
                </div>
              )}
            </>
          )}
          <button onClick={onComplete}>
            {language === 'jp' ? '待機画面に戻る' : 'Return to Waiting Screen'}
          </button>
        </div>
      </div>

      <footer className="flex justify-center items-center w-full h-[13svh] bg-[#4ACEFF] bg-opacity-35">
        <p className="text-[4svw]">© 2024 Scene Hunter</p>
      </footer>

    </div>

  );
}

export default GameResult;
