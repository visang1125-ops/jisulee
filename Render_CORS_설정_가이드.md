# Render CORS 설정 가이드

## ✅ 중요: Vercel의 ALLOWED_ORIGINS는 수정 불필요

**Vercel의 `ALLOWED_ORIGINS` 환경 변수는 수정할 필요가 없습니다.**
- `ALLOWED_ORIGINS`는 **백엔드(Render)**에서 사용하는 변수입니다
- Vercel은 프론트엔드이므로 이 변수는 사용되지 않습니다

## 🔧 Render 백엔드 설정

### Render 대시보드 → Environment Variables

**설정할 환경 변수:**

1. **`NODE_ENV`**: `production`
2. **`ALLOWED_ORIGINS`**: (선택사항)
   - 설정하지 않으면 Vercel 도메인은 자동으로 허용됩니다
   - 또는 명시적으로 설정: `https://jisulee.vercel.app,https://jisulee-a9r1pk91m-ljsses-projects.vercel.app`

## ✅ 자동 허용되는 도메인

코드에서 자동으로 허용되는 도메인:
- ✅ `*.vercel.app` (모든 Vercel 도메인)
- ✅ `https://jisulee.vercel.app` (커스텀 도메인)

## 🔍 문제 해결

**"No 'Access-Control-Allow-Origin' header is present" 오류가 발생하는 경우:**

1. **Render 서버가 최신 코드로 배포되었는지 확인**
   - Git에 푸시된 최신 코드가 Render에 배포되었는지 확인
   - Render 대시보드에서 "Manual Deploy" → "Deploy latest commit" 클릭

2. **Render 환경 변수 확인**
   - `NODE_ENV`가 `production`으로 설정되어 있는지 확인
   - `ALLOWED_ORIGINS`는 설정하지 않아도 됩니다 (Vercel 도메인은 자동 허용)

3. **브라우저 캐시 클리어**
   - 브라우저 개발자 도구 → Network 탭 → "Disable cache" 체크
   - 또는 시크릿 모드에서 테스트

## 📋 요약

- ✅ Vercel의 `ALLOWED_ORIGINS`는 수정 불필요
- ✅ Render의 `ALLOWED_ORIGINS`는 선택사항 (Vercel 도메인은 자동 허용)
- ✅ Render 서버가 최신 코드로 배포되었는지 확인

