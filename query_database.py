"""
SmartPort AI — SQLite Data Query Script
Run this script to fetch and display data from the SQLite database.
"""

import sqlite3
from pathlib import Path

# Database path
DB_PATH = Path(__file__).resolve().parent / "backend" / "data" / "smartport.db"

def run_query(title: str, query: str):
    print("\n" + "=" * 70)
    print(f" {title}")
    print("=" * 70)
    print(f"SQL: {query}\n")

    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()

    try:
        cursor.execute(query)
        rows = cursor.fetchall()
        columns = [desc[0] for desc in cursor.description]

        if not rows:
            print("  (Table is currently empty / 0 records returned)")
            return

        # Format column widths
        col_widths = [len(c) for c in columns]
        for row in rows:
            for i, val in enumerate(row):
                col_widths[i] = max(col_widths[i], len(str(val if val is not None else "")))

        # Header
        header = " | ".join(f"{col:<{col_widths[i]}}" for i, col in enumerate(columns))
        sep = "-+-".join("-" * col_widths[i] for i in range(len(columns)))
        print(f" {header}")
        print(f" {sep}")

        # Rows
        for row in rows:
            row_str = " | ".join(f"{str(val if val is not None else ''):<{col_widths[i]}}" for i, val in enumerate(row))
            print(f" {row_str}")

        print(f"\n Total rows: {len(rows)}")

    except Exception as e:
        print(f"Error executing query: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    print("Connecting to:", DB_PATH)

    # 1. Fetch User Accounts & Roles
    run_query(
        "1. ALL ACTIVE USERS & ASSIGNED ROLES",
        """
        SELECT 
            p.email, 
            p.first_name || ' ' || p.last_name AS full_name, 
            p.organization, 
            r.role, 
            p.status 
        FROM profiles p
        JOIN user_roles r ON p.id = r.user_id
        ORDER BY r.role;
        """
    )

    # 2. Fetch Port Berths
    run_query(
        "2. PSA SINGAPORE BERTHS (First 10)",
        """
        SELECT code, terminal_name, length_m, max_draft_m, status 
        FROM berths 
        ORDER BY code 
        LIMIT 10;
        """
    )

    # 3. Fetch Shipment Submissions
    run_query(
        "3. SHIPMENT SUBMISSIONS",
        """
        SELECT id, reference, vessel_name, imo_number, shipping_company, stage, berth_code, created_at 
        FROM shipment_submissions 
        ORDER BY created_at DESC;
        """
    )

    # 4. Fetch Physical Containers
    run_query(
        "4. CONTAINER YARD INVENTORY",
        """
        SELECT id, container_number, iso_type, stage, yard_block, bay_row_tier, is_reefer, is_hazardous 
        FROM containers 
        LIMIT 10;
        """
    )

    # 5. Fetch Audit Trail Logs
    run_query(
        "5. AUDIT COMPLIANCE LOGS",
        """
        SELECT id, actor_email, action, target_type, success, created_at 
        FROM audit_logs 
        ORDER BY created_at DESC 
        LIMIT 5;
        """
    )

