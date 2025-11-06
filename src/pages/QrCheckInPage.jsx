import React, { useRef, useEffect, useState } from 'react';
import './QrCheckInPage.css';

// API 기본 URL 정의
const API_BASE_URL = 'http://localhost:5050/api';

/**
 * QR 코드를 통해 시설 체크인을 처리하는 페이지 컴포넌트입니다.
 * QR 코드에서 추출한 spaceId와 사용자의 GPS 위치를 서버로 전송합니다.
 * @param {object} props - 컴포넌트 속성
 * @param {string} props.spaceId - QR 코드를 통해 전달된 시설 공간 ID
 * @param {function} props.onNavigate - 페이지 이동을 처리하는 함수
 */
function QrCheckInPage({ spaceId, onNavigate }) {

    // 로딩 상태 (체크인 과정 진행 중)
    const [isLoading, setIsLoading] = useState(true);
    // 사용자에게 표시할 현재 상태 메시지
    const [statusMessage, setStatusMessage] = useState('체크인 처리 중...');
    // 오류 메시지 상태
    const [error, setError] = useState('');
    // 체크인 성공 시 반환되는 예약 정보
    const [bookingInfo, setBookingInfo] = useState(null);

    // React.StrictMode 환경에서 useEffect가 두 번 실행되는 것을 방지하기 위한 참조
    const effectRan = useRef(false);

    // 컴포넌트 마운트 시 (또는 spaceId/onNavigate 변경 시) 체크인 로직 실행
    useEffect(() => {

        // StrictMode의 이중 실행 방지
        if (effectRan.current === true) {
            return;
        }

        /**
         * 서버에 체크인 요청을 보내는 함수.
         * @param {string} token - 인증 토큰
         * @param {number} latitude - 사용자의 현재 위도
         * @param {number} longitude - 사용자의 현재 경도
         */
        const attemptCheckIn = async (token, latitude, longitude) => {
            setStatusMessage('서버로 체크인 요청 중...');
            try {
                // API 호출: space_id, 위도(lat), 경도(lng)를 쿼리 파라미터로 전송
                const response = await fetch(
                    `${API_BASE_URL}/check-in?space_id=${spaceId}&lat=${latitude}&lng=${longitude}`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}` // 인증 토큰 전달
                        }
                    }
                );

                const data = await response.json();

                if (response.ok) {
                    // 체크인 성공 처리
                    setStatusMessage(data.message);
                    setBookingInfo(data);
                } else {
                    // 체크인 실패 처리
                    let errorMsg = data.error || '체크인에 실패했습니다.';
                    if (data.details) {
                        // 백엔드에서 전송한 GPS 오차 관련 상세 에러 메시지 추가
                        errorMsg += ` (${data.details})`;
                    }
                    setError(errorMsg);
                }
            } catch (err) {
                setError('서버에 연결할 수 없습니다.');
            } finally {
                setIsLoading(false); // 로딩 종료
            }
        };

        // 로컬 저장소에서 인증 토큰 확인
        const token = localStorage.getItem('authToken');
        if (!token) {
            alert('로그인이 필요합니다. 체크인을 위해 로그인 해주세요.');
            onNavigate('loginPage'); // 로그인 페이지로 이동
            return;
        }

        // spaceId (QR 정보) 유효성 확인
        if (!spaceId) {
            setError('유효하지 않은 QR 코드입니다. (장소 ID 없음)');
            setIsLoading(false);
            return;
        }

        // GPS 위치 정보 요청
        setStatusMessage('GPS 위치 정보를 요청하는 중...');

        if (!navigator.geolocation) {
            // 브라우저가 GPS 기능을 지원하지 않는 경우 오류 처리
            setError('오류: 이 브라우저에서는 GPS 위치 확인을 지원하지 않습니다.');
            setIsLoading(false);
            return;
        }

        // GPS 위치 획득 시도
        navigator.geolocation.getCurrentPosition(
            (position) => {
                // GPS 좌표 획득 성공
                const { latitude, longitude } = position.coords;
                // 획득한 좌표로 서버 체크인 시도
                attemptCheckIn(token, latitude, longitude);
            },
            (geoError) => {
                // GPS 획득 실패 (권한 거부 등)
                let errorMsg = 'GPS 위치를 확인할 수 없습니다.';
                if (geoError.code === 1) { // PERMISSION_DENIED
                    errorMsg = 'GPS 권한을 허용해야 체크인이 가능합니다.';
                }
                setError(errorMsg);
                setIsLoading(false);
            },
            { // GPS 옵션 설정
                enableHighAccuracy: true, // 높은 정확도 요구
                timeout: 10000,           // 10초 타임아웃
                maximumAge: 0             // 캐시된 위치 사용 안 함
            }
        );

        // useEffect 정리 함수: effectRan 플래그 설정
        return () => {
            effectRan.current = true;
        };

    }, [spaceId, onNavigate]); // spaceId 또는 onNavigate 변경 시 재실행


    return (
        <div className="qr-check-in-container">
            {/* 로딩 중 메시지 */}
            {isLoading && (
                <h2 className="status-message loading">{statusMessage}</h2>
            )}

            {/* 오류 메시지 */}
            {!isLoading && error && (
                <h1 className="status-message error">❌ {error}</h1>
            )}

            {/* 체크인 성공 상세 정보 */}
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
                    >
                        퇴실하기
                    </button>
                </div>
            )}

            {/* 메인으로 돌아가기 버튼 (성공/실패 시 모두 표시) */}
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