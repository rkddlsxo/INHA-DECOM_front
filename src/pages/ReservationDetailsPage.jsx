import React, { useState, useEffect } from "react";
import './ReservationDetailsPage.css';

const LAST_PAGE_KEY = 'lastReservationSelectPage';
const API_BASE_URL = 'http://localhost:5050/api';

const PlaceUsageGuideHTML = `
    <div>
        <p style="font-size: 14pt; font-weight: bold;">시설물 예약 및 사용 안내</p>
        <p style="font-weight: bold;">■ 학생 주관 행사 시설물 사용 안내</p>
        <p style="font-weight: bold;">◎장소별 기안 방식</p>
        
        <table class="guide-table">
            <thead>
                <tr>
                    <td class="bg-yellow bold">구분</td>
                    <td class="bg-pink">오프라인 장소 기안</td>
                    <td class="bg-pink">온라인 장소 기안</td>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="bg-yellow">장소</td>
                    <td>강의실, 강당(본관 대/중/소, 5남소), 후문, 광장, 음악감상실, 60주년기념관1,2층 로비</td>
                    <td>스터디룸(인문,해동,학생라운지), 가무연습실, 운동장(축구장, 다목적구장, 테니스장, 농구장, 풋살파크A, D)</td>
                </tr>
                <tr>
                    <td class="bg-yellow">기안 방법</td>
                    <td>학생지원팀 방문</td>
                    <td>학사행정-온라인시설예약 (학생 개별 신청)</td>
                </tr>
                <tr>
                    <td class="bg-yellow" rowspan="2">사용 가능 시간</td>
                    <td>09~22시</td>
                    <td>학기중 및 방학중, 체육시설별로 상이함</td>
                </tr>
                <tr>
                    <td>최대 8시간, 주 3회까지</td>
                    <td>최대 2시간, 주 2회까지</td>
                </tr>
                <tr>
                    <td class="bg-yellow">사용 가능 기간</td>
                    <td colspan="2">
                        <p>● 시설물 사용은 한 단체당 연속된 동일 장소는 2주까지, 1일 1장소 1회만 신청 가능</p>
                        <p>● 사용일 기준 - 최소 3일 전(주말, 공휴일 제외) / 최대 30일 전(주말, 공휴일 포함)</p>
                    </td>
                </tr>
            </tbody>
        </table>

        <p class="guide-note">※ 학교 주요행사, 시설물 유지보수공사, 천재지변 등으로 학생 안전이 우려되는 경우 시설물 사용 예약이 취소 또는 제한될 수 있음.</p>
        <p class="guide-note">※ 위 규칙은 학생단체 사용 시 적용됨.</p>
        <p>&nbsp;</p>

        <p style="font-weight: bold;">◎체육 시설</p>
        <table class="guide-table">
            <thead>
                <tr>
                    <td class="bg-yellow bold" rowspan="5">체육 시설</td>
                    <td colspan="2" class="bg-yellow bold">장소</td>
                    <td colspan="2" class="bg-yellow bold">대운동장 <span class="small-text">(조명on(자동) 19~22시)</span></td>
                    <td colspan="2" class="bg-yellow bold">다목적구장 [5남쪽,학군단쪽]</td>
                    <td colspan="2" class="bg-yellow bold">농구장[1,4면]</td>
                    <td colspan="2" class="bg-yellow bold">농구장[2,3]면</td>
                    <td colspan="2" class="bg-yellow bold">풋살장[A,D면]</td>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td rowspan="2" class="bg-gray bold">학기중</td>
                    <td class="bg-gray bold">평일</td>
                    <td>2시간</td><td>~22시</td>
                    <td>2시간</td><td>~22시</td>
                    <td>2시간</td><td>~20시</td>
                    <td>2시간</td><td>~22시</td>
                    <td>2시간</td><td>~17시</td>
                </tr>
                <tr>
                    <td class="bg-gray bold">주말</td>
                    <td>2시간</td><td>~20시</td>
                    <td>2시간</td><td>~22시</td>
                    <td class="red-text bold">3시간</td><td>~20시</td>
                    <td class="blue-text bold">3시간</td><td>~22시</td>
                    <td colspan="2" class="red-text bold">주말 사용불가</td>
                </tr>
                <tr>
                    <td rowspan="2" class="bg-gray bold">방학중</td>
                    <td class="bg-gray bold">평일</td>
                    <td>2시간</td><td>~17시</td>
                    <td>2시간</td><td>~17시</td>
                    <td>2시간</td><td>~17시</td>
                    <td>2시간</td><td>~17시</td>
                    <td>2시간</td><td>~17시</td>
                    <td>2시간</td><td>~17시</td>
                </tr>
                <tr>
                    <td class="bg-gray bold">주말</td>
                    <td>2시간</td><td>~17시</td>
                    <td>2시간</td><td>~17시</td>
                    <td>2시간</td><td>~17시</td>
                    <td>2시간</td><td>~17시</td>
                    <td colspan="2" class="red-text bold">주말 사용불가</td>
                </tr>
            </tbody>
        </table>
        <p>&nbsp;</p>

        <p style="font-weight: bold;">■ 시설물 예약신청 <span class="red-text">(1인/1단체 1일 1회 가능)</span></p>
        <p>1. 예약은 반드시 사용예정일의 30일 전부터 최소 3일 전(주말제외)까지 해야 합니다. 기간 외 신청시 미확인으로 인한 ‘사용불가’의 책임은 신청자에게 있습니다.</p>
        <p>2. 한 단체에서 강당, 학생공간, 체육시설 사용에 대해 각각 주 3일을 초과할 수 없으며, 동시에 두 시설의 사용은 불가합니다. 특별한 사유시 소속기관장의 협조문을 작성하여 학생지원팀으로 제출하십시오.</p>
        <p>3. 강당은 한 단체에서 1일 최대 8시간까지 가능하며, 학기중 평일 음향사용은 18시 이후로만 가능하고 사전 무대설치는 불가합니다. </p>
        <p>4. 냉난방을 원하는 경우 예약시 함께 신청해야 하며, 예약 완료 후 별도로 확인해야 합니다.</p>
        <p>* 학생회관 회의실의 음향시설은 방송기재실에서 지원하지 않습니다.</p>
        <p>5. 예약 후 수정은 불가하며 변경사항 발생시 취소 후 재신청해야 합니다. </p>
        <p>6. 부득이한 사유로 예약한 시설물이 수업 또는 학교주요행사와 중복되었을 경우 사용중이더라도 반드시 양보해야 합니다.</p>
        <p>7. 강당 및 체육시설은 수업에 사용되는 시설이므로 방학 중에는 다음 학기 강의시간표 확정시까지 개강이후 시설 사용에 대한 예약이 불가합니다. <span class="red-text">(개강 한 달 전, 운동장 온라인 예약 불가)</span></p>
        <p>&nbsp;</p>

        <p style="font-weight: bold;">■ 시설물 예약이 불가한 경우 <span class="red-text">(적발시 사용금지 및 시설예약 불가등 패널티 적용)</span></p>
        <ul>
            <li>수업에 지장을 초래하는 경우</li>
            <li>시설물 훼손가능성이 크거나 화재 및 사고의 위험이 큰 경우</li>
            <li>정치적 종교적 성향이 과도한 경우</li>
            <li>외부인 및 외부단체가 대다수 참여하는 경우</li>
            <li>요청내용과 실제 사용내용이 다른 경우(예)행사내용, 사용단체 등)</li>
            <li>그 외 학생신분으로서 부적절한 경우</li>
        </ul>
        <p>&nbsp;</p>

        <p style="font-weight: bold;">■ 장소별 유의사항</p>
        <p style="font-weight: bold;">◎실내공간</p>
        <table class="guide-table">
            <thead>
                <tr>
                    <td class="bg-yellow bold">구분</td>
                    <td class="bg-pink bold">특이사항</td>
                    <td class="bg-pink bold">예약가능시간</td>
                    <td class="bg-pink bold">출입문 개폐</td>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="bg-yellow">본관(대/중/소)강당</td>
                    <td rowspan="2">※ 강당/회의실 내 설치된 빔프로젝터 사용불가<br>※ 빔/스크린, 음향, 조명장비 대여 → 학생복지위원회 방문 후 직접 대여</td>
                    <td rowspan="4">08:00 ~ 22:00</td>
                    <td rowspan="4">※ 종합상황실 전화 후 원격으로 개폐<br>※ 공간 사용 후 종합상황실로 전화하여 출입문을 잠가 주시기 바랍니다.</td>
                </tr>
                <tr>
                    <td class="bg-yellow">5남 소강당</td>
                </tr>
                <tr>
                    <td class="bg-yellow">가무연습실</td>
                    <td>※ 학생회관 403호, 404호, 406호, 513호</td>
                </tr>
                <tr>
                    <td class="bg-yellow">음악감상실</td>
                    <td></td>
                </tr>
            </tbody>
        </table>
        <p>&nbsp;</p>

        <p style="font-weight: bold;">■ 관련부서 안내</p>
        <table class="guide-table">
            <thead>
                <tr>
                    <td class="bg-yellow bold">부서명</td>
                    <td class="bg-yellow bold">관련업무</td>
                    <td class="bg-yellow bold">위치</td>
                    <td class="bg-yellow bold">내선</td>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="bg-gray bold">기관실</td>
                    <td>냉난방 문의</td>
                    <td class="bg-gray">5남 지하</td>
                    <td>8354</td>
                </tr>
                <tr>
                    <td class="bg-gray bold">종합상황실</td>
                    <td>교내 전체 시설물 개폐 및 안전관리</td>
                    <td>본관 1층 로비</td>
                    <td>9119</td>
                </tr>
                <tr>
                    <td class="bg-gray bold">학생지원팀</td>
                    <td>시설 예약 및 승인</td>
                    <td class="bg-gray">학생회관 3층</td>
                    <td>7066</td>
                </tr>
                <tr>
                    <td class="bg-gray bold">학생복지위원회</td>
                    <td>빔, 마이크, 엠프, 천막 등 대여</td>
                    <td>학생회관 지하</td>
                    <td>9135</td>
                </tr>
                <tr>
                    <td class="bg-gray bold">예술체육대학행정실</td>
                    <td>대강당 피아노사용 문의</td>
                    <td>서호관 118</td>
                    <td>8161</td>
                </tr>
            </tbody>
        </table>
    </div>
`;
// ------------------------------------

const RulesModal = ({ isOpen, onClose, htmlContent }) => {
    if (!isOpen) return null;
    return (
        <div className="modal rules-modal">
            <div className="modal-content guide-modal-content">
                <h2>🚨 장소별 예약안내 및 유의사항</h2>
                <div className="guide-content-body" dangerouslySetInnerHTML={{ __html: htmlContent }} />
                <div className="rules-action-area">
                    <button onClick={onClose} className="close-button">
                        안내사항을 확인하고 체크
                    </button>
                </div>
            </div>
        </div>
    );
};
// ------------------------------------

// ⭐️ 1. [재예약] 컴포넌트 외부에 localStorage 데이터를 읽어오는 함수 정의
const getRebookingData = () => {
    const data = localStorage.getItem('rebookingData');
    if (!data) {
        return null; // 재예약 데이터가 없으면 null 반환
    }
    try {
        // ⭐️ 데이터를 읽어온 후 즉시 삭제 (일회용)
        localStorage.removeItem('rebookingData');
        return JSON.parse(data);
    } catch (e) {
        // 파싱 실패 시에도 삭제
        localStorage.removeItem('rebookingData');
        return null;
    }
};

// ⭐️ 2. [재예약] 컴포넌트 로드 시 1회만 실행
const rebookingData = getRebookingData();
// ------------------------------------


const ReservationDetailsPage = ({ onNavigate }) => {
    // 1. 상태 관리
    const [bookingData, setBookingData] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
    const [isFinalSubmitDisabled, setIsFinalSubmitDisabled] = useState(true);
    const [showCheckAlert, setShowCheckAlert] = useState(false);
    const [prevPage, setPrevPage] = useState('reservationFormSelectPage');

    // ⭐️ 3. [재예약] 폼 데이터 상태 초기값에 rebookingData 적용
    const [formData, setFormData] = useState({
        organizationType: rebookingData?.organizationType || '',
        organizationName: rebookingData?.organizationName || '',
        phone: rebookingData?.phone || '',
        email: rebookingData?.email || '',
        eventName: rebookingData?.eventName || '',
        numPeople: rebookingData?.numPeople || 1,
        acUse: rebookingData?.acUse || 'yes',
        rulesChecked: [false, false, false, false, false] // 체크박스는 항상 false로 시작
    });


    // 2. 데이터 로딩 및 외부 클릭 핸들러
    useEffect(() => {
        const storedData = localStorage.getItem('tempBookingData');
        const storedPrevPage = localStorage.getItem(LAST_PAGE_KEY);

        if (storedData) {
            setBookingData(JSON.parse(storedData));
        } else {
            alert("예약 정보가 없습니다. 장소 선택 페이지로 돌아갑니다.");
            onNavigate(storedPrevPage || 'reservationFormSelectPage');
        }

        if (storedPrevPage) {
            setPrevPage(storedPrevPage);
        }

        const handleOutsideClick = (event) => {
            if (event.target.classList.contains('modal') && !event.target.classList.contains('rules-modal')) {
                setIsModalOpen(false);
            }
        };

        window.addEventListener('click', handleOutsideClick);
        return () => window.removeEventListener('click', handleOutsideClick);
    }, [onNavigate]);

    // 3. 체크박스 상태 감시
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
        if (!formData.organizationType || !formData.organizationName || !formData.phone || !formData.email || !formData.eventName || formData.numPeople < 1) {
            alert("필수 입력 항목(사용단체, 단체명/이름, 연락처, 이메일, 행사명, 인원)을 모두 채워주세요.");
            return;
        }
        setIsModalOpen(true);
        setShowCheckAlert(true);
    };

    const handleOpenRulesModal = (e) => {
        setIsRulesModalOpen(true);
        e.stopPropagation(); 
    };

    const handleRuleCheckFromModal = () => {
        const newRulesChecked = [...formData.rulesChecked];
        newRulesChecked[0] = true; 
        setFormData(prev => ({
            ...prev,
            rulesChecked: newRulesChecked
        }));
        setIsRulesModalOpen(false);
    };

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
            roomName: bookingData.roomName,
            roomLocation: bookingData.roomLocation,
            applicant: formData.organizationName,
            phone: formData.phone,
            email: formData.email,
            eventName: formData.eventName,
            numPeople: parseInt(formData.numPeople) || 1,
            acUse: formData.acUse,
            organizationType: formData.organizationType,
            status: '확정대기'
        };

        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                alert('오류: 로그인 정보(토큰)를 찾을 수 없습니다. 다시 로그인해주세요.');
                onNavigate('loginPage');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/bookings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newBooking),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: '서버 응답 오류' }));
                throw new Error(`예약 제출 실패: ${errorData.message || response.statusText}`);
            }

            localStorage.removeItem('tempBookingData');
            localStorage.removeItem(LAST_PAGE_KEY);
            // ⭐️ 4. [재예약] 재예약 데이터도 확실히 삭제
            localStorage.removeItem('rebookingData');

            alert(`🎉 ${formData.organizationName}님의 예약이 접수되었습니다! (상태: 확정대기)`);
            onNavigate('main');

        } catch (error) {
            console.error('Final Submit Error:', error);
            alert(`예약 제출 중 오류가 발생했습니다: ${error.message}`);
        }
    };

    const handleGoBack = () => {
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
            <div className="absolute top-4 left-4">
                <button
                    onClick={handleGoBack}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition z-10"
                >
                    ← 뒤로
                </button>
            </div>

            <h1 className="mt-8">예약 상세 정보 입력</h1>

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

            {/* ⭐️ 폼은 rebookingData에 의해 자동으로 채워짐 */}
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
                            <div className="rule-item" onClick={handleOpenRulesModal}>
                                <label className={formData.rulesChecked[0] ? 'rule-checked' : 'rule-unchecked'}>
                                    <input type="checkbox" className="required-check" checked={formData.rulesChecked[0]} onChange={handleRuleCheck(0)} disabled />
                                    <span style={{ cursor: 'pointer', textDecoration: 'underline' }}>"장소별 예약안내 및 유의사항"을 확인하였습니다.</span>
                                </label>
                                {!formData.rulesChecked[0] && (
                                    <p style={{ color: 'red', fontSize: '0.8em', marginTop: '5px' }}>* 안내사항을 확인하고 체크해야 합니다. **문구 클릭 시 안내 창 열림**</p>
                                )}
                            </div>
                            <div className="rule-item">
                                <label>
                                    <input type="checkbox" className="required-check" checked={formData.rulesChecked[1]} onChange={handleRuleCheck(1)} />
                                    학교 주요행사 발생시 양보하겠습니다.
                                </label>
                            </div>
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
                            <div className="rule-item">
                                <label>
                                    <input type="checkbox" className="required-check" checked={formData.rulesChecked[3]} onChange={handleRuleCheck(3)} />
                                    운동장,다목적구장, 농구장등 기타외부장소를 이용하는 사용자의 경우 해당 시설에서 수업 진행시 수업에 방해되는 행동과 소음을 자제하여 주시기 바랍니다.
                                </label>
                            </div>
                            <div className="rule-item">
                                <label>
                                    <input type="checkbox" className="required-check" checked={formData.rulesChecked[4]} onChange={handleRuleCheck(4)} />
                                    시설물 사용자 준수사항 (쓰레기수거 및 금연 등) 불이행 단체는 추후 기안시 취소 및 불이익을 받을 수 있음을 확인합니다.
                                </label>
                            </div>
                            <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #eee' }} />
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

            {/* 장소 안내 모달 렌더링 */}
            <RulesModal
                isOpen={isRulesModalOpen}
                onClose={handleRuleCheckFromModal}
                htmlContent={PlaceUsageGuideHTML}
            />
        </div>
    );
};

export default ReservationDetailsPage;
