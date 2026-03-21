import hashlib
import json
from datetime import datetime


def normalize_wallet(wallet_address: str) -> str:
    return wallet_address.lower()


def canonical_hash(payload: dict) -> str:
    encoded = json.dumps(payload, sort_keys=True, default=_json_default).encode("utf-8")
    return "0x" + hashlib.sha256(encoded).hexdigest()


def _json_default(value: object) -> str:
    if isinstance(value, datetime):
        return value.isoformat()

    raise TypeError(f"Object of type {type(value).__name__} is not JSON serializable")
