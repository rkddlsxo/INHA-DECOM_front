import React, { useState, useEffect } from 'react';
import './BookingHistoryPage.css';
import { BsArrowLeft } from 'react-icons/bs';

// API 기본 URL을 상수로 정의
const API_BASE_URL = 'http://localhost:5050/api';

/**
 * 예약 내역을 보여주고 관리하는 컴포넌트입니다.
 * @param {object} props - 컴포넌트 속성
 * @param {function} props.onNavigate - 페이지 이동을 처리하는 콜백 함수
 */
const BookingHistory = ({ onNavigate }) => {
    // 예약 목록 상태
    const [bookings, setBookings] = useState([]);
    // 모달에서 선택된 특정 예약 정보
    const [selectedBooking, setSelectedBooking] = useState(null);
    // 상세 정보/수정 모달 표시 여부
    const [isModalOpen, setIsModalOpen] = useState(false);
    // 수정 모드 활성화 여부
    const [isEditMode, setIsEditMode] = useState(false);
    // 수정 중인 데이터 임시 저장소
    const [editData, setEditData] = useState({});
    // 데이터 로딩 상태
    const [loading, setLoading] = useState(true);
    // 에러 메시지 상태
    const [error, setError] = useState(null);

    // 컴포넌트 마운트 시 예약 목록을 불러오는 useEffect 훅
    useEffect(() => {
        fetchBookings();
    }, []);

    /**
     * 서버에서 사용자의 예약 목록을 비동기적으로 불러오는 함수
     */
    const fetchBookings = async () => {
        setLoading(true);
        setError(null);
        try {
            // 로컬 저장소에서 인증 토큰 가져오기
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('로그인이 필요합니다.');
            }

            const response = await fetch(`${API_BASE_URL}/bookings/my`, {
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

            // 각 예약 객체에 화면에 표시할 상태(displayStatus)를 추가
            const updatedBookings = data.map(booking => ({
                ...booking,
                displayStatus: getBookingStatus(booking)
            }));

            // 예약 목록을 시작 시간이 최신인 순서로 정렬 (내림차순)
            updatedBookings.sort((a, b) => {
                const dateA = new Date(`${a.date} ${a.startTime}`);
                const dateB = new Date(`${b.date} ${b.startTime}`);
                return dateB - dateA;
            });
            setBookings(updatedBookings);
        } catch (err) {
            setError(err.message || '예약 목록을 불러오는 데 실패했습니다.');
        }
        setLoading(false);
    };

    /**
     * 예약 객체를 기반으로 현재 시점의 표시 상태 문자열을 반환합니다.
     * @param {object} booking - 개별 예약 객체
     * @returns {string} 예약 상태 ('지난예약', '사용중', '확정', '취소', '확정대기')
     */
    const getBookingStatus = (booking) => {
        // 기본 상태 필터링
        if (booking.status === '확정대기') return '확정대기';
        if (booking.status === '취소') return '취소';

        const now = new Date();
        // 예약 날짜와 시간으로 Date 객체 생성 시도 (YYYY-MM-DD T HH:mm 형식 가정)
        const startDateTime = new Date(`${booking.date}T${booking.startTime}`);
        const endDateTime = new Date(`${booking.date}T${booking.endTime}`);

        if (isNaN(startDateTime) || isNaN(endDateTime)) {
            // 날짜 형식이 표준과 다를 경우 (예: "2025년 10월 17일" 형태)를 위한 폴백 로직
            const dateParts = booking.date.match(/(\d{4})년 (\d{2})월 (\d{2})일/);
            if (!dateParts) return booking.status || '확정'; // 폴백 실패 시 원본 상태 반환

            // 날짜 문자열 재구성 (YYYY-MM-DD)
            const dateString = `${dateParts[1]}-${dateParts[2]}-${dateParts[3]}`;
            const parsedStart = new Date(`${dateString}T${booking.startTime}`);
            const parsedEnd = new Date(`${dateString}T${booking.endTime}`);

            if (isNaN(parsedStart) || isNaN(parsedEnd)) return booking.status || '확정';

            const nowTime = now.getTime();
            const startTime = parsedStart.getTime();
            const endTime = parsedEnd.getTime();

            if (endTime < nowTime) return '지난예약'; // 종료 시간이 현재보다 이전
            if (startTime <= nowTime && nowTime < endTime) return '사용중'; // 현재 시간이 예약 시간대 내부에 있음
            return '확정'; // 예약 예정
        }

        const nowTime = now.getTime();
        const startTime = startDateTime.getTime();
        const endTime = endDateTime.getTime();

        if (endTime < nowTime) return '지난예약';
        if (startTime <= nowTime && nowTime < endTime) return '사용중';
        return '확정';
    };

    /**
     * 테이블 행 클릭 시 모달을 열고 해당 예약 정보를 설정합니다.
     * @param {object} booking - 클릭된 예약 데이터
     */
    const handleRowClick = (booking) => {
        setSelectedBooking(booking);
        setIsModalOpen(true);
        setIsEditMode(false); // 기본적으로 상세 보기 모드로 열림
    };

    /**
     * 모달을 닫는 함수
     */
    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedBooking(null);
        setIsEditMode(false);
        setEditData({});
    };

    /**
     * 예약 취소 API를 호출하고 목록을 업데이트합니다.
     */
    const handleCancel = async () => {
        if (!selectedBooking) return;
        const bookingId = selectedBooking.id;

        if (!window.confirm('예약을 취소하시겠습니까?')) {
            return;
        }

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/cancel`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('예약 취소에 실패했습니다.');

            // 로컬 상태 업데이트: 상태를 '취소'로 변경
            const updatedBookings = bookings.map(booking =>
                booking.id === bookingId
                    ? { ...booking, status: '취소', displayStatus: '취소', cancelReason: '사용자 요청 취소 (API)' }
                    : booking
            );
            setBookings(updatedBookings);
            alert('예약이 취소되었습니다.');
            closeModal();

        } catch (err) {
            alert(`예약 취소 중 오류가 발생했습니다: ${err.message}`);
        }
    };

    /**
     * 예약 사용 완료(퇴실) 처리를 API로 요청합니다.
     */
    const handleCheckout = async () => {
        if (!selectedBooking || selectedBooking.displayStatus !== '사용중') return;

        if (!window.confirm('퇴실 처리를 완료하고 예약을 종료하시겠습니까?')) {
            return;
        }

        try {
            const token = localStorage.getItem('authToken');
            const bookingId = selectedBooking.id;

            const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/complete`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            if (!response.ok) {
                throw new Error('퇴실 처리에 실패했습니다. 서버 상태를 확인해주세요.');
            }

            // 로컬 상태 업데이트: 상태를 '사용완료'로, 표시 상태를 '지난예약'으로 변경
            const updatedBookings = bookings.map(booking =>
                booking.id === bookingId
                    ? { ...booking, status: '사용완료', displayStatus: '지난예약' }
                    : booking
            );
            setBookings(updatedBookings);

            alert('퇴실 처리가 완료되었습니다.');
            closeModal();

        } catch (err) {
            alert(`퇴실 처리 중 오류가 발생했습니다: ${err.message}`);
        }
    };

    /**
     * 수정 모드로 전환하고, 현재 예약 데이터를 editData에 복사합니다.
     */
    const handleEditMode = () => {
        setEditData({
            // 수정 가능한 필드만 초기화 (상태는 '확정대기'로 고정)
            status: '확정대기',
            applicant: selectedBooking.applicant,
            phone: selectedBooking.phone,
            email: selectedBooking.email,
            eventName: selectedBooking.eventName,
            numPeople: selectedBooking.numPeople,
            acUse: selectedBooking.acUse
        });
        setIsEditMode(true);
    };

    /**
     * 수정 폼의 입력 값 변경을 감지하여 editData를 업데이트합니다.
     * @param {string} field - 변경된 필드 이름
     * @param {*} value - 새로운 값
     */
    const handleEditChange = (field, value) => {
        setEditData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    /**
     * 수정된 정보를 서버에 PATCH 요청으로 전송하고 목록을 업데이트합니다.
     */
    const handleEditConfirm = async () => {
        if (!selectedBooking) return;
        const bookingId = selectedBooking.id;

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(editData),
            });

            if (!response.ok) throw new Error('예약 정보 수정에 실패했습니다.');

            // 목록 업데이트
            const updatedBookings = bookings.map(booking =>
                booking.id === bookingId
                    ? {
                        ...booking,
                        ...editData,
                        // 수정된 데이터로 displayStatus 다시 계산
                        displayStatus: getBookingStatus({ ...booking, ...editData })
                    }
                    : booking
            );
            setBookings(updatedBookings);

            // 선택된 예약 객체 자체도 업데이트
            const updatedSelected = { ...selectedBooking, ...editData };
            updatedSelected.displayStatus = getBookingStatus(updatedSelected);
            setSelectedBooking(updatedSelected);

            alert('예약 정보가 성공적으로 수정되었습니다. (상태: 확정대기)');
            setIsEditMode(false);
            setEditData({});

        } catch (err) {
            alert(`정보 수정 중 오류가 발생했습니다: ${err.message}`);
        }
    };

    /**
     * 수정 모드 진입 취소
     */
    const handleEditCancel = () => {
        setIsEditMode(false);
        setEditData({});
    };

    /**
     * 이전 예약과 동일한 정보로 공간 예약 페이지로 이동합니다.
     */
    const handleRebook = () => {
        if (!selectedBooking) return;

        // 1. 이전 예약 정보를 로컬 저장소에 저장 (예약 폼으로 전달)
        const rebookingData = {
            organizationType: selectedBooking.organizationType || 'private',
            organizationName: selectedBooking.applicant,
            phone: selectedBooking.phone,
            email: selectedBooking.email,
            eventName: selectedBooking.eventName,
            numPeople: selectedBooking.numPeople || 1,
            acUse: selectedBooking.acUse || 'yes',
        };
        localStorage.setItem('rebookingData', JSON.stringify(rebookingData));

        // 2. 공간 선택 페이지에서 사용할 장소 정보 프리필
        const prefillData = {
            room: {
                id: selectedBooking.space_id, // 공간 ID 사용
                name: selectedBooking.room,
                location: selectedBooking.location,
            },
            date: null, // 날짜는 사용자가 새로 선택하도록 null 처리
        };
        localStorage.setItem('prefillPlaceFocus', JSON.stringify(prefillData));

        // 3. 모달 닫고 다음 페이지로 이동
        closeModal();
        onNavigate('placeFocusSelectPage');
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
                    <button className="retry-button" onClick={fetchBookings}>
                        다시 시도
                    </button>
                </>
            );
        }

        if (bookings.length === 0) {
            return (
                <p id="no-history">
                    아직 예약된 내역이 없습니다.
                </p>
            );
        }

        // 예약 목록 테이블 렌더링
        return (
            <table className="history-table">
                <thead>
                    <tr>
                        <th>상태</th>
                        <th>예약 일자</th>
                        <th>시간</th>
                        <th>장소</th>
                        <th>신청자</th>
                    </tr>
                </thead>
                <tbody>
                    {bookings.map((booking) => (
                        <tr key={booking.id} onClick={() => handleRowClick(booking)}>
                            <td>
                                {/* 상태에 따라 클래스 지정된 배지 표시 */}
                                <span className={`status-badge status-${booking.displayStatus}`}>
                                    {booking.displayStatus}
                                </span>
                            </td>
                            <td>{booking.date}</td>
                            <td>{`${booking.startTime} ~ ${booking.endTime}`}</td>
                            <td>{booking.room}</td>
                            <td>{booking.applicant}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    };

    return (
        <div className="history-page-container">
            {/* 뒤로가기 버튼 */}
            <button
                className="back-button"
                onClick={() => onNavigate('main')}
            >
                <BsArrowLeft size={16} />
                뒤로
            </button>

            <div className="top-title">
                <h1 className="page-title">📝 나의 예약 내역</h1>
            </div>

            <div className="history-container">
                <div className="table-center-box">
                    {renderContent()}
                </div>
            </div>

            {/* 예약 상세/수정 모달 */}
            {isModalOpen && selectedBooking && (
                <div id="detail-modal" className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <span className="close-btn" onClick={closeModal}>&times;</span>
                        <h2 className="modal-title">{isEditMode ? '예약 정보 수정' : '예약 상세 정보'}</h2>
                        <div id="modal-details">

                            {selectedBooking.status === '취소' ? (
                                // 예약이 취소된 경우 표시할 상세 내역
                                <>
                                    <div className="detail-item"><strong>상태:</strong> <span className={`status-badge status-취소`}>취소</span></div>
                                    <div className="detail-item"><strong>장소:</strong> {selectedBooking.room} ({selectedBooking.location})</div>
                                    <div className="detail-item"><strong>날짜:</strong> {selectedBooking.date}</div>
                                    <div className="detail-item"><strong>시간:</strong> {`${selectedBooking.startTime} ~ ${selectedBooking.endTime}`}</div>
                                    <div className="detail-item" style={{ marginTop: '15px' }}><strong>신청자:</strong> {selectedBooking.applicant}</div>
                                    <div className="detail-item"><strong>연락처:</strong> {selectedBooking.phone}</div>
                                    <div className="detail-item cancel-reason-box">
                                        <strong>취소 사유</strong>
                                        <p>{selectedBooking.cancelReason || '사유 정보 없음'}</p>
                                    </div>
                                    <div className="modal-buttons" style={{ marginTop: '15px' }}>
                                        <button className="confirm-btn" onClick={closeModal}>
                                            확인
                                        </button>
                                    </div>
                                </>
                            ) : isEditMode ? (
                                // 예약 수정 모드 UI
                                <>
                                    <div className="detail-item"><strong>상태:</strong> <span className={`status-badge status-확정대기`}>확정대기</span></div>
                                    <div className="detail-item"><strong>장소:</strong> {selectedBooking.room} ({selectedBooking.location}) <span className="readonly-text">(수정 불가)</span></div>
                                    <div className="detail-item"><strong>날짜:</strong> {selectedBooking.date} <span className="readonly-text">(수정 불가)</span></div>
                                    <div className="detail-item"><strong>시간:</strong> {`${selectedBooking.startTime} ~ ${selectedBooking.endTime}`} <span className="readonly-text">(수정 불가)</span></div>
                                    <div className="edit-item">
                                        <strong>신청자:</strong>
                                        <input type="text" value={editData.applicant} onChange={(e) => handleEditChange('applicant', e.target.value)} className="edit-input" />
                                    </div>
                                    <div className="edit-item">
                                        <strong>연락처:</strong>
                                        <input type="text" value={editData.phone} onChange={(e) => handleEditChange('phone', e.target.value)} className="edit-input" />
                                    </div>
                                    <div className="edit-item">
                                        <strong>이메일:</strong>
                                        <input type="email" value={editData.email} onChange={(e) => handleEditChange('email', e.target.value)} className="edit-input" />
                                    </div>
                                    <div className="edit-item">
                                        <strong>행사명:</strong>
                                        <input type="text" value={editData.eventName} onChange={(e) => handleEditChange('eventName', e.target.value)} className="edit-input" />
                                    </div>
                                    <div className="edit-item">
                                        <strong>행사인원:</strong>
                                        <input type="number" value={editData.numPeople} onChange={(e) => handleEditChange('numPeople', parseInt(e.target.value) || 1)} className="edit-input" min="1" />
                                    </div>
                                    <div className="edit-item">
                                        <strong>냉난방:</strong>
                                        <select value={editData.acUse} onChange={(e) => handleEditChange('acUse', e.target.value)} className="edit-select" >
                                            <option value="yes">사용함</option>
                                            <option value="no">사용 안 함</option>
                                        </select>
                                    </div>
                                    <div className="modal-buttons">
                                        <button className="cancel-btn" onClick={handleEditCancel}>
                                            수정 취소
                                        </button>
                                        <button className="confirm-btn" onClick={handleEditConfirm}>
                                            수정 확정
                                        </button>
                                    </div>
                                </>
                            ) : (
                                // 기본 상세 정보 UI
                                <>
                                    <div className="detail-item"><strong>상태:</strong> <span className={`status-badge status-${selectedBooking.displayStatus}`}>{selectedBooking.displayStatus}</span></div>
                                    <div className="detail-item"><strong>장소:</strong> {selectedBooking.room} ({selectedBooking.location})</div>
                                    <div className="detail-item"><strong>날짜:</strong> {selectedBooking.date}</div>
                                    <div className="detail-item"><strong>시간:</strong> {`${selectedBooking.startTime} ~ ${selectedBooking.endTime}`}</div>
                                    <div className="detail-item" style={{ marginTop: '15px' }}><strong>신청자:</strong> {selectedBooking.applicant}</div>
                                    <div className="detail-item"><strong>연락처:</strong> {selectedBooking.phone}</div>
                                    <div className="detail-item"><strong>이메일:</strong> {selectedBooking.email}</div>
                                    <div className="detail-item"><strong>행사명:</strong> {selectedBooking.eventName}</div>
                                    <div className="detail-item"><strong>행사인원:</strong> {selectedBooking.numPeople}명</div>
                                    <div className="detail-item"><strong>냉난방:</strong> {selectedBooking.acUse === 'yes' ? '사용함' : '사용 안 함'}</div>

                                    <div className="modal-buttons">
                                        {/* 사용중인 예약인 경우에만 '퇴실' 버튼 표시 */}
                                        {selectedBooking.displayStatus === '사용중' && (
                                            <button
                                                className="checkout-btn"
                                                onClick={handleCheckout}
                                            >
                                                퇴실
                                            </button>
                                        )}

                                        {/* '다시 예약하기' 버튼: 취소된 예약이 아닌 경우에만 표시 */}
                                        <button
                                            className="confirm-btn" // 초록색 버튼
                                            onClick={handleRebook}
                                            disabled={selectedBooking.displayStatus === '취소'}
                                        >
                                            다시 예약하기
                                        </button>

                                        <button
                                            className="cancel-btn"
                                            onClick={handleCancel}
                                            // 지난 예약 또는 이미 취소된 예약은 취소 불가
                                            disabled={selectedBooking.displayStatus === '지난예약' || selectedBooking.displayStatus === '사용중'}
                                        >
                                            예약 취소
                                        </button>
                                        <button
                                            className="edit-btn"
                                            onClick={handleEditMode}
                                            // 지난 예약 또는 이미 취소된 예약은 수정 불가
                                            disabled={selectedBooking.displayStatus === '지난예약' || selectedBooking.displayStatus === '사용중'}
                                        >
                                            정보 수정
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

export default BookingHistory;