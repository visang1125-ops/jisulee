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
  const headers = Object.keys(jsonData[0]);
  console.log('📋 엑셀 파일의 컬럼명:');
  headers.forEach((header, index) => {
    console.log(`  ${index + 1}. "${header}"`);
  });
  
  console.log('\n📊 첫 번째 행 데이터:');
  const firstRow = jsonData[0];
  headers.forEach(header => {
    const value = firstRow[header];
    console.log(`  ${header}: "${value}" (타입: ${typeof value})`);
  });
  
  console.log('\n🔍 필수 컬럼 확인:');
  const requiredColumns = {
    '부서': 'department',
    '계정과목': 'accountCategory',
    '월': 'month',
    '연도': 'year',
    '구분': 'type',
    '금액': 'amount',
    '프로젝트명': 'projectName',
    '산정근거/집행내역': 'calculationBasis',
  };
  
  const missing = [];
  const found = [];
  
  for (const [excelHeader, fieldName] of Object.entries(requiredColumns)) {
    const matched = headers.find(h => {
      const normalized1 = h.replace(/\s+/g, '').toLowerCase();
      const normalized2 = excelHeader.replace(/\s+/g, '').toLowerCase();
      return normalized1 === normalized2 || h === excelHeader;
    });
    
    if (matched) {
      found.push({ required: excelHeader, actual: matched, field: fieldName });
    } else {
      missing.push(excelHeader);
    }
  }
  
  console.log('\n✅ 매칭된 컬럼:');
  found.forEach(({ required, actual, field }) => {
    console.log(`  "${required}" → "${actual}" (${field})`);
  });
  
  if (missing.length > 0) {
    console.log('\n❌ 누락된 필수 컬럼:');
    missing.forEach(col => console.log(`  - ${col}`));
  }
  
  // 구분 컬럼 값 확인
  const typeHeader = found.find(f => f.field === 'type')?.actual;
  if (typeHeader) {
    console.log('\n🔍 구분 컬럼 값 샘플 (처음 10개):');
    const typeValues = jsonData.slice(0, 10).map(row => row[typeHeader]).filter(v => v);
    const uniqueTypes = [...new Set(typeValues)];
    console.log('  고유 값:', uniqueTypes);
    if (uniqueTypes.length > 0) {
      uniqueTypes.forEach(type => {
        const count = jsonData.filter(row => String(row[typeHeader] || '').trim() === String(type).trim()).length;
        console.log(`    "${type}": ${count}개`);
      });
    }
  }
}

