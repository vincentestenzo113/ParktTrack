import RPi.GPIO as GPIO
from long_range_rfid_library import LongRangeRFIDReader
import time

reader = LongRangeRFIDReader()

# Store active entries (rfid: entry_time)
active_entries = {}

def read_rfid():
    try:
        print("Waiting for RFID card...")
        rfid = reader.read_long_range()
        if rfid:
            print(f"RFID detected: {rfid}")
            return rfid
        else:
            print("No RFID detected")
            return None
    except Exception as e:
        print(f"Error reading RFID: {e}")
        return None
    finally:
        GPIO.cleanup()

def handle_entry(rfid):
    current_time = time.strftime("%Y-%m-%d %H:%M:%S")
    if rfid not in active_entries:
        active_entries[rfid] = current_time
        print(f"Vehicle with RFID {rfid} entered at {current_time}")
        return {"rfid": rfid, "action": "enter", "time": current_time}
    else:
        print(f"Vehicle with RFID {rfid} is already inside.")

def handle_exit(rfid):
    if rfid in active_entries:
        entry_time = active_entries.pop(rfid)
        current_time = time.strftime("%Y-%m-%d %H:%M:%S")
        print(f"Vehicle with RFID {rfid} exited at {current_time}, entered at {entry_time}")
        return {"rfid": rfid, "action": "exit", "time": current_time}
    else:
        print(f"Vehicle with RFID {rfid} not found for exit.")

# Main loop
try:
    while True:
        rfid = read_rfid()
        if rfid:
            if rfid in active_entries:
                handle_exit(rfid)  # If RFID is detected and already in, handle exit
            else:
                handle_entry(rfid)  # If RFID is not in, handle entry
finally:
    GPIO.cleanup()
