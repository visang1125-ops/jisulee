/**
 * 개발 및 디버깅 유틸리티
 */

export function logEnvironmentInfo() {
  if (import.meta.env.DEV) {
    console.group('🔍 환경 정보');
    console.log('API URL:', import.meta.env.VITE_API_URL || '/api');
    console.log('Mode:', import.meta.env.MODE);
    console.log('Dev:', import.meta.env.DEV);
    console.log('Prod:', import.meta.env.PROD);
    console.groupEnd();
  }
}

export function checkAPIConnection() {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  console.log('🔗 API 연결 확인:', apiUrl);
  
  fetch(`${apiUrl}/health`)
    .then(res => res.json())
    .then(data => console.log('✅ API 연결 성공:', data))
    .catch(err => console.error('❌ API 연결 실패:', err));
}

