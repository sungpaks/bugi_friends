## 새 친구 스프라이트 생성/적용 기능

### 개요

- 팝업에서 레퍼런스 이미지를 업로드하고 Gemini 기반 API를 호출하여 48×48px × 5프레임 스프라이트 시트(PNG)를 생성합니다.
- 프레임 순서: [sitting, standing, walking0, walking1, walking2]
- 배경은 투명 PNG를 기대합니다.
- 생성된 시트는 chrome.storage.session에 Data URL로만 저장하며, 외부 파일 저장을 하지 않습니다.

### UI 흐름 (popup)

1. 이미지 업로드: 업로드 캔버스에서 미리보기 렌더링
2. API Key 입력: 저장 선택시 chrome.storage.local에 저장 (선택)
3. 생성하기: nanobanana.generateSprite 호출 → PNG Blob 수신 → Data URL 변환
4. 미리보기: 전체 시트와 5개 프레임을 캔버스로 렌더링 (원본 규격이 달라도 가로 5등분 정규화)
5. 지금 적용: APPLY_NEW_SPRITE 메시지 전송 (현재 페이지 내 모든 인스턴스 즉시 교체)

### 데이터 보관

- chrome.storage.session
  - generatedSpriteSheet: data URL (PNG)
  - generatedSpriteMeta: { frameSize: 48, frameCount: 5, orientation: 'horizontal'|'vertical' }
- 세션 종료 시 모두 휘발
- Blob URL이 필요한 경우 사용 후 URL.revokeObjectURL 처리 권장 (현재는 data URL 사용)

### 서비스 워커/콘텐츠 스크립트

- scripting.js: 팝업에서 APPLY_NEW_SPRITE 수신 → 현재 탭의 모든 인스턴스에 `reloadAssetsFromSession` 호출 (ISOLATED 월드에서 실행)
- declare-bugi.js:
  - initAssets: Storage API(session)에서 `generatedSpriteSheet`가 있으면 이를 최우선 적용. 없으면 `window.spriteSheet.loadFramesFromEitherSource(name)` → 최종적으로 기본 5장 PNG로 폴백
  - reloadAssetsFromSession: 세션 스프라이트 재적용 (세션 접근 불가 문맥은 조용히 무시)

### 스프라이트 판독 규칙

- 가로 시트: 240×48 → [0..4] 프레임을 x축으로 슬라이스
- 세로 시트: 48×240 → [0..4] 프레임을 y축으로 슬라이스
- 유효하지 않으면 가로로 간주해 5등분 후 48×48로 정규화, 그래도 실패 시 기본 5장 PNG로 폴백

### API 호출 규칙

- lib/nanobanana.js → generateSprite({ apiKey, referenceImageBlob, prompt? })
- TODO: 실제 Gemini/nanobanana 엔드포인트와 파라미터 명세 확정 필요

### 기타 노트

- 기본 에셋 사용 시 콘솔 경고/에러는 출력하지 않습니다(조용한 폴백).
- "지금 적용"은 스토리지(session)에 저장된 스프라이트를 모든 인스턴스에 반영할 뿐, 기본 햄부기 생성 로직의 캐릭터 종류는 바꾸지 않습니다.
