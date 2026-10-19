---
chunk_id: telecom-unlimited-001
category_group: TELECOM_RISK
sub_code: UNLIMITED_CLAIM
source_type: guideline
source_title: "[TODO] 표시광고 심사지침 — 절대적 표현(무제한)"
source_ref: "TODO: 공정위 표시·광고의 공정화에 관한 법률 심사지침"
severity_default: high
applies_to: [naming, text]
channel: [TV, SNS, OOH, APP_PUSH, WEB]
effective_from: 2020-01-01
effective_to:
---
판정 포인트: "무제한", "unlimited", "걱정 없는", "마음껏" 등 사용량 제한이 없는 것처럼 읽히는 표현은 QoS(데이터 소진 후 속도제어) 조건을 같은 화면/카피에 병기하지 않으면 위험으로 본다.
병기 예시: "기본 제공량 소진 시 최대 ○Mbps로 속도 제어". 병기가 없으면 UNLIMITED_CLAIM = high.
실제 조문·지침 원문은 이 파일을 교체할 것.

---
chunk_id: telecom-speed-001
category_group: TELECOM_RISK
sub_code: SPEED_QUALITY_CLAIM
source_type: case
source_title: "[TODO] 5G 속도 과장 표시광고 공정위 제재 사례"
source_ref: "TODO: 공정위 의결서 번호 확인 후 기입"
severity_default: high
applies_to: [naming, text, image]
channel: [TV, SNS, OOH, APP_PUSH, WEB]
effective_from: 2019-01-01
effective_to:
---
판정 포인트: 이론상 최대속도·실험실 수치를 체감속도처럼 단정하면 위험. "5G 최대 속도 20배", "초고속", "무조건 빠르다"는 비교 기준·측정 조건·평균/최대 구분이 없으면 SPEED_QUALITY_CLAIM = high.
"최대", "최고", "N배"가 있으면 비교 대상과 근거 자료를 요구한다. 근거 없으면 위험.

---
chunk_id: telecom-rate-notice-001
category_group: TELECOM_RISK
sub_code: RATE_MATERIAL_NOTICE
source_type: law
source_title: "[TODO] 전기통신사업법 — 이용자 이익 저해 금지행위"
source_ref: "TODO: 전기통신사업법 및 시행령 금지행위 유형 조항"
severity_default: high
applies_to: [naming, text]
channel: [TV, SNS, OOH, APP_PUSH, WEB]
effective_from: 2020-01-01
effective_to:
---
판정 포인트: 요금·혜택 광고에서 위약금, 약정 기간, 결합 조건, 부가세, 프로모션 종료 후 요금을 누락하면 RATE_MATERIAL_NOTICE. "무료", "할인"만 강조하고 조건이 없으면 주의 이상.

---
chunk_id: telecom-device-current-001
category_group: TELECOM_RISK
sub_code: DEVICE_SUBSIDY
source_type: law
source_title: "[TODO] 전기통신사업법(단통법 폐지 이후 이관 조항)"
source_ref: "TODO: 단통법 폐지 후 이관된 지원금·공시 관련 조항"
severity_default: med
applies_to: [naming, text, image]
channel: [TV, SNS, OOH, APP_PUSH, WEB]
effective_from: 2025-07-01
effective_to:
---
판정 포인트: "공짜폰", "0원", "공시지원금 최대"는 실제 출고가·지원금·부가 조건(요금제 의무, 중도해지)을 병기해야 한다. 단통법 원문이 아니라 이관 조항을 근거로 쓴다.

---
chunk_id: telecom-bundle-finance-001
category_group: TELECOM_RISK
sub_code: BUNDLED_FINANCE
source_type: guideline
source_title: "[TODO] 제휴카드·금융 결합할인 표시 기준"
source_ref: "TODO: 표시광고법 심사지침 + 카드사 광고 관련 규정"
severity_default: med
applies_to: [naming, text]
channel: [TV, SNS, WEB, APP_PUSH]
effective_from: 2020-01-01
effective_to:
---
판정 포인트: 카드 청구할인·캐시백을 통신 요금 할인처럼 표기하면 BUNDLED_FINANCE. "월 n만원 할인"이 요금제 자체 할인이 아니라 제휴카드 조건이면 주체를 명시해야 한다.
