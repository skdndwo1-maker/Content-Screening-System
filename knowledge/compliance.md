---
chunk_id: ad-law-superlative-001
category_group: COMPLIANCE_RISK
sub_code: AD_LAW
source_type: law
source_title: "[TODO] 표시광고법 — 부당한 표시·광고 금지"
source_ref: "TODO: 표시·광고의 공정화에 관한 법률 관련 조항"
severity_default: high
applies_to: [naming, text, image]
channel: [TV, SNS, OOH, APP_PUSH, WEB]
effective_from: 2012-01-01
effective_to:
---
판정 포인트: 최상급·절대 표현("국내 1위", "최고", "무조건", "100%")은 실증 자료가 없으면 AD_LAW = 위험. 효능·효과를 단정하는 카피도 동일.

---
chunk_id: comparative-ad-001
category_group: COMPLIANCE_RISK
sub_code: COMPARATIVE_AD
source_type: guideline
source_title: "[TODO] 비교표시·광고 심사지침"
source_ref: "TODO: 공정위 비교표시광고 심사지침"
severity_default: high
applies_to: [naming, text, image]
channel: [TV, SNS, OOH, APP_PUSH, WEB]
effective_from: 2012-01-01
effective_to:
---
판정 포인트: 경쟁사 비방이 아니어도 "타사 대비 N배", "다른 통신사보다 빠르다"는 비교 대상·기간·지표·출처가 없으면 COMPARATIVE_AD. DEFAMATION과 분리한다.

---
chunk_id: dark-pattern-001
category_group: COMPLIANCE_RISK
sub_code: DARK_PATTERN
source_type: guideline
source_title: "[TODO] 전자상거래법·다크패턴 심사 기준"
source_ref: "TODO: 전자상거래법 및 공정위 다크패턴 관련 지침"
severity_default: high
applies_to: [naming, text, image]
channel: [TV, SNS, OOH, APP_PUSH, WEB]
effective_from: 2024-01-01
effective_to:
---
판정 포인트: "오늘만", "지금 아니면 품절", "마감 임박" 등 허위 긴급성. 숨은 자동갱신, 해지 방해 카피. 실제 재고·기간 근거가 없으면 DARK_PATTERN = 위험.

---
chunk_id: greenwashing-001
category_group: COMPLIANCE_RISK
sub_code: GREENWASHING
source_type: guideline
source_title: "[TODO] 환경 관련 표시광고 심사지침"
source_ref: "TODO: 공정위 환경 관련 표시광고 심사지침"
severity_default: med
applies_to: [naming, text, image]
channel: [TV, SNS, OOH, APP_PUSH, WEB]
effective_from: 2023-01-01
effective_to:
---
판정 포인트: "친환경", "탄소중립", "ESG"를 근거(인증·수치·범위) 없이 쓰면 GREENWASHING. 일부 공정만 친환경인데 서비스 전체를 그렇게 묘사해도 주의 이상.

---
chunk_id: ad-disclosure-001
category_group: COMPLIANCE_RISK
sub_code: AD_DISCLOSURE
source_type: guideline
source_title: "[TODO] 추천·보증 등에 관한 표시광고 심사지침(뒷광고)"
source_ref: "TODO: 공정위 추천·보증 심사지침"
severity_default: med
applies_to: [naming, text, image]
channel: [TV, SNS, OOH, APP_PUSH, WEB]
effective_from: 2021-01-01
effective_to:
---
판정 포인트: 유료 광고·협찬이면 "광고" 표기가 필요. SNS 채널은 가중. 조건부 혜택을 확정된 것처럼 쓰면 AD_DISCLOSURE.

---
chunk_id: disclosure-001
category_group: COMPLIANCE_RISK
sub_code: DISCLOSURE
source_type: guideline
source_title: "[TODO] 중요정보 고지 — 부가세·약정·제한"
source_ref: "TODO: 표시광고법 심사지침 + 전기통신사업법 고지 관련"
severity_default: med
applies_to: [naming, text, image]
channel: [TV, SNS, OOH, APP_PUSH, WEB]
effective_from: 2012-01-01
effective_to:
---
판정 포인트: 요금 광고에서 부가세, 약정, 속도 제한, 프로모션 기간을 누락하면 DISCLOSURE. 통신 요금제는 RATE_MATERIAL_NOTICE와 함께 본다.

---
chunk_id: defamation-001
category_group: COMPLIANCE_RISK
sub_code: DEFAMATION
source_type: law
source_title: "[TODO] 경쟁사 비방 — 표시광고법·명예훼손"
source_ref: "TODO: 표시광고법 비방 광고 + 형법 명예훼손 관련"
severity_default: high
applies_to: [naming, text, image]
channel: [TV, SNS, OOH, APP_PUSH, WEB]
effective_from: 2012-01-01
effective_to:
---
판정 포인트: 특정 경쟁사를 열등·기만적으로 지칭하면 DEFAMATION. 단순 비교 수치는 COMPARATIVE_AD로 분리.

---
chunk_id: trademark-001
category_group: COMPLIANCE_RISK
sub_code: TRADEMARK_PUBLICITY
source_type: law
source_title: "[TODO] 상표법·부정경쟁방지법 퍼블리시티"
source_ref: "TODO: 상표법, 부정경쟁방지법 관련 조항"
severity_default: high
applies_to: [naming, text, image]
channel: [TV, SNS, OOH, APP_PUSH, WEB]
effective_from: 2012-01-01
effective_to:
---
판정 포인트: 유명인 이름·이미지·음성, 타사 로고·슬로건을 허가 없이 쓰면 TRADEMARK_PUBLICITY.

---
chunk_id: privacy-001
category_group: COMPLIANCE_RISK
sub_code: PRIVACY
source_type: law
source_title: "[TODO] 개인정보보호법 — 얼굴·번호판·화면캡처"
source_ref: "TODO: 개인정보보호법 관련 조항"
severity_default: high
applies_to: [image, text]
channel: [TV, SNS, OOH, APP_PUSH, WEB]
effective_from: 2020-01-01
effective_to:
---
판정 포인트: 식별 가능한 얼굴, 차량번호, 단말기 화면의 개인정보가 보이면 PRIVACY. 모자이크·동의 여부를 확인.

---
chunk_id: copyright-001
category_group: COMPLIANCE_RISK
sub_code: COPYRIGHT
source_type: law
source_title: "[TODO] 저작권법 — 폰트·이미지·BGM·로고"
source_ref: "TODO: 저작권법 관련 조항"
severity_default: med
applies_to: [image, naming]
channel: [TV, SNS, OOH, APP_PUSH, WEB]
effective_from: 2012-01-01
effective_to:
---
판정 포인트: 라이선스 불명 스톡·폰트·BGM, 타사 로고 삽입은 COPYRIGHT. 초상권은 TRADEMARK_PUBLICITY와 함께 검토.
