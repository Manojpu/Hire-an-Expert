import logging
import sys

# Configure logging
def setup_logger():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[logging.StreamHandler(sys.stdout)]
    )
    
    # Create logger
    logger = logging.getLogger("booking_service")
    logger.setLevel(logging.INFO)
    
    return logger

# Create a logger instance
logger = setup_logger()
