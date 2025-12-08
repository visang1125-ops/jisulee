import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const excelPath = path.join(__dirname, '..', 'data', 'budget.xlsx');

if (!fs.existsSync(excelPath)) {
  console.log('❌ 엑셀 파일을 찾을 수 없습니다:', excelPath);
  process.exit(1);
}

console.log('📄 엑셀 파일 읽기:', excelPath);

const workbook = XLSX.readFile(excelPath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

console.log(`\n✅ 총 ${jsonData.length}개 행 발견\n`);

if (jsonData.length > 0) {
  // 부서 컬럼 찾기
  const headers = Object.keys(jsonData[0]);
  const deptHeader = headers.find(h => h.includes('부서') || h.toLowerCase().includes('department'));
  
  if (!deptHeader) {
    console.log('❌ 부서 컬럼을 찾을 수 없습니다.');
    console.log('   사용 가능한 컬럼:', headers);
    process.exit(1);
  }
  
  console.log(`📋 부서 컬럼: "${deptHeader}"\n`);
  
  // 고유한 부서 목록 추출
  const departments = [...new Set(jsonData.map(row => String(row[deptHeader] || '').trim()).filter(d => d))];
  
  console.log(`🔍 발견된 부서 (총 ${departments.length}개):\n`);
  departments.forEach((dept, index) => {
    const count = jsonData.filter(row => String(row[deptHeader] || '').trim() === dept).length;
    console.log(`  ${index + 1}. "${dept}" (${count}개 행)`);
  });
  
  // 현재 코드의 부서 목록과 비교
  const codeDepartments = [
    "DX전략 Core Group",
    "서비스혁신 Core",
    "플랫폼혁신 Core",
    "백오피스혁신 Core",
  ];
  
  console.log('\n📊 코드와 비교:\n');
  const missingInCode = departments.filter(d => !codeDepartments.includes(d));
  const missingInData = codeDepartments.filter(d => !departments.includes(d));
  
  if (missingInCode.length > 0) {
    console.log('❌ 엑셀에는 있지만 코드에 없는 부서:');
    missingInCode.forEach(dept => console.log(`  - "${dept}"`));
  }
  
  if (missingInData.length > 0) {
    console.log('⚠️  코드에는 있지만 엑셀에 없는 부서:');
    missingInData.forEach(dept => console.log(`  - "${dept}"`));
  }
  
  if (missingInCode.length === 0 && missingInData.length === 0) {
    console.log('✅ 모든 부서가 일치합니다.');
  }
}


