import React, { useRef, useEffect, useState } from 'react';
import './QrCheckInPage.css';

const API_BASE_URL = 'http://localhost:5050/api';

function QrCheckInPage({ spaceId, onNavigate }) { 
    
    const [isLoading, setIsLoading] = useState(true);
    const [statusMessage, setStatusMessage] = useState('체크인 처리 중...');
    const [error, setError] = useState('');
    const [bookingInfo, setBookingInfo] = useState(null);

    const effectRan = useRef(false); //strictmode의 race condition 방지를 위해 api 호출하지 않도록

    useEffect(() => {
        
        if (effectRan.current === true) {
            return;
        }
        
        const attemptCheckIn = async (token) => {
            setStatusMessage('서버로 체크인 요청 중...');
            try {
                const response = await fetch(`${API_BASE_URL}/check-in?space_id=${spaceId}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                const data = await response.json();

                if (response.ok) {
                    setStatusMessage(data.message);
                    setBookingInfo(data);
                } else {
                    setError(data.error || '체크인에 실패했습니다.');
                }
            } catch (err) {
                setError('서버에 연결할 수 없습니다.');
            } finally {
                setIsLoading(false);
            }
        };

        // 4. 'authToken' 키로 토큰을 가져옴
        const token = localStorage.getItem('authToken');
        if (!token) {
            alert('로그인이 필요합니다. 체크인을 위해 로그인 해주세요.');
            onNavigate('loginPage'); 
            return;
        }

        if (!spaceId) {
            setError('유효하지 않은 QR 코드입니다. (장소 ID 없음)');
            setIsLoading(false);
            return;
        }

        attemptCheckIn(token);
        
        return () => {
            effectRan.current = true;
        };

    }, [spaceId, onNavigate]);

    
    return (
        <div className="qr-check-in-container">
            {isLoading && (
                <h2 className="status-message loading">{statusMessage}</h2>
            )}

            {!isLoading && error && (
                <h1 className="status-message error">❌ {error}</h1>
            )}

            {!isLoading && !error && bookingInfo && (
                <div className="success-details-wrapper">
                    <h1 className="status-message success">{statusMessage}</h1>
                    
                    <div className="check-in-details">
                        <p><strong>예약자명:</strong> {bookingInfo.user_name}</p>
                        <p><strong>예약장소:</strong> {bookingInfo.space_name}</p>
                        <p><strong>예약시간:</strong> {bookingInfo.start_time} ~ {bookingInfo.end_time}</p>
                    </div>

                    <button 
                        className="checkout-button" 
                        onClick={() => alert('퇴실 기능은 추후 구현 예정입니다.')}
                        // TODO: 퇴실 버튼 기능 구현 (추후 구현 예정)
                    >
                        퇴실하기
                    </button>
                </div>
            )}
            <button 
                className="back-to-main-button"
                onClick={() => onNavigate('main')}
            >
                메인으로 돌아가기
            </button>
        </div>
    );
}

export default QrCheckInPage;