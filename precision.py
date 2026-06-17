import cv2
import numpy as np

img = cv2.imread('c:/Users/aayus/OneDrive/Desktop/vinyl app/apps/web/public/themes/classic.png')
h, w, _ = img.shape
print(f"Image: {w}x{h}")

gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# Find Platter (large circle)
circles = cv2.HoughCircles(gray, cv2.HOUGH_GRADIENT, 1, 50, param1=50, param2=30, minRadius=int(w*0.2), maxRadius=int(w*0.4))
if circles is not None:
    c = circles[0][0]
    print(f"Platter: cx%={c[0]/w*100:.2f}, cy%={c[1]/h*100:.2f}, size%={c[2]*2/w*100:.2f}")

# Find Tonearm Pivot base (medium circle on the right)
right_half = gray[:, int(w*0.6):]
circles_right = cv2.HoughCircles(right_half, cv2.HOUGH_GRADIENT, 1, 20, param1=50, param2=30, minRadius=int(w*0.05), maxRadius=int(w*0.15))
if circles_right is not None:
    # Get the highest circle (smallest y) which should be the pivot recess
    c2 = sorted(circles_right[0], key=lambda x: x[1])[0]
    print(f"Tonearm Pivot: cx%={(c2[0] + int(w*0.6))/w*100:.2f}, cy%={c2[1]/h*100:.2f}")

# Find Start/Stop Button (rectangle in bottom left)
bottom_left = gray[int(h*0.7):, :int(w*0.3)]
_, thresh = cv2.threshold(bottom_left, 100, 255, cv2.THRESH_BINARY)
contours, _ = cv2.findContours(thresh, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
# Look for a rectangular contour of appropriate size
for cnt in sorted(contours, key=cv2.contourArea, reverse=True):
    x,y,bw,bh = cv2.boundingRect(cnt)
    if 0.05 < bw/w < 0.15 and 0.05 < bh/h < 0.15:
        # found it
        print(f"Start/Stop: cx%={(x + bw/2)/w*100:.2f}, cy%={(y + bh/2 + int(h*0.7))/h*100:.2f}, w%={bw/w*100:.2f}, h%={bh/h*100:.2f}")
        
        # 33/45 buttons are to the right
        print(f"RPM 33 approx cx%: {(x + bw + int(w*0.02))/w*100:.2f}")
        break

