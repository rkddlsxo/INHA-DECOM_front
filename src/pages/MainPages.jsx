import React from 'react';
// 1. ⭐️ CSS 파일을 import 합니다.
import './Mainpage.css';
// 2. ⭐️ 아이콘을 import 합니다.
import { BsCalendarPlus, BsCheck2Square, BsExclamationTriangle } from 'react-icons/bs';

const MainPages = ({ onNavigate }) => {

  const handleSectionClick = (page) => {
    onNavigate(page);
  };

  return (
    // ⭐️ 클래스 이름 변경: reservation-container -> facility-menu-wrapper
    <div className="facility-menu-wrapper">

      {/* ⭐️ 2. 메인 페이지 분위기의 Header 추가 */}
      <header className="main-page-header">
        <h1 className="main-page-title">
          시설 예약 메뉴
        </h1>
        <p className="main-page-welcome">
          원하는 예약 관련 서비스를 선택하세요.
        </p>
      </header>

      {/* ⭐️ 3. 카드를 감싸는 그리드 (2:1:1 레이아웃) */}
      {/* ⭐️ 클래스 이름 변경: reservation-grid -> menu-card-grid */}
      <main className="menu-card-grid">

        {/* '신규 예약' 섹션 (큰 카드) */}
        <div
          className="reservation-section section-reserve"
          onClick={() => handleSectionClick('reservationFormSelectPage')}
        >
          <button className="menu-button">
            <div className="menu-icon-wrapper">
              <BsCalendarPlus size={40} />
            </div>
            <span className="menu-text">신규 예약하기</span>
            <p className="menu-description">
              시설 예약 방식을 선택하여 새로운 예약을 진행합니다.
            </p>
          </button>
        </div>

        {/* '예약 내역/수정' 섹션 (작은 카드 1) */}
        <div
          className="reservation-section section-history"
          onClick={() => handleSectionClick('bookingHistory')}
        >
          <button className="menu-button">
            <div className="menu-icon-wrapper">
              <BsCheck2Square size={38} />
            </div>
            <span className="menu-text">예약 내역 / 수정</span>
            <p className="menu-description">
              나의 예약 현황을 조회하고 변경 또는 취소합니다.
            </p>
          </button>
        </div>

        {/* '불편 사항 접수' 섹션 (작은 카드 2) */}
        <div
          className="reservation-section section-complaint"
          onClick={() => handleSectionClick('complaintMenuPage')}
        >
          <button className="menu-button">
            <div className="menu-icon-wrapper">
              <BsExclamationTriangle size={40} />
            </div>
            <span className="menu-text">불편 사항 접수</span>
            <p className="menu-description">
              예약 시스템 또는 시설 이용 관련 불편 사항을 접수합니다.
            </p>
          </button>
        </div>

      </main>

      {/* 메인으로 돌아가는 버튼은 JSX에 없으므로 주석 처리된 상태로 유지합니다. */}

    </div>
  );
};

export default MainPages;