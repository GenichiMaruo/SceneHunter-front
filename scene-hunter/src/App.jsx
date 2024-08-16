import React, { useState, useEffect } from 'react';
import './App.css';
import GameScreen from './GameScreen';
import { BrowserRouter as Router, Route, Routes, useParams, useNavigate, useLocation } from 'react-router-dom';

function App() {
  const [apiUrl, setApiUrl] = useState('https://sh.yashikota.com/api');
  const [language, setLanguage] = useState('jp');
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [screen, setScreen] = useState('main');
  const [playerId, setPlayerId] = useState('');

  const navigate = useNavigate();
  const { room_id } = useParams();
  const location = useLocation(); // useLocation hook to get current URL parameters

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const debug = searchParams.get('debug');
    const port = searchParams.get('port');

    // If debug is true and port is 8080, set apiUrl to localhost:8080
    if (debug === 'true') {
      // If port is not set, default to 8080
      if (port) {
        setApiUrl(`http://localhost:${port}/api`);
      } else {
        setApiUrl('http://localhost:8080/api');
      }
    }

    const fetchPlayerId = async () => {
      // 言語設定がローカルストレージに保存されている場合、再利用
      if (localStorage.getItem('language')) {
        setLanguage(localStorage.getItem('language'));
      }
      // プレイヤーIDがローカルストレージに保存されている場合、3時間以内のデータであれば再利用
      if (localStorage.getItem('player_id') && (new Date() - new Date(localStorage.getItem('save_date_time'))) < (3 * 60 * 60 * 1000) - 60) {
        setPlayerId(localStorage.getItem('player_id'));
        setPlayerName(localStorage.getItem('player_name'));
        return;
      }
      try {
        const response = await fetch(`${apiUrl}/generate_user_id`);
        if (response.ok) {
          const data = await response.json();
          setPlayerId(data.user_id);
          localStorage.setItem('player_id', data.user_id);
          localStorage.setItem('player_name', playerName);
          localStorage.setItem('save_date_time', new Date().toISOString());
        } else {
          console.error('Failed to generate user ID');
        }
      } catch (error) {
        console.error('Error generating user ID:', error);
      }
    };
    fetchPlayerId();
  }, [apiUrl, location.search]); // location.search to trigger the effect when URL parameters change

  useEffect(() => {
    if (room_id) {
      setRoomNumber(room_id);
      setShowJoinInput(true);
      setShowCreateInput(false);
    }
  }, [room_id]);

  const handleLanguageChange = (event) => {
    setLanguage(event.target.value);
    localStorage.setItem('language', event.target.value);
  };

  const handleUpdatePlayerName = async (player_name) => {
    try {
      const response = await fetch(`${apiUrl}/update_username?room_id=${roomNumber}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: playerId,
          name: player_name,
        }),
      });

      if (response.ok) {
        console.log('Player name updated');
      } else {
        console.error('Failed to update player name');
      }
    } catch (error) {
      console.error('Error updating player name:', error);
    }
  };

  const handleCreateClick = () => {
    setShowCreateInput(true);
    setShowJoinInput(false);
  };

  const handleJoinClick = () => {
    setShowJoinInput(true);
    setShowCreateInput(false);
  };

  const handleCreateInputChange = (event) => {
    setPlayerName(event.target.value);
  };

  const handleJoinInputChange = (event) => {
    setRoomNumber(event.target.value);
  };

  const handleEnterRoom = async () => {
    try {
      const response = await fetch(`${apiUrl}/join_room?room_id=${roomNumber}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: playerId,
          name: playerName,
          lang: language,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Room joined:', data);
        setScreen('game');
      } else if (response.status === 409) {
        // すでに入室済みの場合
        // プレイヤー名を更新
        handleUpdatePlayerName(playerName);
        console.log('Room joined:', response.statusText);
        setScreen('game');
      } else {
        console.error('Failed to join room');
      }
    } catch (error) {
      console.error('Error joining room:', error);
    }
  };

  const handleEnterPlayerName = async () => {
    try {
      const response = await fetch(`${apiUrl}/create_room`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: playerId,
          name: playerName,
          lang: language,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Room created:', data);
        setRoomNumber(data.room_id);
        setScreen('game');
        navigate(`/${data.room_id}`); // 部屋が作成された後にURLを変更
      } else {
        console.error('Failed to create room');
      }
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };

  const handleGoBack = () => {
    setShowCreateInput(false);
    setShowJoinInput(false);
  };

  const handleGameEnd = () => {
    setShowCreateInput(false);
    setShowJoinInput(false);
    setScreen('main');
    setRoomNumber('');
    setPlayerName('');
    navigate('/');
  };

  return (
    <div className="App">
      {screen === 'main' ? (
        <>
          <div className="App-background"></div>
          <header className="App-header">
            <h1 className="App-title">Scene Hunter</h1>
            <p className="App-subtitle">Spot the Image from the Clues!</p>
            <div className="App-buttons">
              {showCreateInput ? (
                <>
                  <input
                    className='App-input'
                    type="text"
                    value={playerName}
                    onChange={handleCreateInputChange}
                    placeholder={language === 'jp' ? 'プレイヤー名を入力' : 'Enter player name'}
                    autoFocus
                  />
                  <button className="App-button" onClick={handleEnterPlayerName}>
                    {language === 'jp' ? '入力' : 'Enter'}
                  </button>
                  <button className="App-button" onClick={handleGoBack}>
                    {language === 'jp' ? '戻る' : 'Back'}
                  </button>
                </>
              ) : showJoinInput ? (
                <>
                  <input
                    className='App-input'
                    type="text"
                    value={playerName}
                    onChange={handleCreateInputChange}
                    placeholder={language === 'jp' ? 'プレイヤー名を入力' : 'Enter player name'}
                    autoFocus
                  />
                  <input
                    className='App-input'
                    type="text"
                    value={roomNumber}
                    onChange={handleJoinInputChange}
                    placeholder={language === 'jp' ? '部屋番号を入力' : 'Enter room number'}
                  />
                  <button className="App-button" onClick={handleEnterRoom}>
                    {language === 'jp' ? '入力' : 'Enter'}
                  </button>
                  <button className="App-button" onClick={handleGoBack}>
                    {language === 'jp' ? '戻る' : 'Back'}
                  </button>
                </>
              ) : (
                <>
                  <button className="App-button" onClick={handleCreateClick}>
                    {language === 'jp' ? '作成' : 'Create'}
                  </button>
                  <button className="App-button" onClick={handleJoinClick}>
                    {language === 'jp' ? '参加' : 'Join'}
                  </button>
                </>
              )}
            </div>
          </header>
          <div className="App-language">
            <select value={language} onChange={handleLanguageChange}>
              <option value="jp">日本語</option>
              <option value="en">English</option>
            </select>
          </div>
          <footer className="App-footer">
            <p>© 2024 Scene Hunter</p>
          </footer>
        </>
      ) : (
        <GameScreen apiUrl={apiUrl} language={language} playerName={playerName} roomNumber={roomNumber} playerId={playerId} handleUpdatePlayerName={handleUpdatePlayerName} handleGameEnd={handleGameEnd} />
      )}
    </div>
  );
}

export default function RouterApp() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/:room_id" element={<App />} />
      </Routes>
    </Router>
  );
}
