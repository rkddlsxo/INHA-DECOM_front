import React, { useState } from 'react';
// CSS 파일을 import 합니다.
import './LoginPage.css';
// 만약 회원가입 전용 스타일을 RegisterPage.css에 따로 만들었다면,
// import './RegisterPage.css'; 도 추가합니다.

const API_URL = 'http://localhost:8080/api/register';

const RegisterPage = ({ onNavigate }) => {
    // 백엔드 명세: id (학번), username (이름), password (비밀번호)
    const [id, setId] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // ... (핸들러 함수들 및 handleSubmit 로직은 이전에 fetch로 구현했던 것과 유사하게 작성)
    const handleIdChange = (e) => {
        setId(e.target.value);
        setError('');   // 에러 초기화
    };
    const handleUsernameChange = (e) => {
        setUsername(e.target.value);
        setError('');
    };
    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // 클라이언트 측 유효성 검사
        if (!id || !username || !password) {
            setError('모든 필드를 입력해주세요.');
            return;
        }
        if (id.length !== 8 || !/^\d+$/.test(id)) {
            setError('학번은 8자리 숫자여야 합니다.');
            return;
        }
        setError('');
        setIsLoading(true);
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, username, password }),
            });
            const data = await response.json();
            if (response.ok) {
                // 회원가입 성공 시 로그인 페이지로 이동
                onNavigate('loginPage');
            }
            else {
                setError(data.message || '회원가입에 실패했습니다.');
            }
        } catch (error) {
            setError('서버와 통신 중 오류가 발생했습니다.');
        }
        setIsLoading(false);
    }
    return (
        // 폼 컨테이너, 헤딩, 폼 그룹 등은 로그인 페이지와 동일한 클래스 사용
        <div className="login-container">
            <h2 className="login-heading">회원가입</h2>
            <form onSubmit={handleSubmit}>

                {/* 1. 학번 (ID) 입력 */}
                <div className="form-group">
                    <label htmlFor="register-id" className="form-label">학번 (ID):</label>
                    <input
                        type="text"
                        id="register-id"
                        value={id}
                        onChange={(e) => setId(e.target.value)}
                        className="form-input"
                        placeholder="학번 8자리를 입력하세요"
                        disabled={isLoading}
                        maxLength={8}
                    />
                </div>

                {/* 2. 사용자 이름 (Username) 입력 */}
                <div className="form-group">
                    <label htmlFor="register-username" className="form-label">이름:</label>
                    <input
                        type="text"
                        id="register-username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="form-input"
                        placeholder="이름을 입력하세요"
                        disabled={isLoading}
                    />
                </div>

                {/* 3. 비밀번호 (Password) 입력 */}
                <div className="form-group">
                    <label htmlFor="register-password" className="form-label">비밀번호:</label>
                    <input
                        type="password"
                        id="register-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="form-input"
                        placeholder="비밀번호를 입력하세요"
                        disabled={isLoading}
                    />
                </div>
                {error && <p className="error-message">{error}</p>}

                <button
                    type="submit"
                    className="login-button"
                    disabled={isLoading}
                >
                    {isLoading ? '처리 중...' : '회원가입'}
                </button>




                {/* 로그인 페이지로 돌아가기 버튼 (옵션) */}
                <button type="button" onClick={() => onNavigate('loginPage')} className="secondary-button" disabled={isLoading}>
                    로그인 페이지로 돌아가기
                </button>
            </form>
        </div>
    );
};

export default RegisterPage;