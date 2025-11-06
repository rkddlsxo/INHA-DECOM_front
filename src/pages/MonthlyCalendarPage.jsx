import React, { useState, useEffect, useMemo, useCallback } from 'react';
// ⭐️ 아이콘 추가
import { BsBuilding, BsArrowLeft, BsArrowRepeat } from 'react-icons/bs';
import './MonthlyCalendarPage.css'; 

const API_BASE_URL = 'http://localhost:5050/api';
const today = new Date();

function getDaysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); }

// ⭐️ [신규] PlaceFocusSelectPage에서 가져옴
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
const allTimeSlots = generateTimeSlots();
// ------------------------------------

const MonthlyCalendarPage = ({ onNavigate }) => {
    const [allMasterSpaces, setAllMasterSpaces] = useState([]);
    const [selectedSpaceId, setSelectedSpaceId] = useState(''); 
    const [roomAvailabilityCache, setRoomAvailabilityCache] = useState({}); 
    
    const [displayDate, setDisplayDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // ⭐️ [신규] 툴팁 상태
    const [tooltip, setTooltip] = useState({
        visible: false, x: 0, y: 0, content: '', dateKey: null
    });
    
    // ⭐️ [신규] 카드 뒤집기 뷰 상태
    const [isTimeView, setIsTimeView] = useState(false);

    // ⭐️ [신규] 1. 툴팁용 시간 포맷팅 헬퍼
    const formatBookedTimesForTooltip = useCallback((dayData) => {
        if (!dayData || typeof dayData !== 'object') return '예약 정보 없음';
        if (!Object.keys(dayData).some(k => k.match(/^\d{2}:\d{2}$/))) {
            return '정보 로딩 중...';
        }
        const bookedSlots = allTimeSlots.filter(time => dayData[time] === false);
        if (bookedSlots.length === 0) return '✅ 모든 시간 예약 가능';

        let ranges = [];
        let currentRangeStart = null;
        for (let i = 0; i < bookedSlots.length; i++) {
            const slot = bookedSlots[i];
            if (currentRangeStart === null) currentRangeStart = slot;
            const [h, m] = slot.split(':').map(Number);
            const nextSlotTime = new Date(0, 0, 0, h, m + 10);
            const nextSlotStr = `${String(nextSlotTime.getHours()).padStart(2, '0')}:${String(nextSlotTime.getMinutes()).padStart(2, '0')}`;

            if (!bookedSlots.includes(nextSlotStr) || i === bookedSlots.length - 1) {
                const endMinute = m + 9;
                const endHour = h + Math.floor(endMinute / 60);
                const endStr = `${String(endHour).padStart(2, '0')}:${String(endMinute % 60).padStart(2, '0')}`;
                ranges.push(`${currentRangeStart} ~ ${endStr}`);
                currentRangeStart = null;
            }
        }
        return `❌ 예약 불가:\n- ${ranges.join('\n- ')}`;
    }, []);

    // ⭐️ [신규] 2. 히트맵 CSS 클래스 반환 헬퍼
    const getHeatMapClass = (percentage) => {
        if (percentage >= 0.7) return 'partial-high';
        if (percentage >= 0.3) return 'partial-mid';
        return 'partial-low'; // 0.3 미만
    };

    // ⭐️ [신규] 일별 상세 API 호출 함수
    const fetchDayTimeAvailability = useCallback(async (roomId, dateKey) => {
        try {
            const response = await fetch(`${API_BASE_URL}/availability/daily?roomId=${roomId}&date=${dateKey}`);
            if (!response.ok) throw new Error('서버 응답 오류: ' + response.statusText);
            const dayAvailability = await response.json(); 

            const monthKey = dateKey.substring(0, 7);
            setRoomAvailabilityCache(prev => ({
                ...prev,
                [roomId]: {
                    ...(prev[roomId] || {}),
                    [monthKey]: {
                        ...(prev[roomId]?.[monthKey] || {}),
                        [dateKey]: { 
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

    // ⭐️ [신규] 3. 툴팁 표시/숨기기 핸들러
    const handleDateHover = useCallback(async (e, year, month, day, isPast) => {
        if (isPast || !selectedSpaceId) return;

        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        setTooltip({
            visible: true,
            x: e.pageX,
            y: e.pageY,
            content: '불러오는 중...',
            dateKey: dateKey
        });

        const roomId = selectedSpaceId;
        const monthKey = dateKey.substring(0, 7);
        let dayData = roomAvailabilityCache[roomId]?.[monthKey]?.[dateKey];

        if (!dayData || !dayData['07:00']) { // 시간표 데이터가 없으면 호출
            dayData = await fetchDayTimeAvailability(roomId, dateKey);
        }

        const content = formatBookedTimesForTooltip(dayData);
        setTooltip(prev => ({
            ...prev,
            visible: true,
            x: e.pageX,
            y: e.pageY,
            content: content
        }));
    }, [selectedSpaceId, roomAvailabilityCache, fetchDayTimeAvailability, formatBookedTimesForTooltip]);

    const handleDateLeave = useCallback(() => {
        setTooltip(prev => ({ ...prev, visible: false }));
    }, []);


    // 1. 마스터 장소 목록 로드
    useEffect(() => {
        const fetchMasterSpaces = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/masters/spaces`);
                if (!response.ok) throw new Error('마스터 장소 목록 로드 실패');
                const data = await response.json();
                setAllMasterSpaces(data);
                if (data.length > 0) {
                    setSelectedSpaceId(data[0].id);
                }
            } catch (err) {
                setError(`장소 목록 로드 실패: ${err.message}`);
                setAllMasterSpaces([]);
            }
        };
        fetchMasterSpaces();
    }, []);

    // 2. 월별 데이터 로드
    useEffect(() => {
        if (!selectedSpaceId) return;

        const fetchMonthData = async () => {
            setLoading(true);
            const year = displayDate.getFullYear();
            const month = displayDate.getMonth();
            const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
            
            if (roomAvailabilityCache[selectedSpaceId] && roomAvailabilityCache[selectedSpaceId][monthKey]) {
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/availability/monthly?roomId=${selectedSpaceId}&year=${year}&month=${month + 1}`);
                if (!response.ok) throw new Error('서버 응답 오류: ' + response.statusText);
                const data = await response.json();

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

    // 3. 달력 셀 계산
    const { calendarCells, displayYear, displayMonth } = useMemo(() => {
        const year = displayDate.getFullYear();
        const month = displayDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDayOfWeek = new Date(year, month, 1).getDay();

        const cells = [];
        for (let i = 0; i < firstDayOfWeek; i++) { cells.push(null); }
        for (let d = 1; d <= daysInMonth; d++) { cells.push(d); }

        return { calendarCells: cells, displayYear: year, displayMonth: month };
    }, [displayDate]);

    // 4. 월 이동 핸들러
    const navigateMonth = (direction) => {
        const newDate = new Date(displayDate);
        const todayMonth = today.getMonth();
        const todayYear = today.getFullYear();
        
        newDate.setMonth(displayDate.getMonth() + (direction === 'next' ? 1 : -1));

        if (newDate.getFullYear() < todayYear || (newDate.getFullYear() === todayYear && newDate.getMonth() < todayMonth)) {
            alert('지난 달은 볼 수 없습니다.');
            return;
        }
        
        setDisplayDate(newDate);
        setError(null);
    };

    // 5. 날짜별 상태 가져오기
    const getDayStatus = (year, month, day) => {
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const monthKey = dateKey.substring(0, 7);

        if (!selectedSpaceId) return { status: 'no-room' };
        const roomCache = roomAvailabilityCache[selectedSpaceId];
        if (!roomCache || !roomCache[monthKey]) return { status: 'loading' };
        const dayData = roomCache[monthKey][dateKey];
        // ⭐️ [수정] dayData가 period_status를 포함하여 반환됨
        if (dayData && dayData.status) return dayData;
        return { status: 'available', percentage: 0 };
    };

    // 6. 날짜 클릭 핸들러
    const handleDateClick = (year, month, day) => {
        if (!selectedSpaceId) {
            alert('먼저 장소를 선택해주세요.');
            return;
        }

        const dateObj = new Date(year, month, day);
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
        
        const prefillData = {
            room: selectedRoom,
            date: formattedDate
        };
        localStorage.setItem('prefillPlaceFocus', JSON.stringify(prefillData));

        onNavigate('placeFocusSelectPage');
    };

    return (
        <div className="calendar-page-container">
            <button
                onClick={() => onNavigate('main')}
                className="back-button"
            >
                <BsArrowLeft size={16} />
                뒤로
            </button>

            <div className="main-page-calendar-wrapper">
                <h1 className="main-calendar-title">
                    <BsBuilding size={24} />
                    주요 장소 월별 예약 현황
                </h1>
                
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

                {/* ⭐️ [신규] 뷰 토글 버튼 */}
                <button 
                    className={`view-toggle-button ${isTimeView ? 'is-flipped' : ''}`}
                    onClick={() => setIsTimeView(!isTimeView)}
                >
                    <BsArrowRepeat size={16} />
                    {isTimeView ? '날짜별 현황 보기' : '시간대별 현황 보기'}
                </button>

                <div className="calendar-header">
                    <button onClick={() => navigateMonth('prev')} disabled={displayMonth === today.getMonth() && displayYear === today.getFullYear()}>&#9664; 이전</button>
                    <span>{displayYear}년 {displayMonth + 1}월</span>
                    <button onClick={() => navigateMonth('next')}>다음 &#9654;</button>
                </div>

                {error && <p className="calendar-error-text">{error}</p>}
                
                <div className="calendar-grid">
                    {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                        <div key={day} className="calendar-header-day">{day}</div>
                    ))}

                    {/* ⭐️ [수정] 3D 플립 구조로 변경 */}
                    {calendarCells.map((day, idx) => {
                        if (day === null) return <div key={idx} className="day-cell-container inactive" />;

                        const year = displayYear;
                        const month = displayMonth;
                        const dateObj = new Date(year, month, day);
                        const isPast = dateObj < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                        
                        const dayData = getDayStatus(year, month, day);
                        const status = isPast ? 'past-date' : (dayData.status || 'loading');
                        const percentage = dayData.percentage || 0;
                        const periodStatus = dayData.period_status || { morning: 'loading', afternoon: 'loading', evening: 'loading' };

                        const isClickable = !isPast && status !== 'booked';
                        const heatMapClass = (status === 'partial' && !isPast) ? getHeatMapClass(percentage) : '';
                        
                        let statusText = '...';
                        if (isPast) { statusText = '지난 날짜'; }
                        else if (status === 'booked') { statusText = '예약 불가'; }
                        else if (status === 'partial') { statusText = `${Math.round(percentage * 100)}% 예약됨`; }
                        else if (status === 'available') { statusText = '사용 가능'; }
                        else if (status === 'loading') { statusText = '로딩 중'; }

                        return (
                            <div 
                                key={idx} 
                                className={`day-cell-container ${isTimeView ? 'is-flipped' : ''} ${isPast ? 'past' : ''}`}
                                onClick={() => isClickable && handleDateClick(year, month, day)}
                            >
                                <div className="day-cell-flipper">
                                    {/* --- 캘린더 앞면 --- */}
                                    <div 
                                        className={`cell-front ${isPast ? 'past-date' : status} ${heatMapClass}`}
                                        onMouseEnter={(e) => !isTimeView && handleDateHover(e, year, month, day, isPast || status === 'booked')}
                                        onMouseLeave={(e) => !isTimeView && handleDateLeave(e)}
                                    >
                                        <span className="date-number">{day}</span>
                                        <span className="availability-status">
                                            {statusText}
                                        </span>
                                    </div>
                                    {/* --- 캘린더 뒷면 --- */}
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
                {loading && <div className="calendar-loading-overlay">로딩 중...</div>}
            </div>

            {/* ⭐️ [신규] 툴팁 렌더링 (앞면일 때만) */}
            {tooltip.visible && !isTimeView && (
                <div
                    className="calendar-tooltip"
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
                            {tooltip.content}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default MonthlyCalendarPage;