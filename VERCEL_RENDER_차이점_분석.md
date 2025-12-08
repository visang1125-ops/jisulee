# Vercel vs Render 차이점 분석

## 🔍 핵심 차이점

### Render (백엔드 서버)
- **서버 실행**: Express 서버가 `dist/public` 디렉토리의 정적 파일을 서빙
- **정적 파일 서빙**: `express.static(distPath)` 사용
- **CSS 파일**: Express가 직접 서빙하므로 경로 문제 없음
- **빌드**: `npm run build` → 클라이언트 + 서버 모두 빌드

### Vercel (정적 파일 호스팅)
- **서버 없음**: 정적 파일만 호스팅
- **정적 파일 서빙**: Vercel CDN이 직접 서빙
- **CSS 파일**: 빌드된 HTML에서 CSS 참조 경로가 중요
- **빌드**: `npm run build:vercel` → 클라이언트만 빌드

## 🚨 문제 원인

### 1. CSS 파일 경로 불일치
- **이전**: CSS 파일이 `assets/css/` 디렉토리에 생성
- **문제**: Vercel의 정적 파일 서빙과 경로 불일치 가능
- **해결**: 모든 정적 파일을 `assets/` 디렉토리에 통일

### 2. 빌드 출력 구조
- **Render**: Express가 모든 파일을 서빙하므로 경로 문제 없음
- **Vercel**: HTML에서 CSS 참조 경로가 정확해야 함

## ✅ 적용된 해결책

### 1. Vite 빌드 설정 통일
```typescript
// 모든 정적 파일을 assets 디렉토리에 통일
assetFileNames: 'assets/[name].[hash].[ext]',
chunkFileNames: 'assets/[name].[hash].js',
entryFileNames: 'assets/[name].[hash].js',
```

### 2. Vercel 헤더 설정 수정
```json
{
  "source": "/assets/(.*\\.css)",
  "headers": [
    {
      "key": "Content-Type",
      "value": "text/css"
    }
  ]
}
```

### 3. CSS 빌드 최적화
- `cssCodeSplit: false` - 단일 CSS 파일 생성
- `cssMinify: true` - CSS 압축
- PostCSS 설정 명시적 지정

## 📋 확인 사항

### Vercel 배포 후 확인:
1. **빌드 로그**: CSS 파일 생성 여부 확인
2. **Network 탭**: CSS 파일 로드 확인 (200 OK)
3. **파일 크기**: CSS 파일이 0.1KB가 아닌 수십~수백 KB여야 함
4. **파일 내용**: Tailwind 클래스가 포함되어 있어야 함

### Render 배포:
- Express 서버가 정상 작동하므로 문제 없음

## 🎯 결론

**Render에서는 작동하는 이유:**
- Express 서버가 모든 정적 파일을 직접 서빙
- 경로 문제가 있어도 Express가 처리

**Vercel에서 안 되는 이유:**
- 정적 파일 호스팅만 제공
- HTML에서 CSS 참조 경로가 정확해야 함
- 빌드 출력 구조가 Vercel 요구사항과 일치해야 함

**해결책:**
- CSS 파일 경로를 단순화하고 통일
- Vercel 설정에서 CSS 파일 헤더 명시
- 빌드 출력 구조 최적화

