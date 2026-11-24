"""
SmartPort AI - SQLite Database Connection & Health Verification Script
This script verifies the SQLite database connection, tables, schemas, and live record counts.
"""

import sys
import os
import sqlite3
from pathlib import Path

# Locate database
BACKEND_DIR = Path(__file__).resolve().parent
DB_PATH = BACKEND_DIR / "data" / "smartport.db"

def check_sqlite_connection():
    print("=" * 65)
    print("       SMARTPORT AI - SQLITE DATABASE VERIFICATION TOOL        ")
    print("=" * 65)
    print(f"[1] Database File Location:\n    {DB_PATH}\n")

    if not DB_PATH.exists():
        print("[-] ERROR: Database file does not exist at this path!")
        sys.exit(1)

    file_size_kb = os.path.getsize(DB_PATH) / 1024
    print(f"[2] Database File Status:  EXISTS (Size: {file_size_kb:.2f} KB)")

    try:
        conn = sqlite3.connect(str(DB_PATH))
        cursor = conn.cursor()
        print("[3] SQLite Engine Connection: SUCCESSFUL (Connected)")

        # Check SQLite Version & Pragmas
        cursor.execute("SELECT sqlite_version();")
        version = cursor.fetchone()[0]
        cursor.execute("PRAGMA journal_mode;")
        journal_mode = cursor.fetchone()[0]
        cursor.execute("PRAGMA foreign_keys;")
        foreign_keys = cursor.fetchone()[0]
        print(f"    - SQLite Version : {version}")
        print(f"    - Journal Mode   : {journal_mode.upper()}")
        print(f"    - Foreign Keys   : {'ON' if foreign_keys else 'OFF'}\n")

        # Check Tables & Row Counts
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;")
        tables = [row[0] for row in cursor.fetchall()]

        print(f"[4] Relational Tables Found: {len(tables)} tables")
        print("-" * 65)
        print(f" {'TABLE NAME':<26} | {'COLUMNS':<9} | {'RECORD COUNT':<12}")
        print("-" * 65)

        total_rows = 0
        for table in tables:
            cursor.execute(f"PRAGMA table_info({table});")
            col_count = len(cursor.fetchall())

            cursor.execute(f"SELECT count(*) FROM {table};")
            count = cursor.fetchone()[0]
            total_rows += count

            print(f" {table:<26} | {col_count:<9} | {count:>6} rows")

        print("-" * 65)
        print(f" {'TOTAL ACROSS ALL TABLES':<26} |           | {total_rows:>6} rows")
        print("-" * 65)

        # Quick sample check of users and berths
        print("\n[5] Sample Verification of Key Tables:")
        cursor.execute("SELECT p.email, r.role FROM profiles p JOIN user_roles r ON p.id = r.user_id ORDER BY r.role;")
        users = cursor.fetchall()
        print(f"    Preserved User Accounts ({len(users)} accounts):")
        for u in users:
            print(f"      * {u[0]:<34} -> Role: {u[1]}")

        cursor.execute("SELECT code, terminal_name, status FROM berths LIMIT 4;")
        berths = cursor.fetchall()
        print("\n    Pre-seeded Berths (first 4):")
        for b in berths:
            print(f"      * Berth {b[0]:<8} ({b[1]:<24}) -> Status: {b[2]}")

        conn.close()
        print("\n" + "=" * 65)
        print(" [RESULT] SQLite Database is 100% HEALTHY, CONNECTED & OPERATIONAL!")
        print("=" * 65)

    except Exception as e:
        print(f"[-] ERROR connecting to SQLite database: {e}")
        sys.exit(1)

if __name__ == "__main__":
    check_sqlite_connection()

