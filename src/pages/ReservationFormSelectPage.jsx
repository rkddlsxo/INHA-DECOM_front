import React from 'react';
import './ReservationFormSelectPage.css';

const reservationFormSelectPage = ({ onNavigate }) => {
    return (
        <div className="reservationFormSelect-container">
            <header>
                <h1 className="text-4xl font-bold mb-2">학교 시설물 관리 시스템</h1>
                <h2 className="reservationFormSelect-heading">예약 방식 선택</h2>
                <p className="reservationFormSelect-subheading">원하는 예약 방식을 선택하세요.</p>
            </header>

            <div className="absolute top-4 left-4">
                <button
                    onClick={() => onNavigate('reservation')}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition z-10"
                >
                    ← 뒤로
                </button>
            </div>

            <div className="reservationFormSelect-section" style={{ backgroundColor: '#e9f7ff' }}>
                <button onClick={() => onNavigate('timeFocusSelect')} id="btn-timeFocused" className="large-button">
                    시간 먼저 선택
                </button>
            </div>

            <div className="reservationFormSelect-section" style={{ backgroundColor: '#e9fff1' }}>
                <button onClick={() => onNavigate('placeFocusSelect')} id="btn-spaceFocused" className="large-button">
                    공간 먼저 선택
                </button>
            </div>
        </div>
    );
};

export default reservationFormSelectPage;
