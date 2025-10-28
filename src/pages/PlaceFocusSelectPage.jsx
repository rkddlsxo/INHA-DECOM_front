import React, { useState, useMemo, useEffect } from 'react';
import './PlaceFocusSelectPage.css';

// 💡 Local Storage 키 상수 정의 (ReservationDetailsPage와 연동)
const LAST_PAGE_KEY = 'lastReservationSelectPage';

// --- 상수 및 유틸리티 ---

// 1. 장소 마스터 데이터는 서버에서 가져와야 하므로 비워둡니다.
const MASTER_SPACES_ALL = [];
const groupedSpaces = {};

const API_BASE_URL = 'http://localhost:8080/api';
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
            minutes.push(String(m + 9).padStart(2, '0'));
        }
    }
    return minutes;
};
// ------------------------------------


// --- 메인 컴포넌트 ---

const PlaceFocusSelectPage = ({ onNavigate }) => {
    const [selectedRooms, setSelectedRooms] = useState([]);
    const [displayDate, setDisplayDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const [selectedDate, setSelectedDate] = useState(null); // YYYY-MM-DD

    const [selectedHour, setSelectedHour] = useState({ start: '09', end: '10' });
    const [selectedMinute, setSelectedMinute] = useState({ start: '00', end: '09' });

    const [selectedTimeRange, setSelectedTimeRange] = useState({ start: '09:00', end: '10:09' });

    const [selectedFinalRoomId, setSelectedFinalRoomId] = useState(null);

    // groupedSpaces가 비어있으므로 초기 확장 상태도 비어있음
    const [expandedCategories, setExpandedCategories] = useState({});

    const [roomAvailabilityCache, setRoomAvailabilityCache] = useState({});
    const [loading, setLoading] = useState(false); // 월별 로딩
    const [error, setError] = useState(null);
    const [timeLoading, setTimeLoading] = useState(false); // 시간표 로딩 전용 상태

    // 캘린더 날짜 배열 생성
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

    // 💡 시간 옵션 목록
    const hourOptions = useMemo(() => generateHourOptions(), []);
    const startMinuteOptions = useMemo(() => generateMinuteOptions('start'), []);
    const endTimeOptions = useMemo(() => generateMinuteOptions('end'), []);


    // 💡 EFFECT: 선택된 룸이 변경되거나 월이 변경되면 월별 가용성 로드
    useEffect(() => {
        if (selectedRooms.length === 0) return;

        if (selectedRooms.length === 1) {
            setSelectedFinalRoomId(selectedRooms[0].id);
        } else {
            setSelectedFinalRoomId(null);
        }

        const fetchAllMonthData = async () => {
            setLoading(true);

            const currentMonthKey = `${displayYear}-${String(displayMonth + 1).padStart(2, '0')}`;

            const promises = selectedRooms.map(room => {
                const roomMonthCache = roomAvailabilityCache[room.id];
                if (!roomMonthCache || !roomMonthCache[currentMonthKey]) {
                    return fetchMonthAvailability(room.id, displayYear, displayMonth, currentMonthKey);
                }
                return Promise.resolve();
            });
            await Promise.all(promises);
            setLoading(false);
        };

        fetchAllMonthData();

    }, [selectedRooms.length, displayDate]);


    // 🚨 서버 통신: 특정 장소의 월별 예약 현황 조회 (달력 표시용)
    const fetchMonthAvailability = async (roomId, year, month) => {

        try {
            // 🚨 실제 서버 통신: GET /api/availability/monthly?roomId={id}&year={y}&month={m}
            const response = await fetch(`${API_BASE_URL}/availability/monthly?roomId=${roomId}&year=${year}&month=${month}`);
            if (!response.ok) throw new Error('서버 응답 오류: ' + response.statusText);
            const data = await response.json();

            const currentMonthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
            const monthData = { [currentMonthKey]: true, ...data };

            setRoomAvailabilityCache(prev => ({
                ...prev,
                [roomId]: { ...(prev[roomId] || {}), ...monthData }
            }));

        } catch (err) {
            // 서버 연결이 안되어 있으면 이 에러가 발생합니다.
            setError(`월별 예약 가능 정보를 불러오는 데 실패했습니다: ${err.message}`);
        }
    };

    // 🚨 서버 통신: 특정 장소/날짜의 시간별 예약 현황 조회 (시간표 표시용)
    const fetchDayTimeAvailability = async (roomId, dateKey) => {

        try {
            // 🚨 실제 서버 통신: GET /api/availability/daily?roomId={id}&date={d}
            const response = await fetch(`${API_BASE_URL}/availability/daily?roomId=${roomId}&date=${dateKey}`);
            if (!response.ok) throw new Error('서버 응답 오류: ' + response.statusText);
            const dayAvailability = await response.json(); // { '07:00': true/false, ... } 형태의 데이터 기대

            setRoomAvailabilityCache(prev => ({
                ...prev,
                [roomId]: {
                    ...(prev[roomId] || {}),
                    [dateKey]: {
                        ...(prev[roomId]?.[dateKey] || {}),
                        ...dayAvailability
                    }
                }
            }));
        } catch (err) {
            // 서버 연결이 안되어 있으면 이 에러가 발생합니다.
            setError(`일별 시간 정보를 불러오는 데 실패했습니다: ${err.message}`);
        }
    };

    // 장소 선택 핸들러 (다중 선택 토글)
    const handleRoomSelect = (room) => {
        setSelectedDate(null);
        setSelectedTimeRange({ start: '09:00', end: '10:09' });
        setSelectedHour({ start: '09', end: '10' });
        setSelectedMinute({ start: '00', end: '09' });
        setError(null);

        setSelectedRooms(prev => {
            const isSelected = prev.some(r => r.id === room.id);
            let newRooms;

            if (isSelected) {
                newRooms = prev.filter(r => r.id !== room.id);
            } else {
                newRooms = [...prev, room];
            }

            return newRooms;
        });
    };

    // 💡 카테고리 펼침/접기 핸들러
    const toggleCategory = (categoryName) => {
        setExpandedCategories(prev => ({
            ...prev,
            [categoryName]: !prev[categoryName]
        }));
    };

    // 날짜 클릭 핸들러
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

    // 시간대 입력 변경 핸들러
    const handleTimeInputComponentChange = (field, part, e) => {
        const value = e.target.value;
        let newStartHour = selectedHour.start;
        let newStartMinute = selectedMinute.start;
        let newEndHour = selectedHour.end;
        let newEndMinute = selectedMinute.end;

        if (part === 'hour') {
            if (field === 'start') {
                setSelectedHour(prev => ({ ...prev, start: value }));
                newStartHour = value;
            } else {
                setSelectedHour(prev => ({ ...prev, end: value }));
                newEndHour = value;
            }
        } else { // part === 'minute'
            if (field === 'start') {
                setSelectedMinute(prev => ({ ...prev, start: value }));
                newStartMinute = value;
            } else {
                setSelectedMinute(prev => ({ ...prev, end: value }));
                newEndMinute = value;
            }
        }

        // HH:MM 문자열 상태 업데이트 (handleNext에서 사용)
        setSelectedTimeRange({
            start: `${newStartHour}:${newStartMinute}`,
            end: `${newEndHour}:${newEndMinute}`,
        });
    };

    // 💡 최종 대표 장소 선택 핸들러
    const handleFinalRoomSelect = (e) => {
        setSelectedFinalRoomId(Number(e.target.value));
    };


    // 예약 버튼 클릭 (다음 페이지 이동)
    const handleNext = () => {
        if (selectedRooms.length === 0 || !selectedDate || !selectedTimeRange.start || !selectedTimeRange.end) {
            alert('장소, 날짜, 시작/종료 시간을 모두 선택해야 합니다.');
            return;
        }
        if (selectedRooms.length > 1 && !selectedFinalRoomId) {
            alert('복수 장소를 선택하셨습니다. 예약 상세 정보에 사용할 대표 장소를 선택해주세요.');
            return;
        }
        if (selectedTimeRange.start >= selectedTimeRange.end) {
            alert('종료 시간은 시작 시간보다 늦어야 합니다.');
            return;
        }

        // 🚨 최종 유효성 검사: 선택된 시간 범위 내에 예약 불가능한 슬롯이 있는지 확인
        const checkRangeAvailability = () => {
            const currentStartTime = selectedTimeRange.start;
            const currentEndTime = selectedTimeRange.end;

            let timePointer = currentStartTime;

            while (timePointer < currentEndTime) {
                const isBooked = selectedRooms.some(room => {
                    const dayData = roomAvailabilityCache[room.id]?.[selectedDate];

                    if (!dayData || dayData[timePointer] === undefined) return true;
                    return dayData[timePointer] === false;
                });

                if (isBooked) {
                    return { isOverlap: true, overlapTime: timePointer };
                }

                // 10분 증가
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
        // -----------------------------------------------------

        // 💡 최종 예약 데이터 추출
        const finalRoom = selectedRooms.length === 1
            ? selectedRooms[0]
            : MASTER_SPACES_ALL.find(r => r.id === selectedFinalRoomId);

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

    // 캘린더 월 이동 함수
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

    // 캘린더 셀 상태 결정 로직
    const getDayStatus = (year, month, day) => {
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        if (selectedRooms.length === 0) return 'no-room';

        const isAnyAvailable = selectedRooms.some(room => {
            const roomCache = roomAvailabilityCache[room.id];

            const currentMonthKey = `${displayYear}-${String(displayMonth + 1).padStart(2, '0')}`;

            if (!roomCache || roomCache[currentMonthKey] === undefined) {
                return false;
            }

            if (roomCache[dateKey] && roomCache[dateKey].hasBooking !== undefined) {
                return !roomCache[dateKey].hasBooking;
            }

            return false;
        });

        const currentMonthKey = `${displayYear}-${String(displayMonth + 1).padStart(2, '0')}`;
        const isCacheLoadedForMonth = selectedRooms.every(room => roomAvailabilityCache[room.id] && roomAvailabilityCache[room.id][currentMonthKey] !== undefined);
        if (!isCacheLoadedForMonth && loading) {
            return 'loading';
        }

        return isAnyAvailable ? 'available' : 'booked';
    };

    // 💡 예약 불가 시간대 목록 계산 및 범위로 변환
    const getCombinedBookedTimeRanges = () => {
        if (!selectedDate || selectedRooms.length === 0 || loading || timeLoading) return [];

        const bookedRangesByRoom = [];

        selectedRooms.forEach(room => {
            const dayData = roomAvailabilityCache[room.id]?.[selectedDate];

            if (!dayData || typeof dayData !== 'object' || Object.keys(dayData).length === 0) {
                return;
            }

            const timeSlotsData = Object.keys(dayData).reduce((acc, key) => {
                if (key.match(/^\d{2}:\d{2}$/)) {
                    acc[key] = dayData[key];
                }
                return acc;
            }, {});

            const roomBookedSlots = allTimeSlots.filter(time => timeSlotsData[time] === false);

            if (roomBookedSlots.length > 0) {
                let currentRangeStart = null;
                const ranges = [];

                for (let i = 0; i < roomBookedSlots.length; i++) {
                    const slot = roomBookedSlots[i];

                    if (currentRangeStart === null) {
                        currentRangeStart = slot;
                    }

                    const [h, m] = slot.split(':').map(Number);
                    const nextSlotTime = new Date(0, 0, 0, h, m + 10);
                    const nextSlotStr = `${String(nextSlotTime.getHours()).padStart(2, '0')}:${String(nextSlotTime.getMinutes()).padStart(2, '0')}`;

                    if (!roomBookedSlots.includes(nextSlotStr) || i === roomBookedSlots.length - 1) {
                        const endMinute = m + 9;
                        const endHour = h + Math.floor(endMinute / 60);
                        const endStr = `${String(endHour).padStart(2, '0')}:${String(endMinute % 60).padStart(2, '0')}`;

                        ranges.push(`${currentRangeStart} ~ ${endStr}`);
                        currentRangeStart = null;
                    }
                }

                if (ranges.length > 0) {
                    bookedRangesByRoom.push({
                        roomName: room.name,
                        times: ranges.join(', ')
                    });
                }
            }
        });

        return bookedRangesByRoom;
    };

    // 💡 시간 선택 드롭다운에 표시될 가용 시간 옵션 목록 생성
    const getAvailableTimeOptions = (type) => {
        if (!selectedDate || selectedRooms.length === 0 || loading || timeLoading) {
            return (type === 'start' ? startTimeOptions : endTimeOptions);
        }

        const timeOptions = (type === 'start' ? startTimeOptions : endTimeOptions);
        const availableOptions = [];

        const isBookedAcrossAllRooms = (time) => {
            return selectedRooms.some(room => {
                const dayData = roomAvailabilityCache[room.id]?.[selectedDate];
                if (!dayData || dayData[time] === undefined) return true;
                return dayData[time] === false;
            });
        };

        timeOptions.forEach(time => {
            const isValidRule = (type === 'start' && time.slice(-1) === '0') || (type === 'end' && time.slice(-1) === '9');

            if (isValidRule && !isBookedAcrossAllRooms(time)) {
                availableOptions.push(time);
            }
        });

        const currentStartTime = `${selectedHour.start}:${selectedMinute.start}`;
        const currentEndTime = `${selectedHour.end}:${selectedMinute.end}`;

        if (type === 'end' && currentStartTime) {
            return availableOptions.filter(time => time > currentStartTime);
        } else if (type === 'start' && currentEndTime) {
            return availableOptions.filter(time => time < currentEndTime);
        }

        return availableOptions;
    };

    const bookedTimeRanges = getCombinedBookedTimeRanges();


    return (
        <div className="reservation-combined-container">
            <button
                onClick={() => onNavigate('reservationFormSelectPage')}
                className="back-btn"
            >
                ← 뒤로
            </button>
            <h1 className="page-title">📌 공간 우선 예약</h1>
            {error && <p className="error-text" style={{ position: 'relative', top: '10px' }}>{error}</p>}

            <div className="selection-area-wrapper">

                {/* 1. 장소 목록 (트리 구조) */}
                <div className="room-list-box">
                    <h2 className="box-title">장소 목록 ({MASTER_SPACES_ALL.length}개)</h2>
                    <p className="instruction-text-small">다중 선택 가능</p>

                    {Object.keys(groupedSpaces).map(category => (
                        <div key={category} className="category-group-wrapper">
                            {/* 주 카테고리 (헤더) */}
                            <div
                                className={`category-header ${expandedCategories[category] ? 'expanded' : ''}`}
                                onClick={() => toggleCategory(category)}
                            >
                                <strong>{category}</strong>
                                <span className="toggle-icon">{expandedCategories[category] ? '▲' : '▼'}</span>
                            </div>

                            {/* 서브/아이템 목록 (접기/펴기) */}
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
                                                    {/* 최종 예약 항목 */}
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

                {/* 2. 달력, 시간 선택, 예약 버튼 영역 */}
                <div className="schedule-area-box">
                    <h2 className="box-title">
                        {selectedRooms.length > 0 ? `선택 장소 (${selectedRooms.length}개)` : '장소를 선택해주세요'}
                    </h2>

                    {/* 달력 섹션 */}
                    {selectedRooms.length > 0 ? (
                        <>
                            <div className="calendar-header">
                                <button onClick={() => navigateMonth('prev')} disabled={displayMonth === today.getMonth() && displayYear === today.getFullYear()}>&#9664; 이전</button>
                                <span>{displayYear}년 {displayMonth + 1}월</span>
                                <button onClick={() => navigateMonth('next')}>다음 &#9654;</button>
                            </div>
                            <div className="calendar-grid">
                                {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                                    <div key={day} className="calendar-header-day">{day}</div>
                                ))}
                                {calendarCells.map((day, idx) => {
                                    if (day === null) return <div key={idx} className="day-cell inactive" />;

                                    const year = displayYear;
                                    const month = displayMonth;
                                    const dateObj = new Date(year, month, day);
                                    const isPast = dateObj < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                                    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                    const isSelected = selectedDate === formattedDate;

                                    const status = getDayStatus(year, month, day);
                                    const isClickable = !isPast;
                                    const statusText = status === 'booked' ? '예약 있음' : status === 'available' ? '사용 가능' : status === 'loading' ? '로딩 중' : '확인 필요';

                                    return (
                                        <div
                                            key={idx}
                                            className={`day-cell ${isSelected ? 'selected-date' : ''} ${isPast ? 'past-date' : status}`}
                                            onClick={() => isClickable && handleDateClick(year, month, day)}
                                            style={!isClickable ? { cursor: 'default' } : {}}
                                        >
                                            <span className="date-number">{day}</span>
                                            <span className="availability-status">
                                                {isPast ? '지난 날짜' : statusText}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        <p className="instruction-text">왼쪽에서 장소를 선택해주세요.</p>
                    )}

                    {/* 💡 예약 불가 시간대 목록 */}
                    {selectedDate && bookedTimeRanges.length > 0 && !timeLoading && (
                        <div className="booked-times-summary">
                            <h4>선택 장소의 예약 불가 시간대 ({selectedDate})</h4>
                            <p className="instruction-text-small" style={{ color: '#dc3545', fontWeight: 'bold' }}>아래 시간이 중복되지 않도록 예약해주세요:</p>
                            <ul className="booked-list">
                                {bookedTimeRanges.map((info, index) => (
                                    <li key={index}>
                                        <span style={{ fontWeight: 'bold' }}>{info.roomName}:</span> {info.times}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* 💡 시간표 로딩 중 표시 */}
                    {selectedDate && selectedRooms.length > 0 && timeLoading && (
                        <p className="loading-text" style={{ marginTop: '20px' }}>
                            시간표를 불러오는 중입니다...
                        </p>
                    )}


                    {/* 💡 시간 선택 드롭다운 섹션 */}
                    {selectedDate && selectedRooms.length > 0 && !timeLoading && (
                        <div className="time-selection-container">
                            <h3>예약 시간대 선택 (10분 단위)</h3>

                            {/* 💡 복수 장소 선택 시 최종 장소 선택 드롭다운 */}
                            {selectedRooms.length > 1 && (
                                <div className="final-room-select-box">
                                    <label>예약에 사용할 **대표 장소** 선택:</label>
                                    <select
                                        value={selectedFinalRoomId || ''}
                                        onChange={handleFinalRoomSelect}
                                        className="time-select"
                                    >
                                        <option value="">-- 대표 장소를 선택하세요 --</option>
                                        {selectedRooms.map(room => (
                                            <option key={room.id} value={room.id}>
                                                {room.name} ({room.location})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="time-inputs-wrapper">
                                {/* 시작 시간 H SELECT */}
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
                                {/* 시작 시간 M SELECT */}
                                <select
                                    value={selectedMinute.start}
                                    onChange={(e) => handleTimeInputComponentChange('start', 'minute', e)}
                                    className="time-select"
                                >
                                    {generateMinuteOptions('start').map(m => (
                                        <option key={`sm-${m}`} value={m}>{m}</option>
                                    ))}
                                </select>

                                <span className="time-separator">~</span>

                                {/* 종료 시간 H SELECT */}
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
                                {/* 종료 시간 M SELECT */}
                                <select
                                    value={selectedMinute.end}
                                    onChange={(e) => handleTimeInputComponentChange('end', 'minute', e)}
                                    className="time-select"
                                >
                                    {generateMinuteOptions('end').map(m => (
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
                                disabled={!selectedTimeRange.start || !selectedTimeRange.end || selectedTimeRange.start >= selectedTimeRange.end || (selectedRooms.length > 1 && !selectedFinalRoomId)}
                            >
                                예약 정보 입력으로 이동
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PlaceFocusSelectPage;