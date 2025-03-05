import pandas as pd
import argparse
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean, ForeignKey, MetaData, Table
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import ProgrammingError
from sqlalchemy.sql import text
from datetime import datetime

# Argument parser for database name only
parser = argparse.ArgumentParser(description='Seed MySQL database')
parser.add_argument('--db-name', type=str, help='Database name', required=True)
args = parser.parse_args()

# Default MySQL credentials and host
DB_USER = 'cornelius'
DB_PASSWORD = 'BBTest'
DB_HOST = 'localhost'

# Construct database URIs
db_uri_without_db = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}"
db_uri_with_db = f"{db_uri_without_db}/{args.db_name}"

# Create engine without database to create it first
engine_no_db = create_engine(db_uri_without_db)
conn = engine_no_db.connect()

# Drop the database if it exists and recreate it
try:
    conn.execute(text(f"DROP DATABASE IF EXISTS {args.db_name}"))
    conn.execute(text(f"CREATE DATABASE {args.db_name}"))
    print(f"Database '{args.db_name}' recreated successfully.")
except ProgrammingError as e:
    print(f"Error recreating database: {e}")
try:
    conn.execute(text(f"CREATE DATABASE IF NOT EXISTS {args.db_name}"))
    print(f"Database '{args.db_name}' created or already exists.")
except ProgrammingError as e:
    print(f"Error creating database: {e}")
finally:
    conn.close()

# Connect to the newly created database
engine = create_engine(db_uri_with_db)
metadata = MetaData()

# Define Tables
users = Table(
    'users', metadata,
    Column('id', Integer, primary_key=True),
    Column('name', String(255), nullable=False),
    Column('last_game', DateTime, nullable=True),
    Column('email', String(255), nullable=False),
    Column('discord', String(255), nullable=False),
    Column('interests', Integer, ForeignKey('user_interests.user'), nullable=False)
)

catalogue = Table(
    'catalogue', metadata,
    Column('id', Integer, primary_key=True),
    Column('name', String(255), nullable=False),
    Column('difficulty', Float, nullable=False),
    Column('rating', Float, nullable=True),
    Column('numplays', Integer, nullable=True),
    Column('own', Boolean, nullable=True),
    Column('fortrade', Boolean, nullable=True),
    Column('want', Boolean, nullable=True),
    Column('wanttobuy', Boolean, nullable=True),
    Column('wanttoplay', Boolean, nullable=True),
    Column('acquisitiondate', DateTime, nullable=True),
    Column('acquiredfrom', String(255), nullable=True),
    Column('invdate', DateTime, nullable=True),
    Column('version_publishers', String(255), nullable=True),
    Column('version_languages', String(255), nullable=True),
    Column('version_yearpublished', Integer, nullable=True),
    Column('version_nickname', String(255), nullable=True)
)

events = Table(
    'events', metadata,
    Column('id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('shop_wide_event', Boolean, nullable=False),
    Column('game', Integer, ForeignKey('catalogue.id'), nullable=True),
    Column('time', DateTime, nullable=False),
    Column('description', String(1000), nullable=False),
    Column('players', String(255), nullable=False),
    Column('notify_tags', Integer, ForeignKey('notifications.id'), nullable=False)
)

notifications = Table(
    'notifications', metadata,
    Column('id', Integer, primary_key=True),
    Column('thing_to_notify_about', Integer, ForeignKey('events.notify_tags'), nullable=False)
)

user_interests = Table(
    'user_interests', metadata,
    Column('user', Integer, primary_key=True),
    Column('notifications', Integer, ForeignKey('notifications.id'), nullable=False)
)

# Drop existing tables with proper order to prevent circular dependency
metadata.reflect(bind=engine)
for table in reversed(metadata.sorted_tables):
    table.drop(engine, checkfirst=True)
metadata.drop_all(engine)

# Create tables
metadata.create_all(engine)

# Load CSV
df = pd.read_csv('collection (1).csv')

# Selecting relevant columns and renaming to match Catalogue model
catalogue_data = df[['objectid', 'objectname', 'weight', 'rating', 'numplays', 'own', 'fortrade', 'want', 'wanttobuy', 'wanttoplay', 'acquisitiondate', 'acquiredfrom', 'invdate', 'version_publishers', 'version_languages', 'version_yearpublished', 'version_nickname']].copy()
catalogue_data.rename(columns={
    'objectid': 'id',
    'objectname': 'name',
    'weight': 'difficulty',
    'rating': 'rating',
    'numplays': 'numplays',
    'invdate': 'invdate'
}, inplace=True)

# Convert date fields if necessary
catalogue_data['acquisitiondate'] = pd.to_datetime(catalogue_data['acquisitiondate'], errors='coerce')
catalogue_data['invdate'] = pd.to_datetime(catalogue_data['invdate'], errors='coerce')

# Insert data into MySQL
Session = sessionmaker(bind=engine)
session = Session()
try:
    catalogue_data.to_sql('catalogue', con=engine, if_exists='append', index=False)
    session.commit()
    print("Seeding completed successfully!")
except Exception as e:
    session.rollback()
    print(f"Error while inserting data: {e}")
finally:
    session.close()
