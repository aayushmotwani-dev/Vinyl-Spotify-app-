import cv2
import numpy as np

themes = [
    ('classic', 'c:/Users/aayus/OneDrive/Desktop/vinyl app/apps/web/public/themes/classic.png'),
    ('transparent', 'c:/Users/aayus/OneDrive/Desktop/vinyl app/apps/web/public/themes/transparent.png'),
    ('cyberpunk', 'c:/Users/aayus/OneDrive/Desktop/vinyl app/apps/web/public/themes/cyberpunk.png'),
    ('neon-synth', 'c:/Users/aayus/OneDrive/Desktop/vinyl app/apps/web/public/themes/neon-synth.png')
]

for name, path in themes:
    img = cv2.imread(path)
    if img is None: continue
    
    h_orig, w_orig, _ = img.shape
    w = 800
    h = int(h_orig * (w / w_orig))
    small = cv2.resize(img, (w, h))
    gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
    
    print(f"\n--- {name.upper()} ---")
    
    # 1. Platter (Left Half)
    roi_platter = gray[:, :int(w*0.65)]
    circles = cv2.HoughCircles(roi_platter, cv2.HOUGH_GRADIENT, dp=1, minDist=50, param1=50, param2=30, minRadius=int(w*0.2), maxRadius=int(w*0.35))
    if circles is not None:
        c = circles[0][0]
        print(f"Platter: x={c[0]/w*100:.2f}%, y={c[1]/h*100:.2f}%, size={c[2]*2/w*100:.2f}%")

    # 2. Tonearm Pivot (Top Right ROI)
    roi_pivot = gray[int(h*0.15):int(h*0.45), int(w*0.70):int(w*0.95)]
    edges = cv2.Canny(roi_pivot, 50, 150)
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    best_circ = 0
    best_circle = None
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area < 20: continue
        perimeter = cv2.arcLength(cnt, True)
        if perimeter == 0: continue
        circ = 4 * np.pi * (area / (perimeter * perimeter))
        if circ > best_circ:
            best_circ = circ
            best_circle = cnt
    if best_circle is not None:
        (cx, cy), radius = cv2.minEnclosingCircle(best_circle)
        abs_x = (cx + int(w*0.70)) / w * 100
        abs_y = (cy + int(h*0.15)) / h * 100
        print(f"Tonearm Pivot: x={abs_x:.2f}%, y={abs_y:.2f}% (circ: {best_circ:.2f})")

    # 3. Start/Stop (Bottom Left ROI)
    roi_start = gray[int(h*0.75):int(h*0.95), int(w*0.10):int(w*0.35)]
    _, thresh = cv2.threshold(roi_start, 100, 255, cv2.THRESH_BINARY)
    contours, _ = cv2.findContours(thresh, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    best_area = 0
    best_rect = None
    for cnt in contours:
        rx, ry, bw, bh = cv2.boundingRect(cnt)
        area = bw * bh
        if 0.5 < bw/bh < 2.0 and area > (w*h*0.001):
            if area > best_area:
                best_area = area
                best_rect = (rx, ry, bw, bh)
    if best_rect:
        rx, ry, bw, bh = best_rect
        abs_x = (rx + bw/2 + int(w*0.10)) / w * 100
        abs_y = (ry + bh/2 + int(h*0.75)) / h * 100
        print(f"Start/Stop: x={abs_x:.2f}%, y={abs_y:.2f}%, w={bw/w*100:.2f}%, h={bh/h*100:.2f}%")
        print(f"RPM 33 approx x%: {(rx + bw + int(w*0.10) + int(w*0.02))/w*100:.2f}%")
