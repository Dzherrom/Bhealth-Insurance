import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from django.conf import settings

def get_cipher_suite():
    """Generates a Fernet cipher suite derived from the Django SECRET_KEY."""
    # Ensure usage of a consistent key derived from settings.SECRET_KEY
    password = settings.SECRET_KEY.encode()
    # Salt should ideally be random per installation but fixed for that installation.
    # Using a hardcoded salt here for simplicity ensures it works across restarts 
    # without a DB for salt storage.
    salt = b'django-cryptography-static-salt' 
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
    )
    key = base64.urlsafe_b64encode(kdf.derive(password))
    return Fernet(key)

def encrypt_text(plaintext):
    """Encrypts a string."""
    if not plaintext:
        return plaintext
    try:
        f = get_cipher_suite()
        # Fernet encrypt returns bytes, we decode to string for storage in CharField
        return f.encrypt(str(plaintext).encode()).decode()
    except Exception as e:
        # Log error in production
        print(f"Encryption error: {e}")
        return None

def decrypt_text(ciphertext):
    """Decrypts a string."""
    if not ciphertext:
        return ciphertext
    try:
        f = get_cipher_suite()
        # Fernet decrypt expects bytes
        return f.decrypt(str(ciphertext).encode()).decode()
    except Exception as e:
        # Log error in production
        # print(f"Decryption error: {e}")
        return None
