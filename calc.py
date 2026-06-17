import math

W = 1024
H = 650

def calc(name, px_pct, py_pct, tx_pct, ty_pct, r_size, arm_len, min_ang, max_ang):
    Cx = W * px_pct / 100
    Cy = H * py_pct / 100
    Tx = W * tx_pct / 100
    Ty = H * ty_pct / 100
    R_vinyl = W * r_size / 100 / 2
    R_label = R_vinyl * 0.32  # 32% diameter
    
    print(f"\n--- {name} ---")
    print(f"Vinyl R = {R_vinyl:.1f}, Label R = {R_label:.1f}")
    
    for label, ang in [("Min", min_ang), ("Max", max_ang)]:
        # Angle 0 means pointing straight down (ty + arm_len).
        # Positive angle means rotating counter-clockwise? Or clockwise?
        # In CSS, rotate(Xdeg) is clockwise.
        # So straight down is (0, arm_len).
        # Rotated by theta (in radians):
        # x' = -sin(theta) * arm_len  --> wait, if straight down is (0, L), rotating clockwise moves x left. So dx = -L * sin(theta)
        # y' = cos(theta) * arm_len   --> dy = L * cos(theta)
        # Let's verify: In Tonearm.tsx, transform-origin is `50% 50%` of the base. The arm extends UPWARDS?
        # Let's check Tonearm.css!
        pass

