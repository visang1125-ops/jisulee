# Vercel 배포 가이드

## ⚠️ 중요 사항

현재 프로젝트는 Express 서버와 파일 시스템을 사용하는 구조입니다. Vercel에 배포하려면 **추가 수정이 필요**합니다.

## 필요한 수정사항

### 1. 파일 시스템 제한
Vercel은 **읽기 전용 파일 시스템**을 사용합니다. 따라서:
- ❌ `data/budget.xlsx` 파일을 직접 읽을 수 없습니다
- ✅ 대신 **외부 스토리지** 또는 **데이터베이스**를 사용해야 합니다

**해결 방법:**
- **옵션 A**: 데이터베이스 사용 (PostgreSQL, MongoDB 등)
- **옵션 B**: 클라우드 스토리지 사용 (AWS S3, Cloudinary 등)
- **옵션 C**: Vercel Blob Storage 사용

### 2. 서버리스 함수 제한
- 각 함수의 최대 실행 시간: **30초**
- 큰 Excel 파일 처리 시 타임아웃 가능

### 3. 서버 시작 로직 수정
`server/app.ts`의 `server.listen()` 부분은 Vercel에서 필요 없습니다.

## 권장 배포 방법

### 방법 1: 프론트엔드만 Vercel에 배포 (권장)
1. 프론트엔드만 Vercel에 배포
2. 백엔드는 별도 서버에 배포 (Railway, Render, Fly.io 등)
3. API 엔드포인트를 환경 변수로 설정

### 방법 2: 전체 앱을 Vercel에 배포
1. 파일 시스템 대신 데이터베이스 사용
2. Excel 파일 업로드는 클라우드 스토리지에 저장
3. `server/app.ts`에서 서버 시작 로직 제거

## 현재 설정 파일

- ✅ `vercel.json` - Vercel 배포 설정
- ✅ `api/serverless.js` - Serverless function 래퍼
- ✅ `.vercelignore` - 배포 제외 파일 목록

## 다음 단계

1. **데이터 저장소 변경**
   - 파일 시스템 → 데이터베이스 또는 클라우드 스토리지

2. **서버 코드 수정**
   - `server/app.ts`에서 `server.listen()` 제거 (Vercel에서는 불필요)
   - 파일 읽기/쓰기 로직을 외부 스토리지로 변경

3. **환경 변수 설정**
   - Vercel 대시보드에서 환경 변수 설정
   - 데이터베이스 연결 정보 등

## 빠른 테스트

로컬에서 빌드 테스트:
```bash
npm run build
```

빌드가 성공하면 Vercel에 배포할 수 있습니다.

