// src/pages/ComplaintPage.jsx

import React, { useState } from 'react';
import './ComplaintPage.css';
import { BsArrowLeft, BsExclamationTriangle } from 'react-icons/bs';

const API_BASE_URL = 'http://localhost:5050/api';

const ComplaintPage = ({ onNavigate }) => {
    const [formData, setFormData] = useState({
        category: '',
        title: '',
        details: '',
        image: null,
        // 로그인 상태에서 로컬 저장소에 저장된 사용자 이름이 있다고 가정
        applicantName: localStorage.getItem('username') || '',
        contact: '',
    });
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState({ type: '', message: '' });

    const handleInputChange = (e) => {
        const { id, value, files } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: files ? files[0] : value
        }));
    };

    const handleInputContact = (e) => {
        setFormData(prev => ({
            ...prev,
            contact: e.target.value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatusMessage({ type: '', message: '' });

        if (!formData.category || !formData.title || !formData.details || !formData.applicantName || !formData.contact) {
            setStatusMessage({ type: 'error', message: '모든 필수 필드를 입력해주세요.' });
            return;
        }

        setLoading(true);

        // 파일 업로드를 포함하는 폼 제출을 위해 FormData 객체 사용
        const data = new FormData();
        data.append('category', formData.category);
        data.append('title', formData.title);
        data.append('details', formData.details);
        data.append('applicantName', formData.applicantName);
        data.append('contact', formData.contact);

        if (formData.image) {
            data.append('image', formData.image);
        }

        try {
            const token = localStorage.getItem('authToken');

            // 더미 API 엔드포인트: /complaints
            const response = await fetch(`${API_BASE_URL}/complaints`, {
                method: 'POST',
                // FormData 사용 시 Content-Type 헤더는 자동으로 설정됨
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: data,
            });

            if (response.ok) {
                setStatusMessage({ type: 'success', message: '✅ 불편 사항이 성공적으로 접수되었습니다. 빠르게 처리하겠습니다.' });
                // 폼 초기화
                setFormData({
                    category: '',
                    title: '',
                    details: '',
                    image: null,
                    applicantName: localStorage.getItem('username') || '',
                    contact: '',
                });
                // 파일 입력 필드를 초기화
                if (document.getElementById('image')) {
                    document.getElementById('image').value = '';
                }

            } else {
                const errorData = await response.json().catch(() => ({ message: '서버 응답 오류' }));
                throw new Error(errorData.message || '불편 사항 접수에 실패했습니다.');
            }

        } catch (error) {
            console.error('Complaint Submit Error:', error);
            setStatusMessage({ type: 'error', message: `❌ 오류 발생: ${error.message}` });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="complaint-page-container">
            {/* 뒤로가기 버튼 */}
            <button
                onClick={() => onNavigate('complaintMenuPage')}
                className="back-button"
                disabled={loading}
            >
                <BsArrowLeft size={16} />
                뒤로
            </button>

            {/* 헤더 */}
            <header className="select-header">
                <h1 className="page-title">
                    <BsExclamationTriangle size={32} style={{ marginRight: '10px', verticalAlign: 'middle' }} />
                    불편 사항 접수
                </h1>
                <p className="page-description">
                    시설 이용 중 발생한 문제나 불편 사항을 자세히 작성해주세요.
                </p>
            </header>

            {/* 폼 영역 */}
            <div className="complaint-form-box">
                <form onSubmit={handleSubmit}>

                    {/* 1. 카테고리 */}
                    <div className="form-group">
                        <label htmlFor="category" className="form-label">불편 유형 (필수)</label>
                        <select
                            id="category"
                            className="form-select"
                            value={formData.category}
                            onChange={handleInputChange}
                            required
                            disabled={loading}
                        >
                            <option value="">-- 선택하세요 --</option>
                            <option value="facility_damage">시설물 파손/고장</option>
                            <option value="reservation_error">예약 시스템 오류</option>
                            <option value="cleanliness">청결/환경 문제</option>
                            <option value="other">기타</option>
                        </select>
                    </div>

                    {/* 2. 제목 */}
                    <div className="form-group">
                        <label htmlFor="title" className="form-label">제목 (필수)</label>
                        <input
                            type="text"
                            id="title"
                            className="form-input"
                            placeholder="간결하고 명확한 제목을 입력하세요."
                            value={formData.title}
                            onChange={handleInputChange}
                            required
                            disabled={loading}
                        />
                    </div>

                    {/* 3. 상세 내용 */}
                    <div className="form-group">
                        <label htmlFor="details" className="form-label">상세 내용 (필수)</label>
                        <textarea
                            id="details"
                            className="form-textarea"
                            placeholder="불편 사항 발생 장소, 시간, 상세 내용을 입력해주세요."
                            value={formData.details}
                            onChange={handleInputChange}
                            required
                            disabled={loading}
                        />
                    </div>

                    {/* 4. 사진 첨부 */}
                    <div className="form-group">
                        <label htmlFor="image" className="form-label">관련 사진 첨부 (선택)</label>
                        <div className="file-upload-wrapper">
                            <input
                                type="file"
                                id="image"
                                accept="image/*"
                                onChange={handleInputChange}
                                disabled={loading}
                            />
                            <p>최대 1개의 사진 파일 (JPEG, PNG 권장)</p>
                        </div>
                    </div>

                    {/* 5. 신청자 이름 (로그인 정보에서 가져옴) */}
                    <div className="form-group">
                        <label htmlFor="applicantName" className="form-label">신청자 이름</label>
                        <input
                            type="text"
                            id="applicantName"
                            className="form-input"
                            value={formData.applicantName}
                            disabled
                        />
                    </div>

                    {/* 6. 연락처 (필수) */}
                    <div className="form-group">
                        <label htmlFor="contact" className="form-label">연락처 (이메일 또는 전화번호, 필수)</label>
                        <input
                            type="text"
                            id="contact"
                            className="form-input"
                            placeholder="답변을 받을 이메일 또는 전화번호를 입력하세요."
                            value={formData.contact}
                            onChange={handleInputContact}
                            required
                            disabled={loading}
                        />
                    </div>

                    {/* 제출 버튼 */}
                    <button
                        type="submit"
                        className="submit-button"
                        disabled={loading}
                    >
                        {loading ? '접수 중...' : '불편 사항 접수하기'}
                    </button>

                    {/* 상태 메시지 */}
                    {statusMessage.message && (
                        <p className={`status-message status-${statusMessage.type}`}>
                            {statusMessage.message}
                        </p>
                    )}

                </form>
            </div>
        </div>
    );
};

export default ComplaintPage;