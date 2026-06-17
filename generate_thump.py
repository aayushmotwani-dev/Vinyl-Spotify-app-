import wave, math, random, struct
import os

sample_rate = 44100
duration = 0.3

out_path = "apps/web/public/thump.wav"
os.makedirs(os.path.dirname(out_path), exist_ok=True)

with wave.open(out_path, "w") as f:
    f.setnchannels(1)
    f.setsampwidth(2)
    f.setframerate(sample_rate)
    
    for i in range(int(sample_rate * duration)):
        t = float(i) / sample_rate
        
        # Low frequency thump (decaying sine wave)
        freq = 40 * math.exp(-t * 10)
        envelope_thump = math.exp(-t * 15)
        thump = math.sin(2 * math.pi * freq * t) * envelope_thump * 0.9
        
        # Click (short burst of noise at the very beginning)
        envelope_click = math.exp(-t * 300)
        click = random.uniform(-1, 1) * envelope_click * 0.6
        
        # Subtle crackle body
        envelope_crackle = math.exp(-t * 8)
        crackle = random.uniform(-0.05, 0.05) * envelope_crackle
        
        val = thump + click + crackle
        val = max(-1.0, min(1.0, val))
        data = struct.pack('<h', int(val * 32767))
        f.writeframesraw(data)

print(f"Generated CC0 thump sound at {out_path}")
