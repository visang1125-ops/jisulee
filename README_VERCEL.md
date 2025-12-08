# Vercel 배포 가이드

## 배포 전 준비사항

1. **환경 변수 설정**
   - Vercel 대시보드에서 환경 변수를 설정해야 합니다:
     - `NODE_ENV=production`
     - 기타 필요한 환경 변수들

2. **빌드 확인**
   - 로컬에서 빌드가 성공하는지 확인:
     ```bash
     npm run build
     ```

## Vercel 배포 방법

### 방법 1: Vercel CLI 사용

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel

# 프로덕션 배포
vercel --prod
```

### 방법 2: GitHub 연동

1. Vercel 대시보드에서 GitHub 저장소 연결
2. 자동으로 배포 설정이 감지됩니다
3. `vercel.json` 설정이 자동으로 적용됩니다

## 주의사항

1. **파일 시스템 제한**
   - Vercel은 읽기 전용 파일 시스템을 사용합니다
   - `data/budget.xlsx` 파일은 Vercel에 업로드할 수 없습니다
   - 대신 외부 스토리지(예: S3, Cloudinary) 또는 데이터베이스를 사용해야 합니다

2. **서버리스 함수 제한**
   - 각 함수의 최대 실행 시간은 30초입니다
   - 큰 파일 처리 시 타임아웃이 발생할 수 있습니다

3. **정적 파일**
   - `dist/public` 폴더의 정적 파일은 자동으로 서빙됩니다
   - API 라우트는 `/api/*` 경로로 라우팅됩니다

## 문제 해결

### 빌드 실패
- `package.json`의 `build` 스크립트가 올바른지 확인
- 로컬에서 빌드 테스트

### API 라우트 404
- `vercel.json`의 `rewrites` 설정 확인
- `api/serverless.js` 파일이 올바른지 확인

### 정적 파일 로드 실패
- `vite.config.ts`의 `outDir` 설정 확인
- 빌드 후 `dist/public` 폴더 확인

