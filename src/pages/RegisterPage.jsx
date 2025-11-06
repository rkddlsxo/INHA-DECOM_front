import React, { useState } from 'react';
// 로그인 페이지와 스타일을 공유
import './LoginPage.css';

// 백엔드 회원가입 API 주소
const API_URL = 'http://localhost:5050/api/register';

/**
 * 사용자 회원가입 폼을 렌더링하고 서버에 등록을 요청하는 컴포넌트입니다.
 * @param {object} props - 컴포넌트 속성
 * @param {function} props.onNavigate - 페이지 이동을 처리하는 함수
 */
const RegisterPage = ({ onNavigate }) => {
    // 학번(ID) 상태
    const [id, setId] = useState('');
    // 사용자 이름 상태
    const [username, setUsername] = useState('');
    // 비밀번호 상태
    const [password, setPassword] = useState('');
    // 에러 메시지 상태
    const [error, setError] = useState('');
    // 로딩 상태 (API 호출 중)
    const [isLoading, setIsLoading] = useState(false);

    // ID 입력 변경 핸들러
    const handleIdChange = (e) => {
        setId(e.target.value);
        setError('');
    };
    // 사용자 이름 입력 변경 핸들러
    const handleUsernameChange = (e) => {
        setUsername(e.target.value);
        setError('');
    };
    // 비밀번호 입력 변경 핸들러
    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
        setError('');
    };

    /**
     * 폼 제출을 처리하고 회원가입 API를 호출합니다.
     * @param {object} e - 폼 제출 이벤트 객체
     */
    const handleSubmit = async (e) => {
        e.preventDefault();

        // 클라이언트 측 유효성 검사: 필수 필드 확인
        if (!id || !username || !password) {
            setError('모든 필드를 입력해주세요.');
            return;
        }
        // 클라이언트 측 유효성 검사: 학번 형식 확인
        if (id.length !== 8 || !/^\d+$/.test(id)) {
            setError('학번은 8자리 숫자여야 합니다.');
            return;
        }

        setError('');
        setIsLoading(true);

        try {
            // 회원가입 API 호출 (POST)
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // 학번, 이름, 비밀번호를 JSON 본문으로 전송
                body: JSON.stringify({ id, username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // 회원가입 성공 시 로그인 페이지로 이동 및 성공 메시지
                alert(`✅ 회원가입이 완료되었습니다. ${username}님, 환영합니다!`);
                onNavigate('loginPage');
            }
            else {
                // 회원가입 실패 처리
                setError(data.message || '회원가입에 실패했습니다.');
            }
        } catch (error) {
            // 네트워크 오류 처리
            setError('서버와 통신 중 오류가 발생했습니다.');
        }
        setIsLoading(false);
    }

    return (
        // 로그인 페이지와 동일한 스타일 컨테이너 사용
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
                        onChange={handleIdChange}
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
                        onChange={handleUsernameChange}
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
                        onChange={handlePasswordChange}
                        className="form-input"
                        placeholder="비밀번호를 입력하세요"
                        disabled={isLoading}
                    />
                </div>
                {/* 에러 메시지 표시 */}
                {error && <p className="error-message">{error}</p>}

                {/* 회원가입 버튼 (login-button 클래스 재사용) */}
                <button
                    type="submit"
                    className="login-button"
                    disabled={isLoading}
                >
                    {isLoading ? '처리 중...' : '회원가입'}
                </button>

                {/* 로그인 페이지로 돌아가기 버튼 (secondary-button 클래스를 가정) */}
                <button
                    type="button"
                    onClick={() => onNavigate('loginPage')}
                    className="register-button" // LoginPage.css에 정의된 register-button 클래스 사용
                    disabled={isLoading}
                >
                    로그인 페이지로 돌아가기
                </button>
            </form>
        </div>
    );
};

export default RegisterPage;