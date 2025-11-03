import React, { useState, useEffect, useMemo } from 'react';
import './SimultaneousSelectPage.css';
import { BsArrowLeft, BsSearch, BsBuilding, BsListUl } from 'react-icons/bs';

const API_BASE_URL = 'http://localhost:5050/api';
const LAST_PAGE_KEY = 'simultaneousSelectPage';

// 💡 장소 카테고리 정의
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

const generateHourOptions = () => {
    const hours = [];
    for (let h = 7; h <= 21; h++) { hours.push(String(h).padStart(2, '0')); }
    return hours;
};

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

const categoryOptions = [
    ...Object.keys(CATEGORIES).filter(key => key !== '스터디룸'),
    ...CATEGORIES['스터디룸']
].filter(cat => cat !== '전체').sort();
categoryOptions.unshift('전체');


const SimultaneousSelectPage = ({ onNavigate }) => {
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTimeRange, setSelectedTimeRange] = useState({ start: '08:00', end: '12:59' });

    const [selectedHour, setSelectedHour] = useState({ start: '08', end: '12' });
    const [selectedMinute, setSelectedMinute] = useState({ start: '00', end: '59' });

    const [selectedRoomIds, setSelectedRoomIds] = useState([]);
    const [expandedCategories, setExpandedCategories] = useState({});

    const [allMasterSpaces, setAllMasterSpaces] = useState([]);
    const [availableSpaces, setAvailableSpaces] = useState([]);
    const [filteredSpaces, setFilteredSpaces] = useState([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isSearchPerformed, setIsSearchPerformed] = useState(false);

    const hourOptions = useMemo(() => generateHourOptions(), []);
    const startMinuteOptions = useMemo(() => generateMinuteOptions('start'), []);
    const endMinuteOptions = useMemo(() => generateMinuteOptions('end'), []);

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


    // ... (useEffect - fetchMasterSpaces 로직 유지)
    useEffect(() => {
        const fetchMasterSpaces = async () => {
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
                console.error("Master Space Load Error:", err);
                setAllMasterSpaces(SimultaneousSelectPage.DUMMY_SPACES_FOR_TEST.map(s => ({ ...s, id: s.id })));
            }
        };
        fetchMasterSpaces();
    }, []);

    // ... (useEffect - 필터링 로직 유지)
    useEffect(() => {
        if (!isSearchPerformed) return;

        let filtered = availableSpaces;

        if (selectedRoomIds.length > 0) {
            filtered = availableSpaces.filter(space => selectedRoomIds.includes(space.id));
        }

        setFilteredSpaces(filtered);
    }, [selectedRoomIds, availableSpaces, isSearchPerformed]);


    // ... (fetchAvailableSpaces, handleTimeInputComponentChange, toggleCategory, handleSearch, handleSelectSpace 로직 유지)
    const fetchAvailableSpaces = async (date, timeRange) => {
        setLoading(true);
        setError(null);
        setAvailableSpaces([]);
        setIsSearchPerformed(true);

        const todayString = new Date().toISOString().split('T')[0];
        if (date < todayString) {
            setError('❌ 지난 날짜는 예약할 수 없습니다.');
            setLoading(false);
            return;
        }
        if (timeRange.start >= timeRange.end) {
            setError('❌ 종료 시간은 시작 시간보다 늦어야 합니다.');
            setLoading(false);
            return;
        }

        try {
            const endpoint = `${API_BASE_URL}/spaces/available?date=${date}&start=${timeRange.start}&end=${timeRange.end}`;
            const response = await fetch(endpoint);

            if (!response.ok) throw new Error('조회 실패');
            const data = await response.json();

            setAvailableSpaces(data);
            setError(null);

        } catch (err) {
            setError('⚠️ 오류: 사용 가능한 장소를 불러오는 중 오류가 발생했습니다. 서버 연결을 확인해주세요.');
            setAvailableSpaces(SimultaneousSelectPage.DUMMY_SPACES_FOR_TEST);
        }
        setLoading(false);
    };

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

        setSelectedTimeRange({
            start: `${newStartHour}:${newStartMinute}`,
            end: `${newEndHour}:${newEndMinute}`,
        });
        setIsSearchPerformed(false);
    };

    const handleRoomSelect = (roomId) => {
        setSelectedRoomIds(prevIds => {
            if (prevIds.includes(roomId)) {
                return prevIds.filter(id => id !== roomId);
            } else {
                return [...prevIds, roomId];
            }
        });
    };

    const toggleCategory = (categoryName) => {
        setExpandedCategories(prev => ({
            ...prev,
            [categoryName]: !prev[categoryName]
        }));
    };

    // ⭐️ 장소 선택 초기화 핸들러 추가
    const handleResetRoomSelection = () => {
        setSelectedRoomIds([]);
    };


    const handleSearch = () => {
        if (!selectedDate) {
            alert('날짜를 선택해주세요.');
            return;
        }
        if (selectedTimeRange.start.slice(-1) !== '0' || selectedTimeRange.end.slice(-1) !== '9') {
            alert('시간 선택 규칙을 다시 확인해주세요. (시작: XX:X0, 종료: XX:X9)');
            return;
        }

        fetchAvailableSpaces(selectedDate, selectedTimeRange);
    };

    const handleSelectSpace = (space) => {
        if (!isSearchPerformed || filteredSpaces.length === 0) return;

        const bookingDataToStore = {
            date: selectedDate,
            startTime: selectedTimeRange.start,
            endTime: selectedTimeRange.end,
            roomName: space.name,
            roomLocation: space.location || '위치 정보 없음',
        };

        localStorage.setItem('tempBookingData', JSON.stringify(bookingDataToStore));
        localStorage.setItem(LAST_PAGE_KEY, 'simultaneousSelectPage');

        onNavigate('reservationDetailsPage');
    };

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
            <p className="page-description">조건을 입력하고 조회 후, 장소 목록을 클릭하여 **여러 개**의 필터를 적용하세요.</p>

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
                        onChange={(e) => { setSelectedDate(e.target.value); setIsSearchPerformed(false); }}
                        min={new Date().toISOString().split('T')[0]}
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
                        disabled={!isSearchReady || loading}
                    >
                        {loading ? '사용 가능 장소 조회 중...' : '사용 가능 장소 조회하기'}
                    </button>

                    {error && <p className="error-text">{error}</p>}
                </div>


                {/* 2. 장소 목록 및 필터 영역 (우측, 트리뷰 사용) */}
                <div className="results-area-box place-focus-box room-list-box">
                    <h2 className="box-title">
                        <BsBuilding size={24} />
                        장소 목록 (필터)
                    </h2>

                    {/* ⭐️ 장소 선택 현황 및 초기화 버튼 */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <p className="instruction-text-small" style={{ color: selectedRoomIds.length > 0 ? '#004B8D' : '#666' }}>
                            현재 필터: {selectedRoomIds.length === 0 ? '전체 장소' : `${selectedRoomIds.length}개 장소 선택됨`}<br />

                        </p>
                        {selectedRoomIds.length > 0 && (
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
                            {/* PlaceFocusSelectPage에서 가져온 그룹화된 UI 사용 */}
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
                                                                    className={`room-item${selectedRoomIds.includes(room.id) ? ' selected' : ''}`}
                                                                    onClick={() => handleRoomSelect(room.id)}
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
                    )}
                </div>
            </div>

            {/* 3. 통합 결과 리스트 영역 (2열 아래, 전체 너비) */}
            <div className="results-area-box place-focus-box" style={{ marginTop: '2.5rem' }}>
                <h2 className="box-title">
                    <BsListUl size={24} />
                    {selectedRoomIds.length === 0
                        ? '선택 시간대에 사용 가능한 모든 장소'
                        : `선택된 ${selectedRoomIds.length}개 장소의 예약 가능 조합 (${filteredSpaces.length}개 발견)`
                    }
                </h2>

                <div className="results-list-box">
                    {loading && isSearchPerformed ? (
                        <p className="loading-text">장소 목록을 불러오는 중...</p>
                    ) : !isSearchPerformed ? (
                        <p className="instruction-text">상단에 시간/날짜 조건을 입력하고 '조회하기' 버튼을 누르세요.</p>
                    ) : filteredSpaces.length === 0 ? (
                        <p className="no-results-text">선택된 조건에 사용 가능한 장소가 없습니다.</p>
                    ) : (
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

// 💡 테스트용 더미 데이터 (서버 미연동 시 사용)
SimultaneousSelectPage.DUMMY_SPACES_FOR_TEST = [
    { id: 101, name: '인문 스터디룸 A', category: '스터디룸', subCategory: '인문 스터디룸', capacity: 6, location: '본관 301호' },
    { id: 103, name: '가무연습실 1', category: '가무연습실', subCategory: '가무연습실', capacity: 20, location: '예술관 지하' },
    { id: 104, name: '풋살파크 전체', category: '풋살파크', subCategory: '풋살파크', capacity: 50, location: '대운동장 옆' },
];

export default SimultaneousSelectPage;