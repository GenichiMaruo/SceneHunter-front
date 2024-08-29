import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes, useParams, useNavigate, useLocation } from 'react-router-dom';
import './main.css';
import './App.css';
import Modal from './Modal';
import ErrorMessage from './ErrorMessage';
import GameScreen from './GameScreen';

function App({ roomId }) {
  const [api, setApi] = useState('https://sh.yashikota.com/api');
  const [version, setVersion] = useState('v2');
  const apiUrl = useRef('');
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'ja');
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [screen, setScreen] = useState('main');
  const [playerId, setPlayerId] = useState('');
  const [token, setToken] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const debug = searchParams.get('debug');
    const port = searchParams.get('port');
    const ver = searchParams.get('ver');

    if (ver) {
      setVersion(`${ver}`);
    }
    if (debug === 'true') {
      if (port) {
        apiUrl.current = `http://localhost:${port}/api/${version}`;
      } else {
        apiUrl.current = `http://localhost:8080/api/${version}`;
      }
    } else {
      apiUrl.current = `${api}/${version}`;
    }

    const fetchTokenAndUserId = async () => {
      let currentToken = localStorage.getItem('token');
      if (!currentToken) {
        currentToken = await getNewToken();
        try {
          const userId = await fetchUserIdWithToken(currentToken);
          if (userId) {
            setPlayerId(userId);
            localStorage.setItem('player_id', userId);
            localStorage.setItem('player_name', playerName);
            localStorage.setItem('save_date_time', new Date().toISOString());
          }
        } catch (error) {
          console.error('Error fetching user ID:', error);
        }
      } else {
        let currentUserId = localStorage.getItem('player_id');
        setToken(currentToken);
        setPlayerId(currentUserId);
      }
    };

    const getNewToken = async () => {
      try {
        console.log('api:token')
        const response = await fetch(`${apiUrl.current}/token`);
        if (response.ok) {
          const tokenData = await response.json();
          const newToken = tokenData.token;
          setToken(newToken);
          localStorage.setItem('token', newToken);
          return newToken;
        } else {
          console.error('Failed to fetch token');
        }
      } catch (error) {
        console.error('Error fetching new token:', error);
      }
      return null;
    };

    const fetchUserIdWithToken = async (token) => {
      try {
        const response = await fetch(`${apiUrl.current}/user`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const userData = await response.json();
          return userData.ID;
        } else if (response.status === 401) {
          const newToken = await getNewToken();
          if (newToken) {
            return await fetchUserIdWithToken(newToken);
          }
        } else {
          console.error('Failed to fetch user ID:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching user ID with token:', error);
      }
      return null;
    };

    fetchTokenAndUserId();
  }, [location.search, apiUrl]);

  useEffect(() => {
    if (roomId) {
      // room_idがURLパラメータにあるが、部屋番号が不正な場合は何もしない
      if (!roomId.match(/^[0-9]{1,6}$/)) {
        // URLを変更してリダイレクト
        navigate('/');
        return;
      }
      setRoomNumber(roomId);
      setShowJoinInput(true);
      setShowCreateInput(false);
    }
  }, [roomId]);

  useEffect(() => {
    // 言語が変更されたときにUIが再レンダリングされる
    console.log('Selected Language:', language);
  }, [language]);

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
    setIsDropdownOpen(false); // ドロップダウンを閉じる
  };

  const handleUpdatePlayerName = async (player_name) => {
    // player_nameが禁止文字を含む場合と文字数が1~12文字以外の場合は何もしない
    if (player_name.match(/[<>\'\",;%()&+\\]/) || player_name.length < 1 || player_name.length > 12) {
      return;
    }
    try {
      const response = await fetch(`${apiUrl.current}/room/username`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: player_name,
        }),
      });

      if (response.ok) {
        console.log('Player name updated');
        localStorage.setItem('player_name', player_name);
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
    const value = event.target.value;
    // Check for forbidden characters, including emojis
    if (value.match(/[<>\'\",;%()&+\\]/) || /\p{Extended_Pictographic}/u.test(value)) {
      showTemporaryMessage('記号の一部は使用できません');
      return;
    }
    // 空白文字を禁止
    if (value.match(/^\s/)) {
      showTemporaryMessage('空白文字は使用できません');
      return;
    }
    // 12文字まで
    if (value.length > 12) {
      showTemporaryMessage('12文字以内で入力してください');
      return;
    }
    setPlayerName(value);
  };

  const handleJoinInputChange = (event) => {
    const value = event.target.value;
    // 数字以外の文字を禁止
    if (!value.match(/^[0-9]*$/)) {
      showTemporaryMessage('数字のみを入力してください');
      return;
    }
    // 6桁まで
    if (value.length > 6) {
      showTemporaryMessage('6桁以内で入力してください');
      return;
    }
    setRoomNumber(value);
  };

  const showTemporaryMessage = (message) => {
    setErrorMessage(message);
    setShowErrorMessage(true);
    setTimeout(() => {
      setShowErrorMessage(false);
    }, 3000); // Message will be displayed for 3 seconds
  };

  const handleCloseErrorMessage = () => {
    setShowErrorMessage(false);
  };

  const handleEnterRoom = async () => {
    try {
      const response = await fetch(`${apiUrl.current}/room/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          room: roomNumber,
          name: playerName,
          lang: language,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Room joined:', data);
        setScreen('game');
      } else if (response.status === 400) {
        // すでに入室済みの場合プレイヤー名を更新
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
      const response = await fetch(`${apiUrl.current}/room/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
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
    <div className="w-full h-100svh min-h-[100svh] flex flex-col items-center justify-center text-center overflow-hidden">
      {screen === 'main' ? (
        <>
          {/* <div className="w-full text-center md:text-left lg:text-right">hoge</div> */}
          <header className="w-full h-[13svh] bg-[#4ACEFF] bg-opacity-35"></header>
          <div id="main" className="w-full flex flex-col flex-grow relative bg-[#E7E7E7]">
            <div className="mt-[7svh] mb-[7svh]">
              <h1 className="text-[14svw] text-shadow-FF9443 text-[#4ACEFF] font-bold">Scene Hunter</h1>
              <p className="text-[5svw] text-[#4CAF50] font-bold">Spot the Image from the Clues!</p>
            </div>

            <div id="buttons" className="flex flex-col items-center justify-center mt-[2svh]">
              <button className="block w-[50%] h-[9svh] lg:h-[9svh] text-[8svw] text-[#E7E7E7] font-bold bg-[#003B5C] rounded-[0.2em] mt-[3svh] mb-[3svh]" onClick={handleCreateClick}>
                {language === 'jp' ? '作成' : 'Create'}
              </button>
              <button className="block w-[50%] h-[9svh] lg:h-[9svh] text-[8svw] text-[#E7E7E7] font-bold bg-[#003B5C] rounded-[0.2em] mt-[3svh] mb-[3svh]" onClick={handleJoinClick}>
                {language === 'jp' ? '参加' : 'Join'}
              </button>
            </div>    

            <div className="flex w-full justify-end items-end absolute bottom-0 right-0 mr-[5svh] mb-[5svh]"> 
              <button
                id="dropdown-button"
                className="flex items-center justify-between h-[4svh] border-[0.5svw] border-[#333333] rounded-[2svw] bg-[#FFFFFF] text-gray-700"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <div className="text-[2svh] mx-[5svw] text-[#333333]">Language</div>
                <span className={isDropdownOpen ? "icon-[fe--arrow-up] mr-[3svw]" 
                                            : "icon-[fe--arrow-down] mr-[3svw]"}></span>
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 top-[100%] mt-[0.5svh] w-48 origin-top-right bg-white divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className=" border-[0.5svw] border-[#333333] rounded-[2svw] ">
                    <button 
                      className="block px-4 py-2 text-[2svh] text-gray-700"
                      onClick={() => handleLanguageChange('jp')}
                    >
                      日本語
                    </button>
                    <button 
                      className="block px-4 py-2 text-[2svh] text-gray-700"
                      onClick={() => handleLanguageChange('en')}
                    >
                      English
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <footer className="flex justify-center items-center w-full h-[13svh] bg-[#4ACEFF] bg-opacity-35">
            <p className="text-[4svw]">© 2024 Scene Hunter</p>
          </footer>
          <Modal
            isOpen={showCreateInput}
            title={language === 'jp' ? '部屋を作成' : 'Create Room'}
            onClose={() => setShowCreateInput(false)}
          >
            {showErrorMessage && <p className="text-red-500">{errorMessage}</p>}
            <input
              className="text-center text-[5svw] border-[0.5svw] border-[#333333] rounded-[2svw] px-[3svw] py-[3svw] my-[5svw]"
              type="text"
              value={playerName}
              onChange={handleCreateInputChange}
              placeholder={language === 'jp' ? 'プレイヤー名を入力' : 'Enter Player Name'}
            />
            <button 
              className={`w-[50vw] my-[5svw] px-[10svw] py-[2svw] bg-[#003B5C] text-[5svw] text-white rounded
                ${ language === 'jp' ? 'indent-[5svw] tracking-[5svw]' : '' } `}
              onClick={handleEnterPlayerName}
            >
              {language === 'jp' ? '作成' : 'Create'}
            </button>
            <button 
              className={`w-[50vw] my-[5svw] px-[10svw] py-[2svw] bg-[#003B5C] text-[5svw] text-white rounded
                ${ language === 'jp' ? 'indent-[5svw] tracking-[5svw]' : '' } `}
              onClick={handleGoBack}
            >
              {language === 'jp' ? '戻る' : 'Back'}
            </button>
          </Modal>

          <Modal
            isOpen={showJoinInput}
            title={language === 'jp' ? '部屋に参加' : 'Join Room'}
            onClose={() => setShowJoinInput(false)}
          >
            {showErrorMessage && <p className="text-red-500">{errorMessage}</p>}
            <input
              className="text-center text-[5svw] border-[0.5svw] border-[#333333] rounded-[2svw] px-[3svw] py-[3svw] my-[2svw] focus-"
              type="text"
              value={playerName}
              onChange={handleCreateInputChange}
              placeholder={language === 'jp' ? 'プレイヤー名を入力' : 'Enter player name'}
            />
            <input
              className="text-center text-[5svw] border-[0.5svw] border-[#333333] rounded-[2svw] px-[3svw] py-[3svw] my-[2svw]"
              type="text"
              value={roomNumber}
              onChange={handleJoinInputChange}
              placeholder={language === 'jp' ? '部屋番号を入力' : 'Enter Room Number'}
            />
            <button
              className={`w-[50vw] my-[2svw] px-[10svw] py-[2svw] bg-[#003B5C] text-[5svw] text-white rounded
                ${ language === 'jp' ? 'indent-[5svw] tracking-[5svw]' : '' } 
                ${roomNumber ? 'bg-[#003B5C]' : 'bg-[#003B5C] bg-opacity-35'}`}
              onClick={roomNumber ? handleEnterRoom : null}
            >
              {language === 'jp' ? '参加' : 'Join'}
            </button>
            <button 
              className={`w-[50vw] my-[2svw] px-[10svw] py-[2svw] bg-[#003B5C] text-[5svw] text-white rounded
                ${ language === 'jp' ? 'indent-[5svw] tracking-[5svw]' : '' } `} 
              onClick={handleGoBack}
            >
              {language === 'jp' ? '戻る' : 'Back'}
            </button>
          </Modal>
        </>
      ) : (
        <GameScreen
          token={token}
          apiUrl={apiUrl.current}
          language={language}
          playerName={playerName}
          roomNumber={roomNumber}
          playerId={playerId}
          handleUpdatePlayerName={handleUpdatePlayerName}
          handleGameEnd={handleGameEnd} />
      )}
    </div>
  );
}

export default App;
