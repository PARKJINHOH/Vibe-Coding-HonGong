import os
import io
import time
import base64
import requests
from PIL import Image, ImageDraw, ImageFont
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("OPENROUTER_API_KEY")
MODEL = "google/gemma-4-31b-it:free"

# 테스트용 이미지 프로그래밍 방식으로 생성
print("=== 이미지 인식 테스트 ===")
print(f"모델: {MODEL}")

# 간단한 텍스트가 있는 이미지 생성
img = Image.new("RGB", (400, 200), color=(30, 60, 120))
draw = ImageDraw.Draw(img)
draw.rectangle([10, 10, 390, 190], outline=(255, 255, 100), width=4)
draw.text((120, 70), "Hello, Gemma!", fill=(255, 255, 255))
draw.text((110, 110), "Image Recognition Test", fill=(200, 200, 200))

buf = io.BytesIO()
img.save(buf, format="PNG")
img_bytes = buf.getvalue()
img_b64 = base64.b64encode(img_bytes).decode("utf-8")
print(f"이미지 생성 완료 (크기: {len(img_bytes)} bytes, 400x200 PNG)\n")

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json",
}

payload = {
    "model": MODEL,
    "messages": [
        {
            "role": "user",
            "content": [
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/png;base64,{img_b64}"
                    }
                },
                {
                    "type": "text",
                    "text": "이 이미지에 무엇이 보이는지 한국어로 자세히 설명해줘. 텍스트, 색상, 도형 등 보이는 모든 것을 묘사해줘."
                }
            ]
        }
    ]
}

for attempt in range(4):
    if attempt > 0:
        wait = 20 * attempt
        print(f"[시도 {attempt+1}/4] Rate limit - {wait}초 후 재시도...")
        time.sleep(wait)

    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers=headers,
        json=payload,
        timeout=60
    )
    data = response.json()

    if response.status_code == 200:
        print(f"[성공] Status: {response.status_code}")
        print(f"사용 모델: {data['model']}")
        print(f"응답:\n{data['choices'][0]['message']['content']}")
        if 'usage' in data:
            u = data['usage']
            print(f"\n토큰 사용: 입력 {u.get('prompt_tokens','-')} / 출력 {u.get('completion_tokens','-')}")
        break
    elif response.status_code == 429:
        err = data.get('error', {})
        print(f"  Rate limit 응답: {err.get('message', data)}")
    else:
        print(f"[오류] Status: {response.status_code}")
        print(data)
        break
else:
    print("\n모든 재시도 실패 - 무료 모델의 rate limit이 지속되고 있습니다.")
    print("잠시 후(1~2분) 다시 실행하거나 유료 모델 사용을 고려하세요.")
