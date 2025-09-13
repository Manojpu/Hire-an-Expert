import logging
import os
from functools import lru_cache

@lru_cache(maxsize=32)
def get_logger(name: str) -> logging.Logger:
    """
    Returns a configured logger with the given name.
    Uses lru_cache to avoid recreating loggers with the same name.
    
    Args:
        name: The name of the logger, typically __name__ from the calling module
        
    Returns:
        A configured logger instance
    """
    logger = logging.getLogger(name)
    
    # Only configure the logger if it hasn't been configured yet
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        
        # Create log directory if it doesn't exist
        log_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "logs")
        os.makedirs(log_dir, exist_ok=True)
        
        # Create handlers
        console_handler = logging.StreamHandler()
        file_handler = logging.FileHandler(os.path.join(log_dir, "gig_service.log"))
        
        # Create formatters
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        
        # Add formatters to handlers
        console_handler.setFormatter(formatter)
        file_handler.setFormatter(formatter)
        
        # Add handlers to logger
        logger.addHandler(console_handler)
        logger.addHandler(file_handler)
    
    return logger
