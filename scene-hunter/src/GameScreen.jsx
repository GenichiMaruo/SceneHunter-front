import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import background from './background.svg';
import PhotoInput from './PhotoInput';
import GameResult from './GameResult';
import Modal from './Modal';
import './GameScreen.css';

function GameScreen({ apiUrl, language, playerName, roomNumber, playerId, handleUpdatePlayerName, handleEndGame }) {
  const [deployUrl, setDeployUrl] = useState('https://scene-hunter.pages.dev');
  const [roomStatus, setRoomStatus] = useState('');
  const [currentRound, setCurrentRound] = useState(1);
  const [participants, setParticipants] = useState([]);
  const [gameMaster, setGameMaster] = useState('');
  const [gameMasterId, setGameMasterId] = useState('');
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPhotoInput, setShowPhotoInput] = useState(false);
  const [showGameResult, setShowGameResult] = useState(false);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [newName, setNewName] = useState(playerName);
  const [eventSource, setEventSource] = useState(null);

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const response = await fetch(`${apiUrl}/get_room_users?room_id=${roomNumber}`);
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

    const initiateEventSource = () => {
      const eventSourceUrl = `${apiUrl}/notification?room_id=${roomNumber}`;
      const es = new EventSource(eventSourceUrl);

      es.onmessage = (event) => {
        if (event.data.startsWith('{')) {
          const data = JSON.parse(event.data);
          console.log('Received event:', data);

          switch (data.message) {
            case 'update game rounds':
            case 'update game status':
            case 'update photo uploaded users':
              setRoomStatus(data.status);
              setCurrentRound(data.current_round);
              setShowPhotoInput(true);
              break;
            case 'update user name':
              updateUserName(data.result);
              break;
            case 'change game master':
            case 'update number of users':
              fetchRoomData();
              break;
            default:
              console.warn('Unhandled event type:', data.message);
          }
        }
      };

      es.onerror = (error) => {
        console.error('EventSource failed:', error);
        es.close();
        setTimeout(initiateEventSource, 5000); // Retry connection after 5 seconds
      };

      setEventSource(es);
    };

    initiateEventSource();

    const updateUserName = (data) => {
      const [userId, newName] = data.split(',');
      if (gameMasterId === '') {
        fetchRoomData();
      } else {
        setParticipants(participants.map(player => {
          if (player.id === userId) {
            return { ...player, name: newName };
          }
          return player;
        }));
        if (gameMasterId === userId) {
          setGameMaster(newName);
        }
      }
    };

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [roomNumber]);

  const handleChangeName = () => {
    if (newName === '') {
      alert(language === 'jp' ? '名前を入力してください。' : 'Please enter a name.');
      return;
    } else if (newName === playerName) {
      setIsNameModalOpen(false);
      return;
    } else if (newName.length > 20) {
      alert(language === 'jp' ? '名前は20文字以内で入力してください。' : 'Please enter a name up to 20 characters.');
      return;
    } else if (newName.includes(' ')) {
      alert(language === 'jp' ? '名前にスペースを含めることはできません。' : 'Name cannot contain spaces.');
      return;
    } else {
      handleUpdatePlayerName(newName);
      setIsNameModalOpen(false);
    }
  };

  const handleStartGame = async () => {
    try {
      const response = await fetch(`${apiUrl}/game_start?room_id=${roomNumber}`, {
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
    const url = `${deployUrl}/${roomNumber}`;
    navigator.clipboard.writeText(url).then(() => {
      alert(language === 'jp' ? 'URLがクリップボードにコピーされました。' : 'URL copied to clipboard.');
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  };

  const handleExitRoom = async () => {
    try {
      const response = await fetch(`${apiUrl}/exit_room?room_id=${roomNumber}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: playerId }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(data.message);
        window.location.href = '/';
      } else {
        const errorData = await response.json();
        console.error(errorData.message);
      }
    } catch (error) {
      console.error('Error exiting room:', error);
      // 今のところはエラーが発生した場合でも退出する
      window.location.href = '/';
      handleEndGame();
    }
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
        <QRCodeSVG id='qrcode' value={`${deployUrl}/${roomNumber}`} />
      </div>
      <div className='GameScreen-url-container'>
        <input type="text" value={`${deployUrl}/${roomNumber}`} readOnly className="GameScreen-url" />
        <button className="share-button" onClick={handleCopyToClipboard}></button>
      </div>
      <main className="GameScreen-main">
        <div className="GameScreen-participants">
          <h3 className='GameScreen-player'>{language === 'jp' ? '参加者' : 'Participants'}</h3>
          <button onClick={() => setIsNameModalOpen(true)} className="change-name-button">
            {language === 'jp' ? '名前を変更' : 'Change Name'}
          </button>
          <ul>
            <li className='GameScreen-gamemaster'>
              <span className="gamemaster">{gameMaster}</span>
              {playerId === gameMasterId && (
                <span>✨️</span>
              )}
              <span role="img" aria-label="crown" className="crown">👑</span>
            </li>
            {participants.map((player) => (
              <li key={player.id}>
                {player.name}
                {player.id === playerId && (
                  <span>✨️</span>
                )}
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
        <button className="GameScreen-exitButton" onClick={handleExitRoom}>
          {language === 'jp' ? '部屋を出る' : 'Exit the room'}
        </button>
      </main>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <QRCodeSVG value={`${deployUrl}/${roomNumber}`} size={256} />
      </Modal>
      <Modal isOpen={isNameModalOpen} onClose={() => setIsNameModalOpen(false)}>
        <h2 className="Modal-change-name">{language === 'jp' ? '名前を変更' : 'Change Name'}</h2>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="Modal-name-input"
        />
        <button onClick={handleChangeName} className="Modal-save-button">
          {language === 'jp' ? '保存' : 'Save'}
        </button>
      </Modal>
    </div>
  );
}

export default GameScreen;
