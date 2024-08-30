import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes, useParams, useNavigate, useLocation } from 'react-router-dom';
import emojiRegex from 'emoji-regex';
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
  const [isPC, setIsPC] = useState(false);
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);

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

    fetchTokenAndUserId();
  }, [location.search, apiUrl]);

  const fetchTokenAndUserId = async () => {
    let currentToken = localStorage.getItem('token');
    // token発行が3️時間以上前の場合は新しいtokenを取得
    if (!currentToken || new Date() - new Date(localStorage.getItem('save_date_time')) > 10800000) {
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
        localStorage.setItem('save_date_time', new Date().toISOString());
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

  useEffect(() => { // PCでアクセスした場合のみモーダルを表示
    const userAgent = navigator.userAgent;
    const isMobile = /Mobi|Android/i.test(userAgent);

    if (!isMobile) {
      setIsPC(true);
      setIsWarningModalOpen(true);
    }
  }, []);

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
    const regexEmoji = emojiRegex();
    // 絵文字を禁止
    if (value.match(regexEmoji)) {
      showTemporaryMessage(language === 'jp' ? '絵文字は使用できません' : 'Emojis are not allowed.');
      return;
    }
    // < > ' " , ; % ( ) & + \ これらの文字を禁止
    if (value.match(/[<>'\",;%()&+\\]/)) {
      showTemporaryMessage(language === 'jp' ? '記号の一部は使用できません' : 'Invalid characters are included.');
      return;
    }
    // 空白文字を禁止
    if (value.match(/\s/)) {
      showTemporaryMessage(language === 'jp' ? '空白文字は使用できません' : 'Spaces are not allowed.');
      return;
    }
    // 12文字まで
    if (value.length > 12) {
      showTemporaryMessage(
        language === 'jp' ? '12文字以内で入力してください' : 'Please enter up to 12 characters'
      );
      return;
    }
    setPlayerName(value);
  };

  const handleJoinInputChange = (event) => {
    const value = event.target.value;
    // 数字以外の文字を禁止
    if (!value.match(/^[0-9]*$/)) {
      showTemporaryMessage(
        language === 'jp' ? '数字のみを入力してください' : 'Please enter only numbers'
      );
      return;
    }
    // 6桁まで
    if (value.length > 6) {
      showTemporaryMessage(
        language === 'jp' ? '6桁以内で入力してください' : 'Please enter up to 6 digits'
      );
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
      } else if (response.status === 401) {
        fetchTokenAndUserId();
        handleEnterRoom();
      } else if (response.status === 404) {
        showTemporaryMessage('部屋が見つかりません');
      } else {
        console.error('Failed to join room');
        showTemporaryMessage(
          language === 'jp' ? '部屋番号が存在しません' : 'Room number does not exist'
        );
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
      } else if (response.status === 401) {
        fetchTokenAndUserId();
        handleEnterPlayerName();
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
          <button 
            className="absolute left-0 top-0 m-[10svw] z-[2]"
            onClick={() => setIsWarningModalOpen(true)}
          >
            {isPC && (
              <span className="icon-[mingcute--warning-fill] text-[4svh] text-[#8b1e1e]"></span>
            )}
          </button>

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
                className="flex items-center justify-between w-[40svw] h-[4svh] border-[0.5svw] border-[#333333] rounded-[2svw] bg-[#FFFFFF] text-gray-700"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <div className="w-[20svw] text-[2svh] mx-[3svw] text-[#333333]">
                  {language === 'jp' ? '日本語' : 'English'}
                </div>
                <span className={isDropdownOpen ? "icon-[fe--arrow-up] text-[2svh] mr-[3svw]"
                  : "icon-[fe--arrow-down] text-[2svh] mr-[3svw]"}></span>
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 top-[100%] mt-[0.5svh] w-[40svw] origin-top-right bg-white divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
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
            backgroundColor={'#E7E7E7'}
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
                ${language === 'jp' ? 'indent-[5svw] tracking-[5svw]' : ''} 
                ${playerName ? 'bg-[#003B5C]' : 'bg-[#003B5C] bg-opacity-35'}`}
              onClick={handleEnterPlayerName}
              disabled={!playerName}
            >
              {language === 'jp' ? '作成' : 'Create'}
            </button>
            <button
              className={`w-[50vw] my-[5svw] px-[10svw] py-[2svw] bg-[#003B5C] text-[5svw] text-white rounded
                ${language === 'jp' ? 'indent-[5svw] tracking-[5svw]' : ''} `}
              onClick={handleGoBack}
            >
              {language === 'jp' ? '戻る' : 'Back'}
            </button>
          </Modal>

          <Modal
            isOpen={showJoinInput}
            title={language === 'jp' ? '部屋に参加' : 'Join Room'}
            onClose={() => setShowJoinInput(false)}
            backgroundColor={'#E7E7E7'}
          >
            {showErrorMessage && <p className="text-red-500">{errorMessage}</p>}
            <input
              className="text-center text-[5svw] border-[0.5svw] border-[#333333] rounded-[2svw] px-[3svw] py-[3svw] my-[2svw]"
              type="text"
              value={playerName}
              onChange={handleCreateInputChange}
              placeholder={language === 'jp' ? 'プレイヤー名を入力' : 'Enter Player Name'}
            />
            <input
              className="text-center text-[5svw] border-[0.5svw] border-[#333333] rounded-[2svw] px-[3svw] py-[3svw] my-[2svw]"
              type="number"
              value={roomNumber}
              onChange={handleJoinInputChange}
              placeholder={language === 'jp' ? '部屋番号を入力' : 'Enter Room Number'}
            />
            <button
              className={`w-[50vw] my-[2svw] px-[10svw] py-[2svw] bg-[#003B5C] text-[5svw] text-white rounded
                ${language === 'jp' ? 'indent-[5svw] tracking-[5svw]' : ''}
                ${roomNumber ? 'bg-[#003B5C]' : 'bg-[#003B5C] bg-opacity-35'}`}
              onClick={handleEnterRoom}
              disabled={!roomNumber}
            >
              {language === 'jp' ? '参加' : 'Join'}
            </button>
            <button
              className={`w-[50vw] my-[2svw] px-[10svw] py-[2svw] bg-[#003B5C] text-[5svw] text-white rounded
                ${language === 'jp' ? 'indent-[5svw] tracking-[5svw]' : ''} `}
              onClick={handleGoBack}
            >
              {language === 'jp' ? '戻る' : 'Back'}
            </button>
          </Modal>
          
          <Modal 
            isOpen={isWarningModalOpen} 
            onClose={() => setIsWarningModalOpen(false)}
            backgroundColor={'#E7E7E7'}
          >
            {isPC && (
              <div className="text-[2.5svh] animate-rainbow">
                <div>{language === 'jp' ? 'PCでは正常に動作しません' : 'This application does not work properly on PC'}</div>
                <div>{language === 'jp' ? 'スマホでアクセスしてください' : 'Please access this application on a smartphone'}</div>
              </div>
            )}
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
