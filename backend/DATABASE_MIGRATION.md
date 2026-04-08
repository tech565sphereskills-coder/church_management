# PostgreSQL Migration Guide

To ensure your church management portal is professional and scalable, you must migrate from SQLite (the current development database) to PostgreSQL (an enterprise-grade production database).

## Prerequisites

1.  **PostgreSQL Installed**: Ensure you have PostgreSQL installed on your server or local machine.
2.  **Database Created**: Create a brand new database for the RCCG portal.
    ```bash
    psql -U postgres -c "CREATE DATABASE rccg_portal;"
    ```
3.  **Dependencies**: The project already includes `psycopg[binary]` in `requirements.txt`.

---

## Migration Steps

Follow these steps carefully to preserve your existing data during the switch.

### 1. Export Existing Data (SQLite)
While still using the SQLite database, dump all your current data to a JSON file.
```bash
python manage.py dumpdata --exclude auth.permission --exclude contenttypes > data_dump.json
```

### 2. Update Environment Variables
Open your `.env` file and set the `DATABASE_URL` to point to your new PostgreSQL instance.
```env
DATABASE_URL=postgres://user:password@localhost:5432/rccg_portal
```

### 3. Initialize PostgreSQL Schema
Run the migrations against the new PostgreSQL database.
```bash
python manage.py migrate
```

### 4. Clear Default Content
Before importing the data dump, clear any automatically created content (like default content types or sites) to avoid conflicts.
```bash
python manage.py shell
# Inside the shell:
from django.contrib.contenttypes.models import ContentType
ContentType.objects.all().delete()
exit()
```

### 5. Import Your Data
Load the data from the JSON file into PostgreSQL.
```bash
python manage.py loaddata data_dump.json
```

### 6. Verify
Restart your server and log in. All your members, financials, and settings should now be safely stored in PostgreSQL.

---

> [!WARNING]
> **Data Loss Risk**: Always back up your `db.sqlite3` file before starting this process. If anything goes wrong, you can revert by simply commenting out the `DATABASE_URL` in your `.env` and Django will revert to SQLite.
