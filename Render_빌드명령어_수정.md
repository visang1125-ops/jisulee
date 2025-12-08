# Render 빌드 명령어 수정 방법

## 🚨 여전히 `vite: not found` 오류가 발생하는 경우

### 해결 방법: Render 대시보드에서 빌드 명령어 직접 수정

Render가 최신 커밋을 가져오지 않았거나 캐시 문제일 수 있습니다.

## ✅ 즉시 해결 방법

### Render 대시보드에서 수정

1. **Render 대시보드 접속**
   - [https://dashboard.render.com](https://dashboard.render.com)

2. **서비스 선택**
   - 배포 중인 서비스 클릭

3. **Settings 탭 클릭**
   - 상단 메뉴에서 "Settings" 선택

4. **Build & Deploy 섹션**
   - "Build Command" 찾기

5. **Build Command 수정**
   - 현재: `npm run build`
   - 변경: `npm install && npx vite build && npx esbuild server/index-prod.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/index.js`

   또는 더 간단하게:
   ```
   npm ci && npm run build
   ```

6. **"Save Changes" 클릭**
   - 자동으로 재배포 시작됨

## 🔄 대안: Start Command 확인

**Start Command**도 확인:
```
npm start
```

이미 올바르게 설정되어 있어야 합니다.

## 📋 체크리스트

- [ ] Render 대시보드 접속
- [ ] 서비스 선택
- [ ] Settings → Build & Deploy
- [ ] Build Command 수정
- [ ] Save Changes
- [ ] 재배포 완료 대기
- [ ] 빌드 성공 확인

## 🆘 여전히 실패하는 경우

### 방법 1: npm install 명시적 추가
Build Command:
```
npm install && npm run build
```

### 방법 2: npm ci 사용 (권장)
Build Command:
```
npm ci && npm run build
```

### 방법 3: 전체 명령어 직접 입력
Build Command:
```
npm install && npx vite build && npx esbuild server/index-prod.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/index.js
```

## 💡 팁

### npm ci vs npm install
- `npm ci`: 더 빠르고 안정적 (package-lock.json 사용)
- `npm install`: 일반적인 설치

### 캐시 문제
- Render 대시보드 → 서비스 → Settings
- "Clear build cache" 옵션 확인
- 또는 서비스 삭제 후 재생성

## ✅ 확인

빌드가 성공하면:
- Deployments 탭에서 "Live" 상태 확인
- 서비스 URL 확인
- `/health` 엔드포인트 테스트

