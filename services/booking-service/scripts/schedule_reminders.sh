#!/bin/bash
# This script schedules reminders for upcoming bookings
# It is intended to be run via cron job once per day

# Navigate to the booking service directory
cd "$(dirname "$0")/.."

# Activate virtual environment if present
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
fi

# Run the reminder script
python -m scripts.send_reminders

# Exit with the script's exit code
exit $?