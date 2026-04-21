# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 구조

손글씨 숫자 인식 프로그램을 두 가지 버전으로 제공합니다.

```
HandwritingRecognitionProgram/
├── desktop_version/   # tkinter GUI + PyInstaller exe
└── web_version/       # Flask 서버 + HTML5 Canvas 브라우저 앱
```

각 버전의 자세한 내용은 하위 폴더의 CLAUDE.md를 참고하세요.

## 공통 사항

- **모델**: 두 버전 모두 동일한 `DigitCNN` (3단 CNN, MNIST 학습, ~99% 정확도) 사용.
- **Python 버전**: 3.14. TensorFlow 미지원 — PyTorch CPU 사용.
- **모델 학습**: `desktop_version/train.py`에서 학습 후 `digit_model.pth`를 각 버전 폴더에 복사해서 사용.

## Git 제외 파일 (.gitignore)

아래 파일·폴더는 git에서 추적하지 않으므로, 클론 후 직접 생성해야 합니다.

| 제외 항목 | 생성 방법 |
|-----------|-----------|
| `digit_model.pth` | `py desktop_version/train.py` 실행 후 각 버전 폴더에 복사 |
| `mnist_data/` | `train.py` 실행 시 자동 다운로드 |
| `build/`, `dist/` | PyInstaller 빌드 시 자동 생성 |
| `__pycache__/`, `*.pyc` | Python 실행 시 자동 생성 |

## 버전별 실행 방법

```bash
# 1. 모델 학습 (최초 1회)
cd desktop_version
py train.py
cp digit_model.pth ../web_version/digit_model.pth

# 2. 데스크톱 버전 실행
py app.py

# 3. 웹 버전 실행 (브라우저: http://localhost:5000)
cd ../web_version
py app.py
```
