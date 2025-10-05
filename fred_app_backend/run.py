#!/usr/bin/env python3
"""
Fred Care API Server
Run with: python run.py
"""

import uvicorn
from app.config import settings

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=3001,
        reload=settings.debug,
        log_level="info"
    )
