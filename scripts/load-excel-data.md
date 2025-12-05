# 엑셀 데이터 로드 가이드

## 방법 1: 서버 시작 시 자동 로드 (권장)

1. 엑셀 파일을 `data/budget.xlsx` 경로에 저장
2. 서버를 재시작하면 자동으로 로드됩니다

## 방법 2: 웹 인터페이스에서 업로드

1. 대시보드에서 "가져오기" 버튼 클릭
2. 엑셀 파일 선택 및 업로드
3. 미리보기 확인 후 가져오기

## 방법 3: API를 통한 로드

### 모든 데이터 삭제
```bash
curl -X DELETE http://localhost:5000/api/budget/clear
```

### 엑셀 파일에서 다시 로드
```bash
curl -X POST http://localhost:5000/api/budget/reload-from-excel
```

### 특정 파일 경로에서 로드
```bash
curl -X POST http://localhost:5000/api/budget/reload-from-excel \
  -H "Content-Type: application/json" \
  -d '{"filePath": "C:/path/to/your/file.xlsx"}'
```

## 엑셀 파일 형식

필수 컬럼:
- 부서
- 계정과목
- 적요
- 월
- 연도
- 예산
- 실제

선택 컬럼 (없으면 기본값 사용):
- 예산 내/외 (기본값: 예산 내)
- 사업구분 (기본값: 전체)
- 프로젝트명 (기본값: 적요 값)
- 산정근거/집행내역 (기본값: 적요 값)
- 고정비/변동비 (기본값: 변동비)

## 주의사항

- 서버를 재시작하면 메모리에 저장된 데이터가 초기화됩니다
- 영구 저장이 필요하면 데이터베이스를 사용하세요


