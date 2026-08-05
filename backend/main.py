"""
FastAPI backend for Enterprise Viability Assessment tool
"""

from fastapi import FastAPI, Form
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI()

# CORS - allow all
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/auto-score")
def auto_score(company_name: str = Form(...)):
    """Test endpoint"""
    return {"received": company_name}


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
