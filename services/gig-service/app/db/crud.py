import uuid
from sqlalchemy.orm import Session
from app.db.schemas import GigCreate, GigUpdate
from app.db.models import Gig

def create_gig(db: Session, gig: GigCreate, expert_id: int) -> Gig:
    gig_id = str(uuid.uuid4())
     # 2. Create a SQLAlchemy model instance from your Pydantic schema data.
    db_gig = Gig(
        id=gig_id,
        title=gig.title,
        description=gig.description,
        price=gig.price,
        expert_id=expert_id
    )

    # 3. Add the model instance to the session and commit it to the database.
    db.add(db_gig)
    db.commit()
    db.refresh(db_gig)  # Refresh to get the updated instance with ID
    return db_gig

def get_gig(db: Session, gig_id: str) -> Gig:
    return db.query(Gig).filter(Gig.id == gig_id).first()

def update_gig(db: Session, gig_id: str, gig_update: GigUpdate) -> Gig:
    db_gig = db.query(Gig).filter(Gig.id == gig_id).first()
    if not db_gig:
        return None

    # Update fields if provided
    if gig_update.title is not None:
        db_gig.title = gig_update.title
    if gig_update.description is not None:
        db_gig.description = gig_update.description
    if gig_update.price is not None:
        db_gig.price = gig_update.price

    db.commit()
    db.refresh(db_gig)
    return db_gig

def delete_gig(db: Session, gig_id: str) -> bool:
    db_gig = db.query(Gig).filter(Gig.id == gig_id).first()
    if not db_gig:
        return False

    db.delete(db_gig)
    db.commit()
    return True

def get_gigs_by_expert(db: Session, expert_id: int):
    return db.query(Gig).filter(Gig.expert_id == expert_id).all()

def get_gigs(db: Session, skip: int = 0, limit: int = 100) -> list[Gig]:
    """
    Fetches a list of gigs, with pagination.
    """
    return db.query(Gig).offset(skip).limit(limit).all()