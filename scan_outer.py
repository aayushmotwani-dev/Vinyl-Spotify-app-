import cv2
import numpy as np

themes = [
    ('classic', 'c:/Users/aayus/OneDrive/Desktop/vinyl app/apps/web/public/themes/classic.png', 47.09, 47.36),
    ('transparent', 'c:/Users/aayus/OneDrive/Desktop/vinyl app/apps/web/public/themes/transparent.png', 46.30, 46.97),
    ('cyberpunk', 'c:/Users/aayus/OneDrive/Desktop/vinyl app/apps/web/public/themes/cyberpunk.png', 46.31, 47.23),
    ('neon-synth', 'c:/Users/aayus/OneDrive/Desktop/vinyl app/apps/web/public/themes/neon-synth.png', 48.8, 50.0)
]

for name, path, cx_pct, cy_pct in themes:
    img = cv2.imread(path)
    if img is None: continue
    h, w, _ = img.shape
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    cx = int(w * cx_pct / 100)
    cy = int(h * cy_pct / 100)
    
    # We want to find edges between r=20% and r=28%
    # This corresponds to sizes between 40% and 56%
    min_r = int(w * 0.20)
    max_r = int(w * 0.28)
    
    slice_left = gray[cy, cx-max_r:cx-min_r][::-1] # reversed so index 0 is at min_r, index N is at max_r
    
    grad = np.abs(np.diff(slice_left.astype(np.int32)))
    
    peaks = []
    for i in range(5, len(grad)-5):
        if grad[i] > 10 and grad[i] == np.max(grad[i-3:i+3]):
            peaks.append((i, grad[i]))
            
    print(f"\n--- {name.upper()} ---")
    # Sort peaks by intensity descending
    peaks.sort(key=lambda x: x[1], reverse=True)
    for i, intensity in peaks[:5]:
        r = min_r + i
        r_pct = (r / w) * 100
        size_pct = r_pct * 2
        print(f"Edge at size {size_pct:.2f}% (radius {r_pct:.2f}%) - intensity {intensity}")

