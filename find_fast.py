import cv2
import numpy as np

files = [
    'c:/Users/aayus/OneDrive/Desktop/vinyl app/apps/web/public/themes/classic.png',
    'c:/Users/aayus/OneDrive/Desktop/vinyl app/apps/web/public/themes/transparent.png',
    'c:/Users/aayus/OneDrive/Desktop/vinyl app/apps/web/public/themes/cyberpunk.png'
]

for f in files:
    img = cv2.imread(f)
    if img is None:
        continue
    
    h, w, _ = img.shape
    # Scale down to width 800 for speed
    scale = 800 / w
    small = cv2.resize(img, (800, int(h * scale)))
    sh, sw, _ = small.shape
    
    gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
    circles = cv2.HoughCircles(gray, cv2.HOUGH_GRADIENT, 1, 50, param1=50, param2=30, minRadius=int(sw*0.2), maxRadius=int(sw*0.4))
    if circles is not None:
        c = circles[0][0]
        # c is in small coordinates, but since we want percentages, it's the same!
        print(f"{f.split('/')[-1]}: cx%={c[0]/sw*100:.1f}, cy%={c[1]/sh*100:.1f}, size%={c[2]*2/sw*100:.1f}")
    else:
        print(f"{f.split('/')[-1]}: Platter Not found")
