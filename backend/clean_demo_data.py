"""
SmartPort AI — Clean Database Script
Removes all demo shipments, containers, documents, AI verifications,
notifications, and demo audit logs from SQLite (smartport.db).
PRESERVES: All user logins (admin, port authority, etc.), profiles, roles, and berth infrastructure.
"""

import sys
import shutil
import sqlite3
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent
DB_PATH = BACKEND_DIR / "data" / "smartport.db"
STANDALONE_DB_PATH = BACKEND_DIR.parent / "database" / "smartport.db"

def clean_database():
    print("=" * 65)
    print("        SMARTPORT AI — CLEANING DATABASE DEMO DATA             ")
    print("=" * 65)
    print(f"Target Database: {DB_PATH}")

    if not DB_PATH.exists():
        print(f"[-] Database file not found at {DB_PATH}")
        sys.exit(1)

    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()

    try:
        # 1. Check existing users
        cursor.execute("SELECT count(*) FROM auth_users;")
        user_count = cursor.fetchone()[0]
        cursor.execute("SELECT count(*) FROM profiles;")
        profile_count = cursor.fetchone()[0]
        cursor.execute("SELECT count(*) FROM user_roles;")
        role_count = cursor.fetchone()[0]
        print(f"\n[1] Verified User Accounts (PRESERVED):")
        print(f"    - auth_users : {user_count} accounts")
        print(f"    - profiles   : {profile_count} profiles")
        print(f"    - user_roles : {role_count} roles")

        # List all preserved users
        cursor.execute("SELECT email FROM auth_users ORDER BY email;")
        print("    Accounts kept for login:")
        for (email,) in cursor.fetchall():
            print(f"      * {email}")

        # 2. Delete demo operational data
        print("\n[2] Removing demo data...")
        tables_to_clear = [
            "submission_documents",
            "ai_verifications",
            "containers",
            "workflow_events",
            "shipment_submissions",
            "notifications",
            "audit_logs",
            "login_history",
        ]

        deleted_counts = {}
        for table in tables_to_clear:
            cursor.execute(f"SELECT count(*) FROM {table};")
            before = cursor.fetchone()[0]
            cursor.execute(f"DELETE FROM {table};")
            deleted_counts[table] = before
            print(f"    - Deleted from {table:<22} : {before:>4} demo records removed")

        # 3. Reset all berths to 'available' (except maintenance)
        cursor.execute("UPDATE berths SET status = 'available' WHERE status = 'occupied';")
        updated_berths = cursor.rowcount
        print(f"\n[3] Berth Infrastructure Status:")
        print(f"    - Reset {updated_berths} occupied berths to 'available'.")
        cursor.execute("SELECT count(*) FROM berths;")
        total_berths = cursor.fetchone()[0]
        cursor.execute("SELECT count(*) FROM berths WHERE status = 'available';")
        avail_berths = cursor.fetchone()[0]
        print(f"    - Total berths: {total_berths} ({avail_berths} available, {total_berths - avail_berths} in maintenance)")

        # 4. Insert clean system initialization audit log
        cursor.execute("SELECT id FROM auth_users WHERE email = 'admin@smartport.ai' LIMIT 1;")
        admin_row = cursor.fetchone()
        admin_id = admin_row[0] if admin_row else "system-admin"

        cursor.execute("""
            INSERT INTO audit_logs (id, actor_id, actor_email, action, target_type, target_id, success, metadata, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        """, (
            "clean-init-01",
            admin_id,
            "admin@smartport.ai",
            "database_cleaned",
            "database",
            "smartport.db",
            1,
            '{"status": "clean", "demo_data_removed": true, "all_users_preserved": true}'
        ))

        # 5. Commit and VACUUM SQLite
        conn.commit()
        print("\n[4] Running VACUUM to shrink and optimize SQLite file...")
        cursor.execute("VACUUM;")
        conn.close()

        # 6. Mirror cleaned database to database/smartport.db
        if STANDALONE_DB_PATH.parent.exists():
            shutil.copy2(str(DB_PATH), str(STANDALONE_DB_PATH))
            print(f"[5] Mirrored clean database to {STANDALONE_DB_PATH}")

        print("\n" + "=" * 65)
        print(" [SUCCESS] ALL DEMO DATA HAS BEEN REMOVED FROM DATABASE!")
        print(" All login accounts (admin, port authority, etc.) are 100% PRESERVED.")
        print("=" * 65)

    except Exception as e:
        conn.rollback()
        conn.close()
        print(f"[-] ERROR cleaning database: {e}")
        sys.exit(1)

if __name__ == "__main__":
    clean_database()
