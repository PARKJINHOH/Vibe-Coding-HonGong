"""
Flask server for handwritten digit recognition.
Accepts a base64-encoded canvas image via POST /predict and returns
the predicted digit and per-class probabilities as JSON.
"""

import os
import io
import base64

import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image, ImageFilter
from flask import Flask, request, jsonify, send_from_directory

from model import DigitCNN

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "digit_model.pth")
STATIC_DIR = os.path.join(BASE_DIR, "static")

app = Flask(__name__, static_folder=STATIC_DIR)

# Load model once at startup
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = DigitCNN().to(device)
model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
model.eval()
print(f"Model loaded on {device}")


def preprocess(data_url: str) -> torch.Tensor:
    """
    Convert a base64 PNG data URL from the browser canvas to a
    normalised (1, 1, 28, 28) tensor matching MNIST preprocessing.
    """
    header, encoded = data_url.split(",", 1)
    img_bytes = base64.b64decode(encoded)
    img = Image.open(io.BytesIO(img_bytes)).convert("RGBA")

    # White background composite so transparent pixels become white
    background = Image.new("RGBA", img.size, (255, 255, 255, 255))
    background.paste(img, mask=img.split()[3])
    gray = background.convert("L")

    gray = gray.filter(ImageFilter.GaussianBlur(radius=1))
    resized = gray.resize((28, 28), Image.LANCZOS)

    arr = np.array(resized, dtype=np.float32) / 255.0
    return torch.tensor(arr).unsqueeze(0).unsqueeze(0).to(device)


@app.route("/")
def index():
    return send_from_directory(STATIC_DIR, "index.html")


@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json(force=True)
    image_data = data.get("image", "")

    if not image_data:
        return jsonify({"error": "No image data"}), 400

    tensor = preprocess(image_data)

    with torch.no_grad():
        logits = model(tensor)
        probs = F.softmax(logits, dim=1).squeeze().cpu().numpy()

    predicted = int(probs.argmax())
    return jsonify({
        "predicted": predicted,
        "confidence": round(float(probs[predicted]) * 100, 1),
        "probabilities": [round(float(p) * 100, 1) for p in probs],
    })


if __name__ == "__main__":
    app.run(debug=True, port=5000)
