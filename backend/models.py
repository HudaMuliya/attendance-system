from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, DateTime
from sqlalchemy.orm import relationship
import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="employee") # admin, employee
    office_id = Column(Integer, ForeignKey("offices.id"), nullable=True)
    is_active = Column(Boolean, default=True)

    office = relationship("Office", back_populates="users")
    attendances = relationship("Attendance", back_populates="user")

class Office(Base):
    __tablename__ = "offices"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    latitude = Column(Float)
    longitude = Column(Float)
    radius = Column(Integer) # in meters
    is_active = Column(Boolean, default=True)

    users = relationship("User", back_populates="office")
    attendances = relationship("Attendance", back_populates="office")

class Attendance(Base):
    __tablename__ = "attendances"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    office_id = Column(Integer, ForeignKey("offices.id"))
    date = Column(String, index=True) # YYYY-MM-DD for easy filtering
    
    check_in_time = Column(DateTime, nullable=True)
    check_in_lat = Column(Float, nullable=True)
    check_in_lng = Column(Float, nullable=True)
    
    check_out_time = Column(DateTime, nullable=True)
    check_out_lat = Column(Float, nullable=True)
    check_out_lng = Column(Float, nullable=True)
    
    status = Column(String) # present, late
    notes = Column(String, nullable=True)

    user = relationship("User", back_populates="attendances")
    office = relationship("Office", back_populates="attendances")

class Setting(Base):
    __tablename__ = "settings"
    
    key = Column(String, primary_key=True, index=True)
    value = Column(String)
