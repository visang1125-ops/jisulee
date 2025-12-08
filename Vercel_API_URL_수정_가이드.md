# Vercel API URL 수정 가이드

## ❌ 문제

현재 Vercel의 `VITE_API_URL`이 `https://jisulee.onrender.com`으로 설정되어 있어서, 프론트엔드에서 `/api/budget` 대신 `/budget`을 호출하고 있습니다.

## ✅ 해결 방법

### Vercel 대시보드에서 환경 변수 수정

1. **Vercel 대시보드** → 프로젝트 선택 → **Settings** → **Environment Variables**

2. **`VITE_API_URL`** 환경 변수를 찾아서 수정:
   - ❌ 현재: `https://jisulee.onrender.com`
   - ✅ 수정: `https://jisulee.onrender.com/api`

3. **Save** 클릭

4. **Redeploy** (자동으로 재배포되거나 수동으로 재배포)

## 📋 확인

수정 후:
- ✅ 프론트엔드에서 `https://jisulee.onrender.com/api/budget` 호출
- ✅ 서버의 `/api/budget` 엔드포인트와 일치

## 🔍 참고

- `API_BASE_URL`은 `VITE_API_URL || '/api'`로 설정되어 있습니다
- `VITE_API_URL`에 `/api`가 포함되어 있으면 그대로 사용
- `VITE_API_URL`이 없으면 `/api`를 기본값으로 사용

