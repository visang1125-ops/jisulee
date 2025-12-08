# Render Build Command 설정

## ✅ Render Build Command

### 최종 설정

**Build Command:**
```
npm run build:render
```

## 📋 전체 설정

### Render 대시보드 → 서비스 → Settings

**Build & Deploy:**
- **Environment:** `Node`
- **Build Command:** `npm run build:render`
- **Start Command:** `npm start`

**Environment Variables:**
- `NODE_ENV`: `production`
- `ALLOWED_ORIGINS`: Vercel 프론트엔드 URL

## 🔍 build:render 스크립트 설명

`package.json`의 `build:render` 스크립트:
```json
"build:render": "npm install --include=dev && npm run build"
```

**동작:**
1. `npm install --include=dev`: devDependencies 포함하여 모든 패키지 설치
2. `npm run build`: 전체 빌드 실행
   - `build:client`: 프론트엔드 빌드
   - `build:server`: 백엔드 빌드

## ✅ 확인

Render 대시보드에서:
1. Settings → Build & Deploy
2. Build Command가 `npm run build:render`인지 확인
3. Save Changes
4. 재배포 확인

