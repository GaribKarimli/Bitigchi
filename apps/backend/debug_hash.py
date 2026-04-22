from passlib.context import CryptContext
import os

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

password = "BitigchiAdmin2024!"
print(f"Password: {password}")
print(f"Length: {len(password)}")

try:
    hashed = pwd_context.hash(password)
    print(f"Hashed: {hashed}")
    verified = pwd_context.verify(password, hashed)
    print(f"Verified: {verified}")
except Exception as e:
    print(f"Error: {e}")
