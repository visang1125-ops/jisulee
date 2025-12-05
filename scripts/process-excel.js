import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 엑셀 파일을 읽어서 새 필드를 추가하고 가공하는 스크립트
 * 
 * 사용법:
 * node scripts/process-excel.js input.xlsx output.xlsx
 * 
 * 또는 대화형 모드:
 * node scripts/process-excel.js
 */

// 필드 매핑 정보
const FIELD_MAPPING = {
  // 기존 필드 (필수)
  department: '부서',
  accountCategory: '계정과목',
  description: '적요',
  month: '월',
  year: '연도',
  budgetAmount: '예산',
  actualAmount: '실제',
  
  // 새 필드 (선택적, 기본값 제공)
  isWithinBudget: '예산 내/외',
  businessDivision: '사업구분',
  projectName: '프로젝트명',
  calculationBasis: '산정근거/집행내역',
  costType: '고정비/변동비',
};

// 유효한 값들
const VALID_BUSINESS_DIVISIONS = ['키즈', '초등', '중등', '전체'];
const VALID_COST_TYPES = ['고정비', '변동비'];
const VALID_DEPARTMENTS = [
  'DX전략 Core Group',
  '서비스혁신 Core',
  '플랫폼혁신 Core',
  '백오피스혁신 Core',
];

/**
 * 엑셀 파일을 읽고 데이터를 반환
 */
function readExcelFile(filePath) {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
    return { workbook, sheetName, worksheet, data };
  } catch (error) {
    console.error(`파일 읽기 오류: ${error.message}`);
    process.exit(1);
  }
}

/**
 * 데이터 행을 가공하여 새 필드 추가
 */
function processRow(row, rowIndex) {
  const processed = { ...row };
  
  // 예산 내/외 (기본값: 예산 내)
  if (!processed[FIELD_MAPPING.isWithinBudget]) {
    processed[FIELD_MAPPING.isWithinBudget] = '예산 내';
  } else {
    const value = String(processed[FIELD_MAPPING.isWithinBudget]).trim();
    processed[FIELD_MAPPING.isWithinBudget] = 
      (value === '예산외' || value === '예산 외' || value === 'false' || value === '0') 
        ? '예산 외' 
        : '예산 내';
  }
  
  // 사업구분 (기본값: 전체)
  if (!processed[FIELD_MAPPING.businessDivision]) {
    processed[FIELD_MAPPING.businessDivision] = '전체';
  } else {
    const value = String(processed[FIELD_MAPPING.businessDivision]).trim();
    if (!VALID_BUSINESS_DIVISIONS.includes(value)) {
      console.warn(`행 ${rowIndex + 2}: 유효하지 않은 사업구분 "${value}", "전체"로 설정합니다.`);
      processed[FIELD_MAPPING.businessDivision] = '전체';
    }
  }
  
  // 프로젝트명 (기본값: 적요)
  if (!processed[FIELD_MAPPING.projectName]) {
    processed[FIELD_MAPPING.projectName] = processed[FIELD_MAPPING.description] || '';
  }
  
  // 산정근거/집행내역 (기본값: 적요)
  if (!processed[FIELD_MAPPING.calculationBasis]) {
    processed[FIELD_MAPPING.calculationBasis] = processed[FIELD_MAPPING.description] || '';
  }
  
  // 고정비/변동비 (기본값: 변동비)
  if (!processed[FIELD_MAPPING.costType]) {
    processed[FIELD_MAPPING.costType] = '변동비';
  } else {
    const value = String(processed[FIELD_MAPPING.costType]).trim();
    if (!VALID_COST_TYPES.includes(value)) {
      console.warn(`행 ${rowIndex + 2}: 유효하지 않은 비용 유형 "${value}", "변동비"로 설정합니다.`);
      processed[FIELD_MAPPING.costType] = '변동비';
    }
  }
  
  return processed;
}

/**
 * 엑셀 파일을 가공하여 새 파일로 저장
 */
function processExcelFile(inputPath, outputPath) {
  console.log(`\n📖 파일 읽는 중: ${inputPath}`);
  const { workbook, sheetName, data } = readExcelFile(inputPath);
  
  console.log(`📊 총 ${data.length}개 행 발견`);
  
  // 데이터 가공
  console.log(`\n🔧 데이터 가공 중...`);
  const processedData = data.map((row, index) => {
    if (index % 100 === 0) {
      process.stdout.write(`\r   진행 중: ${index + 1}/${data.length} 행`);
    }
    return processRow(row, index);
  });
  console.log(`\n✅ 가공 완료: ${processedData.length}개 행`);
  
  // 새 워크북 생성
  const newWorkbook = XLSX.utils.book_new();
  const newWorksheet = XLSX.utils.json_to_sheet(processedData);
  XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, sheetName);
  
  // 파일 저장
  console.log(`\n💾 파일 저장 중: ${outputPath}`);
  XLSX.writeFile(newWorkbook, outputPath);
  console.log(`✅ 저장 완료!\n`);
  
  // 통계 출력
  const stats = {
    total: processedData.length,
    withinBudget: processedData.filter(r => r[FIELD_MAPPING.isWithinBudget] === '예산 내').length,
    outsideBudget: processedData.filter(r => r[FIELD_MAPPING.isWithinBudget] === '예산 외').length,
    businessDivisions: {},
    costTypes: {},
  };
  
  processedData.forEach(row => {
    const division = row[FIELD_MAPPING.businessDivision];
    const costType = row[FIELD_MAPPING.costType];
    stats.businessDivisions[division] = (stats.businessDivisions[division] || 0) + 1;
    stats.costTypes[costType] = (stats.costTypes[costType] || 0) + 1;
  });
  
  console.log('📈 처리 통계:');
  console.log(`   총 행 수: ${stats.total}`);
  console.log(`   예산 내: ${stats.withinBudget}`);
  console.log(`   예산 외: ${stats.outsideBudget}`);
  console.log(`   사업구분:`, stats.businessDivisions);
  console.log(`   비용 유형:`, stats.costTypes);
  console.log('');
}

/**
 * 엑셀 템플릿 생성
 */
function createTemplate(outputPath) {
  console.log(`\n📝 템플릿 생성 중: ${outputPath}`);
  
  const templateData = [
    {
      [FIELD_MAPPING.department]: 'DX전략 Core Group',
      [FIELD_MAPPING.accountCategory]: '광고선전비(이벤트)',
      [FIELD_MAPPING.description]: '이벤트프로모션',
      [FIELD_MAPPING.isWithinBudget]: '예산 내',
      [FIELD_MAPPING.businessDivision]: '키즈',
      [FIELD_MAPPING.projectName]: '이벤트프로모션',
      [FIELD_MAPPING.calculationBasis]: '2025년 1분기 키즈 이벤트 프로모션 집행',
      [FIELD_MAPPING.costType]: '변동비',
      [FIELD_MAPPING.month]: 1,
      [FIELD_MAPPING.year]: 2025,
      [FIELD_MAPPING.budgetAmount]: 10000000,
      [FIELD_MAPPING.actualAmount]: 8500000,
    },
    {
      [FIELD_MAPPING.department]: '서비스혁신 Core',
      [FIELD_MAPPING.accountCategory]: '통신비',
      [FIELD_MAPPING.description]: '통신비',
      [FIELD_MAPPING.isWithinBudget]: '예산 내',
      [FIELD_MAPPING.businessDivision]: '전체',
      [FIELD_MAPPING.projectName]: '통신비',
      [FIELD_MAPPING.calculationBasis]: '월간 통신비 집행',
      [FIELD_MAPPING.costType]: '고정비',
      [FIELD_MAPPING.month]: 1,
      [FIELD_MAPPING.year]: 2025,
      [FIELD_MAPPING.budgetAmount]: 5000000,
      [FIELD_MAPPING.actualAmount]: 5000000,
    },
  ];
  
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(templateData);
  XLSX.utils.book_append_sheet(workbook, worksheet, '예산데이터');
  
  XLSX.writeFile(workbook, outputPath);
  console.log(`✅ 템플릿 생성 완료!\n`);
}

// 메인 실행
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
📋 엑셀 파일 가공 도구

사용법:
  1. 파일 가공:
     node scripts/process-excel.js <입력파일> <출력파일>
  
  2. 템플릿 생성:
     node scripts/process-excel.js --template <출력파일>

예시:
  node scripts/process-excel.js data.xlsx processed_data.xlsx
  node scripts/process-excel.js --template template.xlsx
`);
    process.exit(0);
  }
  
  if (args[0] === '--template') {
    const outputPath = args[1] || 'budget_template.xlsx';
    createTemplate(outputPath);
  } else if (args.length >= 2) {
    const inputPath = args[0];
    const outputPath = args[1];
    
    if (!fs.existsSync(inputPath)) {
      console.error(`❌ 파일을 찾을 수 없습니다: ${inputPath}`);
      process.exit(1);
    }
    
    processExcelFile(inputPath, outputPath);
  } else {
    console.error('❌ 잘못된 인수입니다. 사용법을 확인하세요.');
    process.exit(1);
  }
}

main();

