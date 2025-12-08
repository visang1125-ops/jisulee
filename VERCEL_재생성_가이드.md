# Vercel 프로젝트 재생성 가이드

## 🔄 재생성 전 백업할 정보

### 1. 환경 변수 (Environment Variables)
Vercel 대시보드에서 다음 환경 변수를 확인하고 기록하세요:

**필수 환경 변수:**
- `VITE_API_URL`: 백엔드 API URL (예: `https://jisulee.onrender.com/api`)
- `ALLOWED_ORIGINS`: CORS 허용 도메인 (선택사항)

**확인 방법:**
1. Vercel 대시보드 → 프로젝트 → Settings → Environment Variables
2. 모든 환경 변수 스크린샷 또는 복사

### 2. 도메인 설정
- 커스텀 도메인이 있다면 기록
- Vercel 자동 생성 도메인도 확인

### 3. Git 연동 정보
- GitHub 저장소 연결 확인
- 브랜치 설정 (보통 `main` 또는 `master`)

## 🗑️ 기존 프로젝트 삭제

### Vercel 대시보드에서:
1. **프로젝트 선택** → Settings
2. **General** 섹션 맨 아래로 스크롤
3. **Delete Project** 클릭
4. 확인 메시지 입력 후 삭제

## 🆕 새 프로젝트 생성

### 1. Vercel 대시보드에서:
1. **Add New...** → **Project** 클릭
2. GitHub 저장소 선택 (`visang1125-ops/jisulee`)
3. **Import** 클릭

### 2. 프로젝트 설정

#### Framework Preset
- **Vite** 선택 (또는 **Other**)

#### Root Directory
- 기본값 유지 (프로젝트 루트)

#### Build and Output Settings

**Build Command:**
```
npm run build:vercel
```

**Output Directory:**
```
dist/public
```

**Install Command:**
```
npm install --legacy-peer-deps
```

### 3. 환경 변수 설정

**Settings → Environment Variables**에서 추가:

#### Production 환경:
- **Key**: `VITE_API_URL`
- **Value**: `https://jisulee.onrender.com/api`
- **Environment**: Production, Preview, Development 모두 선택

#### 선택사항 (CORS 설정):
- **Key**: `ALLOWED_ORIGINS`
- **Value**: `https://jisulee.vercel.app,https://jisulee-git-main-*.vercel.app`
- **Environment**: Production만 선택

### 4. 배포

설정 완료 후:
1. **Deploy** 클릭
2. 빌드 로그 확인
3. 배포 완료 후 사이트 확인

## ✅ 배포 후 확인 사항

### 1. 빌드 로그 확인
- CSS 파일 생성 여부 확인
- 오류 없이 빌드 완료 확인

### 2. 사이트 동작 확인
- 브라우저 개발자 도구 → Network 탭
- CSS 파일 로드 확인 (200 OK)
- 레이아웃 정상 표시 확인

### 3. API 연결 확인
- 데이터 로딩 정상 작동 확인
- CORS 오류 없는지 확인

## 🔧 문제 해결

### CSS가 여전히 안 되는 경우:
1. **빌드 로그**에서 CSS 파일 생성 확인
2. **Network 탭**에서 CSS 파일 크기 확인 (0.1KB가 아닌 수십~수백 KB)
3. **Vercel 대시보드** → Deployments → 최신 배포 → Inspect에서 파일 목록 확인

### 빌드 실패하는 경우:
1. **빌드 로그** 확인
2. `package.json`의 `build:vercel` 스크립트 확인
3. `vercel.json` 설정 확인

## 📝 현재 프로젝트 설정 요약

### vercel.json
```json
{
  "version": 2,
  "buildCommand": "npm run build:vercel",
  "outputDirectory": "dist/public",
  "installCommand": "npm install --legacy-peer-deps",
  "framework": "vite"
}
```

### package.json
```json
{
  "scripts": {
    "build:vercel": "npm run build:client"
  }
}
```

## 🎯 재생성의 장점

1. **깨끗한 시작**: 기존 설정 문제 제거
2. **최신 설정 적용**: 현재 `vercel.json`과 빌드 스크립트 반영
3. **문제 해결**: 설정이 꼬인 경우 빠른 해결

## ⚠️ 주의사항

- 환경 변수는 반드시 백업 후 재설정
- 커스텀 도메인은 재연결 필요할 수 있음
- 기존 배포 히스토리는 삭제됨 (새로 시작)

