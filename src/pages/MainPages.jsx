import React from 'react';

const MainPage = ({ onNavigate }) => {
  return (
    <div className="p-8">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-2">학교 시설물 관리 시스템</h1>
        <p className="text-lg text-gray-600">원하는 서비스를 선택하세요.</p>
      </header>
      <main className="flex justify-center gap-8">
        <button
          onClick={() => onNavigate('reservation')}
          className="w-48 h-32 bg-blue-500 text-white text-xl font-semibold rounded-lg shadow-md hover:bg-blue-600 transition-transform transform hover:-translate-y-1"
        >
          1. 시설 예약
        </button>
        <button
          onClick={() => alert('아직 준비 중인 기능입니다.')}
          className="w-48 h-32 bg-green-500 text-white text-xl font-semibold rounded-lg shadow-md hover:bg-green-600 transition-transform transform hover:-translate-y-1"
        >
          2. 시설 제보
        </button>
      </main>
    </div>
  );
};

export default MainPage;
