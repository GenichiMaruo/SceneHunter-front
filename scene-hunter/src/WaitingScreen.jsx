import React from 'react';
import './main.css';

function WaitingScreen({ language, isGameMaster }) {
  return (
    <div className="w-full h-100svh min-h-[100svh] flex flex-col items-center justify-center text-center overflow-hidden">
      <header className="w-full h-[13svh] bg-[#4ACEFF] bg-opacity-35"></header>
      <div className="w-full flex flex-col flex-grow relative bg-[#E7E7E7]">
        <div className="mt-[7svh] mb-[7svh]"> {/* title */}
          <h1 className="text-[14svw] text-shadow-FF9443 text-[#4ACEFF] font-bold">Scene Hunter</h1>
          <p className="text-[5svw] text-[#4CAF50] font-bold">Spot the Image from the Clues!</p>
        </div>
        <div className="w-full px-[20svw] mb-[5svh] text-[5svh] text-[#FF9443] font-bold">
          <div className="">
            {language === 'jp' ? 'しばらくお待ちください...' : 'Waiting for Capture...'}
          </div>
        </div>
        <div className="flex justify-center" aria-label="読み込み中">
          <div className="animate-spin h-[20svw] w-[20svw] border-[1svh] border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      </div>
      <footer className="flex justify-center items-center w-full h-[13svh] bg-[#4ACEFF] bg-opacity-35">
        <p className="text-[4svw]">© 2024 Scene Hunter</p>
      </footer>
    </div>
  );
}

export default WaitingScreen;
