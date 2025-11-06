import React from 'react';
import './Mainpage.css';
import { BsCalendarPlus, BsCalendarWeek, BsCheck2Square, BsExclamationTriangle } from 'react-icons/bs';

/**
 * 시설 예약 및 관련 서비스를 선택하는 메인 메뉴 컴포넌트입니다.
 * @param {object} props - 컴포넌트 속성
 * @param {function} props.onNavigate - 페이지 이동을 처리하는 함수
 */
const MainPages = ({ onNavigate }) => {

  /**
   * 메뉴 항목 클릭 시 지정된 페이지로 이동을 요청합니다.
   * @param {string} page - 이동할 페이지의 이름 (예: 'reservationFormSelectPage')
   */
  const handleSectionClick = (page) => {
    onNavigate(page);
  };

  return (
    // 전체 레이아웃 컨테이너
    <div className="facility-menu-wrapper">

      {/* 페이지 헤더 (제목 및 환영 메시지) */}
      <header className="main-page-header">
        <h1 className="main-page-title">
          시설 예약 메뉴
        </h1>
        <p className="main-page-welcome">
          원하는 예약 관련 서비스를 선택하세요.
        </p>
      </header>

      {/* 카드 메뉴를 담는 그리드 레이아웃 컨테이너 */}
      <main className="menu-card-grid">

        {/* 1. '신규 예약하기' 카드 (메인 버튼 역할) */}
        <div
          className="reservation-section section-reserve-hero"
          onClick={() => handleSectionClick('reservationFormSelectPage')} // 예약 폼 선택 페이지로 이동
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

        {/* 2. '월별 현황 보기' 카드 */}
        <div
          className="reservation-section section-secondary section-calendar-toggle"
          onClick={() => handleSectionClick('monthlyCalendarPage')} // 월별 캘린더 페이지로 이동
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

        {/* 3. '예약 내역/수정' 카드 */}
        <div
          className="reservation-section section-secondary section-history"
          onClick={() => handleSectionClick('bookingHistory')} // 예약 내역 페이지로 이동
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

        {/* 4. '불편 사항 접수' 카드 */}
        <div
          className="reservation-section section-secondary section-complaint"
          onClick={() => handleSectionClick('complaintMenuPage')} // 불편 사항 메뉴 페이지로 이동
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