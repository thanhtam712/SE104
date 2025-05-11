from passlib.context import CryptContext


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password, hashed_password):
    print("Verifying password...")
    print(f"Plain password: {plain_password}")
    print(f"Hashed password: {hashed_password}")
    # Check if the hashed password is None or empty
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)
