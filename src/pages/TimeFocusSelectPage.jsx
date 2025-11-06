import React, { useState, useEffect, useMemo } from 'react';
import './TimeFocusSelectPage.css';
import { BsArrowLeft, BsPencilSquare, BsClipboardCheck } from 'react-icons/bs';

// API 기본 URL 정의
const API_BASE_URL = 'http://localhost:5050/api';

// --- 상수 및 유틸리티 ---

// 예약 가능한 시설 카테고리 정의 (서브 카테고리 포함)
const CATEGORIES = {
    '전체': ['전체'],
    '스터디룸': ['인문 스터디룸', '해동 스터디룸', '학생라운지 스터디룸'],
    '가무연습실': ['가무연습실'],
    '운동장': ['운동장'],
    '피클볼 코트': ['피클볼 코트'],
    '테니스 코트': ['테니스 코트'],
    '농구장': ['농구장'],
    '풋살파크': ['풋살파크'],
};

/**
 * 규칙에 맞는 시간 옵션 목록을 생성합니다. (시작: XX:X0, 종료: XX:X9)
 * @param {string} type - 'start' (XX:X0) 또는 'end' (XX:X9)
 * @returns {string[]} 'HH:MM' 형식의 시간 문자열 배열
 */
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
            } else { // type === 'end'
                minute = m + 9;
                if (h === END_HOUR && m + 9 > 59) break;
                // 21:50 슬롯의 종료 시간은 21:59
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
    // 중복 제거 및 정렬
    return Array.from(new Set(options)).sort();
};

// 카테고리 선택 드롭다운에 표시할 옵션 목록 생성
const categoryOptions = [
    ...Object.keys(CATEGORIES).filter(key => key !== '스터디룸'), // 메인 카테고리
    ...CATEGORIES['스터디룸'] // 스터디룸 서브 카테고리
].filter(cat => cat !== '전체').sort();
categoryOptions.unshift('전체'); // '전체' 옵션을 가장 앞에 추가


// --- 메인 컴포넌트 ---

/**
 * 시간 우선 예약 페이지 컴포넌트입니다.
 * 날짜와 시간을 먼저 선택하고 해당 시간에 사용 가능한 장소를 조회합니다.
 * @param {object} props - 컴포넌트 속성
 * @param {function} props.onNavigate - 페이지 이동을 처리하는 함수
 */
const TimeFocusSelectPage = ({ onNavigate }) => {
    // 선택된 날짜 ('YYYY-MM-DD')
    const [selectedDate, setSelectedDate] = useState('');
    // 선택된 시간 범위 ('HH:MM' ~ 'HH:MM')
    const [selectedTimeRange, setSelectedTimeRange] = useState({ start: '09:00', end: '10:59' });
    // 사용자가 드롭다운에서 선택한 카테고리 (필터 조건)
    const [selectedCategory, setSelectedCategory] = useState('전체');

    // 실제 장소 목록 필터링에 사용될 카테고리 (조회 버튼 클릭 시에만 업데이트됨)
    const [currentFilterCategory, setCurrentFilterCategory] = useState('전체');

    // 서버에서 받은 모든 사용 가능한 장소 목록 (원본)
    const [allAvailableSpaces, setAllAvailableSpaces] = useState([]);
    // 필터링되어 사용자에게 표시될 최종 장소 목록
    const [filteredSpaces, setFilteredSpaces] = useState([]);

    // 로딩 상태 및 에러 메시지
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    // 검색 버튼을 눌러 조회했는지 여부
    const [isSearchPerformed, setIsSearchPerformed] = useState(false);

    // 시간 옵션 목록 (useMemo로 최적화)
    const startTimeOptions = useMemo(() => generateTimeOptions('start'), []);
    const endTimeOptions = useMemo(() => generateTimeOptions('end'), []);

    // 장소 목록 카테고리 필터링 로직 (currentFilterCategory 또는 원본 목록 변경 시 실행)
    useEffect(() => {
        if (!isSearchPerformed) {
            setFilteredSpaces([]);
            return;
        }

        let filtered = allAvailableSpaces;

        // 1. '전체' 카테고리가 선택된 경우 필터링 없이 전체 목록 표시
        if (currentFilterCategory === '전체') {
            setFilteredSpaces(filtered);
            return;
        }

        // 2. 선택된 카테고리가 스터디룸의 서브 카테고리인지 확인
        const isSubCategory = CATEGORIES['스터디룸'].includes(currentFilterCategory);

        if (isSubCategory) {
            // 서브 카테고리 필터링
            filtered = filtered.filter(space => space.subCategory === currentFilterCategory);
        } else {
            // 메인 카테고리 필터링
            filtered = filtered.filter(space => space.category === currentFilterCategory);
        }

        setFilteredSpaces(filtered);

    }, [currentFilterCategory, allAvailableSpaces, isSearchPerformed]);


    /**
     * 서버에서 사용 가능한 장소 목록을 불러오는 함수
     * @param {string} date - 예약 날짜
     * @param {object} timeRange - { start: 'HH:MM', end: 'HH:MM' }
     */
    const fetchAvailableSpaces = async (date, timeRange) => {
        setLoading(true);
        setError(null);
        setAllAvailableSpaces([]);
        setFilteredSpaces([]);
        setIsSearchPerformed(true);

        // 유효성 검사
        if (!timeRange.start || !timeRange.end || timeRange.start >= timeRange.end) {
            setError('❌ 유효한 시간대를 선택해주세요. (시작 시간 < 종료 시간)');
            setLoading(false);
            return;
        }

        try {
            // API 호출: 날짜, 시작 시간, 종료 시간을 쿼리 파라미터로 전송
            const response = await fetch(`${API_BASE_URL}/spaces/available?date=${date}&start=${timeRange.start}&end=${timeRange.end}`);
            if (!response.ok) throw new Error('사용 가능한 장소 목록 조회 실패');

            const data = await response.json();

            setAllAvailableSpaces(data); // 원본 데이터 저장

            // 조회 성공 시, useEffect에서 currentFilterCategory에 따라 필터링이 자동으로 재실행됨

            setError(null);

        } catch (err) {
            console.error(err);
            setError('⚠️ 오류: 장소 목록을 불러오는 중 오류가 발생했습니다.');
            setAllAvailableSpaces([]);
        }
        setLoading(false);
    };

    /**
     * 시간 SELECT 입력 변경 핸들러
     * @param {string} field - 'start' 또는 'end'
     * @param {object} e - 이벤트 객체
     */
    const handleTimeInputChange = (field, e) => {
        const value = e.target.value;
        setSelectedTimeRange(prev => ({ ...prev, [field]: value }));
        // 시간 조건이 바뀌면 검색 상태를 리셋하여 재조회를 유도
        setIsSearchPerformed(false);
    };

    /**
     * '장소 조회하기' 버튼 클릭 핸들러
     */
    const handleSearch = () => {
        // 필수 조건 확인
        if (!selectedDate) {
            alert('날짜를 먼저 선택해주세요.');
            return;
        }

        // 시간 포맷 규칙 검사 (XX:X0 ~ XX:X9)
        if (selectedTimeRange.start.slice(-1) !== '0' || selectedTimeRange.end.slice(-1) !== '9') {
            alert('시간 선택 규칙을 다시 확인해주세요. (시작: XX:X0, 종료: XX:X9)');
            return;
        }

        // 핵심: 버튼 클릭 시에만 드롭다운에서 선택된 카테고리를 실제 필터링 기준으로 설정
        setCurrentFilterCategory(selectedCategory);

        // API 호출 시작
        fetchAvailableSpaces(selectedDate, selectedTimeRange);
    };

    /**
     * 결과 목록에서 '예약하기' 버튼 클릭 핸들러
     * @param {object} space - 선택된 장소 객체
     */
    const handleSelectSpace = (space) => {
        if (!isSearchPerformed) return;

        // 예약 상세 페이지로 전달할 임시 데이터 LocalStorage에 저장
        const bookingDataToStore = {
            date: selectedDate,
            startTime: selectedTimeRange.start,
            endTime: selectedTimeRange.end,
            roomName: space.name,
            roomLocation: space.location || '위치 정보 없음',
        };

        localStorage.setItem('tempBookingData', JSON.stringify(bookingDataToStore));
        localStorage.setItem('lastReservationSelectPage', 'timeFocusSelectPage'); // 이전 페이지 경로 저장

        onNavigate('reservationDetailsPage'); // 상세 정보 입력 페이지로 이동
    };

    // 조회 버튼 활성화 여부
    const isSearchReady = selectedDate && selectedTimeRange.start && selectedTimeRange.end;

    return (
        <div className="time-focus-main-container">
            {/* 뒤로가기 버튼 */}
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
                    {/* 제목 */}
                    <h2 className="box-title">
                        <BsPencilSquare size={24} />
                        예약 조건 선택
                    </h2>

                    {/* 날짜 선택 */}
                    <label className="input-label" htmlFor="date-picker">예약 날짜:</label>
                    <input
                        type="date"
                        id="date-picker"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]} // 오늘 이후 날짜만 허용
                        className="date-picker-input"
                    />

                    {/* 시간 선택 드롭다운 */}
                    <label className="input-label time-label">예약 시간대 (XX:X0 ~ XX:X9):</label>
                    <div className="time-inputs-wrapper">
                        {/* 시작 시간 드롭다운 */}
                        <select
                            value={selectedTimeRange.start}
                            onChange={(e) => handleTimeInputChange('start', e)}
                            className="time-select"
                        >
                            {startTimeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>

                        <span className="time-separator">~</span>

                        {/* 종료 시간 드롭다운 */}
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

                    {/* 조회 버튼 */}
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
                    {/* 제목 */}
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
                            // 사용 가능한 장소 목록 표시
                            <ul className="space-list">
                                {filteredSpaces.map(space => (
                                    <li key={space.id} className="space-item">
                                        <div className="space-details">
                                            <h3 className="space-name">{space.name}</h3>
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