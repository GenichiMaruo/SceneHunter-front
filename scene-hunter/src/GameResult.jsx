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
            { id: 'user1', name: 'User1', score: { similarity: 90 } },
            { id: 'user2', name: 'User2', score: { similarity: 80 } },
            { id: 'user3', name: 'User3', score: { similarity: 70 } },
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
          <h1 className="w-full my-[2svh] text-[5svh] text-[#FF9443] font-bold">
            {language === 'jp' ? '結果発表' : 'Results'}
          </h1>

          <div className="text-[2svh] mb-[1svh]">
            {isGameMaster ? (
              <>
                <div className="text-[red]">
                  {language === 'jp' ? 'あなたはゲームマスターです' : 'You are the Game Master'}
                </div>
              </>
            ) : (
              <>
                {rank && (
                  <div className="w-full flex flex-row items-center justify-center">
                    {language === 'jp'
                      ? `あなたの順位は`
                      : `Your rank is `}
                    <div>
                      {rank}
                    </div>
                    {language === 'jp'
                      ? `位です`
                      : ``}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="h-[45svh] p-[5svw] mx-[5svw] border-[0.5svw] border-[#333333] rounded-[6svw] "> 
            <div className="w-full flex left-0 mb-[1svh]">
              <div className="text-[3svh] text-[#4CAF50] font-medium">
                {language === 'jp' ? '参加者' : 'Players'}
              </div>
            </div>

            <div className="flex flex-row items-center justify-between text-[2svh] text-[#888888]">
              <div className="w-[15svw]">
                {language === 'jp' ? '順位' : 'Rank'}
              </div>
              <div className="w-[25svw]">
                {language === 'jp' ? '名前' : 'Name'}  
              </div>
              <div className="w-[15svw]">
                {language === 'jp' ? '一致率' : 'Score'}
              </div>
            </div>

            <div className=" h-[calc(100%-8svh)] overflow-x-hidden overflow-y-scroll">
              {error && <div className="GameResult-error">{error}</div>}
              {users.length > 0 && (
                <div className="flex flex-col items-center text-[2svh] text-[#333333]">
                  {users.map(user => (
                    <div 
                      key={user.id} 
                      className="w-full m-[0.5svh] flex flex-row items-center justify-between"
                    >
                      <div className="w-[15svw]"> 
                        {language === 'jp' ? '順位' : 'Rank'}
                      </div>
                      <div className="w-[40svw]">
                        {user.name}
                      </div>
                      <div className="w-[15svw]">
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
            </div>

          </div>
          <div className="flex flex-col flex-grow items-center justify-center"> {/* buttons */}
            <button className="flex items-center justify-center text-[2svh] w-[70svw] px-[10svw] py-[1svh] my-[2svw] bg-[#003B5C] text-[#E7E7E7] rounded-[2svw]">
              {language === 'jp' ? '待機画面に戻る' : 'Return to Waiting Screen'}
            </button>
            <button className="flex items-center justify-center text-[2svh] w-[70svw] px-[10svw] py-[1svh] my-[2svw] bg-[#003B5C] text-[#E7E7E7] rounded-[2svw]">
              {language === 'jp' ? 'ゲームを終了する' : 'End the Game'}
            </button>
          </div>
        </div>
      </div>

      <footer className="flex justify-center items-center w-full h-[13svh] bg-[#4ACEFF] bg-opacity-35">
        <p className="text-[4svw]">© 2024 Scene Hunter</p>
      </footer>

    </div>

  );
}

export default GameResult;
