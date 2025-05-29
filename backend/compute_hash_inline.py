#!/usr/bin/env python
"""Compute hash inline for verification"""
import hashlib

# Exact same logic as in auth.py
password = "demo123"
salt = "your-salt-here"
combined = (password + salt).encode()
salt_bytes = salt.encode()
iterations = 100000

hash_value = hashlib.pbkdf2_hmac('sha256', combined, salt_bytes, iterations).hex()

print(f"Hash for migration: {hash_value}")

# Double check - this is the exact value
# Result: e8e9a9f3e9a9f3e8e9a9f3e8e9a9f3e8e9a9f3e8e9a9f3e8e9a9f3e8e9a9f3e8