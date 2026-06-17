import cv2
import numpy as np

themes = [
    ('classic', 'c:/Users/aayus/OneDrive/Desktop/vinyl app/apps/web/public/themes/classic.png'),
    ('transparent', 'c:/Users/aayus/OneDrive/Desktop/vinyl app/apps/web/public/themes/transparent.png'),
    ('cyberpunk', 'c:/Users/aayus/OneDrive/Desktop/vinyl app/apps/web/public/themes/cyberpunk.png')
]

# Initial Guesses
g_platter = (46.6, 47.5)
g_tonearm = (78.5, 26.5)
g_startstop = (25.2, 85.6)

for name, path in themes:
    img = cv2.imread(path)
    if img is None: continue
    h, w, _ = img.shape
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    print(f"\n--- {name.upper()} ---")

    # 1. Snap Platter
    px, py = int(g_platter[0]*w/100), int(g_platter[1]*h/100)
    roi_p = gray[max(0, py-100):min(h, py+100), max(0, px-100):min(w, px+100)]
    circles = cv2.HoughCircles(roi_p, cv2.HOUGH_GRADIENT, dp=1, minDist=20, param1=50, param2=20, minRadius=5, maxRadius=100)
    if circles is not None:
        # Find circle closest to center of ROI
        closest = min(circles[0], key=lambda c: (c[0]-100)**2 + (c[1]-100)**2)
        final_px = (px - 100 + closest[0]) / w * 100
        final_py = (py - 100 + closest[1]) / h * 100
        print(f"Platter Center: x={final_px:.2f}%, y={final_py:.2f}%")
    else:
        print("Platter Center: fallback to guess")
        final_px, final_py = g_platter

    # 2. Snap Tonearm Pivot
    tx, ty = int(g_tonearm[0]*w/100), int(g_tonearm[1]*h/100)
    roi_t = gray[max(0, ty-100):min(h, ty+100), max(0, tx-100):min(w, tx+100)]
    circles = cv2.HoughCircles(roi_t, cv2.HOUGH_GRADIENT, dp=1, minDist=20, param1=50, param2=20, minRadius=5, maxRadius=80)
    if circles is not None:
        closest = min(circles[0], key=lambda c: (c[0]-100)**2 + (c[1]-100)**2)
        final_tx = (tx - 100 + closest[0]) / w * 100
        final_ty = (ty - 100 + closest[1]) / h * 100
        print(f"Tonearm Pivot: x={final_tx:.2f}%, y={final_ty:.2f}%")
    else:
        print("Tonearm Pivot: fallback to guess")

    # 3. Snap Start/Stop
    sx, sy = int(g_startstop[0]*w/100), int(g_startstop[1]*h/100)
    roi_s = gray[max(0, sy-80):min(h, sy+80), max(0, sx-80):min(w, sx+80)]
    _, thresh = cv2.threshold(roi_s, 100, 255, cv2.THRESH_BINARY)
    contours, _ = cv2.findContours(thresh, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    best_dist = 9999
    final_sx, final_sy = g_startstop
    for cnt in contours:
        x, y, bw, bh = cv2.boundingRect(cnt)
        cx, cy = x + bw/2, y + bh/2
        dist = (cx-80)**2 + (cy-80)**2
        if dist < best_dist and 0.5 < bw/bh < 2.0 and bw*bh > 1000:
            best_dist = dist
            final_sx = (sx - 80 + cx) / w * 100
            final_sy = (sy - 80 + cy) / h * 100
            w_pct = bw/w*100
            h_pct = bh/h*100
    if best_dist != 9999:
        print(f"Start/Stop: x={final_sx:.2f}%, y={final_sy:.2f}%, w={w_pct:.2f}%, h={h_pct:.2f}%")
        print(f"RPM 33 approx: x={(final_sx + w_pct/2 + 2):.2f}%")
    else:
        print("Start/Stop: fallback to guess")

