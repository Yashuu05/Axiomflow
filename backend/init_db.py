import os
from dotenv import load_dotenv
import pymysql

load_dotenv()

host = os.getenv("DB_HOST")
port = int(os.getenv("DB_PORT", 3306))
user = os.getenv("DB_USER")
password = os.getenv("DB_PASSWORD")
target_db = os.getenv("DB_NAME", "axiomflow_db")

print(f"Connecting to host: {host}:{port} as user: {user}...")

try:
    # 1. Connect without specifying the target db to check/create it
    conn = pymysql.connect(
        host=host,
        port=port,
        user=user,
        password=password,
        connect_timeout=10,
        autocommit=True
    )
    print("Successfully connected to AWS RDS MySQL instance!")

    with conn.cursor() as cursor:
        cursor.execute("SELECT VERSION();")
        version = cursor.fetchone()
        print(f"MySQL Version: {version[0]}")

        # Create database if it doesn't exist
        print(f"Initiating database '{target_db}'...")
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{target_db}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
        print(f"Database '{target_db}' initiated successfully.")

        # Show databases
        cursor.execute("SHOW DATABASES;")
        dbs = [row[0] for row in cursor.fetchall()]
        print(f"Available databases: {dbs}")

    conn.close()

    # 2. Connect directly to axiomflow_db to verify access
    print(f"Testing direct connection to database '{target_db}'...")
    conn_db = pymysql.connect(
        host=host,
        port=port,
        user=user,
        password=password,
        database=target_db,
        connect_timeout=10
    )
    with conn_db.cursor() as cursor:
        cursor.execute("SELECT DATABASE();")
        active_db = cursor.fetchone()
        print(f"Active database confirmed: {active_db[0]}")
    conn_db.close()

    print("\n[SUCCESS] AWS RDS MySQL connection and database initiation verified successfully!")

except Exception as e:
    print(f"\n[ERROR] Connection failed: {e}")
    raise e
