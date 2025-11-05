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

//url 분석 (무조건 main page로 가지 않게 하기 위함) & login이 매 새로고침마다 풀리는 문제 해결
const getInitialState = () => {
  const path = window.location.pathname;
  // 1. 함수 안에서 토큰 존재 여부를 확인
  const tokenExists = !!localStorage.getItem('authToken');

  // 2. QR 스캔 경로 확인
  if (path.startsWith('/qr-check-in/')) {
    const spaceId = path.split('/')[2];
    if (spaceId) {
      return {
        initialPage: 'qrCheckIn',
        initialSpaceId: spaceId
      };
    }
  }

  // QR 스캔이 아닐 경우, 토큰 여부로 분기
  if (tokenExists) {
    // 토큰이 있으면 'main' 페이지로
    return { initialPage: 'main', initialSpaceId: null };
  } else {
    // 토큰이 없으면 'loginPage'로
    return { initialPage: 'loginPage', initialSpaceId: null };
  }
};


function App() {
  const { initialPage, initialSpaceId } = getInitialState();

  const [page, setPage] = useState(initialPage);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('authToken')); //login이 매 새로고침마다 풀리는 문제 해결
  const [currentSpaceId, setCurrentSpaceId] = useState(initialSpaceId);


  const renderPage = () => {
    if (page === 'qrCheckIn' && !isLoggedIn) { //strict mode render 방지
      return <LoginPage onNavigate={setPage} handleLogin={handleLoginSuccess} />;
    }
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
        return <LoginPage onNavigate={setPage} />;
    }


  };
  const handleLoginSuccess = (status) => {
    setIsLoggedIn(status);
    if (initialPage === 'qrCheckIn' && initialSpaceId) {
      setPage('qrCheckIn');
    } else {
      setPage('main');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg">
        {renderPage()}
      </div>
    </div>
  );
}

export default App;