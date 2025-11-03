import React, { useState } from 'react';
import './LoginPage.css'; // 1단계에서 수정한 CSS 파일을 import 합니다.

// 백엔드 API 주소를 설정합니다. 실제 서버 주소로 변경해주세요.
const API_URL = 'http://localhost:5050/api/login';

const LoginPage = ({ onNavigate, handleLogin }) => {

    const [id, setId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleIdChange = (e) => {
        setId(e.target.value);
        setError('');
    };
    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        /* // //테스트용 바로 넘어가게 만들기 (⭐️ 백엔드 통신을 위해 주석 처리)
        if (id && password) {
             handleLogin(true);
             onNavigate('main');
             return;
        }
        */
        
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
                
                // alert() 대신 콘솔 로그 사용을 권장합니다.
                console.log(message || `${username}님, 환영합니다!`);

                // 부모 컴포넌트(App.js 등)의 로그인 상태 및 페이지 전환
                if (handleLogin) {
                    handleLogin(true); // 로그인 상태 업데이트
                }
                //onNavigate('main') 삭제: qr 로그인 화면에서도 main으로 강제 전환됨

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

    // 1. ⭐️ CSS에서 만든 전체 배경을 적용하기 위해 래퍼(wrapper)를 추가합니다.
    return (
        <div className="login-page-wrapper">
            <div className="login-container">
                {/* TODO: 여기에 인하대학교 로고 이미지를 추가하면 훨씬 좋습니다.
                  <img src="/inha_logo.png" alt="Inha Logo" style={{width: "150px", margin: "0 auto 1.5rem", display: "block"}} /> 
                */}
                
                {/* 2. ⭐️ 제목을 "로그인" 대신 시스템 이름으로 변경 */}
                <h2 className="login-heading">시설물 관리 시스템</h2>
                <form onSubmit={handleSubmit}>

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
                            disabled={isLoading} 
                            maxLength={8} 
                        />
                    </div>

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
                            disabled={isLoading} 
                        />
                    </div>

                    {error && <p className="error-message">{error}</p>}

                    <button type="submit" className="login-button" disabled={isLoading}>
                        {isLoading ? '로그인 중...' : '로그인'}
                    </button>

                    {/* 3. ⭐️ 회원가입 버튼에도 disabled={isLoading}을 추가합니다. */}
                    <button 
                        type="button" 
                        onClick={() => onNavigate('registerPage')} 
                        className="register-button"
                        disabled={isLoading} 
                    >
                        회원가입
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;

