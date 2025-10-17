"""
Analytics endpoints for gig performance metrics.
Provides revenue, bookings, and performance analytics for experts.
"""
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, and_
from datetime import datetime, timedelta
from typing import Optional
from app.db.session import get_db
from app.db.models import Booking, BookingStatus, Gig
from firebase_admin import auth
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


async def verify_firebase_token(authorization: str = Header(None)) -> str:
    """
    Verify Firebase token from Authorization header.
    Returns the Firebase UID if valid, raises HTTPException if not.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    try:
        # Extract token from "Bearer <token>"
        token = authorization.replace("Bearer ", "")
        decoded_token = auth.verify_id_token(token)
        return decoded_token['uid']
    except Exception as e:
        logger.error(f"Token verification failed: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid authentication token")


@router.get("/analytics/gig/{gig_id}")
async def get_gig_analytics(
    gig_id: str,
    period: str = "month",  # day, week, month, year
    db: Session = Depends(get_db),
    firebase_uid: str = Depends(verify_firebase_token)
):
    """
    Get comprehensive analytics for a specific gig.
    
    Returns:
    - Revenue metrics (today, week, month with growth)
    - Booking statistics (total, completed, cancelled, completion rate)
    - Time-series data for charts
    """
    try:
        logger.info(f"Fetching analytics for gig {gig_id} by user {firebase_uid}")
        
        # Calculate date ranges
        now = datetime.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=today_start.weekday())
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        year_start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # Previous periods for growth calculation
        prev_day_start = today_start - timedelta(days=1)
        prev_week_start = week_start - timedelta(days=7)
        prev_month_start = (month_start - timedelta(days=1)).replace(day=1)
        
        # Get the gig's hourly rate from the gigs table
        gig_record = db.query(Gig).filter(Gig.id == gig_id).first()
        
        if not gig_record or not gig_record.hourly_rate:
            # Use default rate if gig not found or no rate set
            hourly_rate = 5000  # Default LKR rate
        else:
            hourly_rate = float(gig_record.hourly_rate)
        
        # Check if there are any bookings for this gig
        booking_exists = db.query(Booking).filter(Booking.gig_id == gig_id).first()
        
        # If no bookings exist, return empty analytics
        if not booking_exists:
            return {
                "revenue": {
                    "today": 0,
                    "week": 0,
                    "month": 0,
                    "year": 0,
                    "growth": {"daily": 0, "weekly": 0, "monthly": 0}
                },
                "bookings": {
                    "total": 0,
                    "thisMonth": 0,
                    "completed": 0,
                    "cancelled": 0,
                    "pending": 0,
                    "confirmed": 0,
                    "completionRate": 0
                },
                "chartData": [],
                "hourlyRate": hourly_rate,
                "currency": "LKR"
            }
        
        # Revenue Calculations - Use actual booking amounts
        def calculate_revenue(start_date, end_date=None):
            # First try to calculate from actual booking amounts
            query = db.query(
                func.coalesce(func.sum(Booking.amount), 0).label('total_amount')
            ).filter(
                and_(
                    Booking.gig_id == gig_id,
                    Booking.status == BookingStatus.COMPLETED,
                    Booking.created_at >= start_date
                )
            )
            if end_date:
                query = query.filter(Booking.created_at < end_date)
            
            total_amount = query.scalar() or 0
            
            # If no amounts are set, fallback to duration-based calculation
            if total_amount == 0:
                duration_query = db.query(
                    func.sum(Booking.duration).label('total_minutes')
                ).filter(
                    and_(
                        Booking.gig_id == gig_id,
                        Booking.status == BookingStatus.COMPLETED,
                        Booking.created_at >= start_date
                    )
                )
                if end_date:
                    duration_query = duration_query.filter(Booking.created_at < end_date)
                
                result = duration_query.scalar()
                total_minutes = result or 0
                total_hours = total_minutes / 60 if total_minutes else 0
                total_amount = total_hours * hourly_rate
            
            return round(float(total_amount), 2)
        
        # Current period revenues
        today_revenue = calculate_revenue(today_start)
        week_revenue = calculate_revenue(week_start)
        month_revenue = calculate_revenue(month_start)
        year_revenue = calculate_revenue(year_start)
        
        # Previous period revenues for growth calculation
        prev_day_revenue = calculate_revenue(prev_day_start, today_start)
        prev_week_revenue = calculate_revenue(prev_week_start, week_start)
        prev_month_revenue = calculate_revenue(prev_month_start, month_start)
        
        # Calculate growth percentages
        def calc_growth(current, previous):
            if previous == 0:
                return 100 if current > 0 else 0
            return round(((current - previous) / previous) * 100, 1)
        
        daily_growth = calc_growth(today_revenue, prev_day_revenue)
        weekly_growth = calc_growth(week_revenue, prev_week_revenue)
        monthly_growth = calc_growth(month_revenue, prev_month_revenue)
        
        # Booking Statistics
        total_bookings = db.query(func.count(Booking.id)).filter(
            Booking.gig_id == gig_id
        ).scalar() or 0
        
        month_bookings = db.query(func.count(Booking.id)).filter(
            and_(
                Booking.gig_id == gig_id,
                Booking.created_at >= month_start
            )
        ).scalar() or 0
        
        completed_bookings = db.query(func.count(Booking.id)).filter(
            and_(
                Booking.gig_id == gig_id,
                Booking.status == BookingStatus.COMPLETED
            )
        ).scalar() or 0
        
        cancelled_bookings = db.query(func.count(Booking.id)).filter(
            and_(
                Booking.gig_id == gig_id,
                Booking.status == BookingStatus.CANCELLED
            )
        ).scalar() or 0
        
        pending_bookings = db.query(func.count(Booking.id)).filter(
            and_(
                Booking.gig_id == gig_id,
                Booking.status == BookingStatus.PENDING
            )
        ).scalar() or 0
        
        confirmed_bookings = db.query(func.count(Booking.id)).filter(
            and_(
                Booking.gig_id == gig_id,
                Booking.status == BookingStatus.CONFIRMED
            )
        ).scalar() or 0
        
        # Calculate completion rate
        total_finalized = completed_bookings + cancelled_bookings
        completion_rate = round((completed_bookings / total_finalized * 100), 1) if total_finalized > 0 else 0
        
        # Chart Data - Daily revenue for the selected period
        if period == "month":
            days_back = 30
        elif period == "week":
            days_back = 7
        elif period == "year":
            days_back = 365
        else:
            days_back = 30
        
        chart_start = now - timedelta(days=days_back)
        
        # Get daily revenue data using amount field (with fallback to duration)
        daily_data = db.query(
            func.date(Booking.created_at).label('date'),
            func.coalesce(func.sum(Booking.amount), 0).label('total_amount'),
            func.sum(Booking.duration).label('total_minutes')
        ).filter(
            and_(
                Booking.gig_id == gig_id,
                Booking.status == BookingStatus.COMPLETED,
                Booking.created_at >= chart_start
            )
        ).group_by(
            func.date(Booking.created_at)
        ).order_by(
            func.date(Booking.created_at)
        ).all()
        
        # Format chart data
        chart_data = []
        for record in daily_data:
            date_str = record.date.strftime('%Y-%m-%d')
            
            # Use amount if available, otherwise calculate from duration
            if record.total_amount and record.total_amount > 0:
                revenue = round(float(record.total_amount), 2)
            else:
                total_hours = (record.total_minutes or 0) / 60
                revenue = round(total_hours * hourly_rate, 2)
            
            chart_data.append({
                "date": date_str,
                "revenue": revenue
            })
        
        # Return analytics response
        return {
            "revenue": {
                "today": today_revenue,
                "week": week_revenue,
                "month": month_revenue,
                "year": year_revenue,
                "growth": {
                    "daily": daily_growth,
                    "weekly": weekly_growth,
                    "monthly": monthly_growth
                }
            },
            "bookings": {
                "total": total_bookings,
                "thisMonth": month_bookings,
                "completed": completed_bookings,
                "cancelled": cancelled_bookings,
                "pending": pending_bookings,
                "confirmed": confirmed_bookings,
                "completionRate": completion_rate
            },
            "chartData": chart_data,
            "hourlyRate": hourly_rate,
            "currency": "LKR"
        }
        
    except Exception as e:
        logger.error(f"Error fetching analytics for gig {gig_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching analytics: {str(e)}")


@router.get("/analytics/expert/overall")
async def get_expert_overall_analytics(
    db: Session = Depends(get_db),
    firebase_uid: str = Depends(verify_firebase_token)
):
    """
    Get overall analytics across all gigs for an expert.
    Aggregates data from all gigs belonging to the current user.
    """
    # TODO: Implement overall expert analytics
    # This would aggregate data across multiple gigs
    # Will need to query gigs by firebase_uid to get expert's gigs
    pass
