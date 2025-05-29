#!/usr/bin/env python
"""Generate password hash for initial migration"""
import hashlib


def hash_password(password: str, salt: str = "your-salt-here") -> str:
    return hashlib.pbkdf2_hmac('sha256', (password + salt).encode(), salt.encode(), 100000).hex()


if __name__ == "__main__":
    password = "demo123"
    salt = "your-salt-here"

    hashed = hash_password(password, salt)
    print(f"Password: {password}")
    print(f"Salt: {salt}")
    print(f"Hash: {hashed}")
    print(f"Length: {len(hashed)}")
    print(f"\nUse this in migration:")
    print(f"password_hash = '{hashed}'")

    # Test verification
    print(f"\nVerification test:")
    print(f"Hash matches: {hashed == hash_password(password, salt)}")