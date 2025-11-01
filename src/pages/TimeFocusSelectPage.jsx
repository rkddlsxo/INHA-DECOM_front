import React, { useState, useEffect, useMemo } from 'react';
import './TimeFocusSelectPage.css';
// ⭐️ 아이콘 import
import { BsArrowLeft, BsPencilSquare, BsClipboardCheck } from 'react-icons/bs';

const API_BASE_URL = 'http://localhost:5050/api';

// --- 상수 및 유틸리티 ---

const CATEGORIES = {
    '전체': ['전체'],
    '스터디룸': ['인문 스터디룸', '해동 스터디룸', '학생라운지 스터디룸'],
    '가무연습실': ['가무연습실'],
    '운동장': ['운동장'],
    '피클볼 코드': ['피클볼 코드'],
    '테니스 코드': ['테니스 코드'],
    '농구장': ['농구장'],
    '풋살파크': ['풋살파크'],
};

/** 규칙에 맞는 시간 옵션 목록을 생성합니다. (시작: XX:X0, 종료: XX:X9) */
const generateTimeOptions = (type) => {
    const options = [];
    const START_HOUR = 7;
    const END_HOUR = 21;

    for (let h = START_HOUR; h <= END_HOUR; h++) {
        for (let m = 0; m <= 50; m += 10) {
            let minute;

            if (type === 'start') {
                minute = m;
                if (h === END_HOUR && m > 50) break;
            } else {
                minute = m + 9;
                if (h === END_HOUR && m + 9 > 59) break;
                if (h === END_HOUR && m === 50) {
                    options.push(`${String(h).padStart(2, '0')}:${String(59).padStart(2, '0')}`);
                    break;
                }
            }

            const hourStr = String(h).padStart(2, '0');
            const minuteStr = String(minute).padStart(2, '0');
            options.push(`${hourStr}:${minuteStr}`);
        }
    }
    return Array.from(new Set(options)).sort();
};

const categoryOptions = [
    ...Object.keys(CATEGORIES).filter(key => key !== '스터디룸'),
    ...CATEGORIES['스터디룸']
].filter(cat => cat !== '전체').sort();
categoryOptions.unshift('전체');


// --- 메인 컴포넌트 ---

const TimeFocusSelectPage = ({ onNavigate }) => {
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTimeRange, setSelectedTimeRange] = useState({ start: '09:00', end: '10:59' });
    const [selectedCategory, setSelectedCategory] = useState('전체');
    const [allAvailableSpaces, setAllAvailableSpaces] = useState([]);
    const [filteredSpaces, setFilteredSpaces] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isSearchPerformed, setIsSearchPerformed] = useState(false);

    const startTimeOptions = useMemo(() => generateTimeOptions('start'), []);
    const endTimeOptions = useMemo(() => generateTimeOptions('end'), []);

    // 장소 목록 카테고리 필터링
    useEffect(() => {
        if (!isSearchPerformed) {
            setFilteredSpaces([]);
            return;
        }

        let filtered = allAvailableSpaces;

        if (selectedCategory === '전체') {
            setFilteredSpaces(filtered);
            return;
        }

        const isSubCategory = CATEGORIES['스터디룸'].includes(selectedCategory);

        if (isSubCategory) {
            filtered = filtered.filter(space => space.subCategory === selectedCategory);
        } else {
            filtered = filtered.filter(space => space.category === selectedCategory);
        }

        setFilteredSpaces(filtered);
    }, [selectedCategory, allAvailableSpaces, isSearchPerformed]);


    // 서버에서 사용 가능한 장소 목록을 불러오는 함수
    const fetchAvailableSpaces = async (date, timeRange) => {
        setLoading(true);
        setError(null);
        setAllAvailableSpaces([]);
        setFilteredSpaces([]);
        setIsSearchPerformed(true);

        if (!timeRange.start || !timeRange.end || timeRange.start >= timeRange.end) {
            setError('❌ 유효한 시간대를 선택해주세요. (시작 시간 < 종료 시간)');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/spaces/available?date=${date}&start=${timeRange.start}&end=${timeRange.end}`);
            if (!response.ok) throw new Error('사용 가능한 장소 목록 조회 실패');

            const data = await response.json();

            setAllAvailableSpaces(data);
            setSelectedCategory('전체');
            setError(null);

        } catch (err) {
            console.error(err);
            setError('⚠️ 오류: 장소 목록을 불러오는 중 오류가 발생했습니다.');
            setAllAvailableSpaces([]); // 데이터 비우기
        }
        setLoading(false);
    };

    // 시간 SELECT 입력 변경 핸들러
    const handleTimeInputChange = (field, e) => {
        const value = e.target.value;
        setSelectedTimeRange(prev => ({ ...prev, [field]: value }));
        setIsSearchPerformed(false);
    };

    // '장소 조회하기' 버튼 클릭 핸들러
    const handleSearch = () => {
        if (!selectedDate) {
            alert('날짜를 먼저 선택해주세요.');
            return;
        }

        if (selectedTimeRange.start.slice(-1) !== '0' || selectedTimeRange.end.slice(-1) !== '9') {
            alert('시간 선택 규칙을 다시 확인해주세요. (시작: XX:X0, 종료: XX:X9)');
            return;
        }

        fetchAvailableSpaces(selectedDate, selectedTimeRange);
    };

    // '예약하기' 버튼 클릭 핸들러
    const handleSelectSpace = (space) => {
        if (!isSearchPerformed) return;

        const bookingDataToStore = {
            date: selectedDate,
            startTime: selectedTimeRange.start,
            endTime: selectedTimeRange.end,
            roomName: space.name,
            roomLocation: space.location || '위치 정보 없음',
        };

        localStorage.setItem('tempBookingData', JSON.stringify(bookingDataToStore));
        localStorage.setItem('lastReservationSelectPage', 'timeFocusSelectPage');

        onNavigate('reservationDetailsPage');
    };

    const isSearchReady = selectedDate && selectedTimeRange.start && selectedTimeRange.end;

    return (
        <div className="time-focus-main-container">
            {/* ⭐️ '뒤로가기' 버튼 스타일 및 아이콘 적용 */}
            <button
                onClick={() => onNavigate('reservationFormSelectPage')}
                className="back-button"
            >
                <BsArrowLeft size={16} />
                뒤로
            </button>
            <h1 className="page-title">🕑 시간 우선 예약</h1>
            <p className="page-description">원하는 날짜/시간대와 장소 범주를 선택하여 사용 가능한 장소를 조회하세요.</p>

            <div className="selection-area-wrapper">

                {/* 1. 날짜 및 시간 선택 영역 */}
                <div className="selection-box time-focus-box">
                    {/* ⭐️ 제목에 아이콘 추가 */}
                    <h2 className="box-title">
                        <BsPencilSquare size={24} />
                        예약 조건 선택
                    </h2>

                    {/* ⭐️ 라벨 클래스 적용 */}
                    <label className="input-label" htmlFor="date-picker">예약 날짜:</label>
                    <input
                        type="date"
                        id="date-picker"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="date-picker-input"
                    />

                    <label className="input-label time-label">예약 시간대 (XX:X0 ~ XX:X9):</label>
                    <div className="time-inputs-wrapper">
                        <select
                            value={selectedTimeRange.start}
                            onChange={(e) => handleTimeInputChange('start', e)}
                            className="time-select"
                        >
                            {startTimeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>

                        <span className="time-separator">~</span>

                        <select
                            value={selectedTimeRange.end}
                            onChange={(e) => handleTimeInputChange('end', e)}
                            className="time-select"
                        >
                            {endTimeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>

                    {/* 카테고리 필터 영역 */}
                    <div className="category-filter-box">
                        <label className="input-label" htmlFor="category-select" style={{ marginTop: 0, marginBottom: '0.75rem' }}>장소 범주 선택 (필터):</label>
                        <select
                            id="category-select"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="category-select"
                        >
                            {categoryOptions.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    {/* ⭐️ 버튼 클래스 변경 */}
                    <button
                        onClick={handleSearch}
                        className="search-button"
                        disabled={!isSearchReady || loading}
                    >
                        {loading ? '장소 조회 중...' : '사용 가능한 장소 조회하기'}
                    </button>

                    {error && <p className="error-text">{error}</p>}
                </div>

                {/* 2. 장소 목록 결과 영역 */}
                <div className="results-area-box place-focus-box">
                    {/* ⭐️ 제목에 아이콘 추가 */}
                    <h2 className="box-title">
                        <BsClipboardCheck size={24} />
                        조회 결과
                    </h2>

                    <div className="results-list-box">
                        {loading ? (
                            <p className="loading-text">장소 목록을 불러오는 중...</p>
                        ) : !isSearchPerformed ? (
                            <p className="instruction-text">날짜, 시간, 범주를 선택하고 '조회하기' 버튼을 누르세요.</p>
                        ) : filteredSpaces.length === 0 ? (
                            <p className="no-results-text">선택된 조건에 사용 가능한 장소가 없습니다.</p>
                        ) : (
                            <ul className="space-list">
                                {filteredSpaces.map(space => (
                                    <li key={space.id} className="space-item">
                                        <div className="space-details">
                                            <h3 className="space-name">{space.name}</h3>
                                            {/* ⭐️ <strong> 태그로 수정 */}
                                            <p className="space-info">
                                                <strong>범주:</strong> {space.subCategory || space.category} |
                                                <strong> 인원:</strong> {space.capacity}명 |
                                                <strong> 위치:</strong> {space.location}
                                            </p>
                                            <p className="space-time-info">
                                                <strong>예약 시간대:</strong> {selectedTimeRange.start} ~ {selectedTimeRange.end}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleSelectSpace(space)}
                                            className="select-space-button"
                                        >
                                            예약하기
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimeFocusSelectPage;
