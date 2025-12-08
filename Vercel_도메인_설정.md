# Vercel 도메인 설정 가이드

## 🔗 Vercel 도메인 수정/설정 방법

### 방법 1: 프로젝트 설정에서

1. **Vercel 대시보드 접속**
   - [https://vercel.com/dashboard](https://vercel.com/dashboard)

2. **프로젝트 선택**
   - 배포된 프로젝트 클릭 (예: `jisulee`)

3. **Settings 탭 클릭**
   - 상단 메뉴에서 **"Settings"** 선택

4. **Domains 섹션**
   - 왼쪽 메뉴에서 **"Domains"** 클릭
   - 또는 Settings 페이지에서 **"Domains"** 섹션 찾기

5. **도메인 관리**
   - 현재 도메인 목록 확인
   - **"Add"** 버튼으로 새 도메인 추가
   - 기존 도메인 옆 **"..."** 메뉴로 수정/삭제

### 방법 2: 배포 페이지에서

1. **Vercel 대시보드 → 프로젝트**
2. **Deployments 탭**
3. 최신 배포 클릭
4. **"Domains"** 섹션에서 확인/수정

## 📝 도메인 추가하기

### 1. 커스텀 도메인 추가

1. Settings → Domains
2. **"Add"** 버튼 클릭
3. 도메인 입력 (예: `example.com`)
4. **"Add"** 클릭
5. DNS 설정 안내 따르기

### 2. 서브도메인 추가

1. Settings → Domains
2. **"Add"** 버튼 클릭
3. 서브도메인 입력 (예: `app.example.com`)
4. **"Add"** 클릭

## 🔄 기본 도메인 변경

Vercel은 자동으로 다음 도메인을 제공합니다:
- `프로젝트명.vercel.app`
- `프로젝트명-xxx.vercel.app` (프리뷰)

**기본 도메인은 변경할 수 없지만:**
- 커스텀 도메인을 추가하여 사용 가능
- 커스텀 도메인을 기본으로 설정 가능

## ⚙️ 도메인 설정 옵션

### Redirects 설정
1. Settings → Domains
2. 도메인 선택
3. **"Configure"** 클릭
4. Redirect 설정

### SSL 인증서
- Vercel이 자동으로 SSL 인증서 제공
- HTTPS 자동 활성화

## 🆘 문제 해결

### 도메인이 보이지 않는 경우
1. Settings 탭 확인
2. Domains 섹션 확인
3. 프로젝트가 배포되었는지 확인

### DNS 설정이 필요한 경우
1. 도메인 추가 시 DNS 설정 안내 표시
2. 도메인 제공업체에서 DNS 레코드 추가
3. Vercel이 자동으로 확인

## 💡 팁

### Vercel 기본 도메인
- `프로젝트명.vercel.app` 형식
- 자동으로 생성됨
- 변경 불가 (하지만 커스텀 도메인 추가 가능)

### 커스텀 도메인
- 원하는 도메인 사용 가능
- DNS 설정 필요
- SSL 자동 제공

## 📋 빠른 경로

**가장 빠른 방법:**
1. Vercel 대시보드
2. 프로젝트 클릭
3. **Settings** (상단 메뉴)
4. **Domains** (왼쪽 메뉴)

또는

1. Vercel 대시보드
2. 프로젝트 클릭
3. **Settings** 탭
4. 페이지에서 **"Domains"** 섹션 찾기

