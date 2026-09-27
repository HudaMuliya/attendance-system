from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    name: str
    email: str
    role: str = "employee"
    office_id: Optional[int] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    
    model_config = ConfigDict(from_attributes=True)

class OfficeBase(BaseModel):
    name: str
    latitude: float
    longitude: float
    radius: int

class OfficeCreate(OfficeBase):
    pass

class OfficeResponse(OfficeBase):
    id: int
    is_active: bool
    
    model_config = ConfigDict(from_attributes=True)

class ClockInRequest(BaseModel):
    latitude: float
    longitude: float

class AttendanceResponse(BaseModel):
    id: int
    date: str
    check_in_time: Optional[datetime]
    check_out_time: Optional[datetime]
    status: str
    
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str

class StatsResponse(BaseModel):
    present: int
    late: int
    absent: int
