import os
import time
import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("OPENROUTER_API_KEY")
MODEL = "google/gemma-4-31b-it:free"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json",
}

payload = {
    "model": MODEL,
    "messages": [
        {
            "role": "user",
            "content": "한국어로 대답해줘. 인공지능이란 무엇인지 2~3문장으로 간단히 설명해줘."
        }
    ]
}

print("=== 텍스트 인식 테스트 ===")
print(f"모델: {MODEL}\n")

for attempt in range(3):
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
        print(f"[시도 {attempt+1}/3] Rate limit - 10초 후 재시도...")
        time.sleep(10)
    else:
        print(f"[오류] Status: {response.status_code}")
        print(data)
        break
else:
    print("모든 재시도 실패 - rate limit이 지속되고 있습니다.")
