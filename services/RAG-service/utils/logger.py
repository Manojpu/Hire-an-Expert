"""
Simple logging utility for the application.
"""
import logging
import sys

def get_logger(name: str = None) -> logging.Logger:
    """Get a configured logger instance."""
    logger_name = name or __name__
    logger = logging.getLogger(logger_name)
    
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
    
    return logger