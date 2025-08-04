from sqlalchemy import Column, Integer, String, Float, DateTime, func
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Gig(Base):
    __tablename__ = 'gigs'
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String)
    price = Column(Float)
    created_at = Column(DateTime, server_default=func.now())
    expert_id = Column(Integer, index=True) 
    updated_at = Column(DateTime, onupdate=func.now())
    
    def __repr__(self):
        return f"<Gig(id={self.id}, expert_id={self.expert_id}, title='{self.title}', price={self.price})>"