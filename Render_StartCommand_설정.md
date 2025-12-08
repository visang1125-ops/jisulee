# Render Start Command 설정

## ✅ Render Start Command

### 최종 설정

**Start Command:**
```
npm start
```

## 📋 전체 설정

### Render 대시보드 → 서비스 → Settings

**Build & Deploy:**
- **Environment:** `Node`
- **Build Command:** `npm run build:render`
- **Start Command:** `npm start`

## 🔍 start 스크립트 설명

`package.json`의 `start` 스크립트:
```json
"start": "cross-env NODE_ENV=production node dist/index.js"
```

**동작:**
1. `NODE_ENV=production` 설정
2. `dist/index.js` 실행 (빌드된 서버 파일)

## ✅ 확인

Render 대시보드에서:
1. Settings → Build & Deploy
2. Start Command가 `npm start`인지 확인
3. Save Changes

## 📝 요약

**Render 설정:**
- Build Command: `npm run build:render`
- Start Command: `npm start`

