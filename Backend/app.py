from flask import Flask, request, jsonify
import rfid_reader  # Import RFID reading functions

app = Flask(__name__)

# In-memory storage for parking slots and RFID tags (for demonstration)
PARKING_SLOTS = 100  # Initial number of slots
parked_vehicles = set()  # To track parked vehicles by RFID

@app.route('/api/parking/enter', methods=['POST'])
def enter_parking():
    rfid = request.json.get('rfid')
    
    if not rfid:
        return jsonify({'error': 'RFID tag is required'}), 400

    # Check if the vehicle is already parked
    if rfid in parked_vehicles:
        return jsonify({'error': 'Vehicle is already parked'}), 400

    # Deduct a parking slot
    global PARKING_SLOTS
    if PARKING_SLOTS > 0:
        PARKING_SLOTS -= 1
        parked_vehicles.add(rfid)
        return jsonify({'message': 'Vehicle entered', 'slots_left': PARKING_SLOTS}), 200
    else:
        return jsonify({'error': 'No parking slots available'}), 400

@app.route('/api/parking/exit', methods=['POST'])
def exit_parking():
    rfid = request.json.get('rfid')

    if not rfid:
        return jsonify({'error': 'RFID tag is required'}), 400

    # Check if the vehicle is in the lot
    if rfid in parked_vehicles:
        global PARKING_SLOTS
        PARKING_SLOTS += 1
        parked_vehicles.remove(rfid)
        return jsonify({'message': 'Vehicle exited', 'slots_left': PARKING_SLOTS}), 200
    else:
        return jsonify({'error': 'Vehicle not found in parking lot'}), 400

@app.route('/api/incident-report', methods=['POST'])
def report_incident():
    student_id = request.form.get('studentId')
    description = request.form.get('description')
    photo = request.files.get('photo')

    # Simulate incident report submission logic
    if not student_id or not description or not photo:
        return jsonify({'error': 'All fields are required'}), 400
    
    # Save the photo file (this can be enhanced for security)
    photo.save(f'./reports/{student_id}_incident.jpg')

    # Store or log the incident data (simulated here)
    return jsonify({'message': 'Incident report submitted'}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)  # Run the Flask app on Raspberry Pi
