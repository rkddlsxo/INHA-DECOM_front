import React, { useState } from 'react';
import MainPage from './pages/MainPages';
import ReservationMenuPage from './pages/ReservationMenuPage';
import ReservationFormSelectPage from './pages/ReservationFormSelectPage';
import PlaceFocusSelectPage from './pages/PlaceFocusSelectPage';
import ReservationDetailsPage from './pages/ReservationDetailsPage';
function App() {
  const [page, setPage] = useState('main');

  const renderPage = () => {
    switch (page) {
      case 'main':
        return <MainPage onNavigate={setPage} />;
      case 'reservation':
        return <ReservationMenuPage onNavigate={setPage} />;
      case 'reservationFormSelect':
        return <ReservationFormSelectPage onNavigate={setPage} />;
      case 'placeFocusSelect':
        return <PlaceFocusSelectPage onNavigate={setPage} />;
      case 'ReservationDetailsPage':
        return <ReservationDetailsPage onNavigate={setPage} />;
      default:
        return <MainPage onNavigate={setPage} />;
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