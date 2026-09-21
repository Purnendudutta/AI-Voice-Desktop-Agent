import sys
import json
from wakeword.detector import WakeWordDetector
from vision.screen_analyzer import ScreenAnalyzer

def main():
    detector = WakeWordDetector()
    analyzer = ScreenAnalyzer()

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            req = json.loads(line)
            method = req.get("method")
            params = req.get("params", {})
            req_id = req.get("id")

            result = None
            if method == "check_wake_phrase":
                result = detector.check_wake_phrase(params.get("transcript", ""))
            elif method == "analyze_ui":
                result = analyzer.analyze_ui_elements(b"")
            elif method == "ping":
                result = "pong"
            else:
                result = {"error": f"Unknown method: {method}"}

            sys.stdout.write(json.dumps({"id": req_id, "result": result}) + "\n")
            sys.stdout.flush()
        except Exception as e:
            sys.stdout.write(json.dumps({"error": str(e)}) + "\n")
            sys.stdout.flush()

if __name__ == "__main__":
    main()
