import React from 'react';
import './Mainpage.css';
import { BsCalendarPlus, BsCalendarWeek, BsCheck2Square, BsExclamationTriangle } from 'react-icons/bs';

const MainPages = ({ onNavigate }) => {

  const handleSectionClick = (page) => {
    onNavigate(page);
  };

  return (
    <div className="facility-menu-wrapper">

      <header className="main-page-header">
        <h1 className="main-page-title">
          시설 예약 메뉴
        </h1>
        <p className="main-page-welcome">
          원하는 예약 관련 서비스를 선택하세요.
        </p>
      </header>

      <main className="menu-card-grid">

        {/* 1. '신규 예약하기' (최상단 Hero 버튼) */}
        <div
          className="reservation-section section-reserve-hero"
          onClick={() => handleSectionClick('reservationFormSelectPage')}
        >
          <button className="menu-button">
            <div className="menu-icon-wrapper">
              <BsCalendarPlus size={40} />
            </div>
            <span className="menu-text">신규 예약하기</span>
            <p className="menu-description">
              가장 빠른 방법으로 새로운 예약을 진행합니다.
            </p>
          </button>
        </div>

        {/* 2. '월별 현황 보기' (하단 1/3) */}
        <div
          // ⭐️ [수정] 고유 클래스(section-calendar-toggle)를 다시 추가합니다.
          className="reservation-section section-secondary section-calendar-toggle"
          onClick={() => handleSectionClick('monthlyCalendarPage')}
        >
          <button className="menu-button">
            <div className="menu-icon-wrapper">
              <BsCalendarWeek size={38} />
            </div>
            <span className="menu-text">월별 현황 보기</span>
            <p className="menu-description">
              장소별 예약 포화도를 확인합니다.
            </p>
          </button>
        </div>

        {/* 3. '예약 내역/수정' (하단 2/3) */}
        <div
          // ⭐️ [수정] 고유 클래스(section-history)를 다시 추가합니다.
          className="reservation-section section-secondary section-history"
          onClick={() => handleSectionClick('bookingHistory')}
        >
          <button className="menu-button">
            <div className="menu-icon-wrapper">
              <BsCheck2Square size={38} />
            </div>
            <span className="menu-text">예약 내역 / 수정</span>
            <p className="menu-description">
              나의 예약 현황을 조회 및 변경합니다.
            </p>
          </button>
        </div>

        {/* 4. '불편 사항 접수' (하단 3/3) */}
        <div
          className="reservation-section section-secondary section-complaint"
          onClick={() => handleSectionClick('complaintMenuPage')}
        >
          <button className="menu-button">
            <div className="menu-icon-wrapper">
              <BsExclamationTriangle size={38} />
            </div>
            <span className="menu-text">불편 사항 접수</span>
            <p className="menu-description">
              시설 및 시스템 불편 사항을 접수합니다.
            </p>
          </button>
        </div>

      </main>
    </div>
  );
};

export default MainPages;