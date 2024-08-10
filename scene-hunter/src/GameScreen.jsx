import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import background from './background.svg';
import PhotoInput from './PhotoInput';
import GameResult from './GameResult';
import Modal from './Modal';
import './GameScreen.css';

function GameScreen({ language, playerName, roomNumber, playerId }) {
  const [roomStatus, setRoomStatus] = useState('');
  const [currentRound, setCurrentRound] = useState(1);
  const [participants, setParticipants] = useState([]);
  const [gameMaster, setGameMaster] = useState('');
  const [gameMasterId, setGameMasterId] = useState('');
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
          setGameMasterId(room.game_master_id);
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

    const eventSourceUrl = `https://sh.yashikota.com/api/notification?room_id=${roomNumber}`;
    const eventSource = new EventSource(eventSourceUrl);

    eventSource.onmessage = (event) => {
      if (event.data.startsWith('{')) {
        const data = JSON.parse(event.data);
        console.log('Received event:', data);

        switch (data.message) {
          case 'update game rounds':
          case 'update game status':
          case 'update photo uploaded users':
            // ゲーム開始された場合
            setRoomStatus(data.status);
            setCurrentRound(data.current_round);
            setShowPhotoInput(true);
            break;
          case 'change game master':
          case 'update user name':
          case 'update number of users':
            fetchRoomData();
            break;
          default:
            console.warn('Unhandled event type:', data.message);
        }
      }
    };

    eventSource.onerror = (error) => {
      console.error('EventSource failed:', error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [roomNumber]);

  const handleStartGame = async () => {
    try {
      const response = await fetch(`https://sh.yashikota.com/api/game_start?room_id=${roomNumber}`, {
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
        const errorData = await response.json();
        console.error(errorData.message);
      }
    } catch (error) {
      console.error('Error starting game:', error);
    }
  };

  const handleCopyToClipboard = () => {
    const url = `https://scene-hunter.pages.dev/${roomNumber}`;
    navigator.clipboard.writeText(url).then(() => {
      alert(language === 'jp' ? 'URLがクリップボードにコピーされました。' : 'URL copied to clipboard.');
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  };

  if (showGameResult) {
    return <GameResult language={language} roomId={roomNumber} />;
  }

  if (showPhotoInput) {
    return <PhotoInput language={language} roomId={roomNumber} userId={playerId} onComplete={() => setShowGameResult(true)} />;
  }

  return (
    <div className="GameScreen">
      <img src={background} alt="Background" className="GameScreen-logo" />
      <div className="GameScreen-title">
        <h2 className="GameScreen-room">{language === 'jp' ? '部屋番号' : 'Room Number:'}</h2>
        <p className="GameScreen-roomCode">{roomNumber}</p>
      </div>
      <div className="GameScreen-qr" onClick={() => setIsModalOpen(true)}>
        <QRCodeSVG id='qrcode' value={`https://scene-hunter.pages.dev/${roomNumber}`} />
      </div>
      <div className='GameScreen-url-container'>
        <input type="text" value={`https://scene-hunter.pages.dev/${roomNumber}`} readOnly className="GameScreen-url" />
        <button className="share-button" onClick={handleCopyToClipboard}></button>
      </div>
      <main className="GameScreen-main">
        <div className="GameScreen-participants">
          <h3 className='GameScreen-player'>{language === 'jp' ? '参加者' : 'Participants'}</h3>
          <ul>
            <li className='GameScreen-gamemaster'>
              <span className="gamemaster">{gameMaster}</span>
              <span role="img" aria-label="crown" className="crown" >👑</span>
            </li>
            {participants.map((player) => (
              <li key={player.id} className={player.id === playerId ? 'GameScreen-underline' : ''}>
                {player.name}
              </li>
            ))}
          </ul>
        </div>
        {playerId === gameMasterId ? (
          <button className="GameScreen-startButton" onClick={handleStartGame}>
            {language === 'jp' ? 'このメンバーでゲームを始める' : 'Start the game with these members'}
          </button>
        ) : (
          <p className="GameScreen-waitingMessage">
            {language === 'jp' ? 'ゲーム開始を待機中' : 'Waiting for the game to start'}
          </p>
        )}
      </main>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <QRCodeSVG value={`https://scene-hunter.pages.dev/${roomNumber}`} size={256} />
      </Modal>
    </div>
  );
}

export default GameScreen;
