import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

/**
 * React 애플리케이션을 DOM에 렌더링하는 진입점 함수입니다.
 */
createRoot(document.getElementById('root')).render(
  // 애플리케이션의 개발 환경에서 잠재적인 문제를 감지하고 경고하는 래퍼 컴포넌트
  <StrictMode>
    {/* 애플리케이션의 최상위 컴포넌트 */}
    <App />
  </StrictMode>,
)