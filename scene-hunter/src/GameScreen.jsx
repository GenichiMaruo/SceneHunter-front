import React, { useEffect, useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import PhotoInput from './PhotoInput';
import GameResult from './GameResult';
import WaitingScreen from './WaitingScreen';
import Modal from './Modal';
import './main.css';

function GameScreen({ token, apiUrl, language, playerName, roomNumber, playerId, handleUpdatePlayerName, handleEndGame }) {
  const [deployUrl, setDeployUrl] = useState('https://scene-hunter.pages.dev');
  const [roomStatus, setRoomStatus] = useState('');
  const [currentRound, setCurrentRound] = useState(1);
  const [participants, setParticipants] = useState([]);
  const [gameMaster, setGameMaster] = useState('');
  const [gameMasterId, setGameMasterId] = useState('');
  const gameMasterIdRef = useRef(gameMasterId);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAlreadyTaken, setIsAlreadyTaken] = useState(false);
  const [showPhotoInput, setShowPhotoInput] = useState(false);
  const [showGameResult, setShowGameResult] = useState(false);
  const [showWaitingScreen, setShowWaitingScreen] = useState(false);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [newName, setNewName] = useState(playerName);
  const [eventSource, setEventSource] = useState(null);
  const isEventSourceOpen = useRef(false);
  const [errorMessage, setErrorMessage] = useState(''); // New state for error message
  const [showErrorMessage, setShowErrorMessage] = useState(false); // New state to control error message visibility

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const response = await fetch(`${apiUrl}/room/users`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const room = await response.json();
          gameMasterIdRef.current = room.game_master_id;
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
      console.log('EventSource connected:', eventSourceUrl);

      es.onmessage = (event) => {
        if (event.data.startsWith('{')) {
          const data = JSON.parse(event.data);
          console.log('Received event:', data);

          switch (data.message) {
            case 'update game rounds':
            case 'update game status':
              handleGameStatusUpdate(data);
              break;
            case 'update photo uploaded users':
              setRoomStatus(data.status);
              setCurrentRound(data.current_round);
              setShowWaitingScreen(true); // Move to waiting screen after photo capture
              break;
            case 'update user name':
              updateUserName(data.result);
              fetchRoomData();
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
    if (!isEventSourceOpen.current) {
      initiateEventSource();
      isEventSourceOpen.current = true;
    }

    const handleGameStatusUpdate = (data) => {
      console.log('Game status update:', data);
      if (data.result === 'game-master-photo' && isAlreadyTaken === false) {
        console.log('PID:', playerId, 'GMID:', gameMasterIdRef.current);
        if (playerId === gameMasterIdRef.current) {
          setShowWaitingScreen(false);
          setShowPhotoInput(true); // Move game master to photo capture mode
        } else {
          setShowPhotoInput(false);
          setShowWaitingScreen(true); // Move players to waiting screen
        }
      } else if (data.result === 'player-photo' && isAlreadyTaken === false) {
        console.log('change to photo input');
        if (playerId !== gameMasterIdRef.current) {
          setShowWaitingScreen(false);
          setShowPhotoInput(true); // Players start photo capture
        } else {
          setShowPhotoInput(false);
          setShowWaitingScreen(true); // Game master moves to waiting screen
        }
      } else if (isAlreadyTaken === true) {
        setShowPhotoInput(false);
        setShowWaitingScreen(true); // Move all users to waiting screen
      } else if (data.result === 'result') {
        setShowPhotoInput(false);
        setShowWaitingScreen(false);
        setShowGameResult(true); // All users transition to the result display screen
      } else {
        setRoomStatus(data.status);
        setCurrentRound(data.current_round);
      }
    };

    const updateUserName = (data) => {
      const [userId, newName] = data.split(',');
      if (gameMasterIdRef.current === '') {
        fetchRoomData();
      } else {
        setParticipants(participants.map(player => {
          if (player.id === userId) {
            return { ...player, name: newName };
          }
          return player;
        }));
        if (gameMasterIdRef.current === userId) {
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

  const showTemporaryMessage = (message) => {
    setErrorMessage(message);
    setShowErrorMessage(true);
    setTimeout(() => {
      setShowErrorMessage(false);
    }, 3000); // Message will be displayed for 3 seconds
  };

  const handleInputChangeName = (e) => {
    // < > ' " , ; % ( ) & + \ これらの文字を禁止
    if (e.target.value.match(/[<>\'\",;%()&+\\]/)) {
      showTemporaryMessage(language === 'ja' ? '記号の一部は使用できません' : 'Invalid characters are included.');
      return;
    }
    // 空白文字を禁止
    if (e.target.value.match(/\s/)) {
      showTemporaryMessage(language === 'ja' ? '空白文字は使用できません' : 'Spaces are not allowed.');
      return;
    }
    // 12文字まで
    if (e.target.value.length > 12) {
      showTemporaryMessage(language === 'ja' ? '12文字以内で入力してください' : 'Please enter a name within 12 characters.');
      return;
    }
    setNewName(e.target.value);
  };

  const handleChangeName = () => {
    if (newName === '') {
      alert(language === 'ja' ? '名前を入力してください' : 'Please enter a name.');
      return;
    } else if (newName === playerName) {
      setIsNameModalOpen(false);
      return;
    } else {
      handleUpdatePlayerName(newName);
      setIsNameModalOpen(false);
    }
  };

  const handleStartGame = async () => {
    try {
      const response = await fetch(`${apiUrl}/game/start`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log(data.message);
        setRoomStatus(data.status);
        setCurrentRound(data.current_round);
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
      alert(language === 'ja' ? 'URLがクリップボードにコピーされました。' : 'URL copied to clipboard.');
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  };

  const handleExitRoom = async () => {
    try {
      const response = await fetch(`${apiUrl}/room/exit`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log(data.message);
        window.location.href = '/';
        handleEndGame();
      } else {
        const errorData = await response.json();
        console.error(errorData.message);
        window.location.href = '/';
        handleEndGame();
      }
    } catch (error) {
      console.error('Error exiting room:', error);
    }
  };

  if (showGameResult) {
    return <GameResult token={token} apiUrl={apiUrl} language={language} isGameMaster={playerId === gameMasterId} onComplete={() => setShowGameResult(false)} />;
  } if (showWaitingScreen) {
    const isGameMaster = playerId === gameMasterId;
    if (isGameMaster === true) {
      return <WaitingScreen language={language} isGameMaster={true} />;
    } else {
      return <WaitingScreen language={language} isGameMaster={isAlreadyTaken} />;
    }
  } if (showPhotoInput) {
    return <PhotoInput token={token} apiUrl={apiUrl} language={language} roomId={roomNumber} userId={playerId} isGameMaster={playerId === gameMasterId} setIsAlreadyTaken={setIsAlreadyTaken} onComplete={() => setShowWaitingScreen(true)} />;
  }

  return (
    <div className="w-full h-100svh min-h-[100svh] flex flex-col items-center justify-center text-center overflow-hidden">
      <header className="w-full h-[13svh] bg-[#4ACEFF] bg-opacity-35"></header>
      <div className="w-full flex flex-col flex-grow relative bg-[#E7E7E7]"> {/* main */}
        <div className="flex justify-between items-start w-full h-[20svh] p-[5svw]"> {/* room status */}
          <div className="flex flex-col justify-between h-full"> {/* Left Section */}
            <div className="flex items-center justify-between w-[40svw] h-[7svh] px-[5svw] border-[0.5svw] border-[#333333] rounded-[2svw] bg-[#E7E7E7] text-[#333333]"> {/* room number */}
              <div className="font-bold text-[4svw]">PIN</div>
              <div className="font-bold text-[6svw]">{roomNumber}</div>
            </div>
            <button className="flex items-center justify-between w-[40svw] h-[7svh] px-[5svw] rounded-[2svw] bg-[#4CAF50] text-[#FFFFFF]" onClick={handleCopyToClipboard}> {/* invite URL button */}
              <div className="text-[8svw]">Invite</div>
              <span class="icon-[ph--copy-bold] text-[8svw]"></span>
            </button>            
          </div>
          <div className="h-full"> {/* Right Section */}
            <div className="flex items-center justify-center border-[0.5svw] w-[h-full] h-full border-[#333333] rounded-[6svw] bg-[#ffffff]" onClick={() => setIsModalOpen(true)}> {/* QR code */}
              <QRCodeSVG className="w-[h-[100%]] h-[calc(100%-4svh)] " id='qrcode' value={`${deployUrl}/${roomNumber}`} />
            </div>  
          </div>
        </div>
        
        <div>  {/* participants */}
          <div className="h-[35svh] p-[5svw] mx-[5svw] border-[0.5svw] border-[#333333] rounded-[6svw] ">
            <button className="w-full flex justify-end" onClick={() => setIsNameModalOpen(true)}>
              <span class="icon-[mdi--rename-box-outline] text-[7svw]"></span>
            </button>
            <div className="h-[calc(100%-4svh)] overflow-x-hidden overflow-y-scroll">
              <ul className="flex flex-col items-center text-[6svw] text-[#333333]">
                <li className="w-full flex items-center justify-between">
                  <span className="">{gameMaster}</span>
                  {playerId === gameMasterId && (
                    <span>✨️</span>
                  )}
                  <span role="img" aria-label="crown" className="">👑</span>
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
          </div>
            
          <div className="mx-[5svw] flex flex-col items-center justify-center"> {/* buttons */}
            {playerId === gameMasterId ? (
              <button className="w-full h-[6svh] m-[2svw] rounded-[2svw] bg-[#003B5C] text-[5svw] text-[#FFFFFF]" onClick={handleStartGame}>
                {language === 'ja' ? 'このメンバーでゲームを始める' : 'Start the game with these members'}
              </button>
            ) : (
              <p className="w-full h-[6svh] m-[2svw] rounded-[2svw] bg-[#003B5C] text-[5svw] text-[#FFFFFF]">
                {language === 'ja' ? 'ゲーム開始を待機中' : 'Waiting for the game to start'}
              </p>
            )}
            <button className="w-full h-[6svh] m-[2svw] rounded-[2svw] bg-[#003B5C] text-[5svw] text-[#FFFFFF]" onClick={handleExitRoom}>
              {language === 'ja' ? '部屋を出る' : 'Exit the room'}
            </button>  
          </div>
        </div>
      </div>

      <footer className="flex justify-center items-center w-full h-[13svh] bg-[#4ACEFF] bg-opacity-35">
        <p className="text-[4svw]">© 2024 Scene Hunter</p>
      </footer>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <QRCodeSVG value={`${deployUrl}/${roomNumber}`} size={256} />
      </Modal>

      <Modal isOpen={isNameModalOpen} onClose={() => setIsNameModalOpen(false)}>
        <h2 className="Modal-change-name">{language === 'ja' ? '名前を変更' : 'Change Name'}</h2>
        {showErrorMessage && <p className="App-error">{errorMessage}</p>} {/* Error message display */}
        <input
          type="text"
          value={newName}
          onChange={handleInputChangeName}
          className="Modal-name-input"
        />
        <button onClick={handleChangeName} className="Modal-save-button">
          {language === 'ja' ? '保存' : 'Save'}
        </button>
      </Modal>
    </div>
  );
}

export default GameScreen;
