import logging
from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger(__name__)

# Replace with your MongoDB connection string if different
MONGO_URL = "mongodb://bitigchi_admin:BitigchiMongo2024Secure!@localhost:27017"

class MongoDB:
    client: AsyncIOMotorClient = None
    db = None

db_mongo = MongoDB()

async def connect_to_mongo():
    logger.info("Connecting to MongoDB...")
    db_mongo.client = AsyncIOMotorClient(MONGO_URL)
    db_mongo.db = db_mongo.client.bitigchi_social
    logger.info("Connected to MongoDB successfully.")

async def close_mongo_connection():
    if db_mongo.client:
        logger.info("Closing MongoDB connection...")
        db_mongo.client.close()
        logger.info("MongoDB connection closed.")

def get_mongo_db():
    return db_mongo.db
