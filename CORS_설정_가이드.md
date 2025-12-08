# CORS 설정 가이드

## 🚨 "Failed to fetch" 오류 해결

이 오류는 CORS(Cross-Origin Resource Sharing) 문제로 발생합니다.

## ✅ 해결 방법

### 백엔드 서버 환경 변수 설정

백엔드 서버(Railway, Render 등)에 다음 환경 변수를 추가해야 합니다:

**환경 변수:**
```
ALLOWED_ORIGINS=https://your-app.vercel.app,https://your-preview.vercel.app
```

**설정 방법:**

#### Railway
1. Railway 대시보드 → 프로젝트 선택
2. Variables 탭
3. `ALLOWED_ORIGINS` 추가
4. 값: Vercel 프론트엔드 URL (쉼표로 구분)
   - 예: `https://jisulee.vercel.app,https://jisulee-git-main.vercel.app`
5. 서비스 재시작

#### Render
1. Render 대시보드 → 서비스 선택
2. Environment 탭
3. `ALLOWED_ORIGINS` 추가
4. 값: Vercel 프론트엔드 URL (쉼표로 구분)
5. 서비스 재배포

## 📋 체크리스트

### 1. Vercel 프론트엔드 URL 확인
- Vercel 대시보드에서 배포된 URL 확인
- 예: `https://jisulee.vercel.app`

### 2. 백엔드 서버 환경 변수 설정
- [ ] `ALLOWED_ORIGINS` 환경 변수 추가
- [ ] Vercel 프론트엔드 URL 포함
- [ ] 여러 URL인 경우 쉼표로 구분
- [ ] 서비스 재시작/재배포

### 3. 확인
- [ ] 백엔드 서버 재시작 완료
- [ ] 브라우저에서 테스트
- [ ] 개발자 도구 → Network 탭에서 CORS 오류 확인

## 🔍 디버깅

### 브라우저 개발자 도구 확인

1. **Console 탭:**
   - CORS 관련 에러 메시지 확인
   - "Failed to fetch" 또는 "CORS policy" 메시지

2. **Network 탭:**
   - API 요청 클릭
   - Response Headers 확인
   - `Access-Control-Allow-Origin` 헤더 확인
   - 없으면 CORS 설정 문제

### 백엔드 서버 로그 확인

백엔드 서버 로그에서 다음 메시지 확인:
```
CORS: Blocked origin https://your-app.vercel.app. Allowed: ...
```

이 메시지가 보이면 `ALLOWED_ORIGINS`에 해당 URL이 포함되어 있는지 확인하세요.

## ⚠️ 중요 사항

### URL 형식
- ✅ 올바른 형식: `https://jisulee.vercel.app`
- ❌ 잘못된 형식: `jisulee.vercel.app` (프로토콜 없음)
- ❌ 잘못된 형식: `https://jisulee.vercel.app/` (끝에 슬래시)

### 여러 URL 설정
여러 프론트엔드 URL을 허용하려면 쉼표로 구분:
```
ALLOWED_ORIGINS=https://jisulee.vercel.app,https://jisulee-git-main.vercel.app,https://jisulee-git-feature.vercel.app
```

### 개발 환경
로컬 개발 환경(`NODE_ENV=development`)에서는 모든 origin이 자동으로 허용됩니다.

## 🆘 여전히 문제가 있는 경우

### 1. 환경 변수가 적용되지 않음
- 백엔드 서버를 재시작했는지 확인
- 환경 변수 이름이 정확한지 확인 (`ALLOWED_ORIGINS`)
- 대소문자 구분 확인

### 2. URL이 정확하지 않음
- Vercel 대시보드에서 정확한 URL 확인
- http vs https 확인
- 도메인 끝에 슬래시 없는지 확인

### 3. 캐시 문제
- 브라우저 캐시 삭제
- 시크릿 모드에서 테스트
- 서비스 재시작 후 다시 시도

