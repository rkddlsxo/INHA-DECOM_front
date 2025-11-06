import React, { useState, useMemo, useEffect, useCallback } from 'react';
import './PlaceFocusSelectPage.css';
// 아이콘 임포트
import { BsArrowLeft, BsBuilding, BsCalendarCheck, BsArrowRepeat } from 'react-icons/bs';

// 상수 정의
const LAST_PAGE_KEY = 'lastReservationSelectPage';
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
 * 07시부터 21시까지의 시간(Hour) 옵션을 생성합니다.
 * @returns {string[]} 'HH' 형식의 시간 문자열 배열
 */
const generateHourOptions = () => {
    const hours = [];
    for (let h = 7; h <= 21; h++) {
        hours.push(String(h).padStart(2, '0'));
    }
    return hours;
};

/**
 * 10분 단위의 분(Minute) 옵션을 생성합니다.
 * @param {string} type - 'start' 또는 'end'
 * @returns {string[]} 'MM' 형식의 분 문자열 배열
 */
const generateMinuteOptions = (type) => {
    const minutes = [];
    for (let m = 0; m <= 50; m += 10) {
        if (type === 'start') {
            minutes.push(String(m).padStart(2, '0')); // 시작 시간은 00, 10, ... 50분
        } else { // type === 'end'
            if (m === 50) {
                minutes.push('59'); // 종료 시간은 09, 19, ... 59분
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

/**
 * 장소 우선 예약 페이지 컴포넌트입니다.
 * 장소 선택, 달력에서 날짜 선택, 시간 선택 로직을 포함합니다.
 * @param {object} props - 컴포넌트 속성
 * @param {function} props.onNavigate - 페이지 이동을 처리하는 함수
 */
const PlaceFocusSelectPage = ({ onNavigate }) => {
    // 마스터 장소 목록 전체
    const [allMasterSpaces, setAllMasterSpaces] = useState([]);
    // 현재 선택된 장소 목록 (단일 선택만 허용)
    const [selectedRooms, setSelectedRooms] = useState([]);
    // 달력에 현재 표시되는 월의 첫째 날
    const [displayDate, setDisplayDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    // 사용자가 달력에서 선택한 날짜 ('YYYY-MM-DD')
    const [selectedDate, setSelectedDate] = useState(null);

    // 시간 선택 드롭다운 상태
    const [selectedHour, setSelectedHour] = useState({ start: '09', end: '10' });
    const [selectedMinute, setSelectedMinute] = useState({ start: '00', end: '59' });
    // 선택된 시작/종료 시간 범위 ('HH:MM')
    const [selectedTimeRange, setSelectedTimeRange] = useState({ start: '09:00', end: '10:59' });

    // (현재는 단일 장소 선택이므로 selectedRooms[0].id와 동일)
    const [selectedFinalRoomId, setSelectedFinalRoomId] = useState(null);
    // 장소 목록의 카테고리 확장/축소 상태
    const [expandedCategories, setExpandedCategories] = useState({});

    // 장소별 월별/일별 예약 가능 정보를 저장하는 캐시
    const [roomAvailabilityCache, setRoomAvailabilityCache] = useState({});
    // 장소 목록 로딩 상태
    const [loading, setLoading] = useState(false);
    // 에러 메시지
    const [error, setError] = useState(null);
    // 일별 상세 시간 로딩 상태
    const [timeLoading, setTimeLoading] = useState(false);

    // 툴팁(Tooltip) 표시를 위한 상태
    const [tooltip, setTooltip] = useState({
        visible: false, x: 0, y: 0, content: '', dateKey: null
    });

    // 달력 카드의 뷰 토글 상태 (false: 히트맵, true: 시간대별 블록)
    const [isTimeView, setIsTimeView] = useState(false);


    // 달력 셀 계산 (표시 월이 변경될 때마다 재계산)
    const { calendarCells, displayYear, displayMonth } = useMemo(() => {
        const year = displayDate.getFullYear();
        const month = displayDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDayOfWeek = new Date(year, month, 1).getDay();

        const cells = [];
        // 전달의 빈 셀 채우기
        for (let i = 0; i < firstDayOfWeek; i++) { cells.push(null); }
        // 해당 월의 날짜 채우기
        for (let d = 1; d <= daysInMonth; d++) { cells.push(d); }

        return { calendarCells: cells, displayYear: year, displayMonth: month };
    }, [displayDate]);

    // 마스터 장소 목록을 카테고리/세부 카테고리별로 그룹화
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

    // 시간(Hour) 옵션 생성
    const hourOptions = useMemo(() => generateHourOptions(), []);

    /**
     * 특정 날짜의 예약 불가 시간대를 포맷하여 툴팁 내용을 반환합니다.
     * @param {object} dayData - 일별 시간대별 예약 가능 정보 객체
     * @returns {string} 예약 불가 시간대 범위 목록 문자열
     */
    const formatBookedTimesForTooltip = useCallback((dayData) => {
        if (!dayData || typeof dayData !== 'object' || Object.keys(dayData).length < 2) return '예약 정보 없음';

        const bookedSlots = allTimeSlots.filter(time => dayData[time] === false);
        if (bookedSlots.length === 0) return '✅ 모든 시간 예약 가능';

        // 연속된 예약 불가 시간대를 하나의 범위로 병합 (MonthlyCalendarPage와 동일 로직)
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

    /**
     * 예약된 비율에 따라 CSS 클래스를 반환하여 히트맵 색상을 결정합니다.
     * @param {number} percentage - 예약된 시간의 비율 (0.0 ~ 1.0)
     * @returns {string} 히트맵 CSS 클래스
     */
    const getHeatMapClass = (percentage) => {
        if (percentage >= 0.7) return 'partial-high';
        if (percentage >= 0.3) return 'partial-mid';
        return 'partial-low';
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
        // 장소가 선택되지 않았거나 지난 날짜인 경우 중단
        if (isPast || selectedRooms.length === 0) return;

        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        // 로딩 중 툴팁 표시
        setTooltip({
            visible: true,
            x: e.pageX + 10,
            y: e.pageY + 10,
            content: '불러오는 중...',
            dateKey: dateKey
        });

        const roomId = selectedRooms[0].id; // 단일 선택만 가능하므로 첫 번째 항목 사용
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
    }, [selectedRooms, roomAvailabilityCache, fetchDayTimeAvailability, formatBookedTimesForTooltip]);

    /**
     * 달력 날짜 셀에서 마우스가 벗어났을 때 툴팁을 숨깁니다.
     */
    const handleDateLeave = useCallback(() => {
        setTooltip(prev => ({ ...prev, visible: false }));
    }, []);


    // 1. 마스터 장소 목록 로드 (컴포넌트 마운트 시 1회 실행)
    useEffect(() => {
        const fetchMasterSpaces = async () => {
            setLoading(true);
            try {
                const response = await fetch(`${API_BASE_URL}/masters/spaces`);
                if (!response.ok) throw new Error('마스터 장소 목록 로드 실패');
                const data = await response.json();
                setAllMasterSpaces(data);
                // 카테고리 확장/축소 상태 초기화 (모두 확장된 상태로 시작)
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

    // 2. 캘린더 페이지 등에서 넘어온 프리필(prefill) 정보 처리
    useEffect(() => {
        if (allMasterSpaces.length === 0) return;
        const prefillDataJSON = localStorage.getItem('prefillPlaceFocus');
        if (prefillDataJSON) {
            try {
                const data = JSON.parse(prefillDataJSON);
                const roomToSelect = allMasterSpaces.find(s => s.id === data.room.id);

                if (roomToSelect) {
                    // 장소 선택
                    setSelectedRooms([roomToSelect]);
                    setSelectedFinalRoomId(roomToSelect.id);

                    if (data.date) { // 날짜 정보도 함께 넘어온 경우
                        const [year, month] = data.date.split('-').map(Number);
                        setSelectedDate(data.date);
                        setDisplayDate(new Date(year, month - 1, 1)); // 달력 표시 월 이동
                        setTimeLoading(true);
                        // 해당 날짜의 상세 시간표 로드
                        fetchDayTimeAvailability(roomToSelect.id, data.date)
                            .finally(() => setTimeLoading(false));
                    }
                }
                localStorage.removeItem('prefillPlaceFocus');
            } catch (e) {
                console.error("Failed to parse prefill data", e);
                localStorage.removeItem('prefillPlaceFocus');
            }
        }
    }, [allMasterSpaces, fetchDayTimeAvailability]);


    /**
     * 월별 예약 가능 정보를 서버에서 불러오고 캐시에 저장합니다.
     * @param {number} roomId - 장소 ID
     * @param {number} year - 연도
     * @param {number} month - 월 (1부터 시작)
     */
    const fetchMonthAvailability = async (roomId, year, month) => {
        const monthKey = `${year}-${String(month).padStart(2, '0')}`;
        try {
            const response = await fetch(`${API_BASE_URL}/availability/monthly?roomId=${roomId}&year=${year}&month=${month}`);
            if (!response.ok) throw new Error('서버 응답 오류: ' + response.statusText);
            const data = await response.json();
            // 캐시 업데이트
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

    // 3. 월별 데이터 로드 (선택된 장소나 표시 월이 변경될 때 실행)
    useEffect(() => {
        if (selectedRooms.length === 0) return;

        const fetchAllMonthData = async () => {
            setLoading(true);
            const currentMonthKey = `${displayYear}-${String(displayMonth + 1).padStart(2, '0')}`;
            const room = selectedRooms[0];

            // 캐시에 월별 데이터가 없으면 API 호출
            const roomMonthCache = roomAvailabilityCache[room.id];
            if (!roomMonthCache || !roomMonthCache[currentMonthKey]) {
                await fetchMonthAvailability(room.id, displayYear, displayMonth + 1);
            }
            setLoading(false);
        };
        fetchAllMonthData();
    }, [selectedRooms, displayDate, displayYear, displayMonth, roomAvailabilityCache]);


    /**
     * 장소 목록에서 항목 선택/해제를 처리합니다. (단일 선택 모드)
     * @param {object} room - 선택된 장소 객체
     */
    const handleRoomSelect = (room) => {
        // 날짜 및 시간 선택 상태 초기화
        setSelectedDate(null);
        setSelectedTimeRange({ start: '09:00', end: '10:59' });
        setSelectedHour({ start: '09', end: '10' });
        setSelectedMinute({ start: '00', end: '59' });
        setError(null);

        setSelectedRooms(prev => {
            const isSelected = prev.some(r => r.id === room.id);
            if (isSelected) {
                return []; // 이미 선택된 경우 해제
            } else {
                return [room]; // 새로 선택된 경우 해당 장소만 선택
            }
        });
        setSelectedFinalRoomId(room.id);
    };

    /**
     * 장소 카테고리의 확장/축소 상태를 토글합니다.
     * @param {string} categoryName - 카테고리 이름
     */
    const toggleCategory = (categoryName) => {
        setExpandedCategories(prev => ({
            ...prev,
            [categoryName]: !prev[categoryName]
        }));
    };

    /**
     * 달력 날짜 클릭 시 처리합니다.
     * @param {number} year - 연도
     * @param {number} month - 월 (0부터 시작)
     * @param {number} day - 일
     */
    const handleDateClick = (year, month, day) => {
        if (selectedRooms.length === 0) return;
        const dateObj = new Date(year, month, day);
        // 지난 날짜는 선택 불가
        if (dateObj < new Date(today.getFullYear(), today.getMonth(), today.getDate())) return;

        const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        setSelectedDate(formattedDate);
        setError(null);

        // 선택된 날짜의 상세 시간표 로드 시작
        setTimeLoading(true);
        const fetchPromises = selectedRooms.map(room => fetchDayTimeAvailability(room.id, formattedDate));
        Promise.all(fetchPromises)
            .then(() => setTimeLoading(false))
            .catch(() => setTimeLoading(false));
    };

    /**
     * 시간 선택 드롭다운 변경을 처리합니다.
     * @param {string} field - 'start' 또는 'end'
     * @param {string} part - 'hour' 또는 'minute'
     * @param {object} e - 이벤트 객체
     */
    const handleTimeInputComponentChange = (field, part, e) => {
        const value = e.target.value;
        let newStartHour = selectedHour.start;
        let newStartMinute = selectedMinute.start;
        let newEndHour = selectedHour.end;
        let newEndMinute = selectedMinute.minute;

        // 선택된 값을 시간/분에 따라 적절히 업데이트
        if (part === 'hour') {
            if (field === 'start') { newStartHour = value; } else { newEndHour = value; }
        } else {
            if (field === 'start') { newStartMinute = value; } else { newEndMinute = value; }
        }

        setSelectedHour({ start: newStartHour, end: newEndHour });
        setSelectedMinute({ start: newStartMinute, end: newEndMinute });

        // 최종 시간 범위 상태 업데이트
        setSelectedTimeRange({
            start: `${newStartHour}:${newStartMinute}`,
            end: `${newEndHour}:${newEndMinute}`,
        });
    };

    // (현재 미사용) 최종 예약 장소 선택 (다중 선택 시 필요)
    const handleFinalRoomSelect = (e) => {
        setSelectedFinalRoomId(Number(e.target.value));
    };

    /**
     * 예약 정보를 확인하고 다음 단계(예약 상세 입력 페이지)로 이동합니다.
     */
    const handleNext = () => {
        // 필수 선택 항목 유효성 검사
        if (selectedRooms.length === 0 || !selectedDate || !selectedTimeRange.start || !selectedTimeRange.end) {
            alert('장소, 날짜, 시작/종료 시간을 모두 선택해야 합니다.');
            return;
        }
        if (selectedTimeRange.start >= selectedTimeRange.end) {
            alert('종료 시간은 시작 시간보다 늦어야 합니다.');
            return;
        }

        /**
         * 선택된 시간 범위 내에 예약 불가능한 슬롯이 있는지 확인합니다.
         * @returns {object} { isOverlap: boolean, overlapTime: string|null }
         */
        const checkRangeAvailability = () => {
            const currentStartTime = selectedTimeRange.start;
            const currentEndTime = selectedTimeRange.end;
            let timePointer = currentStartTime;

            // 10분 단위로 예약 가능 여부를 순차적으로 검사
            while (timePointer < currentEndTime) {
                const room = selectedRooms[0];
                const monthKey = selectedDate.substring(0, 7);
                const dayData = roomAvailabilityCache[room.id]?.[monthKey]?.[selectedDate];

                // 해당 시간 슬롯이 예약 불가(false)인 경우 중복 발생
                if (!dayData || dayData[timePointer] === false) {
                    return { isOverlap: true, overlapTime: timePointer };
                }

                // 10분 후로 시간 포인터 이동
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

        // 예약 상세 페이지로 전달할 임시 데이터 LocalStorage에 저장
        const tempBookingData = {
            roomName: finalRoom.name,
            roomLocation: finalRoom.location,
            date: selectedDate,
            startTime: selectedTimeRange.start,
            endTime: selectedTimeRange.end,
        };
        localStorage.setItem('tempBookingData', JSON.stringify(tempBookingData));
        localStorage.setItem(LAST_PAGE_KEY, 'placeFocusSelectPage');

        // 다음 페이지로 이동
        onNavigate('reservationDetailsPage');
    };

    /**
     * 달력의 월 이동을 처리합니다.
     * @param {string} direction - 'prev' 또는 'next'
     */
    const navigateMonth = (direction) => {
        if (selectedRooms.length === 0) return;
        const newDate = new Date(displayDate);
        const todayMonth = today.getMonth();
        const todayYear = today.getFullYear();

        // 예약 가능 기간 제한 (현재 월 기준 다음 달 말일까지)
        const limitDate = new Date(todayYear, todayMonth + 2, 0);

        newDate.setMonth(displayDate.getMonth() + (direction === 'next' ? 1 : -1));

        // 예약 가능 기간 초과 검사
        if (newDate.getTime() > limitDate.getTime()) {
            alert('예약은 현재 월 기준 다음 달 말일까지만 가능합니다.');
            return;
        }
        // 지난 달로 이동 방지 검사
        if (newDate.getFullYear() < todayYear || (newDate.getFullYear() === todayYear && newDate.getMonth() < todayMonth)) {
            alert('지난 달은 볼 수 없습니다.');
            return;
        }

        setDisplayDate(newDate);
        setSelectedDate(null);
        setError(null);
    };

    /**
     * 특정 날짜의 예약 현황 데이터를 캐시에서 가져옵니다.
     * @param {number} year - 연도
     * @param {number} month - 월 (0부터 시작)
     * @param {number} day - 일
     * @returns {object} 날짜 상태 정보 객체
     */
    const getDayStatus = (year, month, day) => {
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const monthKey = dateKey.substring(0, 7);

        if (selectedRooms.length === 0) return { status: 'no-room' };
        const room = selectedRooms[0];
        const roomCache = roomAvailabilityCache[room.id];

        // 월별 데이터 로딩 중
        if (!roomCache || !roomCache[monthKey]) {
            return { status: 'loading' };
        }

        // 날짜별 상태 정보 반환
        const dayData = roomCache[monthKey][dateKey];
        if (dayData && dayData.status) {
            return dayData;
        }
        return { status: 'loading' }; // 데이터는 있으나 상태 정보가 불완전한 경우
    };

    // 시작 시간 분(minute) 옵션 (00, 10, ..., 50)
    const startTimeMinuteOptions = useMemo(() => generateMinuteOptions('start'), []);
    // 종료 시간 분(minute) 옵션 (09, 19, ..., 59)
    const endTimeMinuteOptions = useMemo(() => generateMinuteOptions('end'), []);


    return (
        <div className="reservation-combined-container">
            {/* 뒤로가기 버튼 */}
            <button
                onClick={() => onNavigate('reservationFormSelectPage')} // 예약 폼 선택 페이지로 돌아감
                className="back-btn"
            >
                <BsArrowLeft size={16} />
                뒤로
            </button>
            <h1 className="page-title">📌 공간 우선 예약</h1>
            {error && <p className="error-text" style={{ position: 'relative', top: '10px' }}>{error}</p>}

            {/* 2단 레이아웃 영역 */}
            <div className="selection-area-wrapper">
                {/* 왼쪽: 장소 목록 (트리 뷰) */}
                <div className="room-list-box">
                    <h2 className="box-title">
                        <BsBuilding size={24} />
                        장소 목록 ({allMasterSpaces.length}개)
                    </h2>
                    <p className="instruction-text-small">하나의 장소를 선택해주세요.</p>

                    {/* 카테고리별 장소 목록 렌더링 */}
                    {Object.keys(groupedSpaces).map(category => (
                        <div key={category} className="category-group-wrapper">
                            {/* 카테고리 헤더 (클릭 시 토글) */}
                            <div
                                className={`category-header ${expandedCategories[category] ? 'expanded' : ''}`}
                                onClick={() => toggleCategory(category)}
                            >
                                <strong>{category}</strong>
                                <span className="toggle-icon">▼</span>
                            </div>
                            {/* 장소 항목 */}
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

                {/* 오른쪽: 달력 및 시간 선택 영역 */}
                <div className="schedule-area-box">
                    <h2 className="box-title">
                        <BsCalendarCheck size={24} />
                        {selectedRooms.length > 0 ? `선택 장소: ${selectedRooms[0].name} 예약 현황` : '장소를 선택해주세요'}
                    </h2>

                    {selectedRooms.length > 0 ? (
                        <>
                            {/* 뷰 토글 버튼 */}
                            <button
                                className={`view-toggle-button ${isTimeView ? 'is-flipped' : ''}`}
                                onClick={() => setIsTimeView(!isTimeView)}
                            >
                                <BsArrowRepeat size={16} />
                                {isTimeView ? '날짜별 현황 보기' : '시간대별 현황 보기'}
                            </button>

                            {/* 월 이동 버튼 및 표시 월 */}
                            <div className="calendar-header">
                                <button onClick={() => navigateMonth('prev')} disabled={displayMonth === today.getMonth() && displayYear === today.getFullYear()}>&#9664; 이전</button>
                                <span>{displayYear}년 {displayMonth + 1}월</span>
                                <button onClick={() => navigateMonth('next')}>다음 &#9654;</button>
                            </div>

                            {/* 달력 그리드 */}
                            <div className="calendar-grid">
                                {/* 요일 헤더 */}
                                {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                                    <div key={day} className="calendar-header-day">{day}</div>
                                ))}

                                {/* 날짜 셀 렌더링 (3D 플립 구조) */}
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
                                            // 뒷면 클릭 시 앞면으로 돌아오기 (날짜 재선택 유도)
                                            onClick={() => isTimeView && isClickable && handleDateClick(year, month, day)}
                                        >
                                            <div className="day-cell-flipper">
                                                {/* --- 캘린더 앞면 (히트맵) --- */}
                                                <div
                                                    className={`cell-front ${isSelected ? 'selected-date' : ''} ${isPast ? 'past-date' : status} ${heatMapClass}`}
                                                    onClick={() => !isTimeView && isClickable && handleDateClick(year, month, day)} // 앞면 클릭 시 날짜 선택
                                                    onMouseEnter={(e) => !isTimeView && handleDateHover(e, year, month, day, isPast || status === 'booked')}
                                                    onMouseLeave={(e) => !isTimeView && handleDateLeave(e)}
                                                >
                                                    <span className="date-number">{day}</span>
                                                    <span className="availability-status">
                                                        {statusText}
                                                    </span>
                                                </div>
                                                {/* --- 캘린더 뒷면 (시간대별 블록) --- */}
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

                    {/* 날짜 선택 후 표시되는 시간 선택 및 다음 단계 버튼 */}
                    {selectedDate && selectedRooms.length > 0 && timeLoading && (
                        <p className="loading-text" style={{ marginTop: '20px' }}>
                            시간표를 불러오는 중입니다...
                        </p>
                    )}

                    {selectedDate && selectedRooms.length > 0 && !timeLoading && (
                        <div className="time-selection-container">
                            <h3>예약 시간대 선택 (10분 단위)</h3>
                            <div className="time-inputs-wrapper">
                                {/* 시작 시간 (시) */}
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
                                {/* 시작 시간 (분) */}
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
                                {/* 종료 시간 (시) */}
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
                                {/* 종료 시간 (분) */}
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
                                // 유효성 검사: 시간이 모두 선택되었고, 시작 시간이 종료 시간보다 이전일 때 활성화
                                disabled={!selectedTimeRange.start || !selectedTimeRange.end || selectedTimeRange.start >= selectedTimeRange.end}
                            >
                                예약 정보 입력으로 이동
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* 툴팁 렌더링 */}
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
                            {/* 포맷팅된 예약 불가 시간대 목록 */}
                            <pre style={{ margin: 0, padding: 0, whiteSpace: 'pre-wrap', color: tooltip.content.includes('✅') ? '#28a745' : '#dc3545' }}>{tooltip.content}</pre>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default PlaceFocusSelectPage;