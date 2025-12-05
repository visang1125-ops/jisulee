/**
 * 에러 메시지 상수
 */
export const ERROR_MESSAGES = {
  // 파일 관련
  FILE_NOT_FOUND: "엑셀 파일을 찾을 수 없습니다",
  FILE_LOAD_ERROR: "엑셀 파일 로드 오류",
  FILE_READ_ERROR: "파일을 읽는 중 오류가 발생했습니다",
  INVALID_FILE_TYPE: "CSV 또는 Excel 파일(.xlsx, .xls)만 업로드할 수 있습니다",
  
  // 데이터 검증
  REQUIRED_FIELD_MISSING: "필수 필드가 누락되어 건너뜁니다",
  INVALID_DEPARTMENT: "유효하지 않은 부서",
  INVALID_ACCOUNT_CATEGORY: "유효하지 않은 계정과목",
  INVALID_BUSINESS_DIVISION: "유효하지 않은 사업구분",
  INVALID_COST_TYPE: "유효하지 않은 비용 유형",
  INVALID_TYPE: "구분이 유효하지 않습니다. \"예산\", \"계획\", \"실제\", \"집행\" 중 하나여야 합니다",
  INVALID_MONTH: "월은 1-12 사이여야 합니다",
  INVALID_YEAR: "연도가 유효하지 않습니다",
  INVALID_AMOUNT: "금액은 0 이상이어야 합니다",
  EMPTY_DEPARTMENT: "부서가 비어있습니다",
  EMPTY_ACCOUNT_CATEGORY: "계정과목이 비어있습니다",
  EMPTY_PROJECT_NAME: "프로젝트명이 비어있습니다",
  EMPTY_CALCULATION_BASIS: "산정근거/집행내역이 비어있습니다",
  EMPTY_TYPE: "구분이 비어있습니다 (예산 또는 실제)",
  
  // API 관련
  DATA_LOAD_FAILED: "데이터를 불러오는데 실패했습니다",
  IMPORT_FAILED: "데이터를 가져오는 중 오류가 발생했습니다",
  CREATE_FAILED: "결산 내역 추가에 실패했습니다",
  UPDATE_FAILED: "데이터 업데이트에 실패했습니다",
  DELETE_FAILED: "데이터 삭제에 실패했습니다",
  VALIDATION_ERROR: "입력 데이터가 유효하지 않습니다",
  
  // 성공 메시지
  IMPORT_SUCCESS: "개의 항목이 성공적으로 추가되었습니다",
  CREATE_SUCCESS: "결산 내역이 성공적으로 추가되었습니다",
  UPDATE_SUCCESS: "데이터가 성공적으로 업데이트되었습니다",
  DELETE_SUCCESS: "데이터가 성공적으로 삭제되었습니다",
} as const;

/**
 * 정보 메시지 상수
 */
export const INFO_MESSAGES = {
  EXCEL_LOADED: "엑셀 파일에서 {count}개의 예산 항목을 로드했습니다",
  EXCEL_RELOADED: "엑셀 파일에서 {count}개의 예산 항목을 다시 로드했습니다",
  NO_EXCEL_FILE: "엑셀 파일을 찾을 수 없습니다",
  EXCEL_READ_COMPLETE: "엑셀 파일 읽기 완료. 총 {count}개 행 발견",
  GROUPING_COMPLETE: "그룹화 완료. 총 {count}개의 고유 키 발견",
  NO_DATA_LOADED: "데이터가 로드되지 않았습니다. 엑셀 파일의 컬럼명과 형식을 확인하세요",
} as const;

/**
 * 경고 메시지 상수
 */
export const WARNING_MESSAGES = {
  REQUIRED_COLUMNS_MISSING: "필수 컬럼이 누락되었습니다",
  ROW_SKIPPED: "행 {row}: {message}",
  INVALID_TYPE_VALUE: "행 {row}: 구분이 유효하지 않습니다. \"예산\" 또는 \"실제\"여야 합니다. (현재: \"{type}\")",
  NO_DATA_AFTER_LOAD: "데이터가 로드되지 않았습니다. 엑셀 파일의 컬럼명과 형식을 확인하세요",
} as const;

