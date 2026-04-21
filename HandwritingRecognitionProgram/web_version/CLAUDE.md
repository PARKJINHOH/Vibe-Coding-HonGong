# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 명령어

```bash
# 1. 모델 학습 (git에서 제외된 파일 — 최초 1회 실행 필수)
cd ../desktop_version
py train.py
cp digit_model.pth ../web_version/digit_model.pth
cd ../web_version

# 2. Flask 서버 실행 (http://localhost:5000)
py app.py
```

## Git 제외 파일

| 제외 항목 | 이유 | 생성 방법 |
|-----------|------|-----------|
| `digit_model.pth` | 학습으로 생성되는 6.5MB 바이너리 | 위 학습 명령 후 복사 |
| `__pycache__/` | Python 컴파일 캐시 | 자동 생성 |

## 아키텍처

Flask 백엔드 + Vanilla JS 프론트엔드의 2계층 구조입니다.

```
web_version/
├── app.py            # Flask 서버 + /predict API
├── model.py          # DigitCNN 정의 (desktop_version과 동일)
├── digit_model.pth   # 학습된 가중치 (git 제외 — 직접 생성 필요)
└── static/
    └── index.html    # 드로잉 캔버스 + 결과 표시 (단일 파일 SPA)
```

**`app.py`** — Flask 서버. 두 라우트만 존재:
- `GET /` → `static/index.html` 서빙
- `POST /predict` → base64 PNG 수신 → 전처리 → `DigitCNN` 추론 → `{predicted, confidence, probabilities}` JSON 반환

**전처리 흐름** (`preprocess` 함수): base64 디코딩 → RGBA→흰 배경 합성→그레이스케일 → 가우시안 블러(radius=1) → LANCZOS 28×28 리사이즈 → `[0,1]` 정규화 → `(1,1,28,28)` 텐서.

**`static/index.html`** — 외부 의존성 없는 순수 HTML/CSS/JS. HTML5 Canvas로 마우스·터치 드로잉 구현, `fetch('/predict')`로 서버 호출, 응답을 받아 예측 숫자와 0~9 확률 바 차트를 동적으로 업데이트.

## 주요 사항

- **CORS 불필요**: Flask가 정적 파일도 직접 서빙하므로 동일 출처.
- **이미지 전송**: 캔버스의 `canvas.toDataURL('image/png')`를 JSON body에 담아 POST. 서버에서 base64 헤더(`data:image/png;base64,`)를 분리 후 디코딩.
- **투명 배경 처리**: 브라우저 캔버스는 RGBA 이미지를 반환하므로, 서버에서 흰 배경에 합성한 뒤 그레이스케일로 변환.
- **모델 공유**: `model.py` 구조는 `desktop_version`과 동일 — `digit_model.pth`를 재학습 없이 복사해서 사용 가능.
