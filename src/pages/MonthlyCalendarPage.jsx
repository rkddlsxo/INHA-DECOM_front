import React, { useState, useEffect, useMemo, useCallback } from 'react';
// 아이콘 임포트
import { BsBuilding, BsArrowLeft, BsArrowRepeat } from 'react-icons/bs';
import './MonthlyCalendarPage.css';

// API 기본 URL 및 현재 날짜 상수
const API_BASE_URL = 'http://localhost:5050/api';
const today = new Date();

/**
 * 특정 월의 일수를 반환합니다.
 * @param {number} year - 연도
 * @param {number} month - 월 (0부터 시작)
 * @returns {number} 해당 월의 일수
 */
function getDaysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); }

/**
 * 07:00부터 21:50까지 10분 단위의 모든 시간 슬롯 배열을 생성합니다.
 * @returns {string[]} 'HH:MM' 형식의 시간 문자열 배열
 */
const generateTimeSlots = () => {
    const slots = [];
    for (let h = 7; h <= 21; h++) {
        for (let m = 0; m <= 50; m += 10) {
            if (h === 21 && m > 50) break;
            slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
        }
    }
    return slots;
};
// 전체 시간 슬롯 목록을 상수로 저장
const allTimeSlots = generateTimeSlots();

/**
 * 월별 예약 현황을 표시하는 달력 컴포넌트입니다.
 * @param {object} props - 컴포넌트 속성
 * @param {function} props.onNavigate - 페이지 이동을 처리하는 함수
 */
const MonthlyCalendarPage = ({ onNavigate }) => {
    // 모든 마스터 장소 목록
    const [allMasterSpaces, setAllMasterSpaces] = useState([]);
    // 현재 선택된 장소의 ID
    const [selectedSpaceId, setSelectedSpaceId] = useState('');
    // 장소별 월별/일별 예약 가능 정보를 저장하는 캐시
    const [roomAvailabilityCache, setRoomAvailabilityCache] = useState({});

    // 현재 달력에 표시되는 월의 첫째 날 Date 객체
    const [displayDate, setDisplayDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    // 로딩 상태
    const [loading, setLoading] = useState(false);
    // 에러 메시지 상태
    const [error, setError] = useState(null);

    // 툴팁(Tooltip) 표시를 위한 상태
    const [tooltip, setTooltip] = useState({
        visible: false, x: 0, y: 0, content: '', dateKey: null
    });

    // 달력 카드의 뷰 토글 상태 (false: 히트맵, true: 시간대별 블록)
    const [isTimeView, setIsTimeView] = useState(false);

    /**
     * 특정 날짜의 예약 불가 시간대를 포맷하여 툴팁 내용을 반환합니다.
     * 예약 가능한 시간 슬롯(true)이 아닌 경우(false)를 예약 불가 시간으로 간주합니다.
     * @param {object} dayData - 일별 시간대별 예약 가능 정보 객체
     * @returns {string} 예약 불가 시간대 범위 목록 문자열
     */
    const formatBookedTimesForTooltip = useCallback((dayData) => {
        if (!dayData || typeof dayData !== 'object' || Object.keys(dayData).length < 2) return '예약 정보 없음';

        // 예약 불가(false)인 슬롯만 필터링
        const bookedSlots = allTimeSlots.filter(time => dayData[time] === false);

        if (bookedSlots.length === 0) return '✅ 모든 시간 예약 가능';

        // 연속된 예약 불가 시간대를 하나의 범위로 병합
        let ranges = [];
        let currentRangeStart = null;
        for (let i = 0; i < bookedSlots.length; i++) {
            const slot = bookedSlots[i];

            if (currentRangeStart === null) currentRangeStart = slot;

            // 다음 슬롯 시간 계산 (10분 후)
            const [h, m] = slot.split(':').map(Number);
            const nextSlotTime = new Date(0, 0, 0, h, m + 10);
            const nextSlotStr = `${String(nextSlotTime.getHours()).padStart(2, '0')}:${String(nextSlotTime.getMinutes()).padStart(2, '0')}`;

            // 다음 슬롯이 예약 불가 목록에 없거나, 마지막 슬롯인 경우 범위 종료
            if (!bookedSlots.includes(nextSlotStr) || i === bookedSlots.length - 1) {
                // 종료 시간은 해당 슬롯의 끝 시간 (9분 추가)
                const endMinute = m + 9;
                const endHour = h + Math.floor(endMinute / 60);
                const endStr = `${String(endHour).padStart(2, '0')}:${String(endMinute % 60).padStart(2, '0')}`;

                ranges.push(`${currentRangeStart} ~ ${endStr}`);
                currentRangeStart = null;
            }
        }
        return `❌ 예약 불가:\n- ${ranges.join('\n- ')}`;
    }, []);

    /**
     * 예약된 비율에 따라 CSS 클래스를 반환하여 히트맵 색상을 결정합니다.
     * @param {number} percentage - 예약된 시간의 비율 (0.0 ~ 1.0)
     * @returns {string} 히트맵 CSS 클래스
     */
    const getHeatMapClass = (percentage) => {
        if (percentage >= 0.7) return 'partial-high'; // 70% 이상 예약됨
        if (percentage >= 0.3) return 'partial-mid';  // 30% 이상 예약됨
        return 'partial-low';                        // 30% 미만 예약됨
    };

    /**
     * 특정 장소와 날짜의 시간대별 예약 가능 정보를 서버에서 불러오고 캐시에 저장합니다.
     * @param {number} roomId - 장소 ID
     * @param {string} dateKey - 조회할 날짜 ('YYYY-MM-DD')
     * @returns {object|null} 일별 예약 가능 정보 객체 또는 null
     */
    const fetchDayTimeAvailability = useCallback(async (roomId, dateKey) => {
        try {
            const response = await fetch(`${API_BASE_URL}/availability/daily?roomId=${roomId}&date=${dateKey}`);
            if (!response.ok) throw new Error('서버 응답 오류: ' + response.statusText);
            const dayAvailability = await response.json();

            // 캐시 업데이트
            const monthKey = dateKey.substring(0, 7);
            setRoomAvailabilityCache(prev => ({
                ...prev,
                [roomId]: {
                    ...(prev[roomId] || {}),
                    [monthKey]: {
                        ...(prev[roomId]?.[monthKey] || {}),
                        [dateKey]: {
                            // 기존 데이터에 새 시간별 데이터 병합
                            ...(prev[roomId]?.[monthKey]?.[dateKey] || {}),
                            ...dayAvailability
                        }
                    }
                }
            }));
            return dayAvailability;
        } catch (err) {
            setError(`일별 시간 정보를 불러오는 데 실패했습니다: ${err.message}`);
            return null;
        }
    }, []);

    /**
     * 달력 날짜 셀에 마우스를 올렸을 때 툴팁을 표시하고 일별 상세 정보를 로드합니다.
     * @param {object} e - 이벤트 객체
     * @param {number} year - 연도
     * @param {number} month - 월 (0부터 시작)
     * @param {number} day - 일
     * @param {boolean} isPast - 지난 날짜인지 여부
     */
    const handleDateHover = useCallback(async (e, year, month, day, isPast) => {
        if (isPast || !selectedSpaceId) return;

        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        // 로딩 중 툴팁 표시
        setTooltip({
            visible: true,
            x: e.pageX + 10,
            y: e.pageY + 10,
            content: '불러오는 중...',
            dateKey: dateKey
        });

        const roomId = selectedSpaceId;
        const monthKey = dateKey.substring(0, 7);
        let dayData = roomAvailabilityCache[roomId]?.[monthKey]?.[dateKey];

        // 캐시에 시간표 데이터가 없으면 API 호출
        if (!dayData || !dayData['07:00']) {
            dayData = await fetchDayTimeAvailability(roomId, dateKey);
        }

        // 로드된 데이터로 툴팁 내용 업데이트
        const content = formatBookedTimesForTooltip(dayData);
        setTooltip(prev => ({
            ...prev,
            visible: true,
            content: content
        }));
    }, [selectedSpaceId, roomAvailabilityCache, fetchDayTimeAvailability, formatBookedTimesForTooltip]);

    /**
     * 달력 날짜 셀에서 마우스가 벗어났을 때 툴팁을 숨깁니다.
     */
    const handleDateLeave = useCallback(() => {
        setTooltip(prev => ({ ...prev, visible: false }));
    }, []);


    // 1. 마스터 장소 목록 로드 (컴포넌트 마운트 시 1회 실행)
    useEffect(() => {
        const fetchMasterSpaces = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/masters/spaces`);
                if (!response.ok) throw new Error('마스터 장소 목록 로드 실패');
                const data = await response.json();
                setAllMasterSpaces(data);
                // 첫 번째 장소를 기본 선택값으로 설정
                if (data.length > 0) {
                    setSelectedSpaceId(String(data[0].id));
                }
            } catch (err) {
                setError(`장소 목록 로드 실패: ${err.message}`);
                setAllMasterSpaces([]);
            }
        };
        fetchMasterSpaces();
    }, []);

    // 2. 월별 데이터 로드 (선택된 장소 또는 표시 월이 변경될 때 실행)
    useEffect(() => {
        if (!selectedSpaceId) return;

        const fetchMonthData = async () => {
            setLoading(true);
            const year = displayDate.getFullYear();
            const month = displayDate.getMonth();
            const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;

            // 이미 캐시에 데이터가 있으면 API 호출 건너뛰기
            if (roomAvailabilityCache[selectedSpaceId] && roomAvailabilityCache[selectedSpaceId][monthKey]) {
                setLoading(false);
                return;
            }

            try {
                // 월별 예약 현황 API 호출
                const response = await fetch(`${API_BASE_URL}/availability/monthly?roomId=${selectedSpaceId}&year=${year}&month=${month + 1}`);
                if (!response.ok) throw new Error('서버 응답 오류: ' + response.statusText);
                const data = await response.json();

                // 캐시에 월별 데이터 저장
                setRoomAvailabilityCache(prev => ({
                    ...prev,
                    [selectedSpaceId]: {
                        ...(prev[selectedSpaceId] || {}),
                        [monthKey]: data
                    }
                }));

            } catch (err) {
                setError(`월별 예약 가능 정보를 불러오는 데 실패했습니다: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };
        fetchMonthData();
    }, [selectedSpaceId, displayDate, roomAvailabilityCache]);

    // 3. 달력 셀 계산 (표시 월이 변경될 때마다 재계산)
    const { calendarCells, displayYear, displayMonth } = useMemo(() => {
        const year = displayDate.getFullYear();
        const month = displayDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        // 해당 월의 1일이 무슨 요일인지 (0: 일요일, 6: 토요일)
        const firstDayOfWeek = new Date(year, month, 1).getDay();

        const cells = [];
        // 전달의 빈 셀 채우기
        for (let i = 0; i < firstDayOfWeek; i++) { cells.push(null); }
        // 해당 월의 날짜 채우기
        for (let d = 1; d <= daysInMonth; d++) { cells.push(d); }

        return { calendarCells: cells, displayYear: year, displayMonth: month };
    }, [displayDate]);

    /**
     * 4. 월 이동 핸들러
     * @param {string} direction - 'prev' 또는 'next'
     */
    const navigateMonth = (direction) => {
        const newDate = new Date(displayDate);
        const todayMonth = today.getMonth();
        const todayYear = today.getFullYear();

        newDate.setMonth(displayDate.getMonth() + (direction === 'next' ? 1 : -1));

        // 지난 달로 이동 방지
        if (newDate.getFullYear() < todayYear || (newDate.getFullYear() === todayYear && newDate.getMonth() < todayMonth)) {
            alert('지난 달은 볼 수 없습니다.');
            return;
        }

        setDisplayDate(newDate);
        setError(null);
    };

    /**
     * 5. 날짜별 예약 현황 데이터 가져오기
     * @param {number} year - 연도
     * @param {number} month - 월 (0부터 시작)
     * @param {number} day - 일
     * @returns {object} { status: 'available'|'partial'|'booked'|'loading'|'no-room', percentage: number, period_status: object }
     */
    const getDayStatus = (year, month, day) => {
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const monthKey = dateKey.substring(0, 7);

        if (!selectedSpaceId) return { status: 'no-room' };
        const roomCache = roomAvailabilityCache[selectedSpaceId];

        // 월별 데이터가 캐시되지 않았으면 로딩 상태 반환
        if (!roomCache || !roomCache[monthKey]) return { status: 'loading' };

        // 해당 날짜의 데이터 반환 (월별 API는 period_status, percentage, status를 반환함)
        const dayData = roomCache[monthKey][dateKey];
        if (dayData && dayData.status) return dayData;

        // 데이터는 있으나 status 정보가 없는 경우 (예외 처리)
        return { status: 'available', percentage: 0 };
    };

    /**
     * 6. 날짜 클릭 핸들러 (세부 시간 선택 페이지로 이동)
     * @param {number} year - 연도
     * @param {number} month - 월 (0부터 시작)
     * @param {number} day - 일
     */
    const handleDateClick = (year, month, day) => {
        if (!selectedSpaceId) {
            alert('먼저 장소를 선택해주세요.');
            return;
        }

        const dateObj = new Date(year, month, day);
        // 지난 날짜 클릭 방지
        if (dateObj < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
            alert('지난 날짜의 세부 현황은 볼 수 없습니다.');
            return;
        }

        const selectedRoom = allMasterSpaces.find(s => s.id === parseInt(selectedSpaceId));
        if (!selectedRoom) {
            alert('장소 정보를 찾을 수 없습니다.');
            return;
        }

        const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        // 다음 페이지로 전달할 장소 및 날짜 정보 LocalStorage에 저장
        const prefillData = {
            room: selectedRoom,
            date: formattedDate
        };
        localStorage.setItem('prefillPlaceFocus', JSON.stringify(prefillData));

        // '장소 우선 예약' 페이지로 이동
        onNavigate('placeFocusSelectPage');
    };

    return (
        <div className="calendar-page-container">
            {/* 뒤로가기 버튼 */}
            <button
                onClick={() => onNavigate('main')}
                className="back-button"
            >
                <BsArrowLeft size={16} />
                뒤로
            </button>

            <div className="main-page-calendar-wrapper">
                {/* 페이지 제목 */}
                <h1 className="main-calendar-title">
                    <BsBuilding size={24} />
                    주요 장소 월별 예약 현황
                </h1>

                {/* 장소 선택 드롭다운 */}
                <div className="main-calendar-controls">
                    <select
                        className="main-calendar-select"
                        value={selectedSpaceId}
                        onChange={(e) => setSelectedSpaceId(e.target.value)}
                    >
                        {allMasterSpaces.length === 0 ? (
                            <option>장소 로딩 중...</option>
                        ) : (
                            allMasterSpaces.map(space => (
                                <option key={space.id} value={space.id}>
                                    {space.name} ({space.location})
                                </option>
                            ))
                        )}
                    </select>
                </div>

                {/* 뷰 토글 버튼 (히트맵 <=> 시간대별) */}
                <button
                    className={`view-toggle-button ${isTimeView ? 'is-flipped' : ''}`}
                    onClick={() => setIsTimeView(!isTimeView)}
                >
                    <BsArrowRepeat size={16} />
                    {isTimeView ? '날짜별 현황 보기' : '시간대별 현황 보기'}
                </button>

                {/* 월 이동 버튼 및 표시 월 */}
                <div className="calendar-header">
                    {/* 지난 달 이동 버튼은 현재 월이면 비활성화 */}
                    <button onClick={() => navigateMonth('prev')} disabled={displayMonth === today.getMonth() && displayYear === today.getFullYear()}>&#9664; 이전</button>
                    <span>{displayYear}년 {displayMonth + 1}월</span>
                    <button onClick={() => navigateMonth('next')}>다음 &#9654;</button>
                </div>

                {/* 에러 메시지 */}
                {error && <p className="calendar-error-text">{error}</p>}

                {/* 달력 그리드 영역 */}
                <div className="calendar-grid">
                    {/* 요일 헤더 */}
                    {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                        <div key={day} className="calendar-header-day">{day}</div>
                    ))}

                    {/* 날짜 셀 렌더링 */}
                    {calendarCells.map((day, idx) => {
                        // 빈 셀 (전달의 남은 요일) 처리
                        if (day === null) return <div key={idx} className="day-cell-container inactive" />;

                        const year = displayYear;
                        const month = displayMonth;
                        const dateObj = new Date(year, month, day);
                        const isPast = dateObj < new Date(today.getFullYear(), today.getMonth(), today.getDate());

                        // 해당 날짜의 예약 상태 정보
                        const dayData = getDayStatus(year, month, day);
                        const status = isPast ? 'past-date' : (dayData.status || 'loading');
                        const percentage = dayData.percentage || 0;
                        const periodStatus = dayData.period_status || { morning: 'loading', afternoon: 'loading', evening: 'loading' };

                        const isClickable = !isPast && status !== 'booked';
                        // 부분 예약 상태일 경우 히트맵 클래스 결정
                        const heatMapClass = (status === 'partial' && !isPast) ? getHeatMapClass(percentage) : '';

                        // 표시할 텍스트 결정
                        let statusText = '...';
                        if (isPast) { statusText = '지난 날짜'; }
                        else if (status === 'booked') { statusText = '예약 불가'; }
                        else if (status === 'partial') { statusText = `${Math.round(percentage * 100)}% 예약됨`; }
                        else if (status === 'available') { statusText = '사용 가능'; }
                        else if (status === 'loading') { statusText = '로딩 중'; }

                        return (
                            <div
                                key={idx}
                                // 3D 플립 애니메이션을 위한 클래스 및 과거 날짜 클래스
                                className={`day-cell-container ${isTimeView ? 'is-flipped' : ''} ${isPast ? 'past' : ''}`}
                                // 클릭 가능하면 handleDateClick 호출 (세부 예약 페이지로 이동)
                                onClick={() => isClickable && handleDateClick(year, month, day)}
                            >
                                <div className="day-cell-flipper">
                                    {/* --- 캘린더 앞면 (히트맵/텍스트 뷰) --- */}
                                    <div
                                        className={`cell-front ${isPast ? 'past-date' : status} ${heatMapClass}`}
                                        // 툴팁: 시간대별 뷰가 아닐 때만 호버/리브 이벤트 등록
                                        onMouseEnter={(e) => !isTimeView && handleDateHover(e, year, month, day, isPast || status === 'booked')}
                                        onMouseLeave={(e) => !isTimeView && handleDateLeave(e)}
                                    >
                                        <span className="date-number">{day}</span>
                                        <span className="availability-status">
                                            {statusText}
                                        </span>
                                    </div>
                                    {/* --- 캘린더 뒷면 (시간대별 블록 뷰) --- */}
                                    <div className={`cell-back ${isPast ? 'past-date' : ''}`}>
                                        <div className={`period-block ${isPast ? 'past' : periodStatus.morning}`}>오전</div>
                                        <div className={`period-block ${isPast ? 'past' : periodStatus.afternoon}`}>오후</div>
                                        <div className={`period-block ${isPast ? 'past' : periodStatus.evening}`}>저녁</div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                {/* 로딩 오버레이 */}
                {loading && <div className="calendar-loading-overlay">로딩 중...</div>}
            </div>

            {/* 툴팁 렌더링 (시간대별 뷰가 아닐 때만) */}
            {tooltip.visible && !isTimeView && (
                <div
                    className="calendar-tooltip"
                    // 마우스 위치에 툴팁 표시
                    style={{
                        top: tooltip.y,
                        left: tooltip.x,
                    }}
                >
                    {tooltip.content === '불러오는 중...' ? (
                        <span className="tooltip-loading">{tooltip.content}</span>
                    ) : (
                        <>
                            <strong>{tooltip.dateKey}</strong>
                            <hr style={{ borderColor: '#555', margin: '4px 0' }} />
                            {/* 포맷팅된 예약 불가 시간대 목록 */}
                            <pre style={{ margin: 0, padding: 0, whiteSpace: 'pre-wrap', color: tooltip.content.includes('✅') ? '#28a745' : '#dc3545' }}>{tooltip.content}</pre>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default MonthlyCalendarPage;