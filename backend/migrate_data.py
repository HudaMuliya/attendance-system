import os
import sys
import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Ensure local imports work
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from models import Base, User, Office, Attendance, Setting

def migrate():
    # 1. Setup Engines
    sqlite_url = "sqlite:///./attendance.db"
    mysql_url = os.getenv("DATABASE_URL", "mysql+pymysql://root:@localhost:3306/attendance_db")

    print(f"Source: {sqlite_url}")
    print(f"Target: {mysql_url}")

    sqlite_engine = create_engine(sqlite_url)
    try:
        mysql_engine = create_engine(mysql_url)
        mysql_engine.connect() # Test connection
    except Exception as e:
        print(f"Error connecting to MySQL: {e}")
        print("Please make sure MySQL is running via XAMPP and the database 'attendance_db' is created.")
        sys.exit(1)

    # 2. Create tables in MySQL
    print("Creating tables in MySQL...")
    Base.metadata.create_all(bind=mysql_engine)

    # 3. Setup Sessions
    SqliteSession = sessionmaker(bind=sqlite_engine)
    MysqlSession = sessionmaker(bind=mysql_engine)

    sqlite_db = SqliteSession()
    mysql_db = MysqlSession()

    # 4. Migrate Data in order of Dependencies
    try:
        # A. Settings
        settings = sqlite_db.query(Setting).all()
        for s in settings:
            if not mysql_db.query(Setting).filter_by(key=s.key).first():
                mysql_db.add(Setting(key=s.key, value=s.value))
        print(f"Migrated {len(settings)} Settings")

        # B. Offices
        offices = sqlite_db.query(Office).all()
        for o in offices:
            if not mysql_db.query(Office).filter_by(id=o.id).first():
                mysql_db.add(Office(
                    id=o.id, name=o.name, latitude=o.latitude, 
                    longitude=o.longitude, radius=o.radius, is_active=o.is_active
                ))
        print(f"Migrated {len(offices)} Offices")
        mysql_db.commit() # commit offices so users can reference them

        # C. Users
        users = sqlite_db.query(User).all()
        for u in users:
            if not mysql_db.query(User).filter_by(id=u.id).first():
                mysql_db.add(User(
                    id=u.id, name=u.name, email=u.email, 
                    hashed_password=u.hashed_password, role=u.role, 
                    office_id=u.office_id, is_active=u.is_active
                ))
        print(f"Migrated {len(users)} Users")
        mysql_db.commit() # commit users so attendances can reference them

        # D. Attendances
        attendances = sqlite_db.query(Attendance).all()
        for a in attendances:
            if not mysql_db.query(Attendance).filter_by(id=a.id).first():
                # Note: DateTime fields from SQLite might need checking, but SQLAlchemy 
                # handles standard python datetime objects fine. If they are strings, we might need to parse.
                # Assuming SQLAlchemy returns datetime objects for SQLite DateTime columns.
                mysql_db.add(Attendance(
                    id=a.id, user_id=a.user_id, office_id=a.office_id,
                    date=a.date, check_in_time=a.check_in_time, 
                    check_in_lat=a.check_in_lat, check_in_lng=a.check_in_lng,
                    check_out_time=a.check_out_time, check_out_lat=a.check_out_lat,
                    check_out_lng=a.check_out_lng, status=a.status, notes=a.notes
                ))
        print(f"Migrated {len(attendances)} Attendances")
        mysql_db.commit()

        print("\n--- VALIDATION ---")
        print("Settings:   SQLite {} -> MySQL {}".format(len(settings), mysql_db.query(Setting).count()))
        print("Offices:    SQLite {} -> MySQL {}".format(len(offices), mysql_db.query(Office).count()))
        print("Users:      SQLite {} -> MySQL {}".format(len(users), mysql_db.query(User).count()))
        print("Attendance: SQLite {} -> MySQL {}".format(len(attendances), mysql_db.query(Attendance).count()))
        print("Migration successful!")

    except Exception as e:
        mysql_db.rollback()
        print(f"Migration failed: {e}")
    finally:
        sqlite_db.close()
        mysql_db.close()

if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()
    migrate()
