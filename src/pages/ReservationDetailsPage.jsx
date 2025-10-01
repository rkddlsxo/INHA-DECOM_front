import React from "react";
import './ReservationDetailsPage.css';

const ReservationDetailsPage = ({ onNavigate }) => {
    return (
        <div className="reservationDetails-container">
            <div className="absolute top-4 left-4">
                <button
                    onClick={() => onNavigate('placeFocusSelect')}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition z-10"
                >
                    ← 뒤로
                </button>
            </div>
            <div className="details-section" style={{ backgroundColor: '#f0f4f8' }}>
                <h2 className="text-2xl font-bold mb-4">예약 상세 정보</h2>
                <p className="mb-2">시설명: 강의실 A</p>
                <p className="mb-2">예약자: 홍길동</p>
                <p className="mb-2">날짜: 2024-07-01</p>
                <p className="mb-2">시간: 10:00 - 12:00</p>
                <p className="mb-2">목적: 스터디 모임</p>
                <button className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
                    예약 취소