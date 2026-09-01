import hashlib

def compute_ledger_hash(previous_hash: str, timestamp: str, image_bytes_hash: str, gps_coords: str, violation_summary: str) -> str:
    """
    Computes an immutable SHA-256 block-linked ledger hash over the inspection data.
    """
    raw_data = f"{previous_hash}{timestamp}{image_bytes_hash}{gps_coords}{violation_summary}"
    return hashlib.sha256(raw_data.encode("utf-8")).hexdigest()
