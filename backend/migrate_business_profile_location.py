import os
import pymysql
from dotenv import load_dotenv

load_dotenv(".env")
load_dotenv("backend/.env")

host = os.getenv("DB_HOST")
port = int(os.getenv("DB_PORT", 3306))
user = os.getenv("DB_USER")
password = os.getenv("DB_PASSWORD")
database = os.getenv("DB_NAME", "axiomflow_db")

print(f"Connecting to database {database} at {host}:{port}...")
conn = pymysql.connect(
    host=host,
    port=port,
    user=user,
    password=password,
    database=database,
    autocommit=True
)

with conn.cursor() as cur:
    # 1. Modify address to allow NULL if needed
    try:
        cur.execute("ALTER TABLE `business_profile` MODIFY COLUMN `address` TEXT NULL;")
        print("[OK] `address` column modified to NULL.")
    except Exception as e:
        print(f"[INFO] `address` modification: {e}")

    # 2. Add location_address if not present
    try:
        cur.execute("ALTER TABLE `business_profile` ADD COLUMN `location_address` TEXT NULL AFTER `website_url`;")
        print("[OK] `location_address` column added.")
    except Exception as e:
        print(f"[INFO] `location_address` column: {e}")

    # 3. Add time_zone if not present
    try:
        cur.execute("ALTER TABLE `business_profile` ADD COLUMN `time_zone` VARCHAR(100) NULL DEFAULT 'Asia/Kolkata' AFTER `location_address`;")
        print("[OK] `time_zone` column added.")
    except Exception as e:
        print(f"[INFO] `time_zone` column: {e}")

    # 4. Add country if not present
    try:
        cur.execute("ALTER TABLE `business_profile` ADD COLUMN `country` VARCHAR(100) NULL DEFAULT 'INDIA' AFTER `time_zone`;")
        print("[OK] `country` column added.")
    except Exception as e:
        print(f"[INFO] `country` column: {e}")

    # Sync existing address values into location_address if empty
    cur.execute("UPDATE `business_profile` SET `location_address` = `address` WHERE (`location_address` IS NULL OR `location_address` = '') AND `address` IS NOT NULL;")
    cur.execute("UPDATE `business_profile` SET `time_zone` = 'Asia/Kolkata' WHERE `time_zone` IS NULL OR `time_zone` = '';")
    cur.execute("UPDATE `business_profile` SET `country` = 'INDIA' WHERE `country` IS NULL OR `country` = '';")
    print("[OK] Existing rows updated with default/fallback data.")

    print("\n--- Current Schema of `business_profile` ---")
    cur.execute("DESCRIBE `business_profile`;")
    for col in cur.fetchall():
        print(f"  {col[0]:<20} {col[1]:<20} Null:{col[2]:<6} Key:{col[3]:<6} Default:{str(col[4]):<10}")

conn.close()
print("\n[SUCCESS] Migration completed successfully!")
