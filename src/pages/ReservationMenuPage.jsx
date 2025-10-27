import React from 'react';
import './ReservationMenuPage.css';

const ReservationMenuPage = ({ onNavigate }) => {
  return (
    <div className="reservation-container">
      <div className="absolute top-4 left-4">
        <button
          onClick={() => onNavigate('main')}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition z-10"
        >
          ← 메인으로
        </button>
      </div>
      <div className="reservation-section" style={{ backgroundColor: '#e9f7ff' }}>
        <button onClick={() => onNavigate('reservationFormSelect')} id="btn-reserve" className="large-button">
          예약하기
        </button>
      </div>
      <div className="reservation-section" style={{ backgroundColor: '#e9fff1' }}>
        <button onClick={() => onNavigate('bookingHistory')} id="btn-history" className="large-button">
          예약내역
        </button>
      </div>
      <div className="reservation-section" style={{ backgroundColor: '#fff0f0' }}>
        <button onClick={() => onNavigate('complaint')} id="btn-complaint" className="large-button">
          민원
        </button>
      </div>
    </div>
  );
};

export default ReservationMenuPage;
