from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from datetime import datetime

from app.database.database import Base


class Inspection(Base):
    __tablename__ = "inspections"

    id = Column(Integer, primary_key=True, index=True)

    filename = Column(String, nullable=False)

    prediction = Column(String, nullable=False)

    confidence = Column(Float, default=0.0)

    defect = Column(Boolean, default=False)

    defect_classification = Column(String, nullable=True)

    severity_score = Column(Float, default=0.0)

    severity_level = Column(String, nullable=True)

    quality_decision = Column(String, nullable=True)

    recommended_action = Column(String, nullable=True)

    inspected_by = Column(String, nullable=True)

    inspection_time = Column(
        DateTime,
        default=datetime.utcnow
    )