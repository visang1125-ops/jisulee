# Vercel 배포 설정 가이드

## 📋 배포 전략

**프론트엔드만 Vercel에 배포**하는 방식으로 설정했습니다.

### 아키텍처
```
┌─────────────┐         ┌──────────────┐
│   Vercel    │  ────>  │  Backend     │
│ (Frontend)  │  API    │  (Railway/   │
│             │         │   Render)    │
└─────────────┘         └──────────────┘
```

## 🚀 배포 단계

### 1. 백엔드 서버 배포 (Railway 또는 Render 권장)

#### Railway 배포:
1. [Railway](https://railway.app)에 가입
2. GitHub 저장소 연결
3. 새 프로젝트 생성
4. 환경 변수 설정:
   - `NODE_ENV=production`
   - `PORT=5000` (자동 설정됨)
5. 배포 완료 후 URL 확인 (예: `https://your-app.railway.app`)

#### Render 배포:
1. [Render](https://render.com)에 가입
2. GitHub 저장소 연결
3. Web Service 생성
4. 빌드 명령: `npm run build`
5. 시작 명령: `npm start`
6. 환경 변수 설정

### 2. 프론트엔드 Vercel 배포

#### 방법 A: Vercel CLI
```bash
# Vercel CLI 설치
npm i -g vercel

# 로그인
vercel login

# 배포
vercel

# 프로덕션 배포
vercel --prod
```

#### 방법 B: GitHub 연동
1. [Vercel](https://vercel.com)에 가입
2. GitHub 저장소 연결
3. 프로젝트 설정:
   - Framework Preset: Other
   - Build Command: `npm run build`
   - Output Directory: `dist/public`
   - Install Command: `npm install`
4. 환경 변수 설정:
   - `VITE_API_URL`: 백엔드 서버 URL (예: `https://your-app.railway.app`)

### 3. API URL 설정

프론트엔드에서 백엔드 API를 호출할 때 환경 변수를 사용하도록 설정:

```typescript
// client/src/lib/constants-api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
```

## ⚙️ 환경 변수 설정

### Vercel (프론트엔드)
- `VITE_API_URL`: 백엔드 서버 URL

### 백엔드 서버
- `NODE_ENV`: `production`
- `PORT`: 서버 포트 (자동 설정됨)

## 📝 API URL 동적 설정

프로덕션에서는 환경 변수로 API URL을 설정하고,
개발 환경에서는 상대 경로(`/api`)를 사용합니다.

## ✅ 배포 확인

1. Vercel 배포 후 프론트엔드 URL 확인
2. 백엔드 서버 URL 확인
3. 브라우저에서 API 호출이 정상 작동하는지 확인

## 🔧 문제 해결

### CORS 오류
- 백엔드 서버에서 CORS 설정 확인
- `server/app.ts`에 CORS 미들웨어 추가 필요

### API 404 오류
- `VITE_API_URL` 환경 변수 확인
- 백엔드 서버가 정상 실행 중인지 확인

### 빌드 실패
- 로컬에서 `npm run build` 테스트
- 빌드 로그 확인

