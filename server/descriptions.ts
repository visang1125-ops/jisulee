import type { AccountCategory } from "@shared/schema";

/**
 * 계정과목별 적요 목록
 */
export const ACCOUNT_DESCRIPTIONS: Record<AccountCategory, string[]> = {
  "광고선전비(이벤트)": [
    "온라인 광고비",
    "오프라인 광고비",
    "이벤트 운영비",
    "홍보물 제작비",
    "SNS 마케팅비",
    "인플루언서 협찬비",
  ],
  "통신비": [
    "인터넷 회선비",
    "전화 요금",
    "모바일 통신비",
    "클라우드 서비스비",
    "데이터 통신비",
  ],
  "지급수수료": [
    "일반 수수료",
    "거래 수수료",
    "처리 수수료",
  ],
  "지급수수료(은행수수료)": [
    "계좌 관리비",
    "이체 수수료",
    "대출 수수료",
    "외환 거래 수수료",
    "보증 수수료",
  ],
  "지급수수료(외부용역,자문료)": [
    "법률 자문료",
    "회계 자문료",
    "세무 자문료",
    "기술 자문료",
    "경영 자문료",
    "디자인 용역비",
    "개발 용역비",
  ],
  "지급수수료(유지보수료)": [
    "시스템 유지보수",
    "소프트웨어 라이선스",
    "하드웨어 유지보수",
    "네트워크 유지보수",
    "보안 유지보수",
  ],
  "지급수수료(저작료)": [
    "저작권 사용료",
    "이미지 사용료",
    "음악 사용료",
    "폰트 라이선스",
    "콘텐츠 제작비",
  ],
  "지급수수료(제휴)": [
    "제휴 수수료",
    "파트너 수수료",
    "제휴 마케팅비",
    "제휴 프로모션비",
  ],
};

/**
 * 계정과목에 대한 랜덤 적요 선택
 */
export function getRandomDescription(accountCategory: AccountCategory): string {
  const descriptions = ACCOUNT_DESCRIPTIONS[accountCategory];
  return descriptions[Math.floor(Math.random() * descriptions.length)];
}






