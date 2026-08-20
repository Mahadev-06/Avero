import pytest
from app.core.security.ssrf import is_ip_allowed
from app.core.security.file_security import sanitize_filename, validate_path_traversal
from pathlib import Path

def test_ssrf_ip_blocking():
    # Private IPs must be blocked
    assert is_ip_allowed("127.0.0.1") is False
    assert is_ip_allowed("10.0.0.1") is False
    assert is_ip_allowed("192.168.1.1") is False
    assert is_ip_allowed("169.254.169.254") is False  # AWS metadata
    assert is_ip_allowed("::1") is False

    # Public IPs must be allowed
    assert is_ip_allowed("8.8.8.8") is True
    assert is_ip_allowed("1.1.1.1") is True

def test_filename_sanitization():
    raw = "../../../etc/passwd"
    clean = sanitize_filename(raw)
    assert ".." not in clean
    assert "/" not in clean

def test_path_traversal():
    base = Path("/tmp/storage")
    malicious = Path("/tmp/storage/../../etc/passwd")
    assert validate_path_traversal(malicious, base) is False
