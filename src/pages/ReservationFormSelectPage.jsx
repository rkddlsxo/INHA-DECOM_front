import React from 'react';
// 1. CSS 파일 import
import './ReservationFormSelectPage.css';
// 2. ⭐️ 아이콘 import: BsCalendarCheck가 정확히 포함되었는지 확인
import { BsArrowLeft, BsClock, BsBuilding, BsCalendarCheck } from 'react-icons/bs';

// 컴포넌트 정의
const ReservationFormSelectPage = ({ onNavigate }) => {
    return (
        <div className="reservationFormSelect-container">

            {/* 뒤로가기 버튼 */}
            <button
                onClick={() => onNavigate('mainPages')}
                className="back-button"
            >
                <BsArrowLeft size={16} />
                뒤로
            </button>

            <header className="select-header">
                <h1 className="select-title">예약 방식 선택</h1>
                <p className="select-subtitle">원하는 예약 방식을 선택하세요.</p>
            </header>

            {/* 카드 그리드 */}
            <div className="select-grid">

                {/* ⭐️ 1. 시간 + 공간 동시 선택 (가장 위로 이동) */}
                <div
                    className="select-card section-simultaneous"
                    onClick={() => onNavigate('simultaneousSelectPage')}
                >
                    <div className="select-icon-wrapper">
                        <BsCalendarCheck size={44} />
                    </div>
                    <span className="select-text">시간 + 공간 동시 선택</span>
                    <p className="select-description">
                        장소 범주와 시간대를 동시에 입력하여
                        사용 가능한 모든 장소를 즉시 조회합니다.
                    </p>
                </div>
                {/* ⭐️ 순서 변경: 시간 우선 예약 카드 (두 번째 위치) */}
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

                {/* ⭐️ 순서 변경: 공간 우선 예약 카드 (세 번째 위치) */}
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

export default ReservationFormSelectPage;