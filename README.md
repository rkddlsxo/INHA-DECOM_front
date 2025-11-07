# INHA-DECOM: 인하대학교 시설물 예약 및 관리 시스템

> React 기반의 프론트엔드와 Flask 기반의 백엔드로 구축된 통합 시설물 예약 및 관리 솔루션입니다.

---

## 응용 프로그램에 대한 설명

INHA-DECOM은 대학교 시설물 예약의 편의성과 관리 효율성을 극대화하기 위해 개발되었습니다.

사용자는 3가지 예약 방식을 통해 원하는 시설의 실시간 예약 가능 여부를 확인하고, 
QR 및 GPS 기반 체크인 시스템을 통해 정확한 시설 이용을 관리할 수 있습니다. 
백엔드는 Flask를 기반으로 데이터의 무결성(특히 예약 시간 충돌)을 확보하고, 예약에 맞춰 이메일을 발송하는 자동화된 기능을 제공합니다.

### 핵심 기능: 기능 & 기술 구현

| 기능 | 설명 | 구현 상세 |
| :--- | :--- | :--- |
| **사용자인증** |  학번 기반 회원가입, 로그인, 프로필 조회를 제공합니다. | JWT 토큰 사용 |
| **다중 예약 플로우** | **시간 우선**, **공간 우선**, **시간+공간 동시 선택** 등 사용 목적에 맞는 3가지 예약 방식 제공. | 프론트엔드에서 예약 방식을 선택하면 해당 페이지로 이동. |
| **실시간 예약 충돌 검사** | 10분 단위 슬롯을 기준으로 시간 충돌을 정밀하게 검사합니다. | 백엔드에서 **`db.Date` 및 `db.Time` 객체**를 사용하여 정확한 시간 비교를 수행. |
| **QR & GPS 체크인** | 시설물 QR 스캔 시, **GPS 위치가 예약 장소의 50m 반경 이내**인지 확인하여 체크인 처리. | `geopy.distance` 모듈을 활용하여 거리 계산, 체크인 가능 시간은 예약 시작 15분 후까지 허용. |
| **자동 이메일 알림** | 예약 시작 10분 전에 사용자에게 알림 이메일 자동 발송. | Flask-APScheduler를 1분 간격으로 실행하여 타겟 예약 확인 및 Flask-Mail로 발송. |
| **예약 및 민원 관리** | 나의 예약 내역 조회, 수정, 취소,재예약 및 시설 이용 불편 사항 접수/조회 기능 제공. | 백엔드 API `/bookings/my` 및 `/complaints/my`를 통해 데이터 연동. |
| **월별 현황 보기**| 메인 메뉴에서 **'월별 현황 보기'**를 선택하여 이동 후, 월별 예약 현황을 확인 할 수 있습니다.. | 프론트엔드에서 시간, 장소를 선택하면 해당 정보 표시.|
---

## 팀 구성원

| 이름   | 이메일                      | 
|--------|---------------------------|
| 오정우 | shfnskdl@naver.com         |
| 강인태 | rkddlsxo12345@naver.com    |
| 이소현 | dlthgus15780@gmail.com     |
| 김태용 | ktyong1225@inha.edu        |
| 김동현 | seaweedtreepot@gmail.com   |

---

## 💻 기술 스택

### 프론트엔드 (INHA-DECOM_front)

| 요소 | 기술 | 설명 |
| :--- | :--- | :--- |
| **스타일** | CSS Modules / PostCSS | 인하대 메인 컬러(004B8D)를 활용한 디자인 시스템. |
| **프레임워크** | React (v19.1.1) | 사용자 인터페이스 구축. |
| **빌드 도구** | Vite (v7.1.12) | 개발 서버 및 프로덕션 빌드. |
		
---

## ⚙️ 응용 프로그램 설치 및 실행 방법


### 1. 프론트엔드 설치 및 실행 (INHA-DECOM_front)
0. 프로젝트를 클론합니다.
    git clone https://github.com/rkddlsxo/INHA-DECOM_front.git

1.  프론트엔드 저장소로 이동합니다.
   
    cd INHA-DECOM_front
   
2.  의존성 패키지를 설치합니다.
   
    npm install
   
3.  개발 서버를 실행합니다.
   
    npm run dev
   
    프론트엔드 앱은 `http://localhost:5173` (Vite 기본 포트)에서 실행되며, 백엔드 **`http://localhost:5050/api`**와 통신합니다.

---

### 2. 시설 예약 (신규 예약하기)

로그인 후 메인 메뉴에서 **'신규 예약하기'**를 클릭하여 원하는 예약 방식을 선택합니다.

#### 예약 방식별 사용 가이드

| 예약 방식 | 사용 단계 | 규칙 |
| :--- | :--- | :--- |
| **시간 + 공간 동시 선택** | 1. 날짜, 시간대를 선택합니다. 2. **'사용 가능한 장소 조회하기'**를 클릭합니다. 3. 우측 목록에서 원하는 **카테고리**를 클릭하여 필터링합니다. | 시작 `XX:X0`, 종료 `XX:X9` 형태의 10분 단위 시간 선택. |
| **시간 우선 예약** | 1. 날짜, 시간대, 카테고리를 선택합니다. 2. **'사용 가능한 장소 조회하기'**를 클릭하여 목록을 확인합니다. | 시작 `XX:X0`, 종료 `XX:X9` 형태의 10분 단위 시간 선택. |
| **공간 우선 예약** | 1. 좌측 장소 목록에서 원하는 시설을 선택합니다. 2. 달력에서 **예약 가능한 날짜**를 선택합니다. 3. 하단에서 시작/종료 시간을 선택합니다. | 예약 불가 시간대를 피해 시간대를 지정해야 합니다. |

#### 최종 예약 확정

1.  **예약 상세 정보 입력**: 예약 페이지로 이동하여 단체명, 행사명, 연락처 등 필수 정보를 모두 입력합니다.
2.  **규칙 확인**: **'최종 예약 확정 및 제출'** 버튼 클릭 시, **'장소별 예약안내 및 유의사항'** 문구를 클릭하여 모달을 열고 내용을 확인한 후, 모든 필수 체크 항목에 동의합니다.
3.  **최종 확정**: **'모든 항목 확인 및 최종 예약 확정'** 버튼을 누르면 예약이 **'확정대기'** 상태로 접수됩니다.

---

### 3. 예약 후 관리 및 이용

| 기능 | 사용 방법 | 참고 사항 |
| :--- | :--- | :--- |
| **예약 내역 조회** | 메인 메뉴에서 **'예약 내역 / 수정'**을 클릭합니다. 목록에서 항목을 클릭하면 상세 조회 및 수정/취소 가능. | **'확정대기'** 및 **'확정'** 상태만 수정 또는 취소가 가능합니다. |
| **시설 체크인 (QR)** | 예약 시설에 부착된 QR 코드를 스캔합니다. 앱이 실행되면 GPS 위치 확인 후 자동 체크인 됩니다. | **예약 장소의 50m 이내**에서만 체크인이 성공합니다. |
| **불편 사항 접수** | 메인 메뉴에서 **'불편 사항 접수'**를 선택하여 접수 메뉴로 이동 후, **'불편 사항 접수'** 버튼을 클릭해 양식을 작성하고 제출합니다. | 접수 내역은 **'불편 사항 내역'** 메뉴에서 확인할 수 있습니다. |
| **재예약**| 메인 메뉴에서 **'예약 내역/수정'**를 선택하여 이동 후, **'지난 예약'** 버튼을 클릭해 재예약합니다. | 재예약시 공간우선예약페이지로 넘어갑니다.|
| **월별 현황 보기**| 메인 메뉴에서 **'월별 현황 보기'**를 선택하여 이동 후, 월별 예약 현황을 확인 할 수 있습니다.. | 토글바를 선택해 장소별로 확인할 수 있습니다.|
### API 통신
- 백엔드 API 서버(`port=5050`)가 먼저 실행되어 있어야 프론트엔드 앱이 정상적으로 동작합니다.

### GPS 체크인
- QR 체크인 기능은 **GPS 위치 정보를 제공하는 환경 (모바일 또는 특정 브라우저)**에서만 정상적으로 동작합니다.
- 체크인은 예약 시작 시간 기준 15분 이후까지 가능합니다.

### 예약 규칙
- 예약 가능 시간 단위는 **10분**이며, 예약 시 시작 시간은 `XX:X0`, 종료 시간은 `XX:X9`로 선택해야 합니다.

### 보안
- **절대 일반 Gmail 비밀번호를 사용하지 마세요**
- 반드시 앱 비밀번호를 생성하여 사용
- Gmail 2단계 인증이 활성화되어 있어야 함



## 라이선스

### MIT 라이선스

이 프로젝트는 **MIT License**를 따릅니다.
MIT License

Copyright (c) 2025 rkddlsxo

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

### 기타 오픈소스 라이선스

| **프론트엔드 (Node)** | React, React-DOM | UI 구축 및 렌더링 | MIT License |
| | Vite, @vitejs/plugin-react | 빌드 도구 및 개발 환경 | MIT License |
| | react-icons | 벡터 아이콘 사용 | MIT License |
| | tailwindcss, autoprefixer, postcss | CSS 스타일링 및 처리 | MIT License |
