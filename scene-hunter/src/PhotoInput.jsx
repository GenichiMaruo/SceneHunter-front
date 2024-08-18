import React, { useState, useRef, useEffect } from 'react';
import './PhotoInput.css';

function PhotoInput({ apiUrl, language, roomId, userId, isGameMaster, setIsAlreadyTaken, onComplete }) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState(null);
  const [useFrontCamera, setUseFrontCamera] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 360,
          height: 640,
          facingMode: useFrontCamera ? "user" : "environment"
        },
      });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      setError(null); // Clear any existing errors
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
    const context = canvasRef.current.getContext('2d');

    // 動的に縦横比を取得し、反転
    const videoWidth = videoRef.current.videoWidth;
    const videoHeight = videoRef.current.videoHeight;

    canvasRef.current.width = videoHeight; // 縦横反転
    canvasRef.current.height = videoWidth;

    context.save();
    context.translate(canvasRef.current.width / 2, canvasRef.current.height / 2);
    context.rotate(90 * Math.PI / 180);
    context.drawImage(videoRef.current, -videoWidth / 2, -videoHeight / 2, videoWidth, videoHeight);
    context.restore();

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
    const context = canvasRef.current.getContext('2d');
    const videoWidth = videoRef.current.videoWidth;
    const videoHeight = videoRef.current.videoHeight;

    canvasRef.current.width = videoHeight;
    canvasRef.current.height = videoWidth;

    context.save();
    context.translate(canvasRef.current.width / 2, canvasRef.current.height / 2);
    context.rotate(90 * Math.PI / 180);
    context.drawImage(videoRef.current, -videoWidth / 2, -videoHeight / 2, videoWidth, videoHeight);
    context.restore();

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
      const blob = await (await fetch(dataUrl)).blob();
      const formData = new FormData();
      formData.append('user_id', userId);
      formData.append('image', blob);

      const response = await fetch(`${apiUrl}/upload_photo?room_id=${roomId}`, {
        method: 'POST',
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

  return (
    <div className="PhotoInput">
      {error && <div className="PhotoInput-error">{error}</div>}
      {error && (
        <button onClick={startVideo}>
          {language === 'jp' ? '権限取得を再試行する' : 'Retry Permission'}
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
            {language === 'jp' ? '写真を撮る' : 'Capture Photo'}
          </button>
          <button onClick={switchCamera}>
            {language === 'jp' ? 'カメラを切り替える' : 'Switch Camera'}
          </button>
        </>
      )}
      {isCapturing && (
        <div className="PhotoInput-overlay">
          {language === 'jp' ? '撮影中は動かさないでください' : 'Please do not move during capture'}
        </div>
      )}
    </div>
  );
}

export default PhotoInput;
