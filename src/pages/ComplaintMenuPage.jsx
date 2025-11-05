import React from 'react';
import './ComplaintMenuPage.css';
// ⭐️ 아이콘 import: 접수 (BsPencilSquare), 내역 (BsListCheck), 뒤로가기 (BsArrowLeft)
import { BsPencilSquare, BsListCheck, BsArrowLeft } from 'react-icons/bs';

const ComplaintMenuPage = ({ onNavigate }) => {

    const handleSectionClick = (page) => {
        onNavigate(page);
    };

    return (
        // ⭐️ 클래스 이름: complaint-menu-wrapper
        <div className="complaint-menu-wrapper">

            {/* ⭐️ 왼쪽 상단 '뒤로가기' 버튼 (수정된 위치) */}
            <button
                className="back-button" // back-button 클래스 사용
                onClick={() => handleSectionClick('main')} // 메인 메뉴(mainPages)로 이동
            >
                <BsArrowLeft size={16} />
                뒤로
            </button>

            {/* 헤더: 메인 페이지 UI와 유사하게 구성 */}
            <header className="main-page-header">
                <h1 className="main-page-title">
                    불편 사항 접수 메뉴
                </h1>
                <p className="main-page-welcome">
                    원하는 불편 사항 관련 서비스를 선택하세요.
                </p>
            </header>

            {/* ⭐️ 카드 그리드 (1:1 레이아웃) */}
            <main className="menu-card-grid">

                {/* '불편 사항 접수' 섹션 (카드 1) */}
                <div
                    className="menu-section section-register"
                    onClick={() => handleSectionClick('complaintPage')} // ⭐️ 접수 페이지로 이동
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

                {/* '불편 사항 내역' 섹션 (카드 2) */}
                <div
                    className="menu-section section-history"
                    onClick={() => handleSectionClick('complaintHistoryPage')} // ⭐️ 내역 페이지로 이동
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

            {/* 하단 '메인으로 돌아가기' 버튼은 상단 버튼으로 대체되어 제거되었습니다. */}
        </div>
    );
};

export default ComplaintMenuPage;