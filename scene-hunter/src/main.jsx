import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

function RouterApp() {
  const location = useLocation();
  const path = location.pathname;

  // ルート判定ロジック
  if (path === '/') {
    return <App />;
  } else if (/^\/\d{6}\/?$/.test(path)) {
    const roomId = path.match(/\d{6}/)[0];
    return <App roomId={roomId} />;
  }

  // それ以外のパスの場合の処理 (404 ページなど)
  return <div>Page not found</div>;
}

function Root() {
  return (
    <Router>
      <RouterApp />
    </Router>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
