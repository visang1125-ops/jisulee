# CORS 오류 즉시 해결 방법

## 🚨 현재 문제

**에러 메시지:**
```
Access-Control-Allow-Origin header has a value 'https://railway.com' 
that is not equal to the supplied origin 'https://jisulee-a9r1pk91m-ljsses-projects.vercel.app'
```

**문제점:**
1. `VITE_API_URL`이 예시 URL(`https://your-backend.railway.app`)로 설정됨
2. 백엔드 서버가 Vercel 프론트엔드 URL을 허용하지 않음

## ✅ 해결 방법

### 1단계: Vercel 환경 변수 수정

**Vercel 대시보드 → Settings → Environment Variables**

1. `VITE_API_URL` 찾기
2. **값을 실제 백엔드 서버 URL로 변경**
   - 현재: `https://your-backend.railway.app` (예시)
   - 변경: 실제 백엔드 URL
     - **Render:** `https://jisulee-backend.onrender.com`
     - **Railway:** `https://jisulee-production.up.railway.app`

### 2단계: 백엔드 서버 CORS 설정

#### Render 사용 시:
**Render 대시보드 → 서비스 → Environment**

1. `ALLOWED_ORIGINS` 환경 변수 추가/수정
2. **값 설정:**
   ```
   https://jisulee-a9r1pk91m-ljsses-projects.vercel.app
   ```
   
   또는 여러 URL 허용 (쉼표로 구분):
   ```
   https://jisulee-a9r1pk91m-ljsses-projects.vercel.app,https://jisulee.vercel.app
   ```

3. **"Save Changes"** 클릭 (자동으로 재배포됨)

#### Railway 사용 시:
**Railway 대시보드 → 프로젝트 → Variables**

1. `ALLOWED_ORIGINS` 환경 변수 확인/추가
2. **값 설정:** (위와 동일)
3. **서비스 재시작** (Railway에서 자동으로 재시작됨)

### 3단계: 확인

1. Vercel 재배포 대기 (환경 변수 변경 후)
2. Railway 서비스 재시작 확인
3. 브라우저에서 테스트

## 📋 체크리스트

### Vercel 설정
- [ ] `VITE_API_URL`이 실제 백엔드 URL로 설정됨
- [ ] 예시 URL(`your-backend.railway.app`)이 아님
- [ ] 재배포 완료

### Railway 설정
- [ ] `ALLOWED_ORIGINS` 환경 변수 설정
- [ ] Vercel 프론트엔드 URL 포함
- [ ] 서비스 재시작 완료

## 🔍 실제 URL 확인 방법

### Vercel 프론트엔드 URL
- Vercel 대시보드 → Deployments → 최신 배포의 URL 확인
- 또는 브라우저 주소창의 URL

### Railway 백엔드 URL
- Railway 대시보드 → 프로젝트 → 서비스 → Settings → Domains
- 또는 배포된 서비스의 URL

## ⚠️ 중요 사항

1. **URL 형식:**
   - ✅ 올바른 형식: `https://jisulee-production.up.railway.app`
   - ❌ 잘못된 형식: `https://your-backend.railway.app` (예시)

2. **프로토콜:**
   - 반드시 `https://` 포함

3. **끝에 슬래시 없음:**
   - ✅ `https://example.com`
   - ❌ `https://example.com/`

## 🆘 빠른 확인

브라우저 콘솔에서:
```javascript
console.log('API URL:', import.meta.env.VITE_API_URL);
```

예시 URL이 나오면 Vercel 환경 변수를 수정해야 합니다.

