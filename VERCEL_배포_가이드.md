# 🚀 Vercel 배포 가이드

## 📋 목차
1. [배포 전 준비사항](#배포-전-준비사항)
2. [백엔드 서버 배포](#백엔드-서버-배포)
3. [프론트엔드 Vercel 배포](#프론트엔드-vercel-배포)
4. [환경 변수 설정](#환경-변수-설정)
5. [배포 확인](#배포-확인)
6. [문제 해결](#문제-해결)

---

## 배포 전 준비사항

### ✅ 확인사항
- [ ] GitHub 저장소에 코드가 푸시되어 있음
- [ ] 로컬에서 `npm run build:client` 빌드가 성공함
- [ ] 백엔드 서버 배포 준비 완료 (Railway, Render 등)

---

## 백엔드 서버 배포

프론트엔드와 백엔드를 분리하여 배포합니다. 백엔드는 Railway 또는 Render에 배포하는 것을 권장합니다.

### 방법 1: Railway 배포 (권장)

#### 1단계: Railway 가입 및 프로젝트 생성
1. [Railway](https://railway.app) 접속 및 가입
2. "New Project" 클릭
3. "Deploy from GitHub repo" 선택
4. `visang1125-ops/jisulee` 저장소 선택

#### 2단계: 환경 변수 설정
Railway 대시보드 → Settings → Variables에서 추가:

| 변수명 | 값 | 설명 |
|--------|-----|------|
| `NODE_ENV` | `production` | 프로덕션 모드 |
| `ALLOWED_ORIGINS` | `https://your-app.vercel.app` | 허용할 프론트엔드 URL (나중에 설정) |

#### 3단계: 배포 설정
- **Root Directory:** (기본값 유지)
- **Build Command:** `npm run build`
- **Start Command:** `npm start`

#### 4단계: 배포 완료
- Railway가 자동으로 배포를 시작합니다
- 배포 완료 후 URL 확인 (예: `https://your-app.railway.app`)
- 이 URL을 복사해두세요 (프론트엔드 환경 변수에 사용)

### 방법 2: Render 배포

#### 1단계: Render 가입 및 서비스 생성
1. [Render](https://render.com) 접속 및 가입
2. "New +" → "Web Service" 선택
3. GitHub 저장소 연결: `visang1125-ops/jisulee`

#### 2단계: 서비스 설정
- **Name:** `jisulee-backend` (원하는 이름)
- **Environment:** `Node`
- **Build Command:** `npm run build`
- **Start Command:** `npm start`
- **Plan:** Free 또는 Paid

#### 3단계: 환경 변수 설정
Render 대시보드 → Environment에서 추가:
- `NODE_ENV=production`
- `ALLOWED_ORIGINS=https://your-app.vercel.app` (나중에 설정)

#### 4단계: 배포
- "Create Web Service" 클릭
- 배포 완료 후 URL 확인

---

## 프론트엔드 Vercel 배포

### 방법 1: Vercel 대시보드 사용 (권장)

#### 1단계: 프로젝트 가져오기
1. [Vercel](https://vercel.com) 접속 및 로그인
2. "Add New..." → "Project" 클릭
3. GitHub 저장소 선택: `visang1125-ops/jisulee`

#### 2단계: 프로젝트 설정

**Framework Preset:**
- `Vite` 선택 (자동 감지됨)
- 또는 `Other` 선택 후 수동 설정

**Build and Output Settings:**

| 항목 | 값 |
|------|-----|
| **Root Directory** | `.` (기본값) |
| **Build Command** | `npm run build:client` |
| **Output Directory** | `dist/public` |
| **Install Command** | `npm install` |

**⚠️ 중요:** 
- Build Command는 반드시 `npm run build:client`로 설정
- Output Directory는 `dist/public`로 설정

#### 3단계: 환경 변수 설정

**Environment Variables** 섹션에서 추가:

| Name | Value | 설명 |
|------|-------|------|
| `VITE_API_URL` | `https://your-backend.railway.app` | 백엔드 서버 URL (Railway/Render에서 받은 URL) |
| `NODE_ENV` | `production` | 프로덕션 모드 |

**⚠️ 중요:**
- `VITE_API_URL`은 백엔드 서버의 실제 URL로 설정해야 합니다
- 예: `https://jisulee-production.up.railway.app`

#### 4단계: 배포
1. "Deploy" 버튼 클릭
2. 배포 진행 상황 확인
3. 배포 완료 후 URL 확인 (예: `https://jisulee.vercel.app`)

#### 5단계: 백엔드 CORS 설정 업데이트
프론트엔드 URL을 받은 후, 백엔드 서버의 환경 변수를 업데이트:

**Railway:**
- `ALLOWED_ORIGINS`에 Vercel URL 추가: `https://jisulee.vercel.app`

**Render:**
- `ALLOWED_ORIGINS`에 Vercel URL 추가: `https://jisulee.vercel.app`

### 방법 2: Vercel CLI 사용

#### 1단계: Vercel CLI 설치
```bash
npm i -g vercel
```

#### 2단계: 로그인
```bash
vercel login
```

#### 3단계: 프로젝트 연결
```bash
cd C:\budget-settlement-system
vercel
```

#### 4단계: 환경 변수 설정
```bash
vercel env add VITE_API_URL
# 프롬프트에 백엔드 URL 입력
```

#### 5단계: 프로덕션 배포
```bash
vercel --prod
```

---

## 환경 변수 설정

### 프론트엔드 (Vercel)

| 변수명 | 값 예시 | 설명 |
|--------|---------|------|
| `VITE_API_URL` | `https://jisulee-production.up.railway.app` | 백엔드 서버 URL |
| `NODE_ENV` | `production` | 프로덕션 모드 |

### 백엔드 (Railway/Render)

| 변수명 | 값 예시 | 설명 |
|--------|---------|------|
| `NODE_ENV` | `production` | 프로덕션 모드 |
| `ALLOWED_ORIGINS` | `https://jisulee.vercel.app` | 허용할 프론트엔드 URL (쉼표로 구분) |

---

## 배포 확인

### 1. 프론트엔드 확인
1. Vercel에서 제공하는 URL로 접속 (예: `https://jisulee.vercel.app`)
2. 브라우저 개발자 도구(F12) → Network 탭 확인
3. API 호출이 정상적으로 이루어지는지 확인

### 2. 백엔드 확인
1. 백엔드 서버 URL + `/health` 접속
   - 예: `https://your-backend.railway.app/health`
2. `{"status":"ok"}` 응답 확인

### 3. 통합 테스트
1. 프론트엔드에서 데이터 로드 확인
2. 필터링 기능 테스트
3. 데이터 추가/수정 기능 테스트

---

## 문제 해결

### ❌ 빌드 오류: "vite: command not found"
**해결:**
- `vercel.json`의 `buildCommand`가 `npm run build:client`인지 확인
- `package.json`에 `build:client` 스크립트가 있는지 확인

### ❌ CORS 오류
**증상:** 브라우저 콘솔에 CORS 관련 오류
**해결:**
1. 백엔드 서버의 `ALLOWED_ORIGINS` 환경 변수 확인
2. 프론트엔드 URL이 포함되어 있는지 확인
3. 백엔드 서버 재시작

### ❌ API 404 오류
**증상:** API 호출 시 404 에러
**해결:**
1. `VITE_API_URL` 환경 변수가 올바른지 확인
2. 백엔드 서버가 정상 실행 중인지 확인
3. 백엔드 URL + `/health` 엔드포인트로 확인

### ❌ 빌드 실패
**해결:**
1. 로컬에서 `npm run build:client` 실행하여 오류 확인
2. Vercel 빌드 로그 확인
3. `package.json`의 의존성 확인

### ❌ 정적 파일 로드 실패
**해결:**
1. `vercel.json`의 `outputDirectory`가 `dist/public`인지 확인
2. 빌드 후 `dist/public` 폴더에 파일이 생성되는지 확인

---

## 📝 체크리스트

### 배포 전
- [ ] 로컬에서 `npm run build:client` 빌드 성공
- [ ] GitHub에 최신 코드 푸시 완료
- [ ] 백엔드 서버 배포 완료 및 URL 확인

### Vercel 배포
- [ ] Framework Preset: `Vite` 또는 `Other` 선택
- [ ] Build Command: `npm run build:client`
- [ ] Output Directory: `dist/public`
- [ ] 환경 변수 `VITE_API_URL` 설정
- [ ] 배포 성공 확인

### 배포 후
- [ ] 프론트엔드 URL 접속 확인
- [ ] 백엔드 CORS 설정 업데이트
- [ ] API 호출 정상 작동 확인
- [ ] 주요 기능 테스트 완료

---

## 🔗 유용한 링크

- [Vercel 공식 문서](https://vercel.com/docs)
- [Railway 공식 문서](https://docs.railway.app)
- [Render 공식 문서](https://render.com/docs)
- [Vite 배포 가이드](https://vitejs.dev/guide/static-deploy.html)

---

## 💡 팁

1. **자동 배포:** GitHub에 푸시하면 Vercel이 자동으로 재배포합니다
2. **프리뷰 배포:** Pull Request 생성 시 자동으로 프리뷰 배포가 생성됩니다
3. **환경 변수:** 프로덕션과 개발 환경을 분리하여 관리할 수 있습니다
4. **도메인 연결:** Vercel에서 커스텀 도메인을 연결할 수 있습니다

---

## 📞 지원

문제가 발생하면:
1. Vercel 빌드 로그 확인
2. 브라우저 개발자 도구 콘솔 확인
3. 백엔드 서버 로그 확인
4. GitHub Issues에 문제 보고

