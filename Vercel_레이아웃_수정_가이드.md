# Vercel 레이아웃 문제 해결 가이드

## ✅ 문제 해결

**문제:** 레이아웃이 깨지는 원인은 정적 파일(CSS, JS)이 제대로 로드되지 않았기 때문입니다.

## 🔧 수정 내용

`vercel.json`에 정적 파일 캐싱 설정을 추가했습니다.

## 📋 확인 사항

### 1. Vercel 재배포 확인
- Git 푸시 후 Vercel이 자동으로 재배포합니다
- Vercel 대시보드에서 배포 상태 확인

### 2. 브라우저 캐시 클리어
- 개발자 도구 (F12) → Network 탭 → "Disable cache" 체크
- 또는 시크릿 모드에서 테스트
- 또는 하드 리프레시 (Ctrl+Shift+R 또는 Cmd+Shift+R)

### 3. 정적 파일 로드 확인
- 개발자 도구 → Network 탭에서 다음 파일들이 로드되는지 확인:
  - `/assets/index-[hash].js`
  - `/assets/index-[hash].css`
  - 기타 assets 파일들

### 4. 콘솔 오류 확인
- 개발자 도구 → Console 탭에서 오류 메시지 확인
- 404 오류가 있는지 확인 (특히 CSS/JS 파일)

## 🔍 추가 문제 해결

만약 여전히 레이아웃이 깨진다면:

1. **Vercel 대시보드에서 수동 재배포**
   - Deployments → 최신 배포 → "Redeploy" 클릭

2. **빌드 로그 확인**
   - Vercel 대시보드 → Deployments → 빌드 로그 확인
   - CSS 파일이 제대로 생성되었는지 확인

3. **환경 변수 확인**
   - Settings → Environment Variables
   - `VITE_API_URL`이 올바르게 설정되어 있는지 확인

