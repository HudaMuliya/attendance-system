from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, date
from fastapi.security import OAuth2PasswordRequestForm
import models, schemas, database, haversine, auth
from typing import List

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Attendance System API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "Attendance System API MVP is running"}

@app.post("/api/offices", response_model=schemas.OfficeResponse)
def create_office(office: schemas.OfficeCreate, db: Session = Depends(get_db)):
    db_office = models.Office(**office.model_dump())
    db.add(db_office)
    db.commit()
    db.refresh(db_office)
    return db_office

@app.get("/api/offices", response_model=List[schemas.OfficeResponse])
def get_offices(db: Session = Depends(get_db)):
    return db.query(models.Office).all()

@app.post("/api/users", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    db_user = models.User(
        name=user.name,
        email=user.email,
        hashed_password=auth.get_password_hash(user.password),
        role=user.role,
        office_id=user.office_id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.get("/api/users", response_model=List[schemas.UserResponse])
def get_users(db: Session = Depends(get_db)):
    return db.query(models.User).all()

@app.get("/api/users/me", response_model=schemas.UserResponse)
def get_user_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@app.post("/api/auth/login", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(data={"sub": str(user.id), "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/attendances/clock-in")
def clock_in(req: schemas.ClockInRequest, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not current_user.office_id:
        raise HTTPException(status_code=400, detail="User has no assigned office")
        
    office = db.query(models.Office).filter(models.Office.id == current_user.office_id).first()
    
    # 2. Check distance
    distance = haversine.calculate_distance(req.latitude, req.longitude, office.latitude, office.longitude)
    if distance > office.radius:
        raise HTTPException(status_code=400, detail=f"Out of range. You are {int(distance)}m away (Max: {office.radius}m)")
        
    # 3. Check if already clocked in today
    today_str = date.today().strftime("%Y-%m-%d")
    existing = db.query(models.Attendance).filter(
        models.Attendance.user_id == current_user.id, 
        models.Attendance.date == today_str
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Already clocked in today")
        
    # 4. Save attendance
    # Simulating time validation (hardcode 09:15 as late threshold for MVP)
    now = datetime.now()
    status = "present"
    if now.hour > 9 or (now.hour == 9 and now.minute > 15):
        status = "late"

    new_attendance = models.Attendance(
        user_id=current_user.id,
        office_id=office.id,
        date=today_str,
        check_in_time=now,
        check_in_lat=req.latitude,
        check_in_lng=req.longitude,
        status=status
    )
    db.add(new_attendance)
    db.commit()
    db.refresh(new_attendance)
    return {"message": "Clock in successful", "status": status, "distance_m": int(distance)}

@app.post("/api/attendances/clock-out")
def clock_out(req: schemas.ClockInRequest, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not current_user.office_id:
        raise HTTPException(status_code=400, detail="User has no assigned office")
        
    office = db.query(models.Office).filter(models.Office.id == current_user.office_id).first()
    distance = haversine.calculate_distance(req.latitude, req.longitude, office.latitude, office.longitude)
    if distance > office.radius:
        raise HTTPException(status_code=400, detail=f"Out of range. You are {int(distance)}m away (Max: {office.radius}m)")
        
    today_str = date.today().strftime("%Y-%m-%d")
    existing = db.query(models.Attendance).filter(
        models.Attendance.user_id == current_user.id, 
        models.Attendance.date == today_str
    ).first()
    
    if not existing:
        raise HTTPException(status_code=400, detail="You haven't clocked in today")
    if existing.check_out_time:
        raise HTTPException(status_code=400, detail="Already clocked out today")
        
    existing.check_out_time = datetime.now()
    existing.check_out_lat = req.latitude
    existing.check_out_lng = req.longitude
    
    db.commit()
    db.refresh(existing)
    return {"message": "Clock out successful", "distance_m": int(distance)}

@app.get("/api/attendances/stats", response_model=schemas.StatsResponse)
def get_attendance_stats(db: Session = Depends(get_db)):
    today_str = date.today().strftime("%Y-%m-%d")
    
    # Get all active users count
    total_active_users = db.query(models.User).filter(models.User.is_active == True).count()
    
    # Get today's attendances
    today_attendances = db.query(models.Attendance).filter(models.Attendance.date == today_str).all()
    
    present = sum(1 for a in today_attendances if a.status == "present")
    late = sum(1 for a in today_attendances if a.status == "late")
    
    # Absent is active users minus those who clocked in today
    absent = total_active_users - (present + late)
    
    return {"present": present, "late": late, "absent": max(0, absent)}

@app.get("/api/attendances/recent")
def get_recent_activity(db: Session = Depends(get_db)):
    # Returns 5 most recent clock-ins/outs with user names
    recent = db.query(models.Attendance).order_by(models.Attendance.id.desc()).limit(5).all()
    
    result = []
    for a in recent:
        result.append({
            "id": a.id,
            "user_name": a.user.name,
            "date": a.date,
            "check_in_time": a.check_in_time,
            "check_out_time": a.check_out_time,
            "status": a.status
        })
    return result

