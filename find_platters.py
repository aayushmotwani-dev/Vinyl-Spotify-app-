import cv2
import numpy as np
import sys

files = [
    'c:/Users/aayus/OneDrive/Desktop/vinyl app/apps/web/public/themes/classic.png',
    'c:/Users/aayus/OneDrive/Desktop/vinyl app/apps/web/public/themes/transparent.png',
    'c:/Users/aayus/OneDrive/Desktop/vinyl app/apps/web/public/themes/cyberpunk.png'
]

for f in files:
    img = cv2.imread(f)
    if img is None:
        print(f"Failed to load {f}")
        continue
    h, w, _ = img.shape
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    circles = cv2.HoughCircles(gray, cv2.HOUGH_GRADIENT, 1, 50, param1=50, param2=30, minRadius=int(w*0.2), maxRadius=int(w*0.4))
    if circles is not None:
        c = circles[0][0]
        print(f"{f}: {w}x{h}, Platter: cx%={c[0]/w*100:.1f}, cy%={c[1]/h*100:.1f}, r%={c[2]/w*100:.1f}")
    else:
        print(f"{f}: {w}x{h}, Platter: Not found")
