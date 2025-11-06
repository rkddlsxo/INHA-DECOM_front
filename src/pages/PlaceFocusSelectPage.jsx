import React, { useState, useMemo, useEffect, useCallback } from 'react';
import './PlaceFocusSelectPage.css';
// ⭐️ 아이콘 추가
import { BsArrowLeft, BsBuilding, BsCalendarCheck, BsArrowRepeat } from 'react-icons/bs';

const LAST_PAGE_KEY = 'lastReservationSelectPage';
const API_BASE_URL = 'http://localhost:5050/api';
const today = new Date();

function getDaysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); }

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

const generateHourOptions = () => {
    const hours = [];
    for (let h = 7; h <= 21; h++) {
        hours.push(String(h).padStart(2, '0'));
    }
    return hours;
};

const generateMinuteOptions = (type) => {
    const minutes = [];
    for (let m = 0; m <= 50; m += 10) {
        if (type === 'start') {
            minutes.push(String(m).padStart(2, '0'));
        } else { // type === 'end'
            if (m === 50) {
                minutes.push('59');
            } else {
                minutes.push(String(m + 9).padStart(2, '0'));
            }
        }
    }
    const options = Array.from(new Set(minutes)).sort();
    if (type === 'end' && !options.includes('59')) {
        options.push('59');
    }
    return options;
};
// ------------------------------------

const PlaceFocusSelectPage = ({ onNavigate }) => {
    const [allMasterSpaces, setAllMasterSpaces] = useState([]);
    const [selectedRooms, setSelectedRooms] = useState([]);
    const [displayDate, setDisplayDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const [selectedDate, setSelectedDate] = useState(null); // YYYY-MM-DD

    const [selectedHour, setSelectedHour] = useState({ start: '09', end: '10' });
    const [selectedMinute, setSelectedMinute] = useState({ start: '00', end: '59' });
    const [selectedTimeRange, setSelectedTimeRange] = useState({ start: '09:00', end: '10:59' });

    const [selectedFinalRoomId, setSelectedFinalRoomId] = useState(null);
    const [expandedCategories, setExpandedCategories] = useState({});

    const [roomAvailabilityCache, setRoomAvailabilityCache] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [timeLoading, setTimeLoading] = useState(false);

    // ⭐️ [신규] 툴팁 상태
    const [tooltip, setTooltip] = useState({
        visible: false, x: 0, y: 0, content: '', dateKey: null
    });
    
    // ⭐️ [신규] 카드 뒤집기 뷰 상태
    const [isTimeView, setIsTimeView] = useState(false);


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

    const groupedSpaces = useMemo(() => {
        return allMasterSpaces.reduce((groups, space) => {
            const category = space.category;
            const subCategory = space.subCategory || space.name;
            if (!groups[category]) groups[category] = {};
            if (!groups[category][subCategory]) groups[category][subCategory] = [];
            groups[category][subCategory].push(space);
            return groups;
        }, {});
    }, [allMasterSpaces]);

    const hourOptions = useMemo(() => generateHourOptions(), []);

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


    // ⭐️ API 호출 함수 (일별)
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
        if (isPast || selectedRooms.length === 0) return;

        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        setTooltip({
            visible: true,
            x: e.pageX,
            y: e.pageY,
            content: '불러오는 중...',
            dateKey: dateKey
        });

        const roomId = selectedRooms[0].id;
        const monthKey = dateKey.substring(0, 7);
        let dayData = roomAvailabilityCache[roomId]?.[monthKey]?.[dateKey];

        if (!dayData || !dayData['07:00']) {
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
    }, [selectedRooms, roomAvailabilityCache, fetchDayTimeAvailability, formatBookedTimesForTooltip]);

    const handleDateLeave = useCallback(() => {
        setTooltip(prev => ({ ...prev, visible: false }));
    }, []);


    // 1. 마스터 장소 목록 로드
    useEffect(() => {
        const fetchMasterSpaces = async () => {
            setLoading(true);
            try {
                const response = await fetch(`${API_BASE_URL}/masters/spaces`);
                if (!response.ok) throw new Error('마스터 장소 목록 로드 실패');
                const data = await response.json();
                setAllMasterSpaces(data);
                const initialExpandedState = data.reduce((acc, space) => {
                    if (space.category && !acc[space.category]) {
                        acc[space.category] = true;
                    }
                    return acc;
                }, {});
                setExpandedCategories(initialExpandedState);
            } catch (err) {
                setError(`장소 목록 로드 실패: ${err.message}`);
                setAllMasterSpaces([]);
            } finally {
                setLoading(false);
            }
        };
        fetchMasterSpaces();
    }, []);

    // 2. 캘린더 페이지에서 넘어온 정보(prefill) 처리
    useEffect(() => {
        if (allMasterSpaces.length === 0) return; 
        const prefillDataJSON = localStorage.getItem('prefillPlaceFocus');
        if (prefillDataJSON) {
            try {
                const data = JSON.parse(prefillDataJSON);
                const roomToSelect = allMasterSpaces.find(s => s.id === data.room.id);
                if (roomToSelect && data.date) { // ⭐️ data.date가 있는지 확인
                    const [year, month, day] = data.date.split('-').map(Number);
                    setSelectedRooms([roomToSelect]);
                    setSelectedDate(data.date);
                    setDisplayDate(new Date(year, month - 1, 1)); 
                    setTimeLoading(true);
                    fetchDayTimeAvailability(roomToSelect.id, data.date)
                        .finally(() => setTimeLoading(false));
                } else if (roomToSelect) { // ⭐️ 날짜 정보 없이 장소만 넘어온 경우
                    setSelectedRooms([roomToSelect]);
                }
                localStorage.removeItem('prefillPlaceFocus');
            } catch (e) {
                console.error("Failed to parse prefill data", e);
                localStorage.removeItem('prefillPlaceFocus');
            }
        }
    }, [allMasterSpaces, fetchDayTimeAvailability]);

    
    // API 호출 (월별)
    const fetchMonthAvailability = async (roomId, year, month) => {
        const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
        try {
            const response = await fetch(`${API_BASE_URL}/availability/monthly?roomId=${roomId}&year=${year}&month=${month + 1}`);
            if (!response.ok) throw new Error('서버 응답 오류: ' + response.statusText);
            // ⭐️ [수정] 백엔드에서 period_status를 포함한 데이터를 받음
            const data = await response.json(); 
            setRoomAvailabilityCache(prev => ({
                ...prev,
                [roomId]: { 
                    ...(prev[roomId] || {}), 
                    [monthKey]: data
                }
            }));
        } catch (err) {
            setError(`월별 예약 가능 정보를 불러오는 데 실패했습니다: ${err.message}`);
        }
    };
    
    // 3. 월별 데이터 로드 (기존 로직)
    useEffect(() => {
        if (selectedRooms.length === 0) return;
        const fetchAllMonthData = async () => {
            setLoading(true);
            const currentMonthKey = `${displayYear}-${String(displayMonth + 1).padStart(2, '0')}`;
            const promises = selectedRooms.map(room => {
                const roomMonthCache = roomAvailabilityCache[room.id];
                if (!roomMonthCache || !roomMonthCache[currentMonthKey]) {
                    return fetchMonthAvailability(room.id, displayYear, displayMonth);
                }
                return Promise.resolve();
            });
            await Promise.all(promises);
            setLoading(false);
        };
        fetchAllMonthData();
    }, [selectedRooms, displayDate, displayYear, displayMonth, roomAvailabilityCache]); // ⭐️ 의존성 배열 수정


    const handleRoomSelect = (room) => {
        setSelectedDate(null);
        setSelectedTimeRange({ start: '09:00', end: '10:59' });
        setSelectedHour({ start: '09', end: '10' });
        setSelectedMinute({ start: '00', end: '59' });
        setError(null);
        setSelectedRooms(prev => {
            const isSelected = prev.some(r => r.id === room.id);
            if (isSelected) {
                return [];
            } else {
                return [room];
            }
        });
    };

    const toggleCategory = (categoryName) => {
        setExpandedCategories(prev => ({
            ...prev,
            [categoryName]: !prev[categoryName]
        }));
    };

    const handleDateClick = (year, month, day) => {
        if (selectedRooms.length === 0) return;
        const dateObj = new Date(year, month, day);
        if (dateObj < new Date(today.getFullYear(), today.getMonth(), today.getDate())) return;
        const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        setSelectedDate(formattedDate);
        setError(null);
        setTimeLoading(true);
        const fetchPromises = selectedRooms.map(room => fetchDayTimeAvailability(room.id, formattedDate));
        Promise.all(fetchPromises)
            .then(() => setTimeLoading(false))
            .catch(() => setTimeLoading(false));
    };

    const handleTimeInputComponentChange = (field, part, e) => {
        const value = e.target.value;
        let newStartHour = selectedHour.start;
        let newStartMinute = selectedMinute.start;
        let newEndHour = selectedHour.end;
        let newEndMinute = selectedMinute.end;

        if (part === 'hour') {
            if (field === 'start') { newStartHour = value; } else { newEndHour = value; }
        } else {
            if (field === 'start') { newStartMinute = value; } else { newEndMinute = value; }
        }
        setSelectedHour({ start: newStartHour, end: newEndHour });
        setSelectedMinute({ start: newStartMinute, end: newEndMinute });
        setSelectedTimeRange({
            start: `${newStartHour}:${newStartMinute}`,
            end: `${newEndHour}:${newEndMinute}`,
        });
    };

    const handleFinalRoomSelect = (e) => {
        setSelectedFinalRoomId(Number(e.target.value));
    };

    const handleNext = () => {
        if (selectedRooms.length === 0 || !selectedDate || !selectedTimeRange.start || !selectedTimeRange.end) {
            alert('장소, 날짜, 시작/종료 시간을 모두 선택해야 합니다.');
            return;
        }
        if (selectedTimeRange.start >= selectedTimeRange.end) {
            alert('종료 시간은 시작 시간보다 늦어야 합니다.');
            return;
        }

        const checkRangeAvailability = () => {
            const currentStartTime = selectedTimeRange.start;
            const currentEndTime = selectedTimeRange.end;
            let timePointer = currentStartTime;
            while (timePointer < currentEndTime) {
                const room = selectedRooms[0];
                const monthKey = selectedDate.substring(0, 7);
                const dayData = roomAvailabilityCache[room.id]?.[monthKey]?.[selectedDate];
                if (!dayData || dayData[timePointer] === false) {
                     return { isOverlap: true, overlapTime: timePointer };
                }
                const [h, m] = timePointer.split(':').map(Number);
                const nextTime = new Date(0, 0, 0, h, m + 10);
                timePointer = `${String(nextTime.getHours()).padStart(2, '0')}:${String(nextTime.getMinutes()).padStart(2, '0')}`;
            }
            return { isOverlap: false };
        };

        const overlapResult = checkRangeAvailability();
        if (overlapResult.isOverlap) {
            alert(`선택한 시간대 (${overlapResult.overlapTime} 근처)에 예약이 불가능한 장소가 포함되어 있습니다. 예약 불가 시간대 목록을 확인해주세요.`);
            return;
        }

        const finalRoom = selectedRooms[0];
        if (!finalRoom) {
            alert('예약 정보를 확정할 장소를 찾을 수 없습니다.');
            return;
        }

        const tempBookingData = {
            roomName: finalRoom.name,
            roomLocation: finalRoom.location,
            date: selectedDate,
            startTime: selectedTimeRange.start,
            endTime: selectedTimeRange.end,
        };
        localStorage.setItem('tempBookingData', JSON.stringify(tempBookingData));
        localStorage.setItem(LAST_PAGE_KEY, 'placeFocusSelectPage');
        onNavigate('reservationDetailsPage');
    };

    const navigateMonth = (direction) => {
        if (selectedRooms.length === 0) return;
        const newDate = new Date(displayDate);
        const todayMonth = today.getMonth();
        const todayYear = today.getFullYear();
        const limitDate = new Date(todayYear, todayMonth + 2, 0); 
        newDate.setMonth(displayDate.getMonth() + (direction === 'next' ? 1 : -1));
        if (newDate.getTime() > limitDate.getTime()) {
            alert('예약은 현재 월 기준 다음 달까지만 가능합니다.');
            return;
        }
        if (newDate.getFullYear() < todayYear || (newDate.getFullYear() === todayYear && newDate.getMonth() < todayMonth)) {
            alert('지난 달은 볼 수 없습니다.');
            return;
        }
        setDisplayDate(newDate);
        setSelectedDate(null);
        setError(null);
    };

    const getDayStatus = (year, month, day) => {
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const monthKey = dateKey.substring(0, 7);
        if (selectedRooms.length === 0) return { status: 'no-room' };
        const room = selectedRooms[0];
        const roomCache = roomAvailabilityCache[room.id];
        if (!roomCache || !roomCache[monthKey]) {
            return { status: 'loading' };
        }
        const dayData = roomCache[monthKey][dateKey];
        // ⭐️ [수정] dayData가 period_status를 포함하여 반환됨
        if (dayData && dayData.status) {
             return dayData;
        }
        return { status: 'loading' };
    };
    
    const startTimeMinuteOptions = useMemo(() => generateMinuteOptions('start'), []);
    const endTimeMinuteOptions = useMemo(() => generateMinuteOptions('end'), []);


    return (
        <div className="reservation-combined-container">
            <button
                onClick={() => onNavigate('reservationFormSelectPage')}
                className="back-btn"
            >
                <BsArrowLeft size={16} /> 
                뒤로
            </button>
            <h1 className="page-title">📌 공간 우선 예약</h1>
            {error && <p className="error-text" style={{ position: 'relative', top: '10px' }}>{error}</p>}

            <div className="selection-area-wrapper">
                <div className="room-list-box">
                    <h2 className="box-title">
                        <BsBuilding size={24} /> 
                        장소 목록 ({allMasterSpaces.length}개)
                    </h2>
                    <p className="instruction-text-small">하나의 장소를 선택해주세요.</p>

                    {Object.keys(groupedSpaces).map(category => (
                        <div key={category} className="category-group-wrapper">
                            <div
                                className={`category-header ${expandedCategories[category] ? 'expanded' : ''}`}
                                onClick={() => toggleCategory(category)}
                            >
                                <strong>{category}</strong>
                                <span className="toggle-icon">▼</span> 
                            </div>
                            {expandedCategories[category] && (
                                <div className="sub-category-content">
                                    {Object.keys(groupedSpaces[category]).map(subCategory => {
                                        const roomsInSub = groupedSpaces[category][subCategory];
                                        return (
                                            <div key={subCategory} className="sub-category-group">
                                                <div className="sub-category-title">
                                                    {subCategory}
                                                </div>
                                                <div className="room-item-list">
                                                    {roomsInSub.map(room => (
                                                        <div
                                                            key={room.id}
                                                            className={`room-item${selectedRooms.some(r => r.id === room.id) ? ' selected' : ''}`}
                                                            onClick={() => handleRoomSelect(room)}
                                                        >
                                                            <span className="room-name-display">{room.name} ({room.location})</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                
                <div className="schedule-area-box">
                    <h2 className="box-title">
                        <BsCalendarCheck size={24} /> 
                        {selectedRooms.length > 0 ? `선택 장소: ${selectedRooms[0].name}` : '장소를 선택해주세요'}
                    </h2>
                    
                    {selectedRooms.length > 0 ? (
                        <>
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
                                    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                    const isSelected = selectedDate === formattedDate;
                                    
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
                                            // ⭐️ 뒷면 클릭 시 앞면으로 돌아오기 (선택사항)
                                            onClick={() => isTimeView && isClickable && handleDateClick(year, month, day)}
                                        >
                                            <div className="day-cell-flipper">
                                                {/* --- 캘린더 앞면 --- */}
                                                <div 
                                                    className={`cell-front ${isSelected ? 'selected-date' : ''} ${isPast ? 'past-date' : status} ${heatMapClass}`}
                                                    onClick={() => !isTimeView && isClickable && handleDateClick(year, month, day)}
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
                        </>
                    ) : (
                        <p className="instruction-text">왼쪽에서 장소를 선택해주세요.</p>
                    )}
                    
                    {/* 날짜 선택 시 보이는 하단 UI (타임라인/시간선택) */}
                    {selectedDate && selectedRooms.length > 0 && timeLoading && (
                        <p className="loading-text" style={{ marginTop: '20px' }}>
                            시간표를 불러오는 중입니다...
                        </p>
                    )}
                    
                    {selectedDate && selectedRooms.length > 0 && !timeLoading && (
                        <div className="time-selection-container">
                            <h3>예약 시간대 선택 (10분 단위)</h3>
                            <div className="time-inputs-wrapper">
                                <select
                                    value={selectedHour.start}
                                    onChange={(e) => handleTimeInputComponentChange('start', 'hour', e)}
                                    className="time-select"
                                >
                                    {hourOptions.map(h => (
                                        <option key={`sh-${h}`} value={h}>{h}</option>
                                    ))}
                                </select>
                                <span className="time-separator">:</span>
                                <select
                                    value={selectedMinute.start}
                                    onChange={(e) => handleTimeInputComponentChange('start', 'minute', e)}
                                    className="time-select"
                                >
                                    {startTimeMinuteOptions.map(m => (
                                        <option key={`sm-${m}`} value={m}>{m}</option>
                                    ))}
                                </select>
                                <span className="time-separator">~</span>
                                <select
                                    value={selectedHour.end}
                                    onChange={(e) => handleTimeInputComponentChange('end', 'hour', e)}
                                    className="time-select"
                                >
                                    {hourOptions.map(h => (
                                        <option key={`eh-${h}`} value={h}>{h}</option>
                                    ))}
                                </select>
                                <span className="time-separator">:</span>
                                <select
                                    value={selectedMinute.end}
                                    onChange={(e) => handleTimeInputComponentChange('end', 'minute', e)}
                                    className="time-select"
                                >
                                    {endTimeMinuteOptions.map(m => (
                                        <option key={`em-${m}`} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>

                            <p className="reservation-summary">
                                <strong>선택 시간대:</strong> {selectedTimeRange.start || '---'} ~ {selectedTimeRange.end || '---'}
                            </p>

                            <button
                                onClick={handleNext}
                                className="next-button"
                                disabled={!selectedTimeRange.start || !selectedTimeRange.end || selectedTimeRange.start >= selectedTimeRange.end}
                            >
                                예약 정보 입력으로 이동
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ⭐️ 툴팁 렌더링 (앞면일 때만 보이도록) */}
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

export default PlaceFocusSelectPage;