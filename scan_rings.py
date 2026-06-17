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
    
    # Extract a horizontal slice starting from center and moving left
    slice_left = gray[cy, :cx][::-1] # Reverse so index 0 is center, index N is left edge
    
    # We want to find the strong edges. The vinyl placeholder usually has a distinct lip/edge.
    # We will look at the gradient (difference between adjacent pixels)
    grad = np.abs(np.diff(slice_left.astype(np.int32)))
    
    # The strobe dots on SL-1200 are near the outer edge. The inner placeholder is before the dots.
    # Find all prominent peaks in the gradient
    peaks = []
    for i in range(10, len(grad)-10):
        if grad[i] > 20 and grad[i] == np.max(grad[i-5:i+5]):
            peaks.append((i, grad[i]))
            
    # Print the peaks as percentages of width
    print(f"\n--- {name.upper()} ---")
    for radius, intensity in peaks[:10]: # Look at first 10 peaks moving outwards from center
        radius_pct = (radius / w) * 100
        diam_pct = radius_pct * 2
        print(f"Edge at radius {radius_pct:.2f}% (Diameter: {diam_pct:.2f}%) - intensity {intensity}")
