import React from 'react';
import { BsCalendarCheck, BsExclamationCircle } from 'react-icons/bs';

// 1. ⭐️⭐️⭐️ 1단계에서 만든 CSS 파일을 import 합니다! ⭐️⭐️⭐️
import './MainPage.css';

const MainPage = ({ onNavigate }) => {
  const userName = localStorage.getItem('username') || '방문자'; //사용자 이름 동적으로 반영하도록 수정

  return (
    // 2. <div>에 className 대신 1단계에서 만든 CSS 클래스 적용
    <div className="main-page-container">

      <header className="main-page-header">
        <h1 className="main-page-title">
          학교 시설물 관리 시스템
        </h1>
        <p className="main-page-welcome">
          {userName}님, 환영합니다. 원하는 서비스를 선택하세요.
        </p>
      </header>

      <main className="main-page-grid">

        {/* 3. '시설 예약' 카드 */}
        <button
          onClick={() => onNavigate('reservation')}
          // 4. 공통 카드 스타일 + 예약 카드 전용 색상
          className="menu-card card-reservation"
        >
          {/* 5. 아이콘에는 크기만 지정 (색상은 CSS에서 white로 자동 적용됨) */}
          <BsCalendarCheck size={52} className="card-icon" />
          <h2 className="card-title">시설 예약</h2>
          <p className="card-description">
            강의실, 스터디룸, 체육관 등<br />교내 시설을 예약합니다.
          </p>
        </button>

        {/* 6. '시설 제보' 카드 */}
        <button
          onClick={() => onNavigate('complaintPage')}
          // 7. 공통 카드 스타일 + 제보 카드 전용 색상
          className="menu-card card-report"
        >
          <BsExclamationCircle size={52} className="card-icon" />
          <h2 className="card-title">시설 제보</h2>
          <p className="card-description">
            파손되거나 고장난 시설을<br />사진과 함께 제보합니다.
          </p>
        </button>

      </main>
    </div>
  );
};

export default MainPage;