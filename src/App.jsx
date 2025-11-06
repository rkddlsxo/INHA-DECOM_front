import React, { useState } from 'react';
import MainPage from './pages/MainPages';
import ReservationFormSelectPage from './pages/ReservationFormSelectPage';
import PlaceFocusSelectPage from './pages/PlaceFocusSelectPage';
import ReservationDetailsPage from './pages/ReservationDetailsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BookingHistoryPage from './pages/BookingHistoryPage';
import TimeFocusSelectPage from './pages/TimeFocusSelectPage';
import QrCheckInPage from './pages/QrCheckInPage';
import SimultaneousSelectPage from './pages/SimultaneousSelectPage';
import ComplaintPage from './pages/ComplaintPage';
import ComplaintMenuPage from './pages/ComplaintMenuPage';
import ComplaintHistoryPage from './pages/ComplaintHistoryPage';
import MonthlyCalendarPage from './pages/MonthlyCalendarPage';

/**
 * 애플리케이션 초기 상태(시작 페이지 및 QR ID)를 결정하는 함수입니다.
 * URL 경로 및 인증 토큰 존재 여부를 확인합니다.
 * @returns {object} { initialPage: string, initialSpaceId: string|null }
 */
const getInitialState = () => {
  const path = window.location.pathname;
  // LocalStorage에 인증 토큰이 있는지 확인
  const tokenExists = !!localStorage.getItem('authToken');

  // 1. QR 스캔 경로 확인 (/qr-check-in/...)
  if (path.startsWith('/qr-check-in/')) {
    const spaceId = path.split('/')[2];
    if (spaceId) {
      return {
        initialPage: 'qrCheckIn',
        initialSpaceId: spaceId
      };
    }
  }

  // 2. 일반 경로 접근 시, 토큰 존재 여부로 초기 페이지 결정
  if (tokenExists) {
    // 토큰이 있으면 'main' 페이지로
    return { initialPage: 'main', initialSpaceId: null };
  } else {
    // 토큰이 없으면 'loginPage'로
    return { initialPage: 'loginPage', initialSpaceId: null };
  }
};


/**
 * 애플리케이션의 메인 라우터 역할을 하는 컴포넌트입니다.
 */
function App() {
  // 초기 URL 경로 및 토큰 기반으로 초기 상태 설정
  const { initialPage, initialSpaceId } = getInitialState();

  // 현재 페이지 상태
  const [page, setPage] = useState(initialPage);
  // 로그인 상태 (토큰 유무로 초기화)
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('authToken'));
  // QR 체크인 시 사용되는 공간 ID
  const [currentSpaceId, setCurrentSpaceId] = useState(initialSpaceId);


  /**
   * 현재 page 상태에 따라 해당하는 컴포넌트를 렌더링합니다.
   * @returns {JSX.Element} 현재 페이지 컴포넌트
   */
  const renderPage = () => {
    // QR 체크인 페이지 접근 시, 로그인이 되어있지 않으면 로그인 페이지를 먼저 표시 (Strict Mode 대비)
    if (page === 'qrCheckIn' && !isLoggedIn) {
      // 로그인 성공 후 QR 체크인 페이지로 돌아가도록 설정됨
      return <LoginPage onNavigate={setPage} handleLogin={handleLoginSuccess} />;
    }

    // 페이지 상태에 따른 컴포넌트 라우팅
    switch (page) {
      case 'main':
        return <MainPage onNavigate={setPage} />;
      case 'reservationFormSelectPage':
        return <ReservationFormSelectPage onNavigate={setPage} />;
      case 'placeFocusSelectPage':
        return <PlaceFocusSelectPage onNavigate={setPage} />;
      case 'reservationDetailsPage':
        return <ReservationDetailsPage onNavigate={setPage} />;
      case 'loginPage':
        return <LoginPage onNavigate={setPage} handleLogin={handleLoginSuccess} />;
      case 'registerPage':
        return <RegisterPage onNavigate={setPage} />;
      case 'bookingHistory':
        return <BookingHistoryPage onNavigate={setPage} />;
      case 'timeFocusSelectPage':
        return <TimeFocusSelectPage onNavigate={setPage} />;
      case 'qrCheckIn':
        // QR 체크인 페이지에 공간 ID 전달
        return <QrCheckInPage onNavigate={setPage} spaceId={currentSpaceId} />;
      case 'simultaneousSelectPage':
        return <SimultaneousSelectPage onNavigate={setPage} />;
      case 'complaintPage':
        return <ComplaintPage onNavigate={setPage} />;
      case 'complaintMenuPage':
        return <ComplaintMenuPage onNavigate={setPage} />
      case 'complaintHistoryPage':
        return <ComplaintHistoryPage onNavigate={setPage} />
      case 'monthlyCalendarPage':
        return <MonthlyCalendarPage onNavigate={setPage} />;
      default:
        // 정의되지 않은 페이지 경로일 경우 로그인 페이지로 리디렉션
        return <LoginPage onNavigate={setPage} handleLogin={handleLoginSuccess} />;
    }
  };

  /**
   * 로그인 성공 시 호출되는 핸들러입니다.
   * 로그인 상태를 업데이트하고, 초기 페이지가 QR 체크인이었으면 해당 페이지로 이동시킵니다.
   * @param {boolean} status - 로그인 성공 여부 (true)
   */
  const handleLoginSuccess = (status) => {
    setIsLoggedIn(status);
    // 초기 진입 경로가 QR 체크인이었다면, 로그인 후 QR 체크인 페이지로 이동
    if (initialPage === 'qrCheckIn' && initialSpaceId) {
      setPage('qrCheckIn');
    } else {
      // 일반적인 로그인 성공 시 메인 페이지로 이동
      setPage('main');
    }
  };

  return (
    // 전체 화면 레이아웃
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      {/* 컨텐츠 영역 (최대 너비 4xl) */}
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg">
        {renderPage()}
      </div>
    </div>
  );
}

export default App;