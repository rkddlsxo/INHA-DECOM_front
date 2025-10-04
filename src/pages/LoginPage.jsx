import React, { useState } from 'react';
import './LoginPage.css';

// 1. 컴포넌트 이름은 대문자 'LoginPage'로 시작
// 2. Props는 하나의 객체 인자로 받습니다.
const LoginPage = ({ onNavigate, handleLogin }) => {

    // 1. 상태 설정
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // 2. 로그인 정보 입력 
    const handleUsernameChange = (e) => {
        setUsername(e.target.value);
        setError('');
    };
    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
        setError('');
    };

    // 3. 폼 제출 처리
    const handleSubmit = (e) => {
        e.preventDefault();

        if (!username || !password) {//뭐라고 써야할지 몰라서 일단 둘다 채우면 로그인 되게 함
            setError('아이디와 비밀번호를 모두 입력해주세요.');
            return;
        }

        // 로그인 인증 로직 (성공 가정)
        if (username && password) {

            setError('');
            console.log('로그인 성공:', { username, password });

            // App.js에서 onNavigate를 받았다면 페이지 전환
            if (onNavigate) {
                onNavigate('main');
            }

            // App.js에서 handleLogin을 받았다면 로그인 상태 업데이트
            if (handleLogin) {
                handleLogin(true);
            }

            alert(`환영합니다, ${username}님!`);

        } else {
            setError('아이디 또는 비밀번호가 잘못되었습니다.');
        }
    };

    // 4. JSX (UI) 구성
    return (
        <div className="login-container">
            <h2 className="login-heading">로그인</h2>
            <form onSubmit={handleSubmit}>

                <div className="form-group">
                    <label htmlFor="username" className="form-label">아이디:</label>
                    <input type="text" id="username" value={username} onChange={handleUsernameChange} required className="form-input" placeholder="아이디를 입력하세요" />
                </div>

                <div className="form-group">
                    <label htmlFor="password" className="form-label">비밀번호:</label>
                    <input type="password" id="password" value={password} onChange={handlePasswordChange} required className="form-input" placeholder="비밀번호를 입력하세요" />
                </div>

                {error && <p className="error-message">{error}</p>}

                <button type="submit" className="login-button">로그인</button>
            </form>
        </div>
    );
};


export default LoginPage;