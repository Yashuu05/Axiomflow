import os
import pymysql
from dotenv import load_dotenv

load_dotenv()

host = os.getenv("DB_HOST")
port = int(os.getenv("DB_PORT", 3306))
user = os.getenv("DB_USER")
password = os.getenv("DB_PASSWORD")
target_db = os.getenv("DB_NAME", "axiomflow_db")

def migrate():
    print(f"Connecting to {host}:{port}/{target_db}...")
    conn = pymysql.connect(
        host=host,
        port=port,
        user=user,
        password=password,
        database=target_db,
        autocommit=True
    )
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = %s AND TABLE_NAME = 'users' AND COLUMN_NAME = 'business_id';
            """,
            (target_db,)
        )
        row = cur.fetchone()
        if not row:
            print("Adding `business_id` column to `users` with FOREIGN KEY referencing `business_profile.id`...")
            cur.execute(
                """
                ALTER TABLE `users` 
                ADD COLUMN `business_id` INT NULL AFTER `role`,
                ADD CONSTRAINT `fk_users_business` FOREIGN KEY (`business_id`) REFERENCES `business_profile`(`id`) ON DELETE CASCADE,
                ADD INDEX `idx_users_business_id` (`business_id`);
                """
            )
            print("[SUCCESS] Added `business_id` column and foreign key constraint.")
        else:
            print("[INFO] `business_id` column already exists in `users`.")

        print("\n--- Verified `users` table schema ---")
        cur.execute("DESCRIBE `users`;")
        for col in cur.fetchall():
            print(f"  {col[0]:<20} {col[1]:<20} Null:{col[2]:<6} Key:{col[3]:<6} Default:{str(col[4]):<10}")

    conn.close()

if __name__ == "__main__":
    migrate()
