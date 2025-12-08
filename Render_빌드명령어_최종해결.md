# Render 빌드 오류 최종 해결

## 🚨 오류: `Cannot find package 'vite'`

### 문제
`vite` 패키지가 `devDependencies`에 있어서 `npm ci`가 설치하지 않음

### 해결 방법

## ✅ Build Command 수정

### Render 대시보드에서 수정

1. **Render 대시보드 → 서비스 → Settings**
2. **Build & Deploy 섹션**
3. **Build Command를 다음으로 변경:**

```
npm install && npx vite build && npx esbuild server/index-prod.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/index.js
```

**또는 devDependencies 포함:**

```
npm ci --include=dev && npx vite build && npx esbuild server/index-prod.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/index.js
```

4. **"Save Changes" 클릭**

## 📋 권장 Build Command

**가장 안정적인 방법:**

```
npm install && npm run build
```

하지만 `package.json`의 `build` 스크립트가 `npx vite build`로 되어 있어야 합니다.

## 🔍 문제 원인

- `vite`가 `devDependencies`에 있음
- `npm ci`는 기본적으로 프로덕션 모드로 실행
- `devDependencies`를 설치하지 않음

## ✅ 해결책

### 방법 1: npm install 사용 (권장)
```
npm install && npm run build
```

### 방법 2: npm ci에 --include=dev 추가
```
npm ci --include=dev && npm run build
```

### 방법 3: 전체 명령어 직접 입력
```
npm install && npx vite build && npx esbuild server/index-prod.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/index.js
```

## 🎯 최종 권장 설정

**Build Command:**
```
npm install && npm run build
```

**Start Command:**
```
npm start
```

이렇게 하면 `package.json`의 스크립트를 그대로 사용하므로 가장 안정적입니다.

## 📝 확인사항

### package.json 확인
`build` 스크립트가 다음과 같아야 합니다:
```json
"build": "npx vite build && npx esbuild server/index-prod.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/index.js"
```

### devDependencies 확인
`vite`가 `devDependencies`에 있는지 확인:
```json
"devDependencies": {
  "vite": "^5.4.20",
  ...
}
```

## 🆘 여전히 실패하는 경우

### 1. 캐시 삭제
Render 대시보드에서:
- Settings → "Clear build cache" (있는 경우)

### 2. 서비스 재생성
- 기존 서비스 삭제
- 새로 생성

### 3. 로그 확인
- Deployments → 최신 배포 → Logs
- 정확한 오류 메시지 확인

