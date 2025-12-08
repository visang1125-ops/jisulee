# API 오류 해결 가이드

## "Unexpected token '<', "<!DOCTYPE "... is not valid JSON" 오류

이 오류는 API 호출이 JSON 대신 HTML을 반환할 때 발생합니다.

### 원인

1. **백엔드 서버가 실행되지 않음**
   - 로컬 개발: `npm run dev`로 서버가 실행 중인지 확인
   - 프로덕션: 백엔드 서버(Railway/Render)가 실행 중인지 확인

2. **API URL이 잘못 설정됨**
   - `VITE_API_URL` 환경 변수가 올바르지 않음
   - 상대 경로(`/api`)를 사용하는데 백엔드 서버가 없음

3. **CORS 문제**
   - 백엔드 서버의 CORS 설정이 잘못됨
   - 프론트엔드 URL이 허용되지 않음

### 해결 방법

#### 1. 로컬 개발 환경

**백엔드 서버 실행 확인:**
```bash
# 서버가 실행 중인지 확인
netstat -ano | findstr :5000

# 서버 실행
npm run dev
```

**API URL 확인:**
- 브라우저 개발자 도구 → Network 탭
- API 호출 URL 확인
- `http://localhost:5000/api/budget` 형태여야 함

#### 2. Vercel 배포 환경

**환경 변수 확인:**
1. Vercel 대시보드 → Project Settings → Environment Variables
2. `VITE_API_URL`이 백엔드 서버 URL로 설정되어 있는지 확인
   - 예: `https://your-backend.railway.app`
   - ❌ 잘못된 예: `/api` (상대 경로)

**백엔드 서버 확인:**
1. 백엔드 서버 URL + `/health` 접속
   - 예: `https://your-backend.railway.app/health`
2. `{"status":"ok"}` 응답 확인

**CORS 설정 확인:**
1. 백엔드 서버 환경 변수에서 `ALLOWED_ORIGINS` 확인
2. Vercel 프론트엔드 URL이 포함되어 있는지 확인
   - 예: `https://your-app.vercel.app`

### 디버깅 방법

#### 브라우저 개발자 도구

1. **Network 탭 확인:**
   - API 호출 URL 확인
   - 응답 상태 코드 확인
   - 응답 내용 확인 (HTML인지 JSON인지)

2. **Console 탭 확인:**
   - 에러 메시지 확인
   - API URL 확인

#### API URL 확인 코드

브라우저 콘솔에서 실행:
```javascript
console.log('API_BASE_URL:', import.meta.env.VITE_API_URL || '/api');
```

### 예상되는 시나리오

#### 시나리오 1: 로컬 개발
- **문제:** 백엔드 서버가 실행되지 않음
- **해결:** `npm run dev` 실행

#### 시나리오 2: Vercel 배포
- **문제:** `VITE_API_URL`이 설정되지 않음
- **해결:** Vercel 환경 변수에 `VITE_API_URL` 추가

#### 시나리오 3: CORS 오류
- **문제:** 백엔드 서버가 프론트엔드 URL을 허용하지 않음
- **해결:** 백엔드 `ALLOWED_ORIGINS`에 Vercel URL 추가

### 체크리스트

- [ ] 백엔드 서버가 실행 중인가?
- [ ] `VITE_API_URL` 환경 변수가 올바르게 설정되었는가?
- [ ] API URL이 올바른가? (브라우저 Network 탭 확인)
- [ ] CORS 설정이 올바른가?
- [ ] 백엔드 서버가 정상 응답하는가? (`/health` 엔드포인트 확인)

