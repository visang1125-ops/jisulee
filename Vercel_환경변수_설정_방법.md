# Vercel 환경 변수 설정 방법

## 🔧 Render 백엔드 URL 입력하는 곳

### 단계별 안내

1. **Vercel 대시보드 접속**
   - [https://vercel.com/dashboard](https://vercel.com/dashboard)

2. **프로젝트 선택**
   - 배포된 프로젝트 클릭 (예: `jisulee`)

3. **Settings 탭 클릭**
   - 상단 메뉴에서 **"Settings"** 선택

4. **Environment Variables 섹션**
   - 왼쪽 메뉴에서 **"Environment Variables"** 클릭
   - 또는 Settings 페이지에서 스크롤하여 **"Environment Variables"** 섹션 찾기

5. **환경 변수 추가/수정**
   - **"Add New"** 또는 **"Add"** 버튼 클릭
   - 또는 기존 변수 옆 **"..."** 메뉴로 수정

## 📝 Render URL 입력하기

### 환경 변수 추가

1. **"Add New"** 버튼 클릭

2. **Key 입력:**
   ```
   VITE_API_URL
   ```
   ⚠️ 중요: 반드시 `VITE_` 접두사 필요!

3. **Value 입력:**
   ```
   https://jisulee-backend.onrender.com
   ```
   (Render에서 받은 실제 URL)

4. **Environment 선택:**
   - ✅ Production
   - ✅ Preview (선택)
   - ✅ Development (선택)

5. **"Save"** 클릭

## 🔍 빠른 경로

**가장 빠른 방법:**
1. Vercel 대시보드
2. 프로젝트 클릭
3. **Settings** (상단 메뉴)
4. **Environment Variables** (왼쪽 메뉴)
5. **"Add New"** 클릭

## ⚠️ 중요 사항

### 변수명 확인
- ✅ 올바른 이름: `VITE_API_URL`
- ❌ 잘못된 이름: `API_URL`, `REACT_APP_API_URL`

### Vite 환경 변수 규칙
- Vite는 `VITE_` 접두사가 있는 변수만 클라이언트에 노출
- `VITE_` 없으면 클라이언트에서 접근 불가

### URL 형식
- ✅ 올바른 형식: `https://jisulee-backend.onrender.com`
- ❌ 잘못된 형식: `http://...` (https 필수)
- ❌ 잘못된 형식: `https://.../` (끝에 슬래시 없음)

## 🔄 환경 변수 수정

### 기존 변수 수정
1. Environment Variables 목록에서 변수 찾기
2. 변수 옆 **"..."** 메뉴 클릭
3. **"Edit"** 선택
4. Value 수정
5. **"Save"** 클릭

### 변수 삭제
1. 변수 옆 **"..."** 메뉴 클릭
2. **"Delete"** 선택
3. 확인

## ✅ 확인 방법

환경 변수 추가 후:

1. **재배포 확인**
   - 환경 변수 변경 시 자동 재배포
   - Deployments 탭에서 확인

2. **브라우저에서 확인**
   - F12 → Console 탭
   - 다음 코드 실행:
   ```javascript
   console.log('API URL:', import.meta.env.VITE_API_URL);
   ```
   - Render URL이 표시되면 성공!

## 🆘 문제 해결

### 환경 변수가 적용되지 않는 경우
1. 재배포 완료 확인 (몇 분 소요)
2. 브라우저 캐시 삭제
3. 시크릿 모드에서 테스트

### 변수명이 올바른지 확인
- `VITE_API_URL`인지 확인
- 대소문자 구분 확인

## 📋 체크리스트

- [ ] Vercel 대시보드 접속
- [ ] 프로젝트 선택
- [ ] Settings → Environment Variables
- [ ] `VITE_API_URL` 추가/수정
- [ ] Render URL 입력
- [ ] Production 환경 선택
- [ ] Save 클릭
- [ ] 재배포 완료 대기
- [ ] 브라우저에서 확인

