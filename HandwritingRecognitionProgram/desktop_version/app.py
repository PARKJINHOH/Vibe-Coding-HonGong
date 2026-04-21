"""
Handwritten digit recognition GUI app.
Draw a digit (0-9) on the canvas, then click Recognize.
Requires a trained model at digit_model.pth (run train.py first).
"""

import os
import sys
import tkinter as tk
from tkinter import messagebox, font as tkfont

import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image, ImageDraw, ImageFilter

from model import DigitCNN

# Resolve the base directory whether running as a script or a PyInstaller exe
if getattr(sys, "frozen", False):
    BASE_DIR = os.path.dirname(sys.executable)
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(BASE_DIR, "digit_model.pth")

# Canvas drawing area in pixels
CANVAS_SIZE = 100
# MNIST model input size
MODEL_INPUT = 28
# Brush radius in pixels
BRUSH_RADIUS = 6


def load_model(device: torch.device) -> DigitCNN:
    """Load trained weights into the CNN model."""
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            f"Model file '{MODEL_PATH}' not found.\n"
            "Please run  py train.py  first to train the model."
        )
    model = DigitCNN().to(device)
    model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
    model.eval()
    return model


def preprocess_canvas(pil_img: Image.Image) -> torch.Tensor:
    """
    Convert the canvas PIL image to a normalised [1,1,28,28] tensor
    that matches the MNIST preprocessing used during training.
    """
    # Convert to grayscale
    gray = pil_img.convert("L")

    # Slightly blur to reduce aliasing from the brush strokes
    gray = gray.filter(ImageFilter.GaussianBlur(radius=1))

    # Resize to 28x28 using high-quality resampling
    resized = gray.resize((MODEL_INPUT, MODEL_INPUT), Image.LANCZOS)

    arr = np.array(resized, dtype=np.float32) / 255.0
    tensor = torch.tensor(arr).unsqueeze(0).unsqueeze(0)  # (1,1,28,28)
    return tensor


class App(tk.Tk):
    """Main application window."""

    def __init__(self, model: DigitCNN, device: torch.device):
        super().__init__()
        self.model = model
        self.device = device

        self.title("Handwritten Digit Recognition")
        self.resizable(False, False)

        self._build_ui()
        self._reset_canvas_image()

    # ------------------------------------------------------------------
    # UI construction
    # ------------------------------------------------------------------

    def _build_ui(self):
        pad = {"padx": 10, "pady": 6}

        # Title label
        title_font = tkfont.Font(family="Helvetica", size=14, weight="bold")
        tk.Label(self, text="Draw a digit (0–9)", font=title_font).pack(**pad)

        # Drawing canvas (white background)
        self.canvas = tk.Canvas(
            self,
            width=CANVAS_SIZE,
            height=CANVAS_SIZE,
            bg="white",
            cursor="crosshair",
            relief=tk.SUNKEN,
            bd=2,
        )
        self.canvas.pack(padx=10)
        self.canvas.bind("<B1-Motion>", self._on_draw)
        self.canvas.bind("<ButtonRelease-1>", self._on_release)

        # Result display
        result_frame = tk.Frame(self)
        result_frame.pack(**pad)

        tk.Label(result_frame, text="Predicted digit:", font=("Helvetica", 12)).pack(side=tk.LEFT)

        self.result_var = tk.StringVar(value="—")
        result_font = tkfont.Font(family="Helvetica", size=36, weight="bold")
        tk.Label(result_frame, textvariable=self.result_var, font=result_font, fg="#2563EB", width=2).pack(side=tk.LEFT)

        # Confidence bar
        self.conf_var = tk.StringVar(value="")
        tk.Label(self, textvariable=self.conf_var, font=("Helvetica", 10), fg="#6B7280").pack()

        # Probability bars for all 10 digits
        self.prob_frame = tk.Frame(self)
        self.prob_frame.pack(padx=10, pady=4)
        self._build_prob_bars()

        # Buttons
        btn_frame = tk.Frame(self)
        btn_frame.pack(**pad)
        tk.Button(
            btn_frame, text="Recognize", width=12, bg="#2563EB", fg="white",
            font=("Helvetica", 11, "bold"), command=self._recognize,
        ).pack(side=tk.LEFT, padx=4)
        tk.Button(
            btn_frame, text="Clear", width=10,
            font=("Helvetica", 11), command=self._clear,
        ).pack(side=tk.LEFT, padx=4)

    def _build_prob_bars(self):
        """Create a small bar chart showing per-digit probabilities."""
        self.bar_vars = []
        self.bar_labels = []
        for digit in range(10):
            row = tk.Frame(self.prob_frame)
            row.pack(fill=tk.X, pady=1)
            tk.Label(row, text=str(digit), width=2, font=("Helvetica", 9)).pack(side=tk.LEFT)
            var = tk.DoubleVar(value=0.0)
            self.bar_vars.append(var)
            bar = tk.Canvas(row, width=200, height=14, bg="#E5E7EB", highlightthickness=0)
            bar.pack(side=tk.LEFT, padx=2)
            self.bar_labels.append(bar)
            tk.Label(row, text="", width=6, font=("Helvetica", 9), anchor="w").pack(side=tk.LEFT)

    # ------------------------------------------------------------------
    # Canvas drawing logic
    # ------------------------------------------------------------------

    def _reset_canvas_image(self):
        """Create a blank PIL image that mirrors the canvas for inference."""
        self.pil_image = Image.new("RGB", (CANVAS_SIZE, CANVAS_SIZE), "white")
        self.pil_draw = ImageDraw.Draw(self.pil_image)
        self.last_xy = None

    def _on_draw(self, event):
        x, y = event.x, event.y
        r = BRUSH_RADIUS

        if self.last_xy:
            lx, ly = self.last_xy
            # Draw on canvas widget
            self.canvas.create_line(lx, ly, x, y, fill="black", width=r * 2,
                                    capstyle=tk.ROUND, joinstyle=tk.ROUND, smooth=True)
            # Mirror to PIL image for preprocessing
            self.pil_draw.line([lx, ly, x, y], fill="black", width=r * 2)

        # Draw filled circle at current position for smooth stroke ends
        self.canvas.create_oval(x - r, y - r, x + r, y + r, fill="black", outline="black")
        self.pil_draw.ellipse([x - r, y - r, x + r, y + r], fill="black")

        self.last_xy = (x, y)

    def _on_release(self, _event):
        self.last_xy = None

    # ------------------------------------------------------------------
    # Recognition
    # ------------------------------------------------------------------

    def _recognize(self):
        """Run the model on the current canvas image and display results."""
        tensor = preprocess_canvas(self.pil_image).to(self.device)

        with torch.no_grad():
            logits = self.model(tensor)
            probs = F.softmax(logits, dim=1).squeeze().cpu().numpy()

        predicted = int(probs.argmax())
        confidence = float(probs[predicted]) * 100

        self.result_var.set(str(predicted))
        self.conf_var.set(f"Confidence: {confidence:.1f}%")

        # Update probability bar chart
        max_p = float(probs.max())
        for digit in range(10):
            p = float(probs[digit])
            bar_width = int((p / max(max_p, 1e-6)) * 200)
            color = "#2563EB" if digit == predicted else "#93C5FD"
            bar = self.bar_labels[digit]
            bar.delete("all")
            bar.create_rectangle(0, 0, bar_width, 14, fill=color, outline="")
            bar.create_text(204, 7, text=f"{p*100:.1f}%", anchor="w",
                            font=("Helvetica", 9), fill="#374151")

    def _clear(self):
        """Clear the canvas and reset all results."""
        self.canvas.delete("all")
        self._reset_canvas_image()
        self.result_var.set("—")
        self.conf_var.set("")
        for bar in self.bar_labels:
            bar.delete("all")


def main():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    try:
        model = load_model(device)
    except FileNotFoundError as e:
        root = tk.Tk()
        root.withdraw()
        messagebox.showerror("Model Not Found", str(e))
        root.destroy()
        return

    print(f"Model loaded. Running on: {device}")
    app = App(model, device)
    app.mainloop()


if __name__ == "__main__":
    main()
