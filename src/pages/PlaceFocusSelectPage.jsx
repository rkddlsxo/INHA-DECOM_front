import React, { useState, useMemo, useEffect } from 'react';
import './PlaceFocusSelectPage.css';
import { BsArrowLeft, BsBuilding, BsCalendarCheck } from 'react-icons/bs';

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

    // ⭐️ API 호출 함수를 useEffect 밖으로 분리
    const fetchDayTimeAvailability = async (roomId, dateKey) => {
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
        } catch (err) {
            setError(`일별 시간 정보를 불러오는 데 실패했습니다: ${err.message}`);
        }
    };

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

    // ⭐️ 2. [신규] 캘린더 페이지에서 넘어온 정보(prefill) 처리
    useEffect(() => {
        // allMasterSpaces가 로드된 후에만 실행
        if (allMasterSpaces.length === 0) return; 

        const prefillDataJSON = localStorage.getItem('prefillPlaceFocus');
        if (prefillDataJSON) {
            try {
                const data = JSON.parse(prefillDataJSON);
                
                // localStorage에서 가져온 room id로 실제 master list에서 room 객체 찾기
                const roomToSelect = allMasterSpaces.find(s => s.id === data.room.id);
                
                if (roomToSelect) {
                    const [year, month, day] = data.date.split('-').map(Number);

                    // 1. 장소 선택
                    setSelectedRooms([roomToSelect]);
                    // 2. 날짜 선택
                    setSelectedDate(data.date);
                    // 3. 달력을 해당 월로 이동
                    setDisplayDate(new Date(year, month - 1, 1)); 

                    // 4. 해당 날짜의 시간표 API 수동 호출
                    setTimeLoading(true);
                    fetchDayTimeAvailability(roomToSelect.id, data.date)
                        .finally(() => setTimeLoading(false));
                }
                
                // 5. prefill 데이터 삭제
                localStorage.removeItem('prefillPlaceFocus');
            } catch (e) {
                console.error("Failed to parse prefill data", e);
                localStorage.removeItem('prefillPlaceFocus');
            }
        }
    }, [allMasterSpaces]); // ⭐️ allMasterSpaces가 로드되면 이 useEffect 실행

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

    }, [selectedRooms, displayDate]);


    const fetchMonthAvailability = async (roomId, year, month) => {
        const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
        try {
            const response = await fetch(`${API_BASE_URL}/availability/monthly?roomId=${roomId}&year=${year}&month=${month + 1}`);
            if (!response.ok) throw new Error('서버 응답 오류: ' + response.statusText);
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

    // ... (핸들러 함수들: handleRoomSelect, toggleCategory 등은 기존과 동일) ...
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
            if (field === 'start') {
                newStartHour = value;
            } else {
                newEndHour = value;
            }
        } else {
            if (field === 'start') {
                newStartMinute = value;
            } else {
                newEndMinute = value;
            }
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

        if (dayData && dayData.status) {
             return dayData;
        }

        return { status: 'loading' };
    };

    const getCombinedBookedTimeRanges = () => {
        if (!selectedDate || selectedRooms.length === 0 || loading || timeLoading) return [];

        const bookedRangesByRoom = [];

        selectedRooms.forEach(room => {
            const monthKey = selectedDate.substring(0, 7);
            const dayData = roomAvailabilityCache[room.id]?.[monthKey]?.[selectedDate];

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
    
    const startTimeMinuteOptions = useMemo(() => generateMinuteOptions('start'), []);
    const endTimeMinuteOptions = useMemo(() => generateMinuteOptions('end'), []);

    const bookedTimeRanges = getCombinedBookedTimeRanges();


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

                                    const dayData = getDayStatus(year, month, day);
                                    const status = dayData.status || 'loading';
                                    const percentage = dayData.percentage || 0;
                                    
                                    const isClickable = !isPast && status !== 'booked'; 
                                    
                                    let statusText = '...';
                                    if (isPast) {
                                        statusText = '지난 날짜';
                                    } else if (status === 'booked') {
                                        statusText = '예약 불가';
                                    } else if (status === 'partial') {
                                        statusText = `${Math.round(percentage * 100)}% 예약됨`; 
                                    } else if (status === 'available') {
                                        statusText = '사용 가능';
                                    } else if (status === 'loading') {
                                        statusText = '로딩 중';
                                    }

                                    return (
                                        <div
                                            key={idx}
                                            className={`day-cell ${isSelected ? 'selected-date' : ''} ${isPast ? 'past-date' : status}`}
                                            onClick={() => isClickable && handleDateClick(year, month, day)}
                                        >
                                            <span className="date-number">{day}</span>
                                            <span className="availability-status">
                                                {statusText}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        <p className="instruction-text">왼쪽에서 장소를 선택해주세요.</p>
                    )}

                    
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
        </div>
    );
};

export default PlaceFocusSelectPage;