from fastapi import FastAPI
import os
import uvicorn

app = FastAPI()

@app.get("/api/health")
def health():
    return {"status": "ok"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
