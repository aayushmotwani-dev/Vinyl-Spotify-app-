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
    
    # We want to find the spindle. It's a small circle very close to (cx, cy)
    # Let's take a 100x100 ROI around the estimated center
    roi = gray[cy-50:cy+50, cx-50:cx+50]
    
    # Apply blur
    blur = cv2.GaussianBlur(roi, (5, 5), 0)
    
    # Find circles
    circles = cv2.HoughCircles(blur, cv2.HOUGH_GRADIENT, dp=1, minDist=10, param1=50, param2=15, minRadius=2, maxRadius=20)
    
    print(f"\n--- {name.upper()} ---")
    if circles is not None:
        # Get the circle closest to the center of the ROI (50, 50)
        closest = None
        min_dist = 9999
        for c in circles[0]:
            dist = (c[0]-50)**2 + (c[1]-50)**2
            if dist < min_dist:
                min_dist = dist
                closest = c
        
        final_cx = cx - 50 + closest[0]
        final_cy = cy - 50 + closest[1]
        print(f"Spindle Center: x={final_cx/w*100:.3f}%, y={final_cy/h*100:.3f}%, radius={closest[2]:.1f}px")
    else:
        # Fallback: find brightest spot
        min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(blur)
        final_cx = cx - 50 + max_loc[0]
        final_cy = cy - 50 + max_loc[1]
        print(f"Fallback Brightest: x={final_cx/w*100:.3f}%, y={final_cy/h*100:.3f}%")
