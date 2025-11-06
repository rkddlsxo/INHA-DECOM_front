import React from 'react';
import './ComplaintMenuPage.css';
// 필요한 아이콘 (접수, 내역, 뒤로가기) 임포트
import { BsPencilSquare, BsListCheck, BsArrowLeft } from 'react-icons/bs';

/**
 * 불편 사항 관련 서비스(접수, 내역 조회)를 선택하는 메뉴 컴포넌트입니다.
 * @param {object} props - 컴포넌트 속성
 * @param {function} props.onNavigate - 페이지 이동을 처리하는 함수
 */
const ComplaintMenuPage = ({ onNavigate }) => {

    /**
     * 메뉴 섹션 클릭 시 지정된 페이지로 이동을 요청합니다.
     * @param {string} page - 이동할 페이지의 이름
     */
    const handleSectionClick = (page) => {
        onNavigate(page);
    };

    return (
        // 전체 레이아웃 컨테이너
        <div className="complaint-menu-wrapper">

            {/* 왼쪽 상단 '뒤로가기' 버튼: 메인 페이지로 이동 */}
            <button
                className="back-button"
                onClick={() => handleSectionClick('main')}
            >
                <BsArrowLeft size={16} />
                뒤로
            </button>

            {/* 헤더 섹션 */}
            <header className="main-page-header">
                <h1 className="main-page-title">
                    불편 사항 접수 메뉴
                </h1>
                <p className="main-page-welcome">
                    원하는 불편 사항 관련 서비스를 선택하세요.
                </p>
            </header>

            {/* 카드 메뉴를 담는 그리드 레이아웃 컨테이너 */}
            <main className="menu-card-grid">

                {/* '불편 사항 접수' 카드 */}
                <div
                    className="menu-section section-register"
                    onClick={() => handleSectionClick('complaintPage')} // 'ComplaintPage'로 이동
                >
                    <button className="menu-button">
                        <div className="menu-icon-wrapper">
                            <BsPencilSquare size={40} />
                        </div>
                        <span className="menu-text">불편 사항 접수</span>
                        <p className="menu-description">
                            시설 이용 또는 예약 시스템 관련 불편 사항을 새로 접수합니다.
                        </p>
                    </button>
                </div>

                {/* '불편 사항 내역' 카드 */}
                <div
                    className="menu-section section-history"
                    onClick={() => handleSectionClick('complaintHistoryPage')} // 'ComplaintHistoryPage'로 이동
                >
                    <button className="menu-button">
                        <div className="menu-icon-wrapper">
                            <BsListCheck size={40} />
                        </div>
                        <span className="menu-text">불편 사항 내역</span>
                        <p className="menu-description">
                            내가 접수한 불편 사항의 처리 현황을 조회합니다.
                        </p>
                    </button>
                </div>

            </main>

        </div>
    );
};

export default ComplaintMenuPage;