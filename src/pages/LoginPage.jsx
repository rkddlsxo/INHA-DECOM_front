import React, { useState } from 'react';
import './LoginPage.css'; // 스타일 파일은 그대로 사용합니다.

// 백엔드 API 주소를 설정합니다. 실제 서버 주소로 변경해주세요.
const API_URL = 'http://localhost:8080/api/login';

// 1. 컴포넌트 이름은 대문자 'LoginPage'로 시작
// 2. Props는 하나의 객체 인자로 받습니다.
const LoginPage = ({ onNavigate, handleLogin }) => {

    // 1. 상태 설정
    // 백엔드 명세에 맞춰 사용자 입력은 'id' (학번)와 'password'로 변경
    const [id, setId] = useState(''); // 학번 (id)
    const [password, setPassword] = useState(''); // 비밀번호
    const [error, setError] = useState(''); // 에러 메시지
    const [isLoading, setIsLoading] = useState(false); // 로딩 상태 추가

    // 2. 로그인 정보 입력 핸들러
    const handleIdChange = (e) => {
        setId(e.target.value);
        setError('');
    };
    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
        setError('');
    };

    // 3. 폼 제출 및 API 통신 처리
    const handleSubmit = async (e) => {
        e.preventDefault();

        // //테스트용 바로 넘어가게 만들기
        // if (id && password) {
        //     handleLogin(true);
        //     onNavigate('main');
        //     return;
        // }
        // 3-1. 클라이언트 측 유효성 검사 (필수 입력 확인)
        if (!id || !password) {
            setError('학번과 비밀번호를 모두 입력해주세요.');
            return;
        }

        // 3-2. 학번 형식 검사 (8자리 확인)
        if (id.length !== 8 || !/^\d+$/.test(id)) {
            setError('학번은 8자리 숫자여야 합니다.');
            return;
        }

        setError(''); // 에러 초기화
        setIsLoading(true); // 로딩 시작

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                // 백엔드 명세에 맞춰 'id'와 'password'를 요청 본문으로 전송
                body: JSON.stringify({ id, password }),
            });

            const data = await response.json();

            if (response.ok) { // Status Code 200 OK (성공)
                // 3-3. 로그인 성공 처리

                // 💡 응답 데이터에서 토큰과 사용자 이름 가져오기
                const { token, username, message } = data;

                // 토큰과 사용자 정보를 localStorage에 저장
                localStorage.setItem('authToken', token);
                localStorage.setItem('username', username);

                alert(message || `${username}님, 환영합니다!`);

                // 부모 컴포넌트(App.js 등)의 로그인 상태 및 페이지 전환
                if (handleLogin) {
                    handleLogin(true); // 로그인 상태 업데이트
                }
                if (onNavigate) {
                    onNavigate('main'); // 메인 페이지로 이동
                }

            } else {
                // 3-4. 로그인 실패 처리 (400 Bad Request, 401 Unauthorized)

                // 백엔드에서 제공한 에러 메시지 사용
                setError(data.error || '로그인에 실패했습니다. 다시 시도해주세요.');

                // 401 Unauthorized 오류의 경우 토큰을 제거 (혹시 남아있을 경우)
                if (response.status === 401) {
                    localStorage.removeItem('authToken');
                }
            }

        } catch (err) {
            // 3-5. 네트워크 오류 처리
            console.error('로그인 API 호출 오류:', err);
            setError('서버와 통신할 수 없습니다. 네트워크 상태를 확인해주세요.');
        } finally {
            setIsLoading(false); // 로딩 종료
        }
    };

    // 4. JSX (UI) 구성
    return (
        <div className="login-container">
            <h2 className="login-heading">로그인</h2>
            <form onSubmit={handleSubmit}>

                <div className="form-group">
                    <label htmlFor="id" className="form-label">학번 (ID):</label>
                    {/* id 상태와 handleIdChange 함수를 연결 */}
                    <input type="text" id="id" value={id} onChange={handleIdChange} required className="form-input" placeholder="학번 8자리를 입력하세요" disabled={isLoading} maxLength={8} />
                </div>

                <div className="form-group">
                    <label htmlFor="password" className="form-label">비밀번호:</label>
                    <input type="password" id="password" value={password} onChange={handlePasswordChange} required className="form-input" placeholder="비밀번호를 입력하세요" disabled={isLoading} />
                </div>

                {error && <p className="error-message">{error}</p>}

                {/* 로딩 중일 때 버튼 비활성화 */}
                <button type="submit" className="login-button" disabled={isLoading}>
                    {isLoading ? '로그인 중...' : '로그인'}
                </button>


                <button type="button" onClick={() => onNavigate('registerPage')} className="register-button">회원가입</button>
            </form>
        </div>
    );
};

export default LoginPage;