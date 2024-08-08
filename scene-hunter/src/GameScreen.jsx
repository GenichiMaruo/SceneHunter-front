import React, { useEffect, useState } from 'react';
import './GameScreen.css';
// import { ReactComponent as GameScreenLogo } from './background.svg';
import QRCode from 'qrcode.react';
import PhotoInput from './PhotoInput';
import GameResult from './GameResult';

function GameScreen({ language, playerName, roomNumber, playerId }) {
  const [roomStatus, setRoomStatus] = useState('');
  const [currentRound, setCurrentRound] = useState(1);
  const [participants, setParticipants] = useState([]);
  const [gameMaster, setGameMaster] = useState('');
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [showPhotoInput, setShowPhotoInput] = useState(false);
  const [showGameResult, setShowGameResult] = useState(false);

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const response = await fetch(`https://sh.yashikota.com/api/get_room_users?room_id=${roomNumber}`);
        if (response.ok) {
          const data = await response.json();
          const room = data.room;
          setGameMaster(room.users[room.game_master_id].name);
          setParticipants(Object.values(room.users).filter(user => user.id !== room.game_master_id));
          setTotalPlayers(room.total_players);
          setRoomStatus(room.status);
          setCurrentRound(room.current_round);
        } else {
          console.error('Failed to fetch room data');
        }
      } catch (error) {
        console.error('Error fetching room data:', error);
      }
    };

    fetchRoomData();

    const interval = setInterval(() => {
      fetchRoomData();
    }, 5000);

    return () => clearInterval(interval);
  }, [roomNumber]);

  const handleStartGame = async () => {
    try {
      const response = await fetch(`https://sh.yashikota.com/api/start_game?room_id=${roomNumber}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: playerId }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(data.message);
        setRoomStatus(data.status);
        setCurrentRound(data.current_round);
        setShowPhotoInput(true);
      } else {
        // const errorData = await response.json();
        // console.error(errorData.message);
        setShowPhotoInput(true);
      }
    } catch (error) {
      console.error('Error starting game:', error);
    }
  };

  if (showGameResult) {
    console.log('showGameResult', showGameResult);
    return <GameResult language={language} roomId={roomNumber} />;
  }

  if (showPhotoInput) {
    return <PhotoInput language={language} roomId={roomNumber} userId={playerId} onComplete={() => setShowGameResult(true)} />;
  }

  return (
    <div className="GameScreen">
      {/* <GameScreenLogo className="GameScreen-logo" /> */}
      <header className="GameScreen-header">
        <div className="GameScreen-title">
          <h2 className="GameScreen-room">{language === 'jp' ? '部屋番号:' : 'Room Number:'}</h2>
          <p className="GameScreen-roomCode">{roomNumber}</p>
        </div>
        <div className="GameScreen-qr">
          <QRCode value={`https://sh.yashikota.com/join?room_id=${roomNumber}`} />
        </div>
      </header>
      <main className="GameScreen-main">
        <input type="text" value={`https://sh.yashikota.com/join?room_id=${roomNumber}`} readOnly className="GameScreen-url" />
        <div className="GameScreen-participants">
          <h3>{language === 'jp' ? '参加者' : 'Participants'}</h3>
          <ul>
            <li>{gameMaster} <span role="img" aria-label="crown">👑</span></li>
            {participants.map((player) => (
              <li key={player.id}>{player.name}</li>
            ))}
          </ul>
        </div>
        <button className="GameScreen-startButton" onClick={handleStartGame}>
          {language === 'jp' ? 'このメンバーでゲームを始める' : 'Start the game with these members'}
        </button>
        <div className="GameScreen-status">
          <h3>{language === 'jp' ? 'ステータス' : 'Status'}</h3>
          <p>{roomStatus}</p>
          <p>{language === 'jp' ? `ラウンド: ${currentRound}` : `Round: ${currentRound}`}</p>
        </div>
      </main>
    </div>
  );
}

export default GameScreen;
