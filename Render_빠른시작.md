# Render 빠른 시작 가이드

## 🚀 5분 안에 배포하기

### Step 1: Render 접속 및 가입 (1분)
1. [https://render.com](https://render.com) 접속
2. "Get Started for Free" 클릭
3. "Continue with GitHub" 클릭
4. GitHub 계정으로 로그인

### Step 2: Web Service 생성 (2분)
1. 대시보드에서 **"New +"** 버튼 클릭
2. **"Web Service"** 선택
3. **"Connect GitHub"** 또는 **"Connect account"** 클릭
4. 저장소 선택: `visang1125-ops/jisulee`
5. **"Connect"** 클릭

### Step 3: 설정 입력 (1분)

**기본 정보:**
- **Name:** `jisulee-backend` (아무 이름이나 가능)
- **Region:** `Singapore` 또는 가장 가까운 지역
- **Branch:** `main`

**빌드 설정:**
- **Environment:** `Node` 선택
- **Build Command:** 
  ```
  npm run build
  ```
- **Start Command:**
  ```
  npm start
  ```

**플랜:**
- **Free** 선택

### Step 4: 환경 변수 추가 (30초)

**Environment Variables** 섹션에서:

1. **"Add Environment Variable"** 클릭
2. 첫 번째 변수:
   - Key: `NODE_ENV`
   - Value: `production`
3. **"Add Environment Variable"** 다시 클릭
4. 두 번째 변수:
   - Key: `ALLOWED_ORIGINS`
   - Value: `https://jisulee-a9r1pk91m-ljsses-projects.vercel.app`
   (나중에 수정 가능)

### Step 5: 배포 시작 (30초)
1. **"Create Web Service"** 클릭
2. 배포 시작됨!

### Step 6: URL 확인 (1분 대기)

배포가 완료되면 (2-5분 소요):
1. 대시보드에서 서비스 클릭
2. 상단에 **URL 표시됨**
   - 예: `https://jisulee-backend.onrender.com`
3. URL 복사!

### Step 7: 테스트

브라우저에서:
```
https://your-url.onrender.com/health
```

`{"status":"ok"}` 응답이면 성공! ✅

## 📋 다음 단계

### 1. Vercel 환경 변수 설정

1. Vercel 대시보드 → 프로젝트 → Settings
2. **Environment Variables**
3. `VITE_API_URL` 추가/수정:
   ```
   https://jisulee-backend.onrender.com
   ```
   (위에서 복사한 Render URL)
4. **Save** 클릭
5. 자동 재배포 대기

### 2. Render CORS 업데이트 (선택)

Vercel 프론트엔드 URL이 다르면:
1. Render 대시보드 → 서비스 → Environment
2. `ALLOWED_ORIGINS` 수정
3. **Save Changes**

## ⚠️ 주의사항

### Render 무료 플랜
- 15분 동안 요청이 없으면 **sleep** 상태
- 첫 요청 시 **30초~1분** 정도 깨어나는 시간 소요
- 정상 동작입니다!

### 배포 시간
- 첫 배포: **2-5분**
- 재배포: **1-3분**

## 🆘 문제 해결

### 배포 실패
- **Logs** 탭에서 에러 확인
- Build Command가 `npm run build`인지 확인
- Start Command가 `npm start`인지 확인

### URL이 안 보임
- 배포가 완료될 때까지 대기
- "Live" 상태인지 확인

## ✅ 완료 체크리스트

- [ ] Render 가입 완료
- [ ] Web Service 생성
- [ ] 배포 완료
- [ ] URL 확인
- [ ] `/health` 테스트 성공
- [ ] Vercel `VITE_API_URL` 설정
- [ ] Vercel 재배포 완료
- [ ] 브라우저에서 테스트

## 💡 팁

- Render URL은 `https://[서비스명].onrender.com` 형식
- 첫 요청이 느리면 sleep 상태였던 것 (정상)
- 환경 변수는 나중에 언제든 수정 가능

