import math
import wave
import struct
import random
import os

SAMPLE_RATE = 44100
DURATION = 40.0 # seconds

def note_freq(note):
    return 440.0 * (2 ** ((note - 69) / 12.0))

# D major pentatonic: D, E, G, A, B
pentatonic = [62, 64, 67, 69, 71, 74, 76, 79, 81, 83]

audio_data = [0.0] * int(SAMPLE_RATE * DURATION)

def add_tone(freq, start_time, duration, vol, tone_type='pad'):
    start_sample = int(start_time * SAMPLE_RATE)
    end_sample = int((start_time + duration) * SAMPLE_RATE)
    for i in range(start_sample, min(end_sample, len(audio_data))):
        t = (i - start_sample) / SAMPLE_RATE
        
        if tone_type == 'pad':
            # Drone: slow attack, slow release, slight detune
            attack = 5.0
            release = 5.0
            if t < attack:
                env = t / attack
            elif t > duration - release:
                env = (duration - t) / release
            else:
                env = 1.0
            sample = math.sin(2.0 * math.pi * freq * t) + 0.5 * math.sin(2.0 * math.pi * freq * 1.002 * t)
            sample *= 0.3 * env
        elif tone_type == 'bell':
            # Percussive attack, long decay
            env = math.exp(-1.5 * t)
            # FM synth bell
            mod = math.sin(2.0 * math.pi * freq * 2.0 * t) * math.exp(-2.0 * t)
            sample = math.sin(2.0 * math.pi * freq * t + 3.0 * mod) * env
            # Add some higher harmonics
            sample += 0.3 * math.sin(2.0 * math.pi * freq * 3.0 * t) * math.exp(-3.0 * t)
            sample += 0.1 * math.sin(2.0 * math.pi * freq * 4.5 * t) * math.exp(-5.0 * t)
            
        audio_data[i] += sample * vol

print("1. Synthesizing Drones...")
# Add Deep Drone (D2, A2, D3)
add_tone(note_freq(38), 0, DURATION, 0.35, 'pad') # D2
add_tone(note_freq(45), 0, DURATION, 0.2, 'pad') # A2
add_tone(note_freq(50), 0, DURATION, 0.15, 'pad') # D3

print("2. Synthesizing Zen Bells...")
# Add random bells (Guzheng/Koto vibes)
random.seed(123) # Replicable, nice sequence
for i in range(20):
    note = random.choice(pentatonic)
    start = random.uniform(2.0, DURATION - 10.0)
    # create short bursts/arpeggios sometimes
    if random.random() > 0.7:
        start2 = start + 0.15
        start3 = start + 0.3
        add_tone(note_freq(note), start, 8.0, 0.15, 'bell')
        add_tone(note_freq(note+2), start2, 8.0, 0.1, 'bell')
        add_tone(note_freq(note+4), start3, 8.0, 0.08, 'bell')
    else:
        add_tone(note_freq(note), start, 10.0, 0.2, 'bell')

print("3. Applying Echo/Delay...")
# Simple Echo / Delay (Feedback = 0.4, Delay = 0.75s)
delay_samples = int(0.75 * SAMPLE_RATE)
for i in range(delay_samples, len(audio_data)):
    audio_data[i] += audio_data[i - delay_samples] * 0.4

print("4. Normalizing Audio...")
max_val = max(max(audio_data), -min(audio_data))
if max_val == 0:
    max_val = 1.0
max_val *= 1.1 # Headroom

output_dir = r"d:\LOP_VO\VoDuong_PPT\next-web\music\start"
os.makedirs(output_dir, exist_ok=True)
output_path = os.path.join(output_dir, "idle_bgm.wav")

print("5. Writing to WAV file:", output_path)
with wave.open(output_path, "w") as f:
    f.setnchannels(1)
    f.setsampwidth(2)
    f.setframerate(SAMPLE_RATE)
    
    chunk_size = 10000
    for idx in range(0, len(audio_data), chunk_size):
        chunk = audio_data[idx:idx+chunk_size]
        int_data = [int((s / max_val) * 32767) for s in chunk]
        f.writeframesraw(struct.pack('<' + 'h'*len(int_data), *int_data))

print(f"DONE! Generated martial arts ambient track at {output_path}")
