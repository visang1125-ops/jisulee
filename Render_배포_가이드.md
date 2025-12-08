# Render 백엔드 배포 가이드

## 🚀 Render에 백엔드 배포하기

### 1단계: Render 가입 및 로그인

1. [https://render.com](https://render.com) 접속
2. "Get Started for Free" 클릭
3. GitHub로 로그인 (권장)

### 2단계: 새 Web Service 생성

1. Render 대시보드에서 **"New +"** 클릭
2. **"Web Service"** 선택
3. **"Connect account"** 또는 **"Connect GitHub"** 클릭
4. GitHub 저장소 선택: `visang1125-ops/jisulee`
5. **"Connect"** 클릭

### 3단계: 서비스 설정

다음 정보를 입력:

**Basic Settings:**
- **Name:** `jisulee-backend` (원하는 이름)
- **Region:** `Singapore` 또는 가장 가까운 지역
- **Branch:** `main`
- **Root Directory:** (비워두기 - 기본값)

**Build & Deploy:**
- **Environment:** `Node`
- **Build Command:** `npm run build`
- **Start Command:** `npm start`

**Plan:**
- **Free** 선택 (무료 플랜)

### 4단계: 환경 변수 설정

**Environment Variables** 섹션에서 추가:

| Key | Value | 설명 |
|-----|-------|------|
| `NODE_ENV` | `production` | 프로덕션 모드 |
| `ALLOWED_ORIGINS` | `https://jisulee-a9r1pk91m-ljsses-projects.vercel.app` | Vercel 프론트엔드 URL (나중에 추가) |

### 5단계: 배포 시작

1. **"Create Web Service"** 클릭
2. Render가 자동으로 배포 시작
3. 배포 진행 상황 확인 (2-5분 소요)

### 6단계: URL 확인

배포 완료 후:

1. 대시보드에서 서비스 클릭
2. 상단에 **URL 표시**
   - 예: `https://jisulee-backend.onrender.com`
   - 예: `https://jisulee-backend-xxx.onrender.com`

### 7단계: URL 테스트

브라우저에서 테스트:
```
https://your-render-url.onrender.com/health
```

응답이 `{"status":"ok"}`이면 성공!

## 📋 체크리스트

- [ ] Render 가입 완료
- [ ] GitHub 저장소 연결
- [ ] Web Service 생성
- [ ] Build Command: `npm run build`
- [ ] Start Command: `npm start`
- [ ] 환경 변수 설정 (`NODE_ENV=production`)
- [ ] 배포 완료
- [ ] URL 확인
- [ ] `/health` 엔드포인트 테스트 성공

## 🔧 문제 해결

### 배포가 실패하는 경우

1. **Build Command 확인**
   - `npm run build`가 올바른지 확인
   - 로컬에서 테스트: `npm run build`

2. **Start Command 확인**
   - `npm start`가 올바른지 확인
   - `package.json`에 `start` 스크립트가 있는지 확인

3. **로그 확인**
   - 서비스 → "Logs" 탭 확인
   - 에러 메시지 확인

### 서비스가 Sleep 상태인 경우

Render 무료 플랜은 15분 동안 요청이 없으면 sleep 상태가 됩니다.

**해결 방법:**
1. 첫 요청 시 깨어나는데 30초~1분 소요
2. 또는 유료 플랜 사용 ($7/월)

### URL이 보이지 않는 경우

1. **배포 완료 확인**
   - 대시보드에서 "Live" 상태 확인

2. **서비스 상태 확인**
   - 서비스가 "Running" 상태인지 확인

## 💡 Render 무료 플랜 특징

### 장점
- ✅ 완전 무료
- ✅ 간단한 설정
- ✅ 자동 배포

### 제한사항
- ⚠️ 15분 비활성 시 sleep (첫 요청 시 깨어남)
- ⚠️ 깨어나는 데 30초~1분 소요
- ⚠️ 소규모 프로젝트에 적합

## 🎯 다음 단계

Render URL을 찾았다면:

1. **Vercel 환경 변수 설정**
   - `VITE_API_URL` = Render URL
   - 예: `https://jisulee-backend.onrender.com`

2. **Render CORS 설정**
   - `ALLOWED_ORIGINS` = Vercel 프론트엔드 URL
   - 예: `https://jisulee-a9r1pk91m-ljsses-projects.vercel.app`

3. **테스트**
   - 브라우저에서 애플리케이션 테스트
   - 첫 요청 시 sleep 상태라면 30초~1분 대기

## 🔄 환경 변수 업데이트

### Render에서 CORS 설정 업데이트

1. Render 대시보드 → 서비스 선택
2. **"Environment"** 탭
3. `ALLOWED_ORIGINS` 수정:
   ```
   https://jisulee-a9r1pk91m-ljsses-projects.vercel.app
   ```
4. **"Save Changes"** 클릭
5. 자동으로 재배포됨

### Vercel에서 API URL 설정

1. Vercel 대시보드 → 프로젝트 → Settings
2. **Environment Variables**
3. `VITE_API_URL` 추가/수정:
   ```
   https://jisulee-backend.onrender.com
   ```
4. **Save** 후 재배포

## 📝 참고사항

### Render URL 형식
- `https://[서비스명].onrender.com`
- 예: `https://jisulee-backend.onrender.com`

### Sleep 상태 대응
- 첫 요청 시 자동으로 깨어남
- 또는 유료 플랜 사용 ($7/월) - 항상 실행

### 배포 시간
- 첫 배포: 2-5분
- 재배포: 1-3분

