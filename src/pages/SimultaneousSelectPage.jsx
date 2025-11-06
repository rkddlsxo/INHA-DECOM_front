import React, { useState, useEffect, useMemo } from 'react';
import './SimultaneousSelectPage.css';
import { BsArrowLeft, BsSearch, BsBuilding, BsListUl } from 'react-icons/bs';

// 상수 정의
const API_BASE_URL = 'http://localhost:5050/api';
const LAST_PAGE_KEY = 'simultaneousSelectPage';

// 예약 가능한 주요 카테고리 정의 (필터링 UI용)
const CATEGORIES = {
    '전체': ['전체'],
    '스터디룸': ['스터디룸'],
    '가무연습실': ['가무연습실'],
    '운동장': ['운동장'],
    '피클볼 코트': ['피클볼 코트'],
    '테니스 코트': ['테니스 코트'],
    '농구장': ['농구장'],
    '풋살파크': ['풋살파크'],
};

/**
 * 7시부터 21시까지의 시간(Hour) 옵션을 생성합니다.
 * @returns {string[]} 'HH' 형식의 시간 문자열 배열
 */
const generateHourOptions = () => {
    const hours = [];
    for (let h = 7; h <= 21; h++) { hours.push(String(h).padStart(2, '0')); }
    return hours;
};

/**
 * 10분 단위의 분(Minute) 옵션을 생성합니다.
 * @param {string} type - 'start' (XX:X0) 또는 'end' (XX:X9)
 * @returns {string[]} 'MM' 형식의 분 문자열 배열
 */
const generateMinuteOptions = (type) => {
    const minutes = [];
    for (let m = 0; m <= 50; m += 10) {
        if (type === 'start') {
            minutes.push(String(m).padStart(2, '0'));
        } else {
            if (m === 50) { minutes.push('59'); } else { minutes.push(String(m + 9).padStart(2, '0')); }
        }
    }
    return minutes;
};

/**
 * 시간/날짜와 공간 카테고리를 동시에 선택하여 장소를 조회하는 페이지 컴포넌트입니다.
 * @param {object} props - 컴포넌트 속성
 * @param {function} props.onNavigate - 페이지 이동을 처리하는 함수
 */
const SimultaneousSelectPage = ({ onNavigate }) => {
    // 선택된 날짜 ('YYYY-MM-DD')
    const [selectedDate, setSelectedDate] = useState('');
    // 선택된 시간 범위 ('HH:MM' ~ 'HH:MM')
    const [selectedTimeRange, setSelectedTimeRange] = useState({ start: '08:00', end: '12:59' });

    // 시간/분 드롭다운 상태
    const [selectedHour, setSelectedHour] = useState({ start: '08', end: '12' });
    const [selectedMinute, setSelectedMinute] = useState({ start: '00', end: '59' });

    // 선택된 카테고리 목록 (필터링 조건)
    const [selectedCategories, setSelectedCategories] = useState([]);

    // 모든 마스터 장소 목록
    const [allMasterSpaces, setAllMasterSpaces] = useState([]);
    // 서버에서 받은 사용 가능한 모든 장소 목록 (원본 데이터)
    const [availableSpaces, setAvailableSpaces] = useState([]);
    // 카테고리 필터가 적용되어 사용자에게 표시될 최종 목록
    const [filteredSpaces, setFilteredSpaces] = useState([]);

    // 로딩 상태 및 에러 메시지
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    // 조회 버튼을 눌러 검색을 실행했는지 여부
    const [isSearchPerformed, setIsSearchPerformed] = useState(false);

    // 시간/분 옵션 목록 (useMemo로 최적화)
    const hourOptions = useMemo(() => generateHourOptions(), []);
    const startMinuteOptions = useMemo(() => generateMinuteOptions('start'), []);
    const endMinuteOptions = useMemo(() => generateMinuteOptions('end'), []);

    // 마스터 장소 목록을 카테고리별로 그룹화 (필터링 UI용)
    const groupedSpaces = useMemo(() => {
        return allMasterSpaces.reduce((groups, space) => {
            // 스터디룸 서브 카테고리를 '스터디룸'으로 통일
            const category = space.category === '스터디룸' ? '스터디룸' : space.category;
            if (!groups[category]) groups[category] = [];
            groups[category].push(space);
            return groups;
        }, {});
    }, [allMasterSpaces]);


    // 마스터 장소 목록 로드 (컴포넌트 마운트 시 1회)
    useEffect(() => {
        const fetchMasterSpaces = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/masters/spaces`);
                if (!response.ok) throw new Error('마스터 장소 목록 로드 실패');
                const data = await response.json();

                // 스터디룸 서브 카테고리를 '스터디룸'으로 통일하는 데이터 가공
                const unifiedData = data.map(space => ({
                    ...space,
                    category: space.subCategory && space.category === '스터디룸' ? '스터디룸' : space.category
                }));

                setAllMasterSpaces(unifiedData);

            } catch (err) {
                console.error("Master Space Load Error:", err);
                // API 실패 시 더미 데이터 사용 (디버깅/테스트용)
                const unifiedDummy = SimultaneousSelectPage.DUMMY_SPACES_FOR_TEST.map(s => ({
                    ...s,
                    id: s.id,
                    category: s.subCategory && s.category === '스터디룸' ? '스터디룸' : s.category
                }));
                setAllMasterSpaces(unifiedDummy);
            }
        };
        fetchMasterSpaces();
    }, []);


    /**
     * 서버에서 사용 가능한 장소 목록을 불러오고, 선택된 카테고리로 필터링합니다.
     * @param {string} date - 예약 날짜 ('YYYY-MM-DD')
     * @param {object} timeRange - { start: 'HH:MM', end: 'HH:MM' }
     * @param {string[]} categories - 선택된 카테고리 목록
     */
    const fetchAndFilterSpaces = async (date, timeRange, categories) => {
        setLoading(true);
        setError(null);
        setIsSearchPerformed(true);

        const todayString = new Date().toISOString().split('T')[0];
        // 유효성 검사: 지난 날짜 예약 불가
        if (date < todayString) {
            setError('❌ 지난 날짜는 예약할 수 없습니다.');
            setLoading(false);
            return;
        }
        // 유효성 검사: 시간 역전 방지
        if (timeRange.start >= timeRange.end) {
            setError('❌ 종료 시간은 시작 시간보다 늦어야 합니다.');
            setLoading(false);
            return;
        }

        try {
            // API 호출: 날짜, 시작 시간, 종료 시간을 쿼리 파라미터로 전송
            const endpoint = `${API_BASE_URL}/spaces/available?date=${date}&start=${timeRange.start}&end=${timeRange.end}`;
            const response = await fetch(endpoint);

            if (!response.ok) throw new Error('조회 실패');
            const data = await response.json();

            // 서버 응답 데이터 가공 (스터디룸 통일)
            const unifiedAvailableData = data.map(space => ({
                ...space,
                category: space.subCategory && space.category === '스터디룸' ? '스터디룸' : space.category
            }));

            // 서버 응답을 받은 후, 선택된 카테고리로 필터링
            let finalFilteredData = unifiedAvailableData;

            // '전체' 카테고리가 선택되지 않은 경우에만 필터링 적용
            if (categories.length > 0 && !categories.includes('전체')) {
                finalFilteredData = unifiedAvailableData.filter(space => {
                    const spaceCategory = space.category;
                    return categories.includes(spaceCategory);
                });
            }

            setAvailableSpaces(unifiedAvailableData); // 서버 원본 목록 저장
            setFilteredSpaces(finalFilteredData);    // 필터링된 최종 목록 표시

            setError(null);

        } catch (err) {
            setError('⚠️ 오류: 사용 가능한 장소를 불러오는 중 오류가 발생했습니다. 서버 연결을 확인해주세요.');

            // 에러 시 더미 데이터 처리 및 필터링
            const unifiedDummy = SimultaneousSelectPage.DUMMY_SPACES_FOR_TEST.map(s => ({
                ...s,
                category: s.subCategory && s.category === '스터디룸' ? '스터디룸' : s.category
            }));

            let filteredDummy = unifiedDummy;
            if (categories.length > 0 && !categories.includes('전체')) {
                filteredDummy = unifiedDummy.filter(space => categories.includes(space.category));
            }

            setAvailableSpaces(unifiedDummy);
            setFilteredSpaces(filteredDummy);
        }
        setLoading(false);
    };

    /**
     * 시간/분 드롭다운 값 변경을 처리하고 시간 범위 상태를 업데이트합니다.
     * @param {string} field - 'start' 또는 'end'
     * @param {string} part - 'hour' 또는 'minute'
     * @param {object} e - 이벤트 객체
     */
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
        } else {
            if (field === 'start') {
                setSelectedMinute(prev => ({ ...prev, start: value }));
                newStartMinute = value;
            } else {
                setSelectedMinute(prev => ({ ...prev, end: value }));
                newEndMinute = value;
            }
        }

        // 최종 시간 범위 상태 업데이트
        setSelectedTimeRange({
            start: `${newStartHour}:${newStartMinute}`,
            end: `${newEndHour}:${newEndMinute}`,
        });

        // 시간/날짜 조건이 바뀌면 검색 결과를 초기화 (다시 조회 필요)
        setIsSearchPerformed(false);
        setAvailableSpaces([]);
        setFilteredSpaces([]);
    };

    /**
     * 카테고리 필터 선택/해제를 처리합니다.
     * @param {string} categoryName - 선택된 카테고리 이름
     */
    const handleCategorySelect = (categoryName) => {
        setSelectedCategories(prevCats => {
            let newCats;
            const isCurrentlySelected = prevCats.includes(categoryName);

            // '전체' 카테고리 선택 시 다른 모든 카테고리 해제
            if (categoryName === '전체') {
                newCats = isCurrentlySelected ? [] : ['전체'];
            }
            // 다른 카테고리 선택/해제 시
            else {
                if (isCurrentlySelected) {
                    newCats = prevCats.filter(cat => cat !== categoryName);
                } else {
                    newCats = [...prevCats.filter(cat => cat !== '전체'), categoryName]; // '전체' 카테고리 제거
                }
            }

            // 카테고리 필터가 변경되었으므로, 기존 검색 결과에 필터를 다시 적용
            let finalFilteredData = availableSpaces;
            if (newCats.length > 0 && !newCats.includes('전체')) {
                finalFilteredData = availableSpaces.filter(space => newCats.includes(space.category));
            }
            // 최종 표시 리스트 업데이트 (API 재호출 없이 로컬 필터링)
            setFilteredSpaces(finalFilteredData);

            // 시간/날짜 조건은 그대로이므로 isSearchPerformed 상태는 유지합니다.
            return newCats;
        });
    };

    /**
     * 카테고리 선택 필터를 초기화하고 결과 목록을 비웁니다.
     */
    const handleResetRoomSelection = () => {
        setSelectedCategories([]);
        setIsSearchPerformed(false); // 검색 상태 리셋 (다시 조회 필요)
        setFilteredSpaces([]); // 목록 비우기
    };


    /**
     * 날짜 및 시간 조건을 기반으로 장소 목록 조회 API를 호출합니다.
     */
    const handleSearch = () => {
        if (!selectedDate) {
            alert('날짜를 선택해주세요.');
            return;
        }
        // 시간 포맷 규칙 검사 (XX:X0 ~ XX:X9)
        if (selectedTimeRange.start.slice(-1) !== '0' || selectedTimeRange.end.slice(-1) !== '9') {
            alert('시간 선택 규칙을 다시 확인해주세요. (시작: XX:X0, 종료: XX:X9)');
            return;
        }

        // 선택된 카테고리 목록을 포함하여 API 호출 및 필터링 실행
        fetchAndFilterSpaces(selectedDate, selectedTimeRange, selectedCategories);
    };

    /**
     * 결과 목록에서 특정 장소를 선택하고 상세 정보 입력 페이지로 이동합니다.
     * @param {object} space - 선택된 장소 객체
     */
    const handleSelectSpace = (space) => {
        // 유효한 검색이 선행되었는지 확인
        if (!isSearchPerformed || loading) {
            alert('먼저 유효한 조건으로 장소 목록을 조회해주세요.');
            return;
        }

        // 예약 상세 페이지로 전달할 임시 데이터 LocalStorage에 저장
        const bookingDataToStore = {
            date: selectedDate,
            startTime: selectedTimeRange.start,
            endTime: selectedTimeRange.end,
            roomName: space.name,
            roomLocation: space.location || '위치 정보 없음',
        };

        localStorage.setItem('tempBookingData', JSON.stringify(bookingDataToStore));
        localStorage.setItem(LAST_PAGE_KEY, 'simultaneousSelectPage'); // 이전 페이지 경로 저장

        onNavigate('reservationDetailsPage'); // 상세 정보 입력 페이지로 이동
    };

    // 조회 준비 완료 상태 (날짜, 시간 모두 선택되었는지 확인)
    const isSearchReady = selectedDate && selectedTimeRange.start && selectedTimeRange.end;


    return (
        <div className="time-focus-main-container">
            <button
                onClick={() => onNavigate('reservationFormSelectPage')}
                className="back-button"
            >
                <BsArrowLeft size={16} />
                뒤로
            </button>
            <h1 className="page-title">🕑 시간 + 공간 동시 선택</h1>
            <p className="page-description">조건을 입력하고 조회 후, 장소 목록에서 원하는 **카테고리**를 클릭하여 필터를 적용하세요.</p>

            <div className="selection-area-wrapper">

                {/* 1. 시간 조건 입력 영역 (좌측) */}
                <div className="selection-box time-focus-box">
                    <h2 className="box-title">
                        <BsSearch size={24} />
                        예약 시간 및 날짜
                    </h2>

                    {/* 날짜 선택 */}
                    <label className="input-label" htmlFor="date-picker">예약 날짜:</label>
                    <input
                        type="date"
                        id="date-picker"
                        value={selectedDate}
                        // 날짜 변경 시 목록 초기화 및 검색 상태 리셋
                        onChange={(e) => { setSelectedDate(e.target.value); setIsSearchPerformed(false); setFilteredSpaces([]); }}
                        min={new Date().toISOString().split('T')[0]} // 오늘 날짜 이후만 선택 가능
                        className="date-picker-input"
                    />

                    {/* 시간 선택 (분리된 드롭다운) */}
                    <label className="input-label time-label">예약 시간대 (XX:X0 ~ XX:X9):</label>
                    <div className="time-inputs-wrapper">
                        {/* 시작 시간 H/M 드롭다운 */}
                        <select
                            value={selectedHour.start}
                            onChange={(e) => handleTimeInputComponentChange('start', 'hour', e)}
                            className="time-select"
                        >
                            {hourOptions.map(h => (<option key={`sh-${h}`} value={h}>{h}</option>))}
                        </select>
                        <span className="time-separator">:</span>
                        <select
                            value={selectedMinute.start}
                            onChange={(e) => handleTimeInputComponentChange('start', 'minute', e)}
                            className="time-select"
                        >
                            {startMinuteOptions.map(m => (<option key={`sm-${m}`} value={m}>{m}</option>))}
                        </select>

                        <span className="time-separator">~</span>

                        {/* 종료 시간 H/M 드롭다운 */}
                        <select
                            value={selectedHour.end}
                            onChange={(e) => handleTimeInputComponentChange('end', 'hour', e)}
                            className="time-select"
                        >
                            {hourOptions.map(h => (<option key={`eh-${h}`} value={h}>{h}</option>))}
                        </select>
                        <span className="time-separator">:</span>
                        <select
                            value={selectedMinute.end}
                            onChange={(e) => handleTimeInputComponentChange('end', 'minute', e)}
                            className="time-select"
                        >
                            {endMinuteOptions.map(m => (<option key={`em-${m}`} value={m}>{m}</option>))}
                        </select>
                    </div>

                    <button
                        onClick={handleSearch}
                        className="search-button"
                        disabled={!isSearchReady || loading} // 조회 준비가 안 됐거나 로딩 중이면 비활성화
                    >
                        {loading ? '사용 가능 장소 조회 중...' : '사용 가능 장소 조회하기'}
                    </button>

                    {error && <p className="error-text">{error}</p>}
                </div>


                {/* 2. 장소 목록 및 필터 영역 (우측, 카테고리 필터) */}
                <div className="results-area-box place-focus-box room-list-box">
                    <h2 className="box-title">
                        <BsBuilding size={24} />
                        장소 목록 (카테고리 필터)
                    </h2>

                    {/* 장소 선택 현황 및 초기화 버튼 */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <p className="instruction-text-small" style={{ color: selectedCategories.length > 0 ? '#004B8D' : '#666' }}>
                            현재 필터: {selectedCategories.length === 0 ? '전체 장소' : `${selectedCategories.length}개 카테고리 선택됨`}
                        </p>
                        {selectedCategories.length > 0 && (
                            <button
                                onClick={handleResetRoomSelection}
                                style={{
                                    padding: '0.4rem 1rem',
                                    backgroundColor: '#f1f1f1',
                                    color: '#dc3545',
                                    border: '1px solid #ddd',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    fontSize: '0.9rem',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                선택 초기화
                            </button>
                        )}
                    </div>

                    {allMasterSpaces.length === 0 ? (
                        <p className="loading-text">장소 목록 로딩 중...</p>
                    ) : (
                        <div className="room-list-scroll-area">
                            {/* 카테고리 필터링 UI 렌더링 */}
                            {Object.keys(groupedSpaces).map(category => {
                                const roomsInCat = groupedSpaces[category];
                                return (
                                    <div
                                        key={category}
                                        className={`category-group-wrapper ${selectedCategories.includes(category) ? ' selected-filter' : ''}`}
                                        onClick={() => handleCategorySelect(category)} // 카테고리 클릭 시 필터 상태만 변경
                                    >
                                        <div
                                            className={`category-header filter-only`}
                                        >
                                            <strong>{category}</strong> (총 {roomsInCat.length}개)
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* 3. 통합 결과 리스트 영역 (2열 아래, 전체 너비) */}
            <div className="results-area-box place-focus-box" style={{ marginTop: '2.5rem' }}>
                <h2 className="box-title">
                    <BsListUl size={24} />
                    {/* 조회 상태 및 필터링 결과 요약 메시지 */}
                    {isSearchPerformed
                        ? (selectedCategories.length === 0
                            ? `사용 가능한 모든 장소 (${filteredSpaces.length}개 발견)`
                            : `선택된 ${selectedCategories.length}개 카테고리 조합 (${filteredSpaces.length}개 발견)`)
                        : '상단에 시간/날짜 조건을 입력하고 "조회하기" 버튼을 누르세요.'
                    }
                </h2>

                <div className="results-list-box">
                    {loading ? (
                        <p className="loading-text">장소 목록을 불러오는 중...</p>
                    ) : !isSearchPerformed ? (
                        <p className="instruction-text">상단에 시간/날짜 조건을 입력하고 카테고리를 선택한 후 '조회하기' 버튼을 누르세요.</p>
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
                                            <strong>범주:</strong> {space.category} |
                                            <strong> 인원:</strong> {space.capacity}명 |
                                            <strong> 위치:</strong> {space.location}
                                        </p>
                                        <p className="space-time-info">
                                            <strong>예약 시간대:</strong> {selectedDate} / {selectedTimeRange.start} ~ {selectedTimeRange.end}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleSelectSpace(space)}
                                        className="select-space-button"
                                    >
                                        예약 정보 입력
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

// 테스트용 더미 데이터
SimultaneousSelectPage.DUMMY_SPACES_FOR_TEST = [
    { id: 101, name: '인문 스터디룸 A', category: '스터디룸', subCategory: '인문 스터디룸', capacity: 6, location: '본관 301호' },
    { id: 102, name: '인문 스터디룸 B', category: '스터디룸', subCategory: '인문 스터디룸', capacity: 6, location: '본관 302호' },
    { id: 201, name: '해동 스터디룸 1', category: '스터디룸', subCategory: '해동 스터디룸', capacity: 4, location: '해동관 101호' },
    { id: 103, name: '가무연습실 1', category: '가무연습실', subCategory: '가무연습실', capacity: 20, location: '예술관 지하' },
    { id: 104, name: '풋살파크 전체', category: '풋살파크', subCategory: '풋살파크', capacity: 50, location: '대운동장 옆' },
];

export default SimultaneousSelectPage;