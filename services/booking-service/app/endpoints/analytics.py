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
from app.db.models import Booking, BookingStatus
from app.utils.gig_service import get_gig_details
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
        
        # Get the gig's hourly rate from gig-service
        gig_details = get_gig_details(gig_id)
        
        if not gig_details or not gig_details.get('hourly_rate'):
            # Use default rate if gig not found or no rate set
            hourly_rate = 5000  # Default LKR rate
            currency = "LKR"
        else:
            hourly_rate = float(gig_details['hourly_rate'])
            currency = gig_details.get('currency', 'LKR')
        
        logger.info(f"Using hourly_rate: {hourly_rate} {currency} for gig {gig_id}")
        
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
                "currency": currency
            }
        
        # Revenue Calculations
        # IMPORTANT: Revenue for ONE booking = gig's hourly_rate
        # Each confirmed/completed booking generates revenue equal to the hourly_rate
        def calculate_revenue(start_date, end_date=None):
            """
            Calculate revenue by counting confirmed and completed bookings and multiplying by hourly_rate.
            Revenue = Number of (confirmed + completed) bookings × hourly_rate
            
            We count bookings that were CREATED in the time period to show new revenue generated.
            """
            query = db.query(
                func.count(Booking.id).label('booking_count')
            ).filter(
                and_(
                    Booking.gig_id == gig_id,
                    Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.COMPLETED]),
                    Booking.created_at >= start_date
                )
            )
            if end_date:
                query = query.filter(Booking.created_at < end_date)
            
            booking_count = query.scalar() or 0
            total_revenue = booking_count * hourly_rate
            
            return round(float(total_revenue), 2)
        
        # Calculate cumulative revenue (all time)
        def calculate_total_revenue():
            """Calculate total cumulative revenue from all confirmed/completed bookings"""
            query = db.query(
                func.count(Booking.id).label('booking_count')
            ).filter(
                and_(
                    Booking.gig_id == gig_id,
                    Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.COMPLETED])
                )
            )
            booking_count = query.scalar() or 0
            total_revenue = booking_count * hourly_rate
            return round(float(total_revenue), 2)
        
        # Current period revenues (new bookings in each period)
        today_revenue = calculate_revenue(today_start)
        week_revenue = calculate_revenue(week_start)
        month_revenue = calculate_revenue(month_start)
        year_revenue = calculate_total_revenue()  # Year shows total cumulative revenue
        
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
        
        # Get daily revenue data by counting completed bookings per day
        # Revenue per day = Number of completed bookings that day × hourly_rate
        daily_data = db.query(
            func.date(Booking.created_at).label('date'),
            func.count(Booking.id).label('booking_count')
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
            # Revenue = booking count × hourly_rate
            revenue = round(float(record.booking_count * hourly_rate), 2)
            
            chart_data.append({
                "date": date_str,
                "revenue": revenue
            })
        
        # Calculate Repeat Customers
        # A repeat customer is a user who has made 2 or more bookings for this gig
        user_booking_counts = db.query(
            Booking.user_id,
            func.count(Booking.id).label('booking_count')
        ).filter(
            Booking.gig_id == gig_id
        ).group_by(
            Booking.user_id
        ).all()
        
        # Count users with 2 or more bookings
        repeat_customers = sum(1 for user_data in user_booking_counts if user_data.booking_count >= 2)
        
        # Calculate average response time (placeholder for now - could be calculated from booking acceptance time)
        avg_response_time = "< 24 hours"
        
        # Calculate average session duration (all sessions are 1 hour in this system)
        avg_session_duration = "1 hour"
        
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
            "performance": {
                "repeatCustomers": repeat_customers,
                "responseTime": avg_response_time,
                "avgSessionDuration": avg_session_duration,
                "rating": 0  # This comes from review service, frontend will override
            },
            "chartData": chart_data,
            "hourlyRate": hourly_rate,
            "currency": currency
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
