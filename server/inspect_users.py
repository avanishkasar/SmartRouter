import bcrypt
from database import SessionLocal
from models import User

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception as e:
        print("Bcrypt verify error:", e)
        return False

db = SessionLocal()
user = db.query(User).filter(User.username == 'admin').first()
print("User username:", user.username)
print("User hashed_password:", user.hashed_password)
print("Password verification result:", verify_password("password123", user.hashed_password))
db.close()
