import React, { useState, useEffect } from 'react';
import './BookingHistoryPage.css';

const API_BASE_URL = 'http://localhost:8080/api';

// DUMMY_BOOKINGS 제거됨

const BookingHistory = ({ onNavigate }) => {
    const [bookings, setBookings] = useState([]);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editData, setEditData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/bookings`);
            if (!response.ok) throw new Error('서버 응답 오류');
            const data = await response.json();
            const updatedBookings = data.map(booking => ({
                ...booking,
                displayStatus: getBookingStatus(booking)
            }));
            // dateKey를 기반으로 예약 목록 정렬
            updatedBookings.sort((a, b) => a.dateKey - b.dateKey);
            setBookings(updatedBookings);
        } catch (err) {
            // 서버 통신 실패 시 에러 메시지 설정
            setError('예약 목록을 불러오는 데 실패했습니다.');
        }
        setLoading(false);
    };

    const getBookingStatus = (booking) => {
        // 1. 서버에서 이미 결정된 상태 (확정대기, 취소) 우선 처리
        if (booking.status === '확정대기') return '확정대기';
        if (booking.status === '취소') return '취소';

        const now = new Date();

        // 날짜 파싱 및 DateTime 객체 생성
        const dateParts = booking.date.match(/(\d{4})년 (\d{2})월 (\d{2})일/);
        if (!dateParts) return booking.status || '확정';

        const dateString = `${dateParts[1]}/${dateParts[2]}/${dateParts[3]}`;
        const startDateTime = new Date(`${dateString} ${booking.startTime}`);
        const endDateTime = new Date(`${dateString} ${booking.endTime}`);

        // 2. 시간 기준 상태 판별
        const nowTime = now.getTime();
        const startTime = startDateTime.getTime();
        const endTime = endDateTime.getTime();

        if (endTime < nowTime) {
            // 종료 시간이 현재보다 과거이면
            return '지난예약';
        } else if (startTime <= nowTime && nowTime < endTime) {
            // 현재 시간이 예약 시작 시간 이후이고 종료 시간 이전이면
            return '사용중';
        } else {
            // (startTime > nowTime) 예약 시작 시간이 현재보다 미래이면
            return '확정';
        }
    };

    const handleRowClick = (booking) => {
        setSelectedBooking(booking);
        setIsModalOpen(true);
        setIsEditMode(false);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedBooking(null);
        setIsEditMode(false);
        setEditData({});
    };

    const handleCancel = async () => {
        if (!selectedBooking) return;
        const bookingId = selectedBooking.id;

        if (window.confirm('예약을 취소하시겠습니까?')) {
            try {
                // 🚨 서버 통신: PATCH 요청으로 상태 변경 (취소)
                const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/cancel`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) throw new Error('예약 취소에 실패했습니다.');

                // 클라이언트 상태 업데이트 (임시 취소 사유 반영)
                const updatedBookings = bookings.map(booking =>
                    booking.id === bookingId
                        ? { ...booking, status: '취소', displayStatus: '취소', cancelReason: '사용자 요청 취소 (API)' }
                        : booking
                );
                setBookings(updatedBookings);
                const updatedSelected = { ...selectedBooking, status: '취소', displayStatus: '취소', cancelReason: '사용자 요청 취소 (API)' };
                setSelectedBooking(updatedSelected);
                alert('예약이 취소되었습니다.');
                closeModal();

            } catch (err) {
                alert(`예약 취소 중 오류가 발생했습니다: ${err.message}`);
            }
        }
    };

    const handleEditMode = () => {
        setEditData({
            // 수정 모드 진입 시 상태를 '확정대기'로 강제 설정하여 서버에 전달
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

    const handleEditChange = (field, value) => {
        setEditData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleEditConfirm = async () => {
        if (!selectedBooking) return;
        const bookingId = selectedBooking.id;

        try {
            // 🚨 서버 통신: PATCH 요청으로 데이터 수정
            const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(editData),
            });

            if (!response.ok) throw new Error('예약 정보 수정에 실패했습니다.');

            // 클라이언트 상태 업데이트
            const updatedBookings = bookings.map(booking =>
                booking.id === bookingId
                    ? {
                        ...booking,
                        ...editData,
                        displayStatus: getBookingStatus({ ...booking, ...editData })
                    }
                    : booking
            );
            setBookings(updatedBookings);
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

    const handleEditCancel = () => {
        setIsEditMode(false);
        setEditData({});
    };

    // 💡 에러 및 로딩 상태 처리 JSX 함수
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
        <div className="login-container">
            <button
                className="back-button fixed-left"
                onClick={() => onNavigate('ReservationMenuPage')}
            >
                뒤로가기
            </button>
            <div className="top-title">
                <h1 className="page-title">📝 나의 예약 내역</h1>
            </div>
            <div className="history-container">
                <div className="table-center-box">
                    {renderContent()}
                </div>
            </div>
            {isModalOpen && selectedBooking && (
                <div id="detail-modal" style={{
                    display: 'block', position: 'fixed', zIndex: 1000, left: 0, top: 0,
                    width: '100%', height: '100%', overflow: 'auto', backgroundColor: 'rgba(0,0,0,0.4)'
                }} onClick={closeModal}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <span className="close-btn" onClick={closeModal}>&times;</span>
                        <h2 className="modal-title">{isEditMode ? '예약 정보 수정' : '예약 상세 정보'}</h2>
                        <div id="modal-details">
                            {/* 💡 1. 상태가 취소일 경우 */}
                            {selectedBooking.status === '취소' ? (
                                <>
                                    <div className="detail-item"><strong>상태:</strong> <span className={`status-badge status-취소`}>취소</span></div>
                                    <div className="detail-item"><strong>장소:</strong> {selectedBooking.room} ({selectedBooking.location})</div>
                                    <div className="detail-item"><strong>날짜:</strong> {selectedBooking.date}</div>
                                    <div className="detail-item"><strong>시간:</strong> {`${selectedBooking.startTime} ~ ${selectedBooking.endTime}`}</div>
                                    <div className="detail-item" style={{ marginTop: '15px' }}><strong>신청자:</strong> {selectedBooking.applicant}</div>
                                    <div className="detail-item"><strong>연락처:</strong> {selectedBooking.phone}</div>

                                    {/* 🚨 취소 사유 표시 칸 */}
                                    <div className="detail-item cancel-reason-box" style={{
                                        flexDirection: 'column', alignItems: 'flex-start', borderTop: '1px solid #ddd', paddingTop: '10px', marginTop: '15px'
                                    }}>
                                        <strong style={{ color: '#dc3545', width: '100%', marginBottom: '5px' }}>취소 사유</strong>
                                        <p style={{ margin: 0, padding: '8px 10px', border: '1px solid #eee', width: '100%', borderRadius: '5px', backgroundColor: '#f8f8f8', whiteSpace: 'pre-wrap' }}>
                                            {selectedBooking.cancelReason || '사유 정보 없음'}
                                        </p>
                                    </div>

                                    <div className="modal-buttons" style={{ marginTop: '15px' }}>
                                        <button className="confirm-btn" onClick={closeModal}>
                                            확인
                                        </button>
                                    </div>
                                </>
                                // 💡 2. 수정 모드일 경우 (상태가 취소가 아닐 때만 가능)
                            ) : isEditMode ? (
                                <>
                                    <div className="detail-item"><strong>상태:</strong> <span className={`status-badge status-확정대기`}>확정대기</span></div>
                                    <div className="detail-item"><strong>장소:</strong> {selectedBooking.room} ({selectedBooking.location}) <span className="readonly-text">(수정 불가)</span></div>
                                    <div className="detail-item"><strong>날짜:</strong> {selectedBooking.date} <span className="readonly-text">(수정 불가)</span></div>
                                    <div className="detail-item"><strong>시간:</strong> {`${selectedBooking.startTime} ~ ${selectedBooking.endTime}`} <span className="readonly-text">(수정 불가)</span></div>
                                    <div className="edit-item">
                                        <strong>신청자:</strong>
                                        <input
                                            type="text"
                                            value={editData.applicant}
                                            onChange={(e) => handleEditChange('applicant', e.target.value)}
                                            className="edit-input"
                                        />
                                    </div>
                                    <div className="edit-item">
                                        <strong>연락처:</strong>
                                        <input
                                            type="text"
                                            value={editData.phone}
                                            onChange={(e) => handleEditChange('phone', e.target.value)}
                                            className="edit-input"
                                        />
                                    </div>
                                    <div className="edit-item">
                                        <strong>이메일:</strong>
                                        <input
                                            type="email"
                                            value={editData.email}
                                            onChange={(e) => handleEditChange('email', e.target.value)}
                                            className="edit-input"
                                        />
                                    </div>
                                    <div className="edit-item">
                                        <strong>행사명:</strong>
                                        <input
                                            type="text"
                                            value={editData.eventName}
                                            onChange={(e) => handleEditChange('eventName', e.target.value)}
                                            className="edit-input"
                                        />
                                    </div>
                                    <div className="edit-item">
                                        <strong>행사인원:</strong>
                                        <input
                                            type="number"
                                            value={editData.numPeople}
                                            onChange={(e) => handleEditChange('numPeople', parseInt(e.target.value))}
                                            className="edit-input"
                                            min="1"
                                        />
                                    </div>
                                    <div className="edit-item">
                                        <strong>냉난방:</strong>
                                        <select
                                            value={editData.acUse}
                                            onChange={(e) => handleEditChange('acUse', e.target.value)}
                                            className="edit-select"
                                        >
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
                                // 💡 3. 기본 상세 정보/버튼 표시 (취소 상태도 아니고 수정 모드도 아닐 때)
                            ) : (
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
                                        <button className="cancel-btn" onClick={handleCancel} disabled={selectedBooking.status === '취소'}>
                                            예약 취소
                                        </button>
                                        <button className="edit-btn" onClick={handleEditMode} disabled={selectedBooking.status === '취소'}>
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