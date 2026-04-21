# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 명령어

```bash
# 1. 모델 학습 (git에서 제외된 파일 — 최초 1회 실행 필수)
py train.py

# 2. GUI 앱 실행
py app.py

# 3. 독립 실행형 Windows exe 빌드 (build/, dist/ 는 git 제외)
py -m PyInstaller --noconfirm --onefile --windowed --name "HandwritingRecognition" --add-data "digit_model.pth;." app.py
cp digit_model.pth dist/digit_model.pth
```

## Git 제외 파일

| 제외 항목 | 이유 | 생성 방법 |
|-----------|------|-----------|
| `digit_model.pth` | 학습으로 생성되는 6.5MB 바이너리 | `py train.py` |
| `mnist_data/` | 학습 시 자동 다운로드되는 데이터셋 | `py train.py` 실행 시 자동 생성 |
| `build/`, `dist/` | PyInstaller 빌드 산출물 | 위 빌드 명령 실행 시 자동 생성 |
| `__pycache__/` | Python 컴파일 캐시 | 자동 생성 |

## 아키텍처

세 파일이 명확한 의존 순서를 가집니다: `model.py` → `train.py` → `app.py`

**`model.py`** — `DigitCNN` 정의. 3단 합성곱(conv1→conv2→pool→conv3→pool→fc1→fc2) CNN. 입력: `(B, 1, 28, 28)` 정규화 float, 출력: 10클래스 logits.

**`train.py`** — MNIST IDX 바이너리를 직접 다운로드(torchvision 미사용), `struct`/`gzip` 파싱, Adam + StepLR로 10 에포크 학습, 최고 정확도 체크포인트를 `digit_model.pth`로 저장.

**`app.py`** — tkinter 드로잉 캔버스 GUI. "Recognize" 클릭 시 PIL 이미지 → 그레이스케일 → 가우시안 블러 → LANCZOS 28×28 리사이즈 → `[0,1]` 정규화 → `DigitCNN` 추론. 예측 숫자와 10클래스 확률 바 차트 표시.

## 주요 사항

- **Python 버전**: 3.14. TensorFlow 미지원 — PyTorch CPU 사용.
- **모델 경로**: `app.py`는 스크립트 실행 시 `__file__` 기준, PyInstaller exe 실행 시 `sys.executable` 기준으로 `digit_model.pth`를 탐색 (`sys.frozen` 분기).
- **캔버스 크기**: `CANVAS_SIZE = 100` px, `BRUSH_RADIUS = 6` px. 캔버스를 미러링하는 PIL 이미지도 동일 크기 — 두 값 항상 동기화.
- **배포**: `dist/HandwritingRecognition.exe`와 `dist/digit_model.pth`는 반드시 같은 폴더에 위치 (dist/ 는 git 제외이므로 직접 빌드 필요).
