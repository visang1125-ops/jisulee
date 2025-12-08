# CORS Vercel 도메인 해결

## ✅ 문제 해결

Vercel은 여러 URL을 사용합니다:
- 프로덕션: `https://jisulee-a9r1pk91m-ljsses-projects.vercel.app`
- 커스텀 도메인: `https://jisulee.vercel.app`
- 프리뷰 배포: `https://jisulee-{hash}-ljsses-projects.vercel.app`

## 🔧 수정 내용

`server/app.ts`의 CORS 로직을 수정하여:
- `.vercel.app` 도메인을 자동으로 허용
- 커스텀 도메인 `https://jisulee.vercel.app` 허용

## 📋 Render 환경 변수 설정

Render의 `ALLOWED_ORIGINS`는 여전히 설정할 수 있지만, 이제 Vercel 도메인은 자동으로 허용됩니다.

**Render → Environment Variables:**
- `ALLOWED_ORIGINS`: `https://jisulee-a9r1pk91m-ljsses-projects.vercel.app` (선택사항, Vercel 도메인은 자동 허용)

## ✅ 확인

이제 다음 URL들이 모두 작동합니다:
- ✅ `https://jisulee.vercel.app`
- ✅ `https://jisulee-*.vercel.app` (모든 프리뷰 배포)
- ✅ `ALLOWED_ORIGINS`에 명시된 도메인

