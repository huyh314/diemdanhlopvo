import math
import wave
import struct
import os

SAMPLE_RATE = 44100
DURATION = 0.2  # 0.2 seconds

def generate_ui_click(output_path):
    num_samples = int(SAMPLE_RATE * DURATION)
    audio_data = []

    # Parameters for a "Firm, Disciplined, Wooden Tap"
    freq = 320.0  # Low fundamental for "firmness"
    decay_rate = 45.0 # Fast decay for "sharpness"
    noise_level = 0.15 # Subtle noise for "tactile" character

    for i in range(num_samples):
        t = i / SAMPLE_RATE
        
        # Exponential decay envelope
        env = math.exp(-decay_rate * t)
        
        # Fundamental sine wave
        sine = math.sin(2.0 * math.pi * freq * t)
        
        # Add a higher harmonic for "tap" definition
        harmonic = 0.4 * math.sin(2.0 * math.pi * freq * 2.1 * t)
        
        # Add very subtle noise burst at the start for "impact"
        import random
        noise = (random.random() * 2.0 - 1.0) * noise_level * math.exp(-150.0 * t)
        
        sample = (sine + harmonic + noise) * env
        
        # Normalize to avoid clipping
        sample = max(-1.0, min(1.0, sample))
        
        # Convert to 16-bit PCM
        int_sample = int(sample * 32767)
        audio_data.append(int_sample)

    # Ensure target directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    with wave.open(output_path, "w") as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(SAMPLE_RATE)
        f.writeframes(struct.pack('<' + 'h' * len(audio_data), *audio_data))

    print(f"UI Click sound generated at: {output_path}")

if __name__ == "__main__":
    output_file = r"d:\LOP_VO\VoDuong_PPT\next-web\public\music\ui_click.wav"
    generate_ui_click(output_file)
