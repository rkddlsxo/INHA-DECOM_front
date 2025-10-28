import React, { useState, useEffect } from "react";
// ReservationDetailsPage.css 파일은 이전 답변에서 새로 생성한 스타일을 사용합니다.
import './ReservationDetailsPage.css';

// 💡 상수: 이전 페이지 경로를 저장하는 Local Storage 키
const LAST_PAGE_KEY = 'lastReservationSelectPage';

const ReservationDetailsPage = ({ onNavigate }) => {
    // 1. 상태 관리
    const [bookingData, setBookingData] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFinalSubmitDisabled, setIsFinalSubmitDisabled] = useState(true);
    const [showCheckAlert, setShowCheckAlert] = useState(false);

    // 💡 이전 페이지 경로 상태 추가
    const [prevPage, setPrevPage] = useState('reservationFormSelectPage');

    // 폼 데이터 상태: 상태 키를 HTML 요소의 ID와 일치시킴
    const [formData, setFormData] = useState({
        organizationType: '',
        organizationName: '',
        phone: '',
        email: '',
        eventName: '',
        numPeople: 1,
        acUse: 'yes',
        rulesChecked: [false, false, false, false, false]
    });

    // 2. 데이터 로딩 (ComponentDidMount 역할)
    useEffect(() => {
        const storedData = localStorage.getItem('tempBookingData');
        const storedPrevPage = localStorage.getItem(LAST_PAGE_KEY);

        if (storedData) {
            setBookingData(JSON.parse(storedData));
        } else {
            // 예약 정보가 없는 경우, 이전 페이지로 이동
            alert("예약 정보가 없습니다. 장소 선택 페이지로 돌아갑니다.");
            onNavigate(storedPrevPage || 'reservationFormSelectPage'); // 저장된 경로로 이동 시도
        }

        // 💡 이전 페이지 경로 설정
        if (storedPrevPage) {
            setPrevPage(storedPrevPage);
        }


        // 팝업 외부 클릭 처리
        const handleOutsideClick = (event) => {
            if (event.target.classList.contains('modal')) {
                setIsModalOpen(false);
            }
        };

        window.addEventListener('click', handleOutsideClick);
        return () => window.removeEventListener('click', handleOutsideClick);
    }, [onNavigate]);

    // 3. 체크박스 상태 감시 및 최종 버튼 활성화/비활성화
    useEffect(() => {
        const allChecked = formData.rulesChecked.every(checked => checked);
        setIsFinalSubmitDisabled(!allChecked);
        if (allChecked) {
            setShowCheckAlert(false);
        }
    }, [formData.rulesChecked]);

    // 4. 이벤트 핸들러

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: id === 'numPeople' ? value.replace(/[^0-9]/g, '') : value
        }));
    };

    const handleRadioChange = (e) => {
        setFormData(prev => ({
            ...prev,
            acUse: e.target.value
        }));
    };

    const handleRuleCheck = (index) => (e) => {
        const newRulesChecked = [...formData.rulesChecked];
        newRulesChecked[index] = e.target.checked;
        setFormData(prev => ({
            ...prev,
            rulesChecked: newRulesChecked
        }));
    };

    const handleOpenModal = (e) => {
        e.preventDefault();

        // 필수 입력 필드 검증
        if (!formData.organizationType || !formData.organizationName || !formData.phone || !formData.email || !formData.eventName || formData.numPeople < 1) {
            alert("필수 입력 항목(사용단체, 단체명/이름, 연락처, 이메일, 행사명, 인원)을 모두 채워주세요.");
            return;
        }

        // 팝업창을 띄움
        setIsModalOpen(true);
        setShowCheckAlert(true);
    };

    // 💡 최종 예약 확정 및 제출 핸들러 (서버 통신 로직)
    const handleFinalSubmit = async () => {
        if (isFinalSubmitDisabled) {
            setShowCheckAlert(true);
            alert("모든 필수 확인 사항에 동의해야 최종 확정이 가능합니다.");
            return;
        }

        if (!bookingData) return;

        const newBooking = {
            date: bookingData.date,
            startTime: bookingData.startTime,
            endTime: bookingData.endTime,
            room: bookingData.roomName,
            location: bookingData.roomLocation,
            applicant: formData.organizationName,
            phone: formData.phone,
            email: formData.email,
            eventName: formData.eventName,
            numPeople: formData.numPeople,
            acUse: formData.acUse,
            organizationType: formData.organizationType,
            status: '확정대기' // 초기 상태 (서버 DB에 저장될 상태)
        };

        try {
            const response = await fetch(`${API_BASE_URL}/bookings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newBooking),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: '서버 응답 오류' }));
                throw new Error(`예약 제출 실패: ${errorData.message || response.statusText}`);
            }

            // 💡 임시 데이터 및 이전 경로 삭제
            localStorage.removeItem('tempBookingData');
            localStorage.removeItem(LAST_PAGE_KEY);


            alert(`🎉 ${formData.organizationName}님의 예약이 접수되었습니다! (상태: 확정대기)`);
            onNavigate('main');

        } catch (error) {
            console.error('Final Submit Error:', error);
            alert(`예약 제출 중 오류가 발생했습니다: ${error.message}`);
        }
    };

    // 💡 뒤로 가기 버튼 핸들러
    const handleGoBack = () => {
        // 저장된 경로로 이동 (예: 'timeFocusSelectPage' 또는 'placeFocusSelectPage')
        onNavigate(prevPage);
    };


    // 5. 렌더링
    if (!bookingData) {
        return (
            <div className="p-8 text-center">
                <p>예약 정보를 로딩 중이거나 유효하지 않습니다.</p>
                <button
                    onClick={handleGoBack}
                    className="mt-4 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                >
                    장소 선택 페이지로 돌아가기
                </button>
            </div>
        );
    }

    return (
        <div className="reservationDetails-container">
            {/* 뒤로가기 버튼 */}
            <div className="absolute top-4 left-4">
                <button
                    onClick={handleGoBack} // 💡 수정된 뒤로 가기 핸들러 사용
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition z-10"
                >
                    ← 뒤로
                </button>
            </div>

            <h1 className="mt-8">예약 상세 정보 입력</h1>

            {/* 예약 확인 섹션 */}
            <div className="summary-box">
                <h2>선택하신 예약 정보 확인</h2>
                <div className="summary-item">
                    <strong>장소:</strong>
                    <span>{bookingData.roomName || '정보 없음'}</span>
                </div>
                <div className="summary-item">
                    <strong>위치:</strong>
                    <span>{bookingData.roomLocation || '정보 없음'}</span>
                </div>
                <div className="summary-item">
                    <strong>예약 날짜:</strong>
                    <span>{bookingData.date || '정보 없음'}</span>
                </div>
                <div className="summary-item">
                    <strong>예약 시간:</strong>
                    <span>{`${bookingData.startTime} ~ ${bookingData.endTime}` || '정보 없음'}</span>
                </div>
            </div>

            {/* 입력 폼 섹션 */}
            <form className="input-form" onSubmit={handleOpenModal}>

                <div className="form-group">
                    <label htmlFor="organizationType">사용단체</label>
                    <select
                        id="organizationType"
                        value={formData.organizationType}
                        onChange={handleInputChange}
                        required
                    >
                        <option value="">-- 선택하세요 --</option>
                        <option value="private">개인</option>
                        <option value="student">학생 단체</option>
                        <option value="business">기업/기관</option>
                        <option value="etc">기타</option>
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="organizationName">단체명 (개인일 경우 예약자 이름)</label>
                    <input
                        type="text"
                        id="organizationName"
                        placeholder="단체명 또는 예약자 이름 입력"
                        value={formData.organizationName}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="phone">연락처</label>
                    <input
                        type="tel"
                        id="phone"
                        placeholder="010-0000-0000 형식"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="email">이메일</label>
                    <input
                        type="email"
                        id="email"
                        placeholder="example@domain.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="eventName">행사명</label>
                    <input
                        type="text"
                        id="eventName"
                        placeholder="예: 팀 프로젝트 회의, 스터디"
                        value={formData.eventName}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="numPeople">행사인원</label>
                    <input
                        type="number"
                        id="numPeople"
                        min="1"
                        placeholder="숫자만 입력"
                        value={formData.numPeople}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>냉난방 사용유무</label>
                    <div className="radio-group">
                        <input type="radio" id="ac-yes" name="ac-use" value="yes" checked={formData.acUse === 'yes'} onChange={handleRadioChange} />
                        <label htmlFor="ac-yes">사용</label>
                        <input type="radio" id="ac-no" name="ac-use" value="no" checked={formData.acUse === 'no'} onChange={handleRadioChange} />
                        <label htmlFor="ac-no">사용 안 함</label>
                    </div>
                </div>

                <button type="button" className="submit-button rent" onClick={() => alert("대여 물품 선택 팝업 또는 페이지로 이동합니다. (현재는 예시)")}>
                    대여 물품 선택하기 (추가 비용 발생 가능)
                </button>

                <button type="submit" className="submit-button">
                    최종 예약 확정 및 제출
                </button>
            </form>

            {/* 최종 확정 모달 */}
            {isModalOpen && (
                <div className="modal">
                    <div className="modal-content">

                        <h2>🚨 예약 전 필수 확인 사항</h2>

                        <div className="rules-list">
                            {/* 룰 항목 1 */}
                            <div className="rule-item">
                                <label>
                                    <input type="checkbox" className="required-check" checked={formData.rulesChecked[0]} onChange={handleRuleCheck(0)} />
                                    "장소별 예약안내 및 유의사항"을 확인하였습니다.
                                </label>
                            </div>

                            {/* 룰 항목 2 */}
                            <div className="rule-item">
                                <label>
                                    <input type="checkbox" className="required-check" checked={formData.rulesChecked[1]} onChange={handleRuleCheck(1)} />
                                    학교 주요행사 발생시 양보하겠습니다.
                                </label>
                            </div>

                            {/* 룰 항목 3 (긴 목록) */}
                            <div className="rule-item">
                                <label>
                                    <input type="checkbox" className="required-check" checked={formData.rulesChecked[2]} onChange={handleRuleCheck(2)} />
                                    다음과 같은 행사의 경우 시설물을 예약할 수 없음을 확인했습니다.
                                </label>
                                <ul style={{ marginTop: 5, paddingLeft: 30, fontSize: '0.9em', color: '#666' }}>
                                    <li>요청내용과 실제 사용내용이 다른 경우(예: 행사내용, 사용단체 등)</li>
                                    <li>외부인 및 외부단체가 대다수 참여하는 경우</li>
                                    <li>시설물 훼손 가능성이 큰 경우</li>
                                    <li>화재 및 사고위험이 큰 경우</li>
                                    <li>정치적, 종교적 성향이 과도한 경우</li>
                                    <li>학생신분으로서 부적절한 경우</li>
                                </ul>
                            </div>

                            {/* 룰 항목 4 */}
                            <div className="rule-item">
                                <label>
                                    <input type="checkbox" className="required-check" checked={formData.rulesChecked[3]} onChange={handleRuleCheck(3)} />
                                    운동장,다목적구장, 농구장등 기타외부장소를 이용하는 사용자의 경우 해당 시설에서 수업 진행시 수업에 방해되는 행동과 소음을 자제하여 주시기 바랍니다.
                                </label>
                            </div>

                            {/* 룰 항목 5 */}
                            <div className="rule-item">
                                <label>
                                    <input type="checkbox" className="required-check" checked={formData.rulesChecked[4]} onChange={handleRuleCheck(4)} />
                                    시설물 사용자 준수사항 (쓰레기수거 및 금연 등) 불이행 단체는 추후 기안시 취소 및 불이익을 받을 수 있음을 확인합니다.
                                </label>
                            </div>

                            <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #eee' }} />

                            {/* 문의처 안내 */}
                            <div className="contact-info">
                                <p>문의처 안내</p>
                                <p>
                                    ※ 60주년기념관 스터디라운지(총무팀(032-860-7097))를 제외한 시설물 기안에 대한 문의사항은 학생지원팀(032-860-7066)으로 문의하시기 바랍니다.<br />
                                    ※ 인하-동동, 인하 튜터링 활동실 신청에 대한 문의사항은 교수학습개발센터(032-860-7026)로 문의하시기 바랍니다.
                                </p>
                            </div>
                        </div>

                        <button
                            className="final-submit-button"
                            onClick={handleFinalSubmit}
                            disabled={isFinalSubmitDisabled}
                        >
                            모든 항목 확인 및 최종 예약 확정
                        </button>
                        {showCheckAlert && isFinalSubmitDisabled && (
                            <p id="check-alert">모든 필수 확인 사항에 체크해야 확정 가능합니다.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReservationDetailsPage;