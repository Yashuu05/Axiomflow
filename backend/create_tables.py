import os
from dotenv import load_dotenv
import pymysql

load_dotenv()

host = os.getenv("DB_HOST")
port = int(os.getenv("DB_PORT", 3306))
user = os.getenv("DB_USER")
password = os.getenv("DB_PASSWORD")
target_db = os.getenv("DB_NAME", "axiomflow_db")

TABLES = {}

TABLES['business_profile'] = """
CREATE TABLE IF NOT EXISTS `business_profile` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `business_name` VARCHAR(255) NOT NULL,
    `sector` VARCHAR(100) NULL,
    `gstin` VARCHAR(30) NOT NULL,
    `cin` VARCHAR(30) NOT NULL,
    `phone_no` VARCHAR(25) NULL,
    `email` VARCHAR(255) NULL,
    `website_url` VARCHAR(500) NULL,
    `description` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_business_profile_gstin` (`gstin`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
"""

TABLES['users'] = """
CREATE TABLE IF NOT EXISTS `users` (
    `user_id` VARCHAR(64) PRIMARY KEY,
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NULL,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `department` VARCHAR(100) NULL,
    `profession` VARCHAR(100) NULL,
    `mobile_no` VARCHAR(25) NULL,
    `role` VARCHAR(50) DEFAULT 'spectator',
    `business_id` INT NULL,
    `password` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_users_role` (`role`),
    INDEX `idx_users_department` (`department`),
    INDEX `idx_users_business_id` (`business_id`),
    CONSTRAINT `fk_users_business` FOREIGN KEY (`business_id`) REFERENCES `business_profile` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
"""

TABLES['logs'] = """
CREATE TABLE IF NOT EXISTS `logs` (
    `task_id` VARCHAR(64) PRIMARY KEY,
    `query` TEXT NULL,
    `status` VARCHAR(50) NOT NULL,
    `task_description` TEXT NULL,
    `agent_name` VARCHAR(100) NULL,
    `llm_name` VARCHAR(100) NULL,
    `time_taken` FLOAT NULL,
    `time_stamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_logs_status` (`status`),
    INDEX `idx_logs_agent` (`agent_name`),
    INDEX `idx_logs_timestamp` (`time_stamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
"""

TABLES['notifications'] = """
CREATE TABLE IF NOT EXISTS `notifications` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `date` DATE NULL,
    `time` TIME NULL,
    `message` TEXT NOT NULL,
    `status` VARCHAR(50) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_notifications_status` (`status`),
    INDEX `idx_notifications_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
"""

def create_tables():
    print(f"Connecting to AWS RDS MySQL `{target_db}` at {host}:{port} as {user}...")
    try:
        conn = pymysql.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            database=target_db,
            connect_timeout=10,
            autocommit=True
        )
        print("Connected successfully!")

        with conn.cursor() as cursor:
            for table_name, ddl in TABLES.items():
                print(f"Creating table `{table_name}`...")
                cursor.execute(ddl)
                print(f"[OK] Table `{table_name}` created or already exists.")

            print("\n--- Current Tables in Database ---")
            cursor.execute("SHOW TABLES;")
            tables = [row[0] for row in cursor.fetchall()]
            for tbl in tables:
                print(f"- {tbl}")

            print("\n--- Table Structures ---")
            for tbl in TABLES.keys():
                print(f"\n[DESCRIBE {tbl}]:")
                cursor.execute(f"DESCRIBE `{tbl}`;")
                cols = cursor.fetchall()
                for col in cols:
                    print(f"  {col[0]:<20} {col[1]:<20} Null:{col[2]:<6} Key:{col[3]:<6} Default:{str(col[4]):<10}")

        conn.close()
        print("\n[SUCCESS] All tables created and verified successfully!")

    except Exception as e:
        print(f"\n[ERROR] Table creation failed: {e}")
        raise e

if __name__ == "__main__":
    create_tables()
