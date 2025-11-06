import React, { useState, useEffect } from 'react';
import './ComplaintHistoryPage.css';
import { BsArrowLeft, BsListCheck } from 'react-icons/bs';

// API 기본 URL 정의
const API_BASE_URL = 'http://localhost:5050/api';

/**
 * 사용자의 불편 사항 접수 내역을 조회하고 상세 정보를 보여주는 컴포넌트입니다.
 * @param {object} props - 컴포넌트 속성
 * @param {function} props.onNavigate - 페이지 이동을 처리하는 함수
 */
const ComplaintHistoryPage = ({ onNavigate }) => {
    // 불편 사항 목록 상태
    const [complaints, setComplaints] = useState([]);
    // 모달에서 선택된 특정 불편 사항 정보
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    // 상세 정보 모달 표시 여부
    const [isModalOpen, setIsModalOpen] = useState(false);
    // 데이터 로딩 상태
    const [loading, setLoading] = useState(true);
    // 에러 메시지 상태
    const [error, setError] = useState(null);

    // 컴포넌트 마운트 시 불편 사항 목록을 불러오는 useEffect 훅
    useEffect(() => {
        fetchComplaints();
    }, []);

    /**
     * 서버에서 사용자의 불편 사항 목록을 비동기적으로 불러오는 함수
     */
    const fetchComplaints = async () => {
        setLoading(true);
        setError(null);
        try {
            // 로컬 저장소에서 인증 토큰 가져오기
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('로그인이 필요합니다.');
            }

            // 사용자 불편 사항 목록 API 호출
            const response = await fetch(`${API_BASE_URL}/complaints/my`, {
                headers: {
                    // 인증 토큰을 헤더에 포함하여 전송
                    'Authorization': `Bearer ${token}`
                }
            });

            // 인증/인가 오류 처리
            if (response.status === 401 || response.status === 403) {
                throw new Error('인증에 실패했습니다. 다시 로그인해주세요.');
            }
            if (!response.ok) throw new Error('서버 응답 오류');

            const data = await response.json();

            // 각 불편 사항 객체에 화면에 표시할 상태(displayStatus)를 추가
            const updatedComplaints = data.map(complaint => ({
                ...complaint,
                displayStatus: getComplaintDisplayStatus(complaint)
            }));

            // 불편 사항 목록을 접수일(createdAt) 최신순으로 정렬 (내림차순)
            updatedComplaints.sort((a, b) => {
                const dateA = new Date(a.createdAt);
                const dateB = new Date(b.createdAt);
                return dateB - dateA;
            });

            setComplaints(updatedComplaints);
        } catch (err) {
            setError(err.message || '불편 사항 목록을 불러오는 데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * 불편 사항 객체의 status 값을 기반으로 화면 표시용 상태 문자열을 반환합니다.
     * @param {object} complaint - 개별 불편 사항 객체
     * @returns {string} 화면 표시용 상태 문자열
     */
    const getComplaintDisplayStatus = (complaint) => {
        switch (complaint.status) {
            case '접수대기': return '접수대기';
            case '처리중': return '처리중';
            case '완료': return '완료';
            case '취소': return '취소';
            default: return '접수대기';
        }
    };

    /**
     * 테이블 행 클릭 시 상세 모달을 열고 해당 불편 사항을 선택합니다.
     * @param {object} complaint - 클릭된 불편 사항 데이터
     */
    const handleRowClick = (complaint) => {
        setSelectedComplaint(complaint);
        setIsModalOpen(true);
    };

    /**
     * 상세 모달을 닫고 선택된 불편 사항 정보를 초기화합니다.
     */
    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedComplaint(null);
    };

    /**
     * 불편 사항 취소 API를 호출하고 목록을 업데이트합니다.
     */
    const handleCancel = async () => {
        // 이미 완료되거나 취소된 사항은 처리하지 않음
        if (!selectedComplaint || selectedComplaint.status === '완료' || selectedComplaint.status === '취소') return;

        if (!window.confirm('접수하신 불편 사항을 취소하시겠습니까?')) {
            return;
        }

        try {
            const token = localStorage.getItem('authToken');
            const complaintId = selectedComplaint.id;

            // 불편 사항 취소 API 호출 (PATCH 요청)
            const response = await fetch(`${API_BASE_URL}/complaints/${complaintId}/cancel`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            if (!response.ok) throw new Error('불편 사항 취소에 실패했습니다.');

            // 로컬 상태 업데이트: 상태를 '취소'로 변경
            const updatedComplaints = complaints.map(c =>
                c.id === complaintId
                    ? { ...c, status: '취소', displayStatus: '취소', cancelReason: '사용자 요청 취소' }
                    : c
            );
            setComplaints(updatedComplaints);
            alert('불편 사항 접수가 취소되었습니다.');
            closeModal();

        } catch (err) {
            alert(`불편 사항 취소 중 오류가 발생했습니다: ${err.message}`);
        }
    };

    /**
     * 로딩, 에러, 데이터 없음, 또는 테이블 렌더링을 조건부로 처리합니다.
     */
    const renderContent = () => {
        if (loading) {
            return (
                <div className="loading-message">
                    데이터를 불러오는 중입니다...
                </div>
            );
        }

        if (error) {
            return (
                <>
                    <p className="error-message">{error}</p>
                    <button className="retry-button" onClick={fetchComplaints}>
                        다시 시도
                    </button>
                </>
            );
        }

        if (complaints.length === 0) {
            return (
                <p id="no-history">
                    아직 접수하신 불편 사항 내역이 없습니다.
                </p>
            );
        }

        // 불편 사항 목록 테이블 렌더링
        return (
            <table className="history-table">
                <thead>
                    <tr>
                        <th>상태</th>
                        <th>접수일</th>
                        <th>유형</th>
                        <th>제목</th>
                        <th>신청자</th>
                    </tr>
                </thead>
                <tbody>
                    {complaints.map((complaint) => (
                        <tr key={complaint.id} onClick={() => handleRowClick(complaint)}>
                            <td>
                                {/* 상태에 따라 클래스 지정된 배지 표시 */}
                                <span className={`status-badge status-${complaint.displayStatus}`}>
                                    {complaint.displayStatus}
                                </span>
                            </td>
                            <td>{complaint.createdAt ? new Date(complaint.createdAt).toLocaleDateString() : '날짜 정보 없음'}</td>
                            <td>{complaint.category}</td>
                            <td>{complaint.title}</td>
                            <td>{complaint.applicantName}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    };

    return (
        <div className="history-page-container">
            {/* 뒤로가기 버튼: 불편 사항 메뉴 페이지로 이동 */}
            <button
                className="back-button"
                onClick={() => onNavigate('complaintMenuPage')}
            >
                <BsArrowLeft size={16} />
                뒤로
            </button>

            <div className="top-title">
                {/* 페이지 제목 및 아이콘 */}
                <h1 className="page-title">
                    <BsListCheck size={28} style={{ marginRight: '10px', verticalAlign: 'middle' }} />
                    불편 사항 내역 조회
                </h1>
            </div>

            <div className="history-container">
                <div className="table-center-box">
                    {renderContent()}
                </div>
            </div>

            {/* 상세 정보 모달 */}
            {isModalOpen && selectedComplaint && (
                <div id="detail-modal" className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <span className="close-btn" onClick={closeModal}>&times;</span>
                        <h2 className="modal-title">불편 사항 상세</h2>

                        <div id="modal-details">

                            {selectedComplaint.status === '취소' ? (
                                // 취소된 불편 사항 상세 정보
                                <>
                                    <div className="detail-item"><strong>상태:</strong> <span className={`status-badge status-취소`}>취소</span></div>
                                    <div className="detail-item"><strong>유형:</strong> {selectedComplaint.category}</div>
                                    <div className="detail-item"><strong>제목:</strong> {selectedComplaint.title}</div>

                                    <div className="detail-item" style={{ alignItems: 'flex-start' }}>
                                        <strong>상세 내용:</strong>
                                        <p style={{ margin: 0, flex: 1 }}>{selectedComplaint.details || '내용 없음'}</p>
                                    </div>

                                    {/* 관리자 답변/처리 내용 표시 */}
                                    {selectedComplaint.managementNote && (
                                        <div className="detail-item admin-note-box">
                                            <strong>관리자 처리 내용</strong>
                                            <p>{selectedComplaint.managementNote}</p>
                                        </div>
                                    )}

                                    {/* 이미지 표시 */}
                                    {selectedComplaint.imageUrl && (
                                        <div className="detail-item image-item">
                                            <strong>첨부 사진:</strong>
                                            <div className="image-preview-wrapper">
                                                <img
                                                    src={selectedComplaint.imageUrl}
                                                    alt="첨부된 불편 사항 사진"
                                                    className="complaint-image-preview"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* 취소 사유 표시 */}
                                    <div className="detail-item cancel-reason-box">
                                        <strong>취소 사유</strong>
                                        <p>{selectedComplaint.cancelReason || '사유 정보 없음'}</p>
                                    </div>

                                    <div className="modal-buttons">
                                        <button className="confirm-btn" onClick={closeModal}>확인</button>
                                    </div>
                                </>
                            ) : (
                                // 일반 (접수대기, 처리중, 완료) 불편 사항 상세 정보
                                <>
                                    <div className="detail-item"><strong>상태:</strong> <span className={`status-badge status-${selectedComplaint.displayStatus}`}>{selectedComplaint.displayStatus}</span></div>
                                    <div className="detail-item"><strong>유형:</strong> {selectedComplaint.category}</div>
                                    <div className="detail-item"><strong>제목:</strong> {selectedComplaint.title}</div>

                                    <div className="detail-item" style={{ alignItems: 'flex-start' }}>
                                        <strong>상세 내용:</strong>
                                        <p style={{ margin: 0, flex: 1 }}>{selectedComplaint.details || '내용 없음'}</p>
                                    </div>

                                    {/* 관리자 답변/처리 내용 표시 */}
                                    {selectedComplaint.managementNote && (
                                        <div className="detail-item admin-note-box">
                                            <strong>관리자 처리 내용</strong>
                                            <p>{selectedComplaint.managementNote}</p>
                                        </div>
                                    )}

                                    {/* 이미지 표시 */}
                                    {selectedComplaint.imageUrl && (
                                        <div className="detail-item image-item">
                                            <strong>첨부 사진:</strong>
                                            <div className="image-preview-wrapper">
                                                <img
                                                    src={selectedComplaint.imageUrl}
                                                    alt="첨부된 불편 사항 사진"
                                                    className="complaint-image-preview"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="detail-item" style={{ marginTop: '15px' }}><strong>신청자:</strong> {selectedComplaint.applicantName}</div>
                                    <div className="detail-item"><strong>연락처:</strong> {selectedComplaint.contact}</div>
                                    <div className="detail-item"><strong>접수일:</strong> {selectedComplaint.createdAt ? new Date(selectedComplaint.createdAt).toLocaleString() : '정보 없음'}</div>

                                    <div className="modal-buttons">
                                        {/* 취소 가능한 상태 (접수대기, 처리중)일 때만 취소 버튼 표시 */}
                                        {(selectedComplaint.status === '접수대기' || selectedComplaint.status === '처리중') && (
                                            <button className="cancel-btn" onClick={handleCancel}>
                                                접수 취소
                                            </button>
                                        )}
                                        <button className="confirm-btn" onClick={closeModal}>
                                            확인
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ComplaintHistoryPage;