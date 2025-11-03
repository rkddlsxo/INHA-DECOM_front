import React, { useState } from 'react';
import MainPage from './pages/MainPages';
import ReservationMenuPage from './pages/ReservationMenuPage';
import ReservationFormSelectPage from './pages/ReservationFormSelectPage';
import PlaceFocusSelectPage from './pages/PlaceFocusSelectPage';
import ReservationDetailsPage from './pages/ReservationDetailsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BookingHistoryPage from './pages/BookingHistoryPage';
import TimeFocusSelectPage from './pages/TimeFocusSelectPage';
import SimultaneousSelectPage from './pages/SimultaneousSelectPage';
import ComplaintPage from './pages/ComplaintPage';
function App() {
  const [page, setPage] = useState('loginPage');
  const [isLoggedIn, setIsLoggedIn] = useState(false);// 로그인 상태 관리


  const renderPage = () => {
    switch (page) {
      case 'main':
        return <MainPage onNavigate={setPage} />;
      case 'reservation':
        return <ReservationMenuPage onNavigate={setPage} />;
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
      case 'simultaneousSelectPage':
        return <SimultaneousSelectPage onNavigate={setPage} />;
      case 'complaintPage':
        return <ComplaintPage onNavigate={setPage} />;
      default:
        return <MainPage onNavigate={setPage} />;
    }


  };
  const handleLoginSuccess = (status) => {
    setIsLoggedIn(status); // 로그인 상태 업데이트
    setPage('main');       // ★ 'navigate' 대신 'setPage'를 사용하여 페이지 전환
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