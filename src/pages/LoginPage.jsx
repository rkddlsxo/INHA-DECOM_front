import React, { useState } from 'react';
import './LoginPage.css'; // 로그인 페이지 CSS 파일 임포트

// 백엔드 로그인 API 주소 설정
const API_URL = 'http://localhost:5050/api/login';

/**
 * 사용자 로그인 폼을 렌더링하고 인증을 처리하는 컴포넌트입니다.
 * @param {object} props - 컴포넌트 속성
 * @param {function} props.onNavigate - 페이지 이동을 처리하는 함수
 * @param {function} props.handleLogin - 로그인 성공 시 상태를 업데이트하는 함수
 */
const LoginPage = ({ onNavigate, handleLogin }) => {

    // 사용자 ID (학번) 상태
    const [id, setId] = useState('');
    // 비밀번호 상태
    const [password, setPassword] = useState('');
    // 에러 메시지 상태
    const [error, setError] = useState('');
    // 로딩 상태 (API 호출 중)
    const [isLoading, setIsLoading] = useState(false);

    /**
     * ID 입력 필드 변경을 처리하고 에러 메시지를 초기화합니다.
     * @param {object} e - 이벤트 객체
     */
    const handleIdChange = (e) => {
        setId(e.target.value);
        setError('');
    };

    /**
     * 비밀번호 입력 필드 변경을 처리하고 에러 메시지를 초기화합니다.
     * @param {object} e - 이벤트 객체
     */
    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
        setError('');
    };

    /**
     * 폼 제출을 처리하고 로그인 API를 호출합니다.
     * @param {object} e - 폼 제출 이벤트 객체
     */
    const handleSubmit = async (e) => {
        e.preventDefault();

        // 클라이언트 측 유효성 검사: 필수 입력 확인
        if (!id || !password) {
            setError('학번과 비밀번호를 모두 입력해주세요.');
            return;
        }

        // 클라이언트 측 유효성 검사: 학번 형식 (8자리 숫자) 확인
        if (id.length !== 8 || !/^\d+$/.test(id)) {
            setError('학번은 8자리 숫자여야 합니다.');
            return;
        }

        setError(''); // 에러 초기화
        setIsLoading(true); // 로딩 시작

        try {
            // 로그인 API 호출
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                // ID와 비밀번호를 JSON 형태로 요청 본문에 담아 전송
                body: JSON.stringify({ id, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // HTTP Status Code 200 OK: 로그인 성공 처리

                // 응답 데이터에서 토큰과 사용자 이름 추출
                const { token, username, message } = data;

                // 토큰과 사용자 정보를 LocalStorage에 저장
                localStorage.setItem('authToken', token);
                localStorage.setItem('username', username);

                console.log(message || `${username}님, 환영합니다!`);

                // 부모 컴포넌트의 로그인 상태를 '성공'으로 업데이트
                if (handleLogin) {
                    handleLogin(true);
                }
                // * 페이지 전환은 로그인 성공 후 상위 컴포넌트에서 상태 변경 감지 후 처리될 것으로 가정합니다.

            } else {
                // 로그인 실패 처리 (예: 400, 401 오류)

                // 백엔드에서 제공한 에러 메시지 사용, 없을 경우 일반 메시지 사용
                setError(data.error || '로그인에 실패했습니다. 다시 시도해주세요.');

                // 401 Unauthorized 오류의 경우 저장된 토큰 제거 (보안)
                if (response.status === 401) {
                    localStorage.removeItem('authToken');
                }
            }

        } catch (err) {
            // 네트워크 오류 또는 기타 예외 처리
            console.error('로그인 API 호출 오류:', err);
            setError('서버와 통신할 수 없습니다. 네트워크 상태를 확인해주세요.');
        } finally {
            setIsLoading(false); // 로딩 종료
        }
    };

    return (
        // 전체 페이지 배경 및 중앙 정렬을 위한 래퍼
        <div className="login-page-wrapper">
            {/* 로그인 폼 컨테이너 (흰색 박스) */}
            <div className="login-container">

                {/* 시스템 제목 */}
                <h2 className="login-heading">시설물 관리 시스템</h2>

                <form onSubmit={handleSubmit}>

                    {/* ID (학번) 입력 그룹 */}
                    <div className="form-group">
                        <label htmlFor="id" className="form-label">학번 (ID)</label>
                        <input
                            type="text"
                            id="id"
                            value={id}
                            onChange={handleIdChange}
                            required
                            className="form-input"
                            placeholder="학번 8자리를 입력하세요"
                            disabled={isLoading} // 로딩 중 비활성화
                            maxLength={8}
                        />
                    </div>

                    {/* 비밀번호 입력 그룹 */}
                    <div className="form-group">
                        <label htmlFor="password" className="form-label">비밀번호</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={handlePasswordChange}
                            required
                            className="form-input"
                            placeholder="비밀번호를 입력하세요"
                            disabled={isLoading} // 로딩 중 비활성화
                        />
                    </div>

                    {/* 에러 메시지 표시 */}
                    {error && <p className="error-message">{error}</p>}

                    {/* 로그인 버튼 */}
                    <button type="submit" className="login-button" disabled={isLoading}>
                        {isLoading ? '로그인 중...' : '로그인'}
                    </button>

                    {/* 회원가입 버튼 */}
                    <button
                        type="button"
                        onClick={() => onNavigate('registerPage')}
                        className="register-button"
                        disabled={isLoading} // 로딩 중 비활성화
                    >
                        회원가입
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;