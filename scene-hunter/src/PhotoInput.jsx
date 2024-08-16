import React, { useState, useRef, useEffect } from 'react';
import './PhotoInput.css';

function PhotoInput({ language, roomId, userId, onComplete }) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 360, // Lower resolution for fallback
          height: 640, // Lower resolution for fallback
          facingMode: "user" // Use front camera
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
  }, []);

  const startCapture = () => {
    setIsCapturing(true);
    setTimeout(() => {
      capturePhoto();
    }, 2000);
  };

  const capturePhoto = async () => {
    if (!canvasRef.current || !videoRef.current) return;

    const context = canvasRef.current.getContext('2d');
    canvasRef.current.width = 720; // Portrait width
    canvasRef.current.height = 1280; // Portrait height

    // Upscale and rotate the context to capture in portrait mode
    context.translate(720, 0);
    context.rotate(90 * Math.PI / 180);
    context.drawImage(videoRef.current, 0, 0, 360, 640, 0, 0, 1280, 720); // Upscale to 720x1280

    const dataUrl = canvasRef.current.toDataURL('image/jpeg');
    await uploadPhoto(dataUrl);

    setTimeout(() => {
      captureSecondPhoto();
    }, 2000);
  };

  const captureSecondPhoto = async () => {
    if (!canvasRef.current || !videoRef.current) return;

    const context = canvasRef.current.getContext('2d');
    context.translate(720, 0);
    context.rotate(90 * Math.PI / 180);
    context.drawImage(videoRef.current, 0, 0, 360, 640, 0, 0, 1280, 720); // Upscale to 720x1280

    const dataUrl = canvasRef.current.toDataURL('image/jpeg');
    await uploadPhoto(dataUrl);

    videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    setIsCapturing(false);
    onComplete();
  };

  const uploadPhoto = async (dataUrl) => {
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const formData = new FormData();
      formData.append('user_id', userId);
      formData.append('image', blob);

      const response = await fetch(`https://sh.yashikota.com/api/upload_photo?room_id=${roomId}`, {
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
      {error && <div className="PhotoInput-error">{error}</div>} {/* Display error message */}
      {error && (
        <button onClick={startVideo}>
          {language === 'jp' ? '権限取得を再試行する' : 'Retry Permission'}
        </button>
      )}
      <video
        ref={videoRef}
        className={`PhotoInput-video ${isCapturing ? 'capturing' : ''}`}
        style={{ display: error ? 'none' : 'block' }} // Hide video if error
      />
      <canvas ref={canvasRef} className="PhotoInput-canvas" style={{ display: 'none' }} />
      {!isCapturing && !error && (
        <button onClick={startCapture}>
          {language === 'jp' ? '写真を撮る' : 'Capture Photo'}
        </button>
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
