import React, { useState } from 'react';
import './PlaceFocusSelectPage.css';

const rooms = [
    { id: 101, name: "스터디룸 A", capacity: 4, location: "2층 Quiet Zone" },
    { id: 102, name: "스터디룸 B (대형)", capacity: 8, location: "2층 Creative Zone" },
    { id: 201, name: "스터디룸 C", capacity: 6, location: "3층 집중 Zone" },
    { id: 202, name: "스터디룸 D", capacity: 4, location: "3층 집중 Zone" },
];

function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

const today = new Date();

const PlaceFocusSelectPage = ({ onNavigate }) => {
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [displayMonth, setDisplayMonth] = useState(today.getMonth());
    const [displayYear, setDisplayYear] = useState(today.getFullYear());
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('10:00');

    // 시간 옵션 생성
    const timeOptions = [];
    for (let h = 9; h <= 20; h++) {
        timeOptions.push(`${String(h).padStart(2, '0')}:00`);
        if (h < 20) timeOptions.push(`${String(h).padStart(2, '0')}:30`);
    }

    // 달력 날짜 배열 생성
    const daysInMonth = getDaysInMonth(displayYear, displayMonth);
    const firstDayOfWeek = new Date(displayYear, displayMonth, 1).getDay();

    const calendarCells = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
        calendarCells.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
        calendarCells.push(d);
    }

    // 날짜 클릭 핸들러
    const handleDateClick = (day) => {
        const dateObj = new Date(displayYear, displayMonth, day);
        if (dateObj < new Date(today.getFullYear(), today.getMonth(), today.getDate())) return;
        setSelectedDate(`${displayYear}-${String(displayMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
    };

    // 예약 버튼 클릭
    const handleNext = () => {
        if (!selectedRoom || !selectedDate || !startTime || !endTime) {
            alert('장소, 날짜, 시작/종료 시간을 모두 선택해야 합니다.');
            return;
        }
        if (endTime <= startTime) {
            alert('종료 시간은 시작 시간보다 늦어야 합니다.');
            return;
        }
        // 실제 예약 데이터 저장 및 다음 단계 이동 로직 필요
        alert(`예약 정보\n장소: ${selectedRoom.name}\n날짜: ${selectedDate}\n시간: ${startTime} ~ ${endTime}`);
        // 예시: onNavigate('bookingDetails');
    };

    return (
        <div className="place-focus-main-container">
            <button
                onClick={() => onNavigate('reservationFormSelect')}
                className="back-btn"
                style={{ position: 'absolute', top: 16, left: 16, zIndex: 10 }}
            >
                ← 뒤로
            </button>
            <h1 style={{ color: '#6f42c1', marginBottom: 30, fontSize: '2em' }}>장소 먼저 선택</h1>
            <div style={{ display: 'flex', gap: 20, width: '95%', maxWidth: 1200, margin: '0 auto' }}>
                {/* 장소 목록 */}
                <div style={{
                    flex: '0 0 300px', background: '#fff', padding: 20, borderRadius: 10,
                    boxShadow: '0 4px 15px rgba(0,0,0,0.05)', maxHeight: '80vh', overflowY: 'auto'
                }}>
                    <h2 style={{ color: '#6f42c1', marginTop: 0 }}>스터디룸 목록</h2>
                    <div>
                        {rooms.map(room => (
                            <div
                                key={room.id}
                                className={`room-item${selectedRoom && selectedRoom.id === room.id ? ' selected' : ''}`}
                                onClick={() => { setSelectedRoom(room); setSelectedDate(null); }}
                            >
                                <strong>{room.name}</strong><br />
                                <span>{room.capacity}인실 | {room.location}</span>
                            </div>
                        ))}
                    </div>
                </div>
                {/* 달력 및 시간 선택 */}
                <div style={{
                    flexGrow: 1, background: '#fff', padding: 20, borderRadius: 10,
                    boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
                }}>
                    <h2>
                        {selectedRoom ? `선택된 장소: ${selectedRoom.name}` : '스터디룸을 선택해주세요'}
                    </h2>
                    {!selectedRoom && (
                        <p style={{ color: '#6c757d' }}>왼쪽 목록에서 스터디룸을 선택하면 예약 가능한 날짜를 확인할 수 있습니다.</p>
                    )}
                    {selectedRoom && (
                        <>
                            {/* 달력 */}
                            <div style={{ margin: '24px 0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                                    <button
                                        onClick={() => {
                                            if (displayMonth > today.getMonth() || displayYear > today.getFullYear()) {
                                                if (displayMonth === 0) {
                                                    setDisplayMonth(11);
                                                    setDisplayYear(displayYear - 1);
                                                } else {
                                                    setDisplayMonth(displayMonth - 1);
                                                }
                                            }
                                        }}
                                    >&#9664; 이전</button>
                                    <span>{displayYear}년 {displayMonth + 1}월</span>
                                    <button
                                        onClick={() => {
                                            // 다음 달은 현재 월 기준 +1까지만 허용
                                            const maxMonth = today.getMonth() + 1;
                                            const maxYear = today.getFullYear();
                                            if (
                                                (displayYear < maxYear) ||
                                                (displayYear === maxYear && displayMonth < maxMonth)
                                            ) {
                                                if (displayMonth === 11) {
                                                    setDisplayMonth(0);
                                                    setDisplayYear(displayYear + 1);
                                                } else {
                                                    setDisplayMonth(displayMonth + 1);
                                                }
                                            } else {
                                                alert('예약은 현재 월 기준 다음 달까지만 가능합니다.');
                                            }
                                        }}
                                    >다음 &#9654;</button>
                                </div>
                                <div style={{
                                    display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5, textAlign: 'center'
                                }}>
                                    {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                                        <div key={day} className="calendar-header-day">{day}</div>
                                    ))}
                                    {calendarCells.map((day, idx) => {
                                        if (day === null) return <div key={idx} style={{ background: '#f4f4f4' }} />;
                                        const dateObj = new Date(displayYear, displayMonth, day);
                                        const isPast = dateObj < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                                        const isSelected = selectedDate === `${displayYear}-${String(displayMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                        return (
                                            <div
                                                key={idx}
                                                className={`day-cell${isSelected ? ' selected-date' : ''}${isPast ? ' past-date' : ''}`}
                                                onClick={() => !isPast && handleDateClick(day)}
                                            >
                                                <span style={{ fontSize: '1.2em' }}>{day}</span>
                                                <div style={{ fontSize: '0.8em', marginTop: 5 }}>
                                                    {isPast ? '지난 날짜' : (isSelected ? '선택됨' : '')}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            {/* 시간 선택 및 예약 */}
                            {selectedDate && (
                                <div style={{
                                    marginTop: 30, padding: 20, border: '1px solid #ddd', borderRadius: 8, textAlign: 'center'
                                }}>
                                    <div style={{ marginBottom: 20, padding: 10, borderBottom: '1px solid #ddd' }}>
                                        <p style={{ fontSize: '1.1em' }}>선택 장소: <strong style={{ color: '#6f42c1' }}>{selectedRoom.name}</strong></p>
                                        <p style={{ fontSize: '1.1em' }}>선택 날짜: <strong style={{ color: '#6f42c1' }}>{selectedDate}</strong></p>
                                    </div>
                                    <div style={{ marginBottom: 20 }}>
                                        <label style={{ fontWeight: 'bold', marginRight: 8 }}>시작 시간:</label>
                                        <select value={startTime} onChange={e => setStartTime(e.target.value)}>
                                            {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                        <label style={{ fontWeight: 'bold', marginLeft: 20, marginRight: 8 }}>종료 시간:</label>
                                        <select value={endTime} onChange={e => setEndTime(e.target.value)}>
                                            {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <button
                                        className="next-step-btn"
                                        onClick={handleNext}
                                    >
                                        다음 단계로 이동
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PlaceFocusSelectPage;