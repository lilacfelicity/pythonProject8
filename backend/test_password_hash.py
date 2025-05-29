#!/usr/bin/env python
"""Test password hash generation to ensure it matches auth.py logic"""
import hashlib

def hash_password(password: str, salt: str = "your-salt-here") -> str:
    """Same function as in auth.py"""
    return hashlib.pbkdf2_hmac('sha256', (password + salt).encode(), salt.encode(), 100000).hex()

# Test values
password = "demo123"
salt = "your-salt-here"

# Generate hash
hash_result = hash_password(password, salt)

print("Password Hash Test")
print("=" * 50)
print(f"Password: {password}")
print(f"Salt: {salt}")
print(f"Generated hash: {hash_result}")
print(f"Hash length: {len(hash_result)}")
print()
print("Use this exact hash in your migration file:")
print(f"'{hash_result}'")
print()
print("To verify in PostgreSQL after migration:")
print("SELECT password_hash FROM users WHERE email = 'ekaterina.smirnova@email.com';")