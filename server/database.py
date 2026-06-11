from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker 
from sqlalchemy.ext.declarative import declarative_base
import os
from dotenv import load_dotenv
load_dotenv()

# Use SQLite local file as a zero-setup database
URL_DATABASE = os.getenv("DATABASE_URL", "sqlite:///./smartroute.db")

# Fix for Supabase/Postgres connection strings that start with postgres://
if URL_DATABASE.startswith("postgres://"):
    URL_DATABASE = URL_DATABASE.replace("postgres://", "postgresql://", 1)

if URL_DATABASE.startswith("sqlite"):
    engine = create_engine(URL_DATABASE, connect_args={"check_same_thread": False})
else:
    engine = create_engine(URL_DATABASE)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
