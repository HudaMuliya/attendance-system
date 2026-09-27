import sys
import os

# Add backend directory to path so imports work
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models import User
import auth

db = SessionLocal()

admin_email = "admin@company.com"
existing = db.query(User).filter(User.email == admin_email).first()

if not existing:
    admin = User(
        name="Admin User",
        email=admin_email,
        hashed_password=auth.get_password_hash("admin123"),
        role="admin"
    )
    db.add(admin)
    db.commit()
    print("Admin user created: admin@company.com / admin123")
else:
    # update password just in case
    existing.hashed_password = auth.get_password_hash("admin123")
    db.commit()
    print("Admin user already exists. Password reset to admin123.")

db.close()
