import math
import struct
from typing import List, Optional

class WakeWordDetector:
    """
    Modular Wake Word & Voice Activity Detector.
    Supports energy threshold VAD and configurable wake phrase templates.
    Can be extended with openWakeWord or Porcupine models.
    """
    def __init__(self, wake_phrase: str = "Hey Agent", energy_threshold: float = 0.03):
        self.wake_phrase = wake_phrase.lower()
        self.energy_threshold = energy_threshold

    def calculate_energy(self, pcm_bytes: bytes) -> float:
        if not pcm_bytes:
            return 0.0
        count = len(pcm_bytes) // 2
        if count == 0:
            return 0.0
        samples = struct.unpack(f"<{count}h", pcm_bytes)
        sum_sq = sum((s / 32768.0) ** 2 for s in samples)
        return math.sqrt(sum_sq / count)

    def is_speech(self, pcm_bytes: bytes) -> bool:
        return self.calculate_energy(pcm_bytes) >= self.energy_threshold

    def check_wake_phrase(self, transcript: str) -> bool:
        return self.wake_phrase in transcript.lower()
