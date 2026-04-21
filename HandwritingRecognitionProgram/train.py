"""
Train the CNN model on MNIST and save it to disk.
Run this script once before launching the GUI app.
"""

import os
import urllib.request
import gzip
import struct
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset

from model import DigitCNN

MODEL_PATH = "digit_model.pth"
DATA_DIR = "mnist_data"

MNIST_URLS = {
    "train_images": "https://storage.googleapis.com/cvdf-datasets/mnist/train-images-idx3-ubyte.gz",
    "train_labels": "https://storage.googleapis.com/cvdf-datasets/mnist/train-labels-idx1-ubyte.gz",
    "test_images":  "https://storage.googleapis.com/cvdf-datasets/mnist/t10k-images-idx3-ubyte.gz",
    "test_labels":  "https://storage.googleapis.com/cvdf-datasets/mnist/t10k-labels-idx1-ubyte.gz",
}


def download_mnist():
    """Download MNIST dataset files if not already present."""
    os.makedirs(DATA_DIR, exist_ok=True)
    for name, url in MNIST_URLS.items():
        dest = os.path.join(DATA_DIR, f"{name}.gz")
        if not os.path.exists(dest):
            print(f"Downloading {name}...")
            urllib.request.urlretrieve(url, dest)
    print("Download complete.")


def load_images(path):
    """Read MNIST image file in IDX3 format."""
    with gzip.open(path, "rb") as f:
        magic, n, rows, cols = struct.unpack(">IIII", f.read(16))
        data = np.frombuffer(f.read(), dtype=np.uint8)
    return data.reshape(n, rows, cols)


def load_labels(path):
    """Read MNIST label file in IDX1 format."""
    with gzip.open(path, "rb") as f:
        struct.unpack(">II", f.read(8))
        data = np.frombuffer(f.read(), dtype=np.uint8)
    return data


def build_datasets():
    """Load MNIST files and return PyTorch TensorDatasets."""
    train_images = load_images(os.path.join(DATA_DIR, "train_images.gz"))
    train_labels = load_labels(os.path.join(DATA_DIR, "train_labels.gz"))
    test_images  = load_images(os.path.join(DATA_DIR, "test_images.gz"))
    test_labels  = load_labels(os.path.join(DATA_DIR, "test_labels.gz"))

    # Normalize to [0, 1] and add channel dimension
    def to_tensor(imgs, lbls):
        x = torch.tensor(imgs, dtype=torch.float32).unsqueeze(1) / 255.0
        y = torch.tensor(lbls, dtype=torch.long)
        return TensorDataset(x, y)

    return to_tensor(train_images, train_labels), to_tensor(test_images, test_labels)


def train():
    """Train the CNN and save the best model weights."""
    download_mnist()
    train_ds, test_ds = build_datasets()

    train_loader = DataLoader(train_ds, batch_size=128, shuffle=True, num_workers=0)
    test_loader  = DataLoader(test_ds,  batch_size=256, shuffle=False, num_workers=0)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Training on: {device}")

    model = DigitCNN().to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=1e-3)
    scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=3, gamma=0.5)

    best_acc = 0.0
    epochs = 10

    for epoch in range(1, epochs + 1):
        # --- Training ---
        model.train()
        total_loss = 0.0
        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)
            optimizer.zero_grad()
            loss = criterion(model(images), labels)
            loss.backward()
            optimizer.step()
            total_loss += loss.item()

        # --- Evaluation ---
        model.eval()
        correct = 0
        with torch.no_grad():
            for images, labels in test_loader:
                images, labels = images.to(device), labels.to(device)
                preds = model(images).argmax(dim=1)
                correct += (preds == labels).sum().item()

        acc = correct / len(test_ds) * 100
        scheduler.step()

        print(f"Epoch {epoch:2d}/{epochs}  loss={total_loss/len(train_loader):.4f}  test_acc={acc:.2f}%")

        if acc > best_acc:
            best_acc = acc
            torch.save(model.state_dict(), MODEL_PATH)
            print(f"  -> Saved model (best acc: {best_acc:.2f}%)")

    print(f"\nTraining done. Best accuracy: {best_acc:.2f}%")
    print(f"Model saved to: {MODEL_PATH}")


if __name__ == "__main__":
    train()
