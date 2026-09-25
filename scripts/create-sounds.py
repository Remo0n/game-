"""Original, deterministic game sounds. No samples or external recordings."""
import math, random, struct, wave
from pathlib import Path
random.seed(14)
rate = 22050
out = Path(__file__).resolve().parent.parent / 'assets' / 'sounds'
out.mkdir(exist_ok=True)
for name, length in [('cut', .13), ('snap', .18), ('invalid', .16), ('complete', .72)]:
    samples = []
    for i in range(int(rate * length)):
        t = i / rate
        fade = min(1, t / .007) * min(1, (length-t) / .025)
        if name == 'cut':
            value = (random.uniform(-1, 1) * .24 + math.sin(2*math.pi*(900*t-1800*t*t))*.2) * math.exp(-t*24)
        elif name == 'snap':
            value = math.sin(2*math.pi*740*t) * math.exp(-t*25) * .5 + math.sin(2*math.pi*1480*t)*math.exp(-t*40)*.12
        elif name == 'invalid':
            value = math.sin(2*math.pi*220*t)*math.exp(-t*18)*.2
        else:
            value = 0
            for offset, freq in [(0, 523.25), (.13, 659.25), (.26, 783.99), (.39, 1046.5)]:
                age = t-offset
                if age >= 0: value += .26*math.sin(2*math.pi*freq*age)*math.exp(-age*9)*min(1, age/.009)
        samples.append(struct.pack('<h', round(max(-1, min(1, value*fade))*32767)))
    with wave.open(str(out / f'{name}.wav'), 'wb') as file:
        file.setnchannels(1); file.setsampwidth(2); file.setframerate(rate); file.writeframes(b''.join(samples))
print('Generated four original sound effects.')
