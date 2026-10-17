import os
from cryptography.fernet import Fernet
from dotenv import load_dotenv

load_dotenv()

# Master encryption key (32 URL-safe base64-encoded bytes)
ENCRYPTION_KEY = os.getenv("OAUTH_TOKEN_ENCRYPTION_KEY")

if not ENCRYPTION_KEY:
    raise RuntimeError("CRITICAL: OAUTH_TOKEN_ENCRYPTION_KEY is not set in environment!")

cipher_suite = Fernet(ENCRYPTION_KEY.encode())

def encrypt_token(plain_token: str) -> str:
    """Encrypts plaintext token string into encrypted ciphertext using AES-256 Fernet."""
    if not plain_token:
        return ""
    return cipher_suite.encrypt(plain_token.encode("utf-8")).decode("utf-8")

def decrypt_token(encrypted_token: str) -> str:
    """Decrypts ciphertext into original plaintext token string."""
    if not encrypted_token:
        return ""
    return cipher_suite.decrypt(encrypted_token.encode("utf-8")).decode("utf-8")
