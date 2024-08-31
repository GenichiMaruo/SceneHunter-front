import React, { useState, useRef, useEffect } from 'react';
import Modal from './Modal';
import './main.css';

function PhotoInput({ isDemo, token, apiUrl, language, roomId, userId, isGameMaster, setIsAlreadyTaken, onComplete }) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState(null);
  const [useFrontCamera, setUseFrontCamera] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [description, setDescription] = useState([]);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 720,
          height: 720,
          facingMode: useFrontCamera ? 'user' : 'environment',
        },
      });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      setError(null);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError(language === 'jp' ? 'カメラにアクセスできませんでした。権限を確認してください。' : 'Could not access the camera. Please check permissions.');
    }
  };

  useEffect(() => {
    startVideo();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, [useFrontCamera]);

  const switchCamera = () => {
    setUseFrontCamera(prevState => !prevState);
  };

  const startCapture = () => {
    setIsCapturing(true);
    setTimeout(() => {
      capturePhoto();
    }, 2000);
  };

  const capturePhoto = async () => {
    if (!canvasRef.current || !videoRef.current) return;

    const videoAspectRatio = videoRef.current.videoWidth / videoRef.current.videoHeight;
    const canvasWidth = videoAspectRatio > 1 ? 1280 : 720;
    const canvasHeight = videoAspectRatio > 1 ? 720 : 1280;

    canvasRef.current.width = canvasWidth;
    canvasRef.current.height = canvasHeight;
    const context = canvasRef.current.getContext('2d');

    context.drawImage(videoRef.current, 0, 0, canvasWidth, canvasHeight);
    const dataUrl = canvasRef.current.toDataURL('image/jpeg');
    await uploadPhoto(dataUrl);

    if (isGameMaster) {
      finishCapture();
    } else {
      setTimeout(() => {
        captureSecondPhoto();
      }, 2000);
    }
  };

  const captureSecondPhoto = async () => {
    if (!canvasRef.current || !videoRef.current) return;

    const videoAspectRatio = videoRef.current.videoWidth / videoRef.current.videoHeight;
    const canvasWidth = videoAspectRatio > 1 ? 1280 : 720;
    const canvasHeight = videoAspectRatio > 1 ? 720 : 1280;

    canvasRef.current.width = canvasWidth;
    canvasRef.current.height = canvasHeight;
    const context = canvasRef.current.getContext('2d');

    context.drawImage(videoRef.current, 0, 0, canvasWidth, canvasHeight);
    const dataUrl = canvasRef.current.toDataURL('image/jpeg');
    await uploadPhoto(dataUrl);

    finishCapture();
  };

  const finishCapture = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setIsCapturing(false);
    setIsAlreadyTaken(true);
    onComplete();
  };

  const uploadPhoto = async (dataUrl) => {
    try {
      if (isDemo) return;
      const blob = await (await fetch(dataUrl)).blob();
      const formData = new FormData();
      formData.append('user_id', userId);
      formData.append('image', blob);

      const response = await fetch(`${apiUrl}/game/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error uploading photo:', errorData.message);
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
    }
  };

  const fetchDescription = async () => {
    try {
      if (isDemo) {
        setDescription(['This is a description of the scene.', 'It is a very interesting scene.', 'You should take a photo of it.']);
        setIsModalOpen(true);
        return
      }
      const response = await fetch(`${apiUrl}/game/description`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDescription(language === 'jp' ? data.ja : data.en);
        setIsModalOpen(true);
      } else {
        console.error('Error fetching description');
      }
    } catch (error) {
      console.error('Error fetching description:', error);
    }
  };

  return (
    <div className="w-full h-100svh min-h-[100svh] flex flex-col items-center justify-center text-center overflow-hidden">
      <header className="w-full h-[13svh] bg-[#4ACEFF] bg-opacity-35"></header>
      <div> {/* camera area */}

      </div>
      <div> {/* capture button */}

      </div>
      <div className="w-full h-full flex flex-col flex-grow relative items-center bg-[#E7E7E7]">
        <div className="top-0 my-[2svh] text-[#4CAF50] text-[5svh] font-bold">Capture the Scene!!</div>
        {error && <div className="">{error}</div>}
        {error && (
          <button onClick={startVideo}>
            {language === 'jp' ? '権限取得を再試行する' : 'Retry Permission'}
          </button>
        )}
        <div className="">
          <video
            ref={videoRef}
            className="w-[80svw] lg:w-[60svw] flex items-center justify-center"
            autoPlay
            muted
            loop
            playsInline
            style={{ display: error ? 'none' : 'block' }}
          />
        </div>


        <canvas ref={canvasRef} className="hidden" />

        {!isCapturing && !error && (
          <div className="h-[16svh] w-full flex flex-col flex-grow items-center justify-center">
            <div className="w-full flex items-center justify-center">
              <button className="flex item-center justify-center w-[60svw] px-[15svw] py-[1svh] my-[1svw] bg-[#003B5C] text-[#E7E7E7] rounded-[2svw]" onClick={startCapture}>
                <span className="icon-[iconoir--camera] text-[3svh]"></span>
                <div className="text-[2svh] ">{language === 'jp' ? '写真を撮る' : 'Capture'}</div>
              </button>
              <button className="absolute right-0 flex items-center justify-center" onClick={switchCamera}>
                <span className="icon-[ic--outline-cameraswitch] text-[8svw] mx-[5svw]"></span>
              </button>
            </div>

            {!isGameMaster && (
              <button
                className="flex item-center justify-center text-[2svh] w-[60svw] px-[15svw] py-[1svh] my-[1svw] bg-[#003B5C] text-[#E7E7E7] rounded-[2svw]"
                onClick={fetchDescription}
              >
                {language === 'jp' ? '写真の説明' : 'Photo Description'}
              </button>
            )}
          </div>
        )}

        {isCapturing && (
          <div className="text-[2svh]">
            {language === 'jp' ? '撮影中は動かさないでください' : 'Please do not move during capture'}
          </div>
        )}

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          backgroundColor={'#E7E7E7'}
        >
          <div className="flex items-start justify-start">
            {description && description.length > 0 && (
              <ul className="text-[4svw] ">
                {description.map((line, index) => (
                  <div className="flex border-b-[0.5svh] border-[#333333]">
                    <div className="mr-[1svw]">{index + 1}.</div>
                    <li className="text-left" key={index}>{line}</li>
                  </div>
                ))}
              </ul>
            )}
          </div>
        </Modal>
      </div>
      <footer className="flex justify-center items-center w-full h-[13svh] bg-[#4ACEFF] bg-opacity-35">
        <p className="text-[4svw]">© 2024 Scene Hunter</p>
      </footer>
    </div>
  );
}

export default PhotoInput;
