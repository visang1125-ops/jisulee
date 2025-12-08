# Render 빌드 명령어 최종 수정

## 🚨 여전히 `vite: not found` 오류

Render가 이전 커밋을 사용하고 있습니다. Build Command에서 직접 `npx`를 사용하도록 수정하세요.

## ✅ 해결 방법

### Render 대시보드에서 Build Command 수정

1. **Render 대시보드 → 서비스 → Settings**
2. **Build & Deploy 섹션**
3. **Build Command를 다음으로 변경:**

```
npm ci && npx vite build && npx esbuild server/index-prod.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/index.js
```

**설명:**
- `npm ci`: 패키지 설치
- `npx vite build`: 프론트엔드 빌드
- `npx esbuild ...`: 서버 빌드

4. **"Save Changes" 클릭**
5. 자동 재배포 시작

## 🔄 대안: 더 간단한 방법

만약 위 명령어가 너무 길다면:

**Build Command:**
```
npm ci && npm run build
```

하지만 `package.json`의 `build` 스크립트가 `npx vite build`로 되어 있어야 합니다.

## 📋 확인사항

### package.json 확인
`package.json`의 `build` 스크립트가 다음과 같아야 합니다:
```json
"build": "npx vite build && npx esbuild server/index-prod.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/index.js"
```

### Git 커밋 확인
최신 커밋이 푸시되었는지 확인:
- 커밋 `31fac93` 또는 그 이후

## 🆘 수동 재배포

Render가 최신 커밋을 가져오지 않는 경우:

1. **Render 대시보드 → 서비스**
2. **"Manual Deploy" 클릭**
3. **"Deploy latest commit" 선택**
4. 재배포 시작

## ✅ 최종 체크리스트

- [ ] Render Build Command 수정 (위 명령어 사용)
- [ ] Save Changes
- [ ] 재배포 완료 대기
- [ ] 빌드 성공 확인
- [ ] 서비스 URL 확인

