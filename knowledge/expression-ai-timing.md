---
chunk_id: hate-001
category_group: EXPRESSION_RISK
sub_code: HATE
source_type: internal
source_title: "[TODO] U+ 브랜드 금칙어·혐오 표현 가이드"
source_ref: "TODO: 사내 브랜드 가이드 / 금칙어 사전"
severity_default: high
applies_to: [naming, text, image]
channel: [TV, SNS, OOH, APP_PUSH, WEB]
effective_from: 2020-01-01
effective_to:
---
판정 포인트: 특정 성별·세대·인종·지역·종교·장애 집단을 비하·조롱하는 표현은 HATE = 위험. 커뮤니티 혐오 은어도 포함.

---
chunk_id: disability-slur-001
category_group: EXPRESSION_RISK
sub_code: DISABILITY_SLUR
source_type: internal
source_title: "[TODO] 장애 비하 관용어 금지 목록"
source_ref: "TODO: 사내 대체어 사전"
severity_default: high
applies_to: [naming, text, image]
channel: [TV, SNS, OOH, APP_PUSH, WEB]
effective_from: 2020-01-01
effective_to:
---
판정 포인트: "결정장애", "벙어리 ~", "정신병자", "장애인 비하 은어"는 DISABILITY_SLUR. 습관적 관용어라도 위험.

---
chunk_id: appearance-status-001
category_group: EXPRESSION_RISK
sub_code: APPEARANCE_STATUS
source_type: internal
source_title: "[TODO] 외모·직업·학력 비하"
source_ref: "TODO: 사내 표현 가이드"
severity_default: med
applies_to: [naming, text, image]
channel: [TV, SNS, OOH, APP_PUSH, WEB]
effective_from: 2020-01-01
effective_to:
---
판정 포인트: 외모·직업·학력을 열등하게 묘사하거나 조롱하면 APPEARANCE_STATUS. 성·연령·지역 차별은 DISCRIMINATION으로 분리.

---
chunk_id: political-religious-001
category_group: EXPRESSION_RISK
sub_code: POLITICAL_RELIGIOUS
source_type: law
source_title: "[TODO] 공직선거법 관련 조항 + 브랜드 정치·종교 중립"
source_ref: "TODO: 공직선거법 관련 조항"
severity_default: high
applies_to: [naming, text, image]
channel: [TV, SNS, OOH, APP_PUSH, WEB]
effective_from: 2020-01-01
effective_to:
---
판정 포인트: 정당 상징색·숫자 조합, 종교 상징을 캠페인에 쓰면 POLITICAL_RELIGIOUS. 선거기간이면 ELECTION_PERIOD와 중첩.

---
chunk_id: ai-label-001
category_group: AI_DIGITAL_RISK
sub_code: AI_GENERATED_LABEL
source_type: law
source_title: "[TODO] AI 기본법 — 생성형 AI 결과물 표시 의무"
source_ref: "TODO: 인공지능 발전과 신뢰 기반 조성 등에 관한 법률 표시 의무 조항"
severity_default: high
applies_to: [image, video]
channel: [TV, SNS, OOH, APP_PUSH, WEB]
effective_from: 2026-01-01
effective_to:
---
판정 포인트: 이미지·영상 탭에서 AI 생성 콘텐츠인데 "AI 생성" 표기가 없으면 AI_GENERATED_LABEL = 위험. 사용자가 AI 생성임을 밝히지 않았고 이미지가 첨부된 경우, 표기 여부를 확인하고 없으면 주의 이상으로 본다.

---
chunk_id: synthetic-person-001
category_group: AI_DIGITAL_RISK
sub_code: SYNTHETIC_PERSON
source_type: law
source_title: "[TODO] 딥페이크·실존인물 합성"
source_ref: "TODO: AI기본법 / 성폭력처벌법 딥페이크 관련 조항"
severity_default: high
applies_to: [image, video]
channel: [TV, SNS, OOH, APP_PUSH, WEB]
effective_from: 2024-01-01
effective_to:
---
판정 포인트: 실존 인물의 얼굴·음성을 합성한 광고는 동의·표시가 없으면 SYNTHETIC_PERSON = 위험.

---
chunk_id: data-collection-001
category_group: AI_DIGITAL_RISK
sub_code: DATA_COLLECTION_TEXT
source_type: law
source_title: "[TODO] 개인정보보호법·위치정보법 수집 동의 문구"
source_ref: "TODO: 개인정보보호법, 위치정보의 보호 및 이용 등에 관한 법률"
severity_default: med
applies_to: [text, naming]
channel: [WEB, APP_PUSH, SNS]
effective_from: 2020-01-01
effective_to:
---
판정 포인트: 이벤트 응모에서 개인정보·위치정보 수집 목적·보유기간·동의가 없거나 과도하면 DATA_COLLECTION_TEXT.

---
chunk_id: election-001
category_group: TIMING_RISK
sub_code: ELECTION_PERIOD
source_type: law
source_title: "[TODO] 공직선거법 — 선거기간 정치 연상 광고"
source_ref: "TODO: 공직선거법 관련 조항"
severity_default: high
applies_to: [naming, text, image]
channel: [TV, SNS, OOH, APP_PUSH, WEB]
effective_from: 2020-01-01
effective_to:
---
판정 포인트: 선거 캘린더에 해당하는 게시 예정일이면 정당·후보 연상 색·숫자·슬로건을 위험으로 본다.

---
chunk_id: memorial-001
category_group: TIMING_RISK
sub_code: MEMORIAL_CONFLICT
source_type: internal
source_title: "[TODO] 추모일·국가 애도 기간 가이드"
source_ref: "TODO: 사내 시의성 캘린더"
severity_default: med
applies_to: [naming, text, image]
channel: [TV, SNS, OOH, APP_PUSH, WEB]
effective_from: 2020-01-01
effective_to:
---
판정 포인트: 게시 예정일이 국가 추모일·재난 애도 기간과 겹치면 경쾌한 톤·할인 강조는 MEMORIAL_CONFLICT.
