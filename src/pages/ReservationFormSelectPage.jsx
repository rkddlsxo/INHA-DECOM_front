import React from 'react';
// CSS 파일 임포트
import './ReservationFormSelectPage.css';
// 필요한 아이콘 임포트: 뒤로가기, 시계(시간), 건물(공간), 달력(동시 선택)
import { BsArrowLeft, BsClock, BsBuilding, BsCalendarCheck } from 'react-icons/bs';

/**
 * 사용자에게 세 가지 예약 방식 중 하나를 선택하도록 안내하는 페이지 컴포넌트입니다.
 * @param {object} props - 컴포넌트 속성
 * @param {function} props.onNavigate - 페이지 이동을 처리하는 함수
 */
const ReservationFormSelectPage = ({ onNavigate }) => {
    return (
        <div className="reservationFormSelect-container">

            {/* 뒤로가기 버튼: 메인 페이지로 이동 */}
            <button
                onClick={() => onNavigate('main')}
                className="back-button"
            >
                <BsArrowLeft size={16} />
                뒤로
            </button>

            {/* 페이지 헤더 */}
            <header className="select-header">
                <h1 className="select-title">예약 방식 선택</h1>
                <p className="select-subtitle">원하는 예약 방식을 선택하세요.</p>
            </header>

            {/* 카드 메뉴 그리드 */}
            <div className="select-grid">

                {/* 1. '시간 + 공간 동시 선택' 카드 (최상위 강조) */}
                <div
                    className="select-card section-simultaneous"
                    onClick={() => onNavigate('simultaneousSelectPage')} // 동시 선택 페이지로 이동
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

                {/* 2. '시간 우선 예약' 카드 */}
                <div
                    className="select-card section-time"
                    onClick={() => onNavigate('timeFocusSelectPage')} // 시간 우선 페이지로 이동
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

                {/* 3. '공간 우선 예약' 카드 */}
                <div
                    className="select-card section-place"
                    onClick={() => onNavigate('placeFocusSelectPage')} // 공간 우선 페이지로 이동
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