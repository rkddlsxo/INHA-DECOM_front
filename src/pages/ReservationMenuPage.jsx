import React from 'react';
// 1. ⭐️ CSS 파일을 import 합니다.
import './ReservationMenuPage.css'; 
// 2. ⭐️ 아이콘을 import 합니다.
import { BsArrowLeft, BsCalendarPlus, BsCheck2Square, BsExclamationTriangle } from 'react-icons/bs';

const ReservationMenuPage = ({ onNavigate }) => {
  
  // 3. ⭐️ 섹션을 클릭하면 버튼이 클릭되도록 래핑 함수를 만듭니다.
  const handleSectionClick = (page) => {
    onNavigate(page);
  };

  return (
    <div className="reservation-container">
      {/* 4. ⭐️ '메인으로' 버튼 (디자인/아이콘 적용) */}
      <button
        onClick={() => onNavigate('main')}
        className="back-button"
      >
        <BsArrowLeft size={16} />
        메인으로
      </button>

      {/* ⭐️ 5. 카드들을 감싸는 그리드 래퍼 추가 ⭐️ */}
      <div className="reservation-grid">

        {/* 6. '신규 예약' 섹션 (카드) */}
        <div 
          className="reservation-section section-reserve"
          onClick={() => handleSectionClick('reservationFormSelectPage')}
        >
          <button className="menu-button">
            <div className="menu-icon-wrapper">
              <BsCalendarPlus size={40} /> {/* 아이콘 크기 조정 */}
            </div>
            <span className="menu-text">신규 예약하기</span>
          </button>
        </div>

        {/* 7. '예약 내역/수정' 섹션 (카드) */}
        <div 
          className="reservation-section section-history"
          onClick={() => handleSectionClick('bookingHistory')}
        >
          <button className="menu-button">
            <div className="menu-icon-wrapper">
              <BsCheck2Square size={38} /> {/* 아이콘 크기 조정 */}
            </div>
            <span className="menu-text">예약 내역 / 수정</span>
          </button>
        </div>

        {/* 8. '불편 사항 접수' 섹션 (카드) */}
        <div 
          className="reservation-section section-complaint"
          onClick={() => handleSectionClick('complaint')}
        >
          <button className="menu-button">
            <div className="menu-icon-wrapper">
              <BsExclamationTriangle size={40} /> {/* 아이콘 크기 조정 */}
            </div>
            <span className="menu-text">불편 사항 접수</span>
          </button>
        </div>

      </div> {/* ⭐️ .reservation-grid 닫기 ⭐️ */}
      
    </div>
  );
};

export default ReservationMenuPage;

