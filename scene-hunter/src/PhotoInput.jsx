import React, { useState, useRef, useEffect } from 'react';
import './PhotoInput.css';

function PhotoInput({ token, apiUrl, language, roomId, userId, isGameMaster, setIsAlreadyTaken, onComplete }) {
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
          width: 360,
          height: 640,
          facingMode: useFrontCamera ? 'user' : 'environment',
        },
      });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      setError(null);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError(language === 'ja' ? 'カメラにアクセスできませんでした。権限を確認してください。' : 'Could not access the camera. Please check permissions.');
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
    const dataUrl = canvasRef.current.toDataURL('image/jaeg');
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
    const dataUrl = canvasRef.current.toDataURL('image/jaeg');
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
      const response = await fetch(`${apiUrl}/game/description`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDescription(language === 'ja' ? data.ja : data.en);
        setIsModalOpen(true);
      } else {
        console.error('Error fetching description');
      }
    } catch (error) {
      console.error('Error fetching description:', error);
    }
  };

  return (
    <div className="PhotoInput">
      {error && <div className="PhotoInput-error">{error}</div>}
      {error && (
        <button onClick={startVideo}>
          {language === 'ja' ? '権限取得を再試行する' : 'Retry Permission'}
        </button>
      )}
      <video
        ref={videoRef}
        className={`PhotoInput-video ${isCapturing ? 'capturing' : ''}`}
        autoPlay
        muted
        loop
        playsInline
        style={{ display: error ? 'none' : 'block' }}
      />
      <canvas ref={canvasRef} className="PhotoInput-canvas" />
      {!isCapturing && !error && (
        <>
          <button onClick={startCapture}>
            {language === 'ja' ? '写真を撮る' : 'Capture Photo'}
          </button>
          <button onClick={switchCamera}>
            {language === 'ja' ? 'カメラを切り替える' : 'Switch Camera'}
          </button>
          {!isGameMaster && (
            <button onClick={fetchDescription}>
              {language === 'ja' ? '写真の説明を見る' : 'View Photo Description'}
            </button>
          )}
        </>
      )}
      {isCapturing && (
        <div className="PhotoInput-overlay">
          {language === 'ja' ? '撮影中は動かさないでください' : 'Please do not move during capture'}
        </div>
      )}
      {isModalOpen && (
        <div className="PhotoInput-modal">
          <div className="PhotoInput-modal-content">
            <h2>{language === 'ja' ? '写真の説明' : 'Photo Description'}</h2>
            <ul>
              {description.map((line, index) => (
                <li key={index}>{line}</li>
              ))}
            </ul>
            <button onClick={() => setIsModalOpen(false)}>
              {language === 'ja' ? '閉じる' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PhotoInput;
