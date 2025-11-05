import React, { useState, useEffect, useMemo } from 'react';
import { BsBuilding, BsArrowLeft } from 'react-icons/bs';
import './MonthlyCalendarPage.css'; 

const API_BASE_URL = 'http://localhost:5050/api';
const today = new Date();

function getDaysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); }

const MonthlyCalendarPage = ({ onNavigate }) => {
    const [allMasterSpaces, setAllMasterSpaces] = useState([]);
    const [selectedSpaceId, setSelectedSpaceId] = useState(''); 
    const [roomAvailabilityCache, setRoomAvailabilityCache] = useState({}); 
    
    const [displayDate, setDisplayDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

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
        if (dayData && dayData.status) return dayData;
        return { status: 'available', percentage: 0 };
    };

    // ⭐️ 6. 날짜 클릭 핸들러 (localStorage에 데이터 저장 및 페이지 이동)
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
        
        // 1. 선택한 장소의 전체 정보 찾기
        const selectedRoom = allMasterSpaces.find(s => s.id === parseInt(selectedSpaceId));
        if (!selectedRoom) {
            alert('장소 정보를 찾을 수 없습니다.');
            return;
        }

        // 2. 선택한 날짜 포맷팅
        const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        // 3. localStorage에 정보 저장
        const prefillData = {
            room: selectedRoom, // 장소 객체 전체 저장
            date: formattedDate // YYYY-MM-DD 형식의 날짜 저장
        };
        localStorage.setItem('prefillPlaceFocus', JSON.stringify(prefillData));

        // 4. '공간 우선 예약' 페이지로 이동
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
                    {calendarCells.map((day, idx) => {
                        if (day === null) return <div key={idx} className="day-cell inactive" />;

                        const year = displayYear;
                        const month = displayMonth;
                        const dateObj = new Date(year, month, day);
                        const isPast = dateObj < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                        
                        const dayData = getDayStatus(year, month, day);
                        const status = isPast ? 'past-date' : (dayData.status || 'loading');
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
                                className={`day-cell ${isPast ? 'past-date' : status}`}
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
                {loading && <div className="calendar-loading-overlay">로딩 중...</div>}
            </div>
        </div>
    );
};

export default MonthlyCalendarPage;