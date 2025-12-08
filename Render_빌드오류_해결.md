# Render 빌드 오류 해결

## 🚨 오류: `vite: not found`

### 문제
Render에서 빌드 시 `vite` 명령어를 찾을 수 없음

### 원인
- `vite`가 전역적으로 설치되지 않음
- `node_modules/.bin` 경로가 PATH에 없음

### 해결 방법

#### 방법 1: npx 사용 (적용됨)
`package.json`의 `build` 스크립트를 수정:
```json
"build": "npx vite build && npx esbuild ..."
```

#### 방법 2: Render 빌드 명령어 수정
Render 대시보드에서:
- Build Command: `npm install && npm run build`
- 또는: `npm ci && npm run build`

## ✅ 수정 완료

`package.json`이 수정되어 Git에 푸시되었습니다.

### 다음 단계

1. **Render에서 자동 재배포 대기**
   - Git 푸시 후 Render가 자동으로 재배포 시작
   - 또는 Render 대시보드에서 "Manual Deploy" 클릭

2. **배포 확인**
   - Deployments 탭에서 배포 진행 상황 확인
   - 빌드가 성공하는지 확인

## 🔍 추가 확인사항

### Render 빌드 설정 확인

Render 대시보드 → 서비스 → Settings에서:

**Build Command:**
```
npm run build
```

**Start Command:**
```
npm start
```

**Environment:**
```
Node
```

## 🆘 여전히 실패하는 경우

### 1. npm install 확인
Build Command를 다음으로 변경:
```
npm install && npm run build
```

### 2. Node 버전 확인
Render Settings → Environment에서:
- Node Version: `22.x` 또는 `20.x` 지정

### 3. 로그 확인
- Render 대시보드 → 서비스 → Logs
- 에러 메시지 확인

## 📋 체크리스트

- [ ] `package.json` 수정 완료 (npx 추가)
- [ ] Git 푸시 완료
- [ ] Render 자동 재배포 대기
- [ ] 빌드 성공 확인
- [ ] 서비스 실행 확인

