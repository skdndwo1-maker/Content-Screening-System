아래 콘텐츠를 검수해 Findings를 반환하세요.

### 검수 맥락
- 캠페인명: {{campaign}}
- 게시 예정일: {{date}}
- 게시 채널: {{channels}}
- 매핑 채널: {{mappedChannels}}
- 주요 타겟: {{targets}}
- 콘텐츠 유형: {{type}}
- 입력 탭: {{tab}}
- 배경·의도: {{intent}}

### 활성 검수 기준 (code — 설명)
{{criteria}}

### 규정 근거 청크 (RAG)
{{rag}}

### 판정 규칙 (01→09)
{{rules}}

### 검수 대상
{{content}}

### 원문 (줄 번호)
{{numberedSource}}

### 은닉 탐지 후보 (코드 엔진)
글자 조합은 코드가 이미 수행했다. 후보에 없는 단어를 만들지 마라.
각 후보가 구조·강조·부자연스러움·캡처 확산 설득력을 갖는지 판단하라. 설득력이 있으면 최소 주의.
애매하면 unverified.
{{hiddenCandidates}}

### 출력
responseSchema에 맞는 JSON 객체만 반환. 설명·마크다운·코드블록 금지.
findings[].category는 활성 기준 code 중 하나여야 한다.
citedChunkIds에는 실제로 인용한 chunk_id만 넣는다.
hiddenJudgments는 위 후보 term/path_id만 사용한다.
openSearch는 새 읽기 방법이 있을 때만, rule + positions + result를 넣고 코드가 재현 가능한 것만 유효하다.
