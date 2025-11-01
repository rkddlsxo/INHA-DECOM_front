import React from 'react';
// 1. ⭐️ CSS 파일 import
import './ReservationFormSelectPage.css';
// 2. ⭐️ 아이콘 import
import { BsArrowLeft, BsClock, BsBuilding } from 'react-icons/bs';

// 3. ⭐️ 컴포넌트 이름은 대문자로 시작 (ReservationFormSelectPage)
const ReservationFormSelectPage = ({ onNavigate }) => {
    return (
        // 4. ⭐️ 전체 컨테이너 (CSS 적용)
        <div className="reservationFormSelect-container">
            
            {/* 5. ⭐️ '뒤로가기' 버튼 (디자인 통일) */}
            <button
                onClick={() => onNavigate('reservation')}
                className="back-button"
            >
                <BsArrowLeft size={16} />
                뒤로
            </button>
            
            {/* 6. ⭐️ 헤더 (디자인 적용) */}
            <header className="select-header">
                <h1 className="select-title">예약 방식 선택</h1>
                <p className="select-subtitle">원하는 예약 방식을 선택하세요.</p>
            </header>

            {/* 7. ⭐️ 카드 그리드 */}
            <div className="select-grid">

                {/* 8. ⭐️ '시간 먼저 선택' 카드 */}
                <div 
                  className="select-card section-time"
                  onClick={() => onNavigate('timeFocusSelectPage')}
                >
                    <div className="select-icon-wrapper">
                        <BsClock size={44} />
                    </div>
                    <span className="select-text">시간 우선 예약</span>
                    <p className="select-description">
                        원하는 날짜와 시간을 먼저 선택하고
                        해당 시간에 사용 가능한 공간을 조회합니다.
                    </p>
                </div>

                {/* 9. ⭐️ '공간 먼저 선택' 카드 */}
                <div 
                  className="select-card section-place"
                  onClick={() => onNavigate('placeFocusSelectPage')}
                >
                    <div className="select-icon-wrapper">
                        <BsBuilding size={44} />
                    </div>
                    <span className="select-text">공간 우선 예약</span>
                    <p className="select-description">
                        원하는 공간을 먼저 선택하고
                        해당 공간의 월별/일별 예약 현황을 조회합니다.
                    </p>
                </div>

            </div>
        </div>
    );
};

// 10. ⭐️ export default 이름 변경
export default ReservationFormSelectPage;
