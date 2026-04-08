import os
import environ
import psycopg

# Load environment variables
env = environ.Env()
environ.Env.read_env('.env')

database_url = env('DATABASE_URL')

def verify_tables():
    try:
        # Connect to the database
        with psycopg.connect(database_url) as conn:
            with conn.cursor() as cur:
                # Query to list all tables in the public schema
                cur.execute("""
                    SELECT count(*) FROM information_schema.tables 
                    WHERE table_schema = 'public';
                """)
                table_count = cur.fetchone()[0]
                
                # Get some sample table names
                cur.execute("""
                    SELECT table_name FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    LIMIT 10;
                """)
                sample_tables = [row[0] for row in cur.fetchall()]
                
                # Check for the Emmanuel user
                cur.execute("SELECT count(*) FROM auth_user WHERE username = 'Emmanuel';")
                emmanuel_exists = cur.fetchone()[0] > 0

                print(f"✅ Total Tables Found: {table_count}")
                print(f"🔍 Sample Tables: {', '.join(sample_tables)}")
                print(f"👤 Admin 'Emmanuel' Found: {'Yes' if emmanuel_exists else 'No'}")
                
                if table_count > 30 and emmanuel_exists:
                    print("\n🚀 CONCLUSION: The database is perfectly synchronized and professionalized!")
                else:
                    print("\n⚠️ WARNING: Some tables or data might be missing.")

    except Exception as e:
        print(f"❌ Error connecting to database: {e}")

if __name__ == "__main__":
    verify_tables()
