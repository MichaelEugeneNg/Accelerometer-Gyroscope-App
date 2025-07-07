# Generate and configure FastAPI instance, mount 'measurements' router
from fastapi import FastAPI
from .routers import measurements
from fastapi.middleware.cors import CORSMiddleware
# from . import models
app = FastAPI()
# models.Base.metadata.create_all(bind=engine)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", # React dev URL
                   "http://127.0.0.1:3000", # React dev URL
                   'http://192.168.249.241:3000', # michael's hotspot LAN from floor 4 (werqwise)
                   'http://192.168.143.241:3000', # michael's hotspot LAN from floor 6 (werqwise)
                   'http://192.168.1.148:3000'], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(measurements.router, prefix="/api/measurements")
