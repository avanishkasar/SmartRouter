import bcrypt
from database import SessionLocal
from models import User

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

db = SessionLocal()

# Clear existing users to start fresh
db.query(User).delete()
db.commit()

# Create test users
users = [
    User(username="dispatcher", hashed_password=hash_password("password123"), role="dispatcher"),
    User(username="manager", hashed_password=hash_password("password123"), role="manager"),
    User(username="admin", hashed_password=hash_password("password123"), role="admin")
]

db.add_all(users)
db.commit()

print("Created default test users successfully:")
for u in db.query(User).all():
    print(f"Username: '{u.username}', Role: '{u.role}'")

db.close()
