# 배포 가이드 (Render + Vercel)

## 🚀 배포 아키텍처

```
┌─────────────┐         ┌──────────────┐
│   Vercel    │  ────>  │    Render    │
│ (Frontend)  │  API    │  (Backend)   │
│             │         │              │
└─────────────┘         └──────────────┘
```

## 📋 배포 설정

### Vercel (프론트엔드)

**Build Command:**
```
npm run build:vercel
```

**Output Directory:**
```
dist/public
```

**Environment Variables:**
- `VITE_API_URL`: Render 백엔드 URL (예: `https://jisulee-backend.onrender.com`)

### Render (백엔드)

**Build Command:**
```
npm run build:render
```

**Start Command:**
```
npm start
```

**Environment Variables:**
- `NODE_ENV`: `production`
- `ALLOWED_ORIGINS`: Vercel 프론트엔드 URL

## 🔧 빌드 스크립트 설명

### `build:vercel`
- Vercel 전용 빌드 (프론트엔드만)
- `vite build` 실행

### `build:render`
- Render 전용 빌드 (프론트엔드 + 백엔드)
- `npm install` 후 전체 빌드

### `build`
- 전체 빌드 (로컬 개발용)
- `build:client` + `build:server`

## ✅ 배포 체크리스트

### Render 백엔드
- [ ] Render 서비스 생성
- [ ] Build Command: `npm run build:render`
- [ ] Start Command: `npm start`
- [ ] 환경 변수 설정
- [ ] 배포 완료 및 URL 확인

### Vercel 프론트엔드
- [ ] Vercel 프로젝트 생성
- [ ] Build Command: `npm run build:vercel`
- [ ] Output Directory: `dist/public`
- [ ] 환경 변수 `VITE_API_URL` 설정
- [ ] 배포 완료

### 연결 확인
- [ ] Render URL + `/health` 테스트
- [ ] Vercel에서 API 호출 테스트
- [ ] CORS 설정 확인

