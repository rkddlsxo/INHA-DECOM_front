import React, { useState, useEffect } from 'react';
import './BookingHistoryPage.css';
// ⭐️ 아이콘 추가
import { BsArrowLeft } from 'react-icons/bs';

const API_BASE_URL = 'http://localhost:8080/api';

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
            // ⭐️ 토큰을 함께 전송 (로그인 된 사용자의 예약만 가져오기)
            const token = localStorage.getItem('authToken'); 
            if (!token) {
                throw new Error('로그인이 필요합니다.');
            }

            const response = await fetch(`${API_BASE_URL}/bookings/my`, { // ⭐️ 엔드포인트 /bookings/my (예시)
                headers: {
                    'Authorization': `Bearer ${token}` // ⭐️ 헤더에 토큰 추가
                }
            });
            
            if (response.status === 401 || response.status === 403) {
                 throw new Error('인증에 실패했습니다. 다시 로그인해주세요.');
            }
            if (!response.ok) throw new Error('서버 응답 오류');

            const data = await response.json();
            const updatedBookings = data.map(booking => ({
                ...booking,
                displayStatus: getBookingStatus(booking)
            }));
            
            // ⭐️ 날짜(date)와 시작 시간(startTime)으로 정렬 (최신순)
            updatedBookings.sort((a, b) => {
                const dateA = new Date(`${a.date} ${a.startTime}`);
                const dateB = new Date(`${b.date} ${b.startTime}`);
                return dateB - dateA; // 내림차순 (최신순)
            });
            setBookings(updatedBookings);
        } catch (err) {
            setError(err.message || '예약 목록을 불러오는 데 실패했습니다.');
        }
        setLoading(false);
    };

    const getBookingStatus = (booking) => {
        if (booking.status === '확정대기') return '확정대기';
        if (booking.status === '취소') return '취소';

        const now = new Date();
        
        // ⭐️ 날짜 형식이 'YYYY-MM-DD'라고 가정 (서버 응답 기준)
        const startDateTime = new Date(`${booking.date}T${booking.startTime}`);
        const endDateTime = new Date(`${booking.date}T${booking.endTime}`);

        if (isNaN(startDateTime) || isNaN(endDateTime)) {
             // ⭐️ booking.date가 "YYYY년 MM월 DD일" 형식일 때의 폴백
            const dateParts = booking.date.match(/(\d{4})년 (\d{2})월 (\d{2})일/);
            if (!dateParts) return booking.status || '확정';

            const dateString = `${dateParts[1]}-${dateParts[2]}-${dateParts[3]}`;
            const parsedStart = new Date(`${dateString}T${booking.startTime}`);
            const parsedEnd = new Date(`${dateString}T${booking.endTime}`);
            
            if (isNaN(parsedStart) || isNaN(parsedEnd)) return booking.status || '확정';

            const nowTime = now.getTime();
            const startTime = parsedStart.getTime();
            const endTime = parsedEnd.getTime();

            if (endTime < nowTime) return '지난예약';
            if (startTime <= nowTime && nowTime < endTime) return '사용중';
            return '확정';
        }

        const nowTime = now.getTime();
        const startTime = startDateTime.getTime();
        const endTime = endDateTime.getTime();

        if (endTime < nowTime) return '지난예약';
        if (startTime <= nowTime && nowTime < endTime) return '사용중';
        return '확정';
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

        // ⭐️ window.confirm 대신 alert 사용 (프로젝트 표준)
        // (추후엔 이 부분도 모달로 바꾸는 것이 좋습니다)
        if (!window.confirm('예약을 취소하시겠습니까?')) {
            return;
        }
            
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/cancel`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // ⭐️ 토큰 추가
                },
            });

            if (!response.ok) throw new Error('예약 취소에 실패했습니다.');

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

    const handleEditMode = () => {
        setEditData({
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
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // ⭐️ 토큰 추가
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
        // ⭐️ 루트 클래스 변경
        <div className="history-page-container">
            {/* ⭐️ 뒤로가기 버튼 스타일 변경 */}
            <button
                className="back-button" // ⭐️ 'fixed-left' 제거, 아이콘 추가
                onClick={() => onNavigate('reservation')} // ⭐️ ReservationMenuPage로 이동
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
            
            {/* ⭐️ 모달 인라인 스타일 제거, CSS 클래스 적용 */}
            {isModalOpen && selectedBooking && (
                <div id="detail-modal" className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <span className="close-btn" onClick={closeModal}>&times;</span>
                        <h2 className="modal-title">{isEditMode ? '예약 정보 수정' : '예약 상세 정보'}</h2>
                        <div id="modal-details">
                            
                            {selectedBooking.status === '취소' ? (
                                <>
                                    <div className="detail-item"><strong>상태:</strong> <span className={`status-badge status-취소`}>취소</span></div>
                                    <div className="detail-item"><strong>장소:</strong> {selectedBooking.room} ({selectedBooking.location})</div>
                                    <div className="detail-item"><strong>날짜:</strong> {selectedBooking.date}</div>
                                    <div className="detail-item"><strong>시간:</strong> {`${selectedBooking.startTime} ~ ${selectedBooking.endTime}`}</div>
                                    <div className="detail-item" style={{ marginTop: '15px' }}><strong>신청자:</strong> {selectedBooking.applicant}</div>
                                    <div className="detail-item"><strong>연락처:</strong> {selectedBooking.phone}</div>

                                    {/* ⭐️ CSS 클래스 적용 */}
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
                                            onChange={(e) => handleEditChange('numPeople', parseInt(e.target.value) || 1)}
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
                                    
                                    {/* ⭐️ 지난예약/사용중일 때 버튼 비활성화 */}
                                    <div className="modal-buttons">
                                        <button 
                                            className="cancel-btn" 
                                            onClick={handleCancel} 
                                            disabled={selectedBooking.displayStatus === '지난예약' || selectedBooking.displayStatus === '사용중'}
                                        >
                                            예약 취소
                                        </button>
                                        <button 
                                            className="edit-btn" 
                                            onClick={handleEditMode} 
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

