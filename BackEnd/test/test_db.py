import psycopg2

try:
    conn = psycopg2.connect(
        dbname="foodstore_db",
        user="postgres",
        password="1234",
        host="localhost",
        port="5432"
    )
    print("Funciona")
    conn.close()
except Exception as e:
    print(f"Error: {e}")