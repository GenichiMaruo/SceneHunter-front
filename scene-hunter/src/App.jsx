import React, { useState, useEffect } from 'react';
import GameScreen from './GameScreen';
import { BrowserRouter as Router, Route, Routes, useParams, useNavigate, useLocation } from 'react-router-dom';
import Modal from './Modal';
import './main.css';

function App() {
  const [apiUrl, setApiUrl] = useState('https://sh.yashikota.com/api/v1');
  const [language, setLanguage] = useState('jp');
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [screen, setScreen] = useState('main');
  const [playerId, setPlayerId] = useState('');
  const [errorMessage, setErrorMessage] = useState(''); // New state for error message
  const [showErrorMessage, setShowErrorMessage] = useState(false); // New state to control error message visibility
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // New state to control dropdown visibility

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
      // room_idがURLパラメータにあるが、部屋番号が不正な場合は何もしない
      if (!room_id.match(/^[0-9]{1,6}$/)) {
        // URLを変更してリダイレクト
        navigate('/');
        return;
      }
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
    // player_nameが禁止文字を含む場合と文字数が1~12文字以外の場合は何もしない
    if (player_name.match(/[<>\'\",;%()&+\\]/) || player_name.length < 1 || player_name.length > 12) {
      return;
    }
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
    <div className="flex flex-col items-center justify-center min-h-screen text-center">
      {screen === 'main' ? (
        <>
          {/* <div className="w-full text-center md:text-left lg:text-right">hoge</div> */}
          <header className="w-full h-[13vh] bg-[#4ACEFF] bg-opacity-35"></header>
          <div id="main" className="w-full flex flex-col flex-grow relative">
            <div className="mt-[7vh] mb-[7vh]">
              <h1 className="text-[14vw] text-shadow-FF9443 text-[#4ACEFF] font-bold">Scene Hunter</h1>
              <p className="text-[5vw] text-[#4CAF50] font-bold">Spot the Image from the Clues!</p>
            </div>

            <div id="buttons" className="flex flex-col items-center justify-center mt-[2vh]">
              <button className="block w-[50%] h-[9vh] lg:h-[9vh] text-[8vw] text-[#E7E7E7] font-bold bg-[#003B5C] rounded-[0.2em] mt-[3vh] mb-[3vh]" onClick={handleCreateClick}>
                {language === 'jp' ? '作成' : 'Create'}
              </button>
              <button className="block w-[50%] h-[9vh] lg:h-[9vh] text-[8vw] text-[#E7E7E7] font-bold bg-[#003B5C] rounded-[0.2em] mt-[3vh] mb-[3vh]" onClick={handleJoinClick}>
                {language === 'jp' ? '参加' : 'Join'}
              </button>
            </div>    

            <div className="flex w-full justify-end items-end absolute bottom-0 right-0 mr-[5vh] mb-[5vh]"> 
              <button
                id="dropdown-button"
                class="flex items-center justify-between h-[4vh] border-[0.5vw] border-[#333333] rounded-[2vw] bg-[#FFFFFF] text-gray-700"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <div className="text-[2vh] mx-[5vw] text-[#333333]">Language</div>
                <span class={isDropdownOpen ? "icon-[fe--arrow-up] mr-[3vw]" 
                                            : "icon-[fe--arrow-down] mr-[3vw]"}></span>
              </button>

              {isDropdownOpen && (
                <div class="absolute right-0 top-[100%] mt-[0.5vh] w-48 origin-top-right bg-white divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div class=" border-[0.5vw] border-[#333333] rounded-[2vw] ">
                    <button class="block px-4 py-2 text-[2vh] text-gray-700" onClick={() => {setLanguage('jp'); setIsDropdownOpen(false);}}>
                      日本語
                    </button>
                    <button class="block px-4 py-2 text-[2vh] text-gray-700" onClick={() => {setLanguage('en'); setIsDropdownOpen(false);}}>
                      English
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <footer className="flex justify-center items-center w-full h-[13vh] bg-[#4ACEFF] bg-opacity-35">
            <p className="text-[4vw]">© 2024 Scene Hunter</p>
          </footer>
          <Modal
            isOpen={showCreateInput}
            title={language === 'jp' ? '部屋を作成' : 'Create Room'}
            onClose={() => setShowCreateInput(false)}
          >
            <input
              className="text-center text-[5vw] border-[0.5vw] border-[#333333] rounded-[2vw] px-[3vw] py-[3vw] my-[5vw]"
              type="text"
              value={playerName}
              onChange={handleCreateInputChange}
              placeholder={language === 'jp' ? 'プレイヤー名を入力' : 'Enter Player Name'}
            />
          <button className="my-[5vw] px-[10vw] py-[2vw] bg-[#003B5C] text-[5vw] text-white rounded indent-[5vw] tracking-[5vw]" onClick={handleEnterPlayerName}>
            {language === 'jp' ? '作成' : 'Create'}
          </button>
          <button className="my-[5vw] px-[10vw] py-[2vw] bg-[#003B5C] text-[5vw] text-white rounded indent-[5vw] tracking-[5vw]" onClick={handleGoBack}>
            {language === 'jp' ? '戻る' : 'Back'}
          </button>
          </Modal>

          <Modal
            isOpen={showJoinInput}
            title={language === 'jp' ? '部屋に参加' : 'Join Room'}
            onClose={() => setShowJoinInput(false)}
          >
            <input
              className="text-center text-[5vw] border-[0.5vw] border-[#333333] rounded-[2vw] px-[3vw] py-[3vw] my-[2vw]"
              type="text"
              value={playerName}
              onChange={handleCreateInputChange}
              placeholder={language === 'jp' ? 'プレイヤー名を入力' : 'Enter player name'}
            />
            <input
              className="text-center text-[5vw] border-[0.5vw] border-[#333333] rounded-[2vw] px-[3vw] py-[3vw] my-[2vw]"
              type="text"
              value={roomNumber}
              onChange={handleJoinInputChange}
              placeholder={language === 'jp' ? '部屋番号を入力' : 'Enter Room Number'}
            />
            <button className="my-[5vw] px-[10vw] py-[2vw] bg-[#003B5C] text-[5vw] text-white rounded indent-[5vw] tracking-[5vw]" onClick={handleEnterRoom}>
              {language === 'jp' ? '参加' : 'Join'}
            </button>
            <button className="my-[5vw] px-[10vw] py-[2vw] bg-[#003B5C] text-[5vw] text-white rounded indent-[5vw] tracking-[5vw]" onClick={handleGoBack}>
              {language === 'jp' ? '戻る' : 'Back'}
            </button>
          </Modal>
        </>
      ) : (
        <GameScreen
          apiUrl={apiUrl}
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
