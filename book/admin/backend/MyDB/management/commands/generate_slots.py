import mysql.connector
from datetime import datetime, timedelta

# MySQL Configuration
db_config = {
    'user': 'root',
    'password': 'password',
    'host': 'localhost',
    'database': 'bookitdb',
    'port': '3306'
}

# Configuration for slot generation
start_date = datetime.now().date()
end_date = datetime(2024, 8, 30).date()
slot_duration = timedelta(minutes=15)
start_time = datetime.strptime('07:00', '%H:%M').time()
end_time = datetime.strptime('17:00', '%H:%M').time()
dentist_id = 1  # Set your actual dentist_id here

# Connect to the MySQL database
connection = mysql.connector.connect(**db_config)
cursor = connection.cursor()

current_date = start_date

try:
    while current_date <= end_date:
        current_time = start_time
        
        while datetime.combine(current_date, current_time) < datetime.combine(current_date, end_time):
            start_datetime = datetime.combine(current_date, current_time)
            end_datetime = start_datetime + slot_duration
            
            # Prepare the SQL INSERT statement
            sql_statement = (
                "INSERT INTO appointment_slots (dentist_id, start_time, end_time, is_available, service_id) "
                "VALUES (%s, %s, %s, %s, %s)"
            )
            values = (dentist_id, start_datetime, end_datetime, True, None)
            
            # Execute the SQL command
            cursor.execute(sql_statement, values)
            
            # Move to the next slot
            current_time = (datetime.combine(current_date, current_time) + slot_duration).time()
        
        # Move to the next day
        current_date += timedelta(days=1)
    
    # Commit the transaction
    connection.commit()
    print("Slots successfully inserted into the database.")
    
except mysql.connector.Error as err:
    print(f"Error: {err}")
    connection.rollback()
finally:
    cursor.close()
    connection.close()
