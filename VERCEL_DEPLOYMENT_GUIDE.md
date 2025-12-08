# Vercel 배포 가이드

## 📋 Vercel 대시보드 설정

### 1. 프로젝트 가져오기
1. [Vercel](https://vercel.com)에 로그인
2. "Add New..." → "Project" 클릭
3. GitHub 저장소 선택: `visang1125-ops/jisulee`

### 2. 프로젝트 설정

#### Framework Preset
**"Vite"** 또는 **"Other"** 선택

- ✅ **권장: "Vite"** - Vite 프로젝트로 자동 감지
- 또는 **"Other"** - 수동 설정

#### Build and Output Settings

**Root Directory:** (기본값 유지)
```
.
```

**Build Command:**
```
npm run build
```

**Output Directory:**
```
dist/public
```

**Install Command:**
```
npm install
```

### 3. 환경 변수 설정

**Environment Variables** 섹션에서 추가:

| Name | Value | 설명 |
|------|-------|------|
| `VITE_API_URL` | `https://your-backend.railway.app` | 백엔드 서버 URL |
| `NODE_ENV` | `production` | 프로덕션 모드 |

### 4. 배포

"Deploy" 버튼 클릭하면 자동으로 배포가 시작됩니다.

## 🔍 배포 확인

배포 완료 후:
1. Vercel이 제공하는 URL 확인 (예: `https://jisulee.vercel.app`)
2. 브라우저에서 접속하여 정상 작동 확인
3. 백엔드 API 연결 확인

## ⚠️ 주의사항

1. **백엔드 서버 필요**: 프론트엔드만 배포되므로 별도로 백엔드 서버가 필요합니다.
2. **환경 변수**: `VITE_API_URL`을 반드시 설정해야 API 호출이 정상 작동합니다.
3. **CORS**: 백엔드 서버에서 CORS 설정이 필요합니다.

## 🚀 빠른 배포 (CLI)

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

