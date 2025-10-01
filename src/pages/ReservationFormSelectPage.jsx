import React from 'react';
import './ReservationFormSelectPage.css';

const ReservationFormSelectPage = ({ onNavigate }) => {
    return (
        <div className="reservationFormSelect-container">
            <div className="absolute top-4 left-4">
                <button
                    onClick={() => onNavigate('reservation')}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition z-10"
                >
                    ← 뒤로
                </button>
            </div>
            <div className="reservationFormSelect-section" style={{ backgroundColor: '#e9f7ff' }}>
                <button onClick={() => onNavigate('reservationFormSelect')} id="btn-reserve" className="large-button">
                    시간 먼저 선택
                </button>
            </div>
            <div className="reservationFormSelect-section" style={{ backgroundColor: '#e9fff1' }}>
                <button onClick={() => onNavigate('history')} id="btn-history" className="large-button">
                    공간 먼저 선택
                </button>
            </div>
        </div>
    );
};

export default ReservationFormSelectPage;