from flask import Flask, render_template, request, jsonify
from models.emergency_room import EmergencyRoom

app = Flask(__name__)
er = EmergencyRoom()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/patient', methods=['POST'])
def add_patient():
    data = request.json
    er.add_patient(data['name'], data['cnp'], int(data['severity']))
    return jsonify({"status" : "ok"})

@app.route('/api/admit/<int:room_id>', methods=['POST'])
def admit_next(room_id):
    patient = er.admit_next(room_id)
    if patient is None:
        return jsonify({"error" : "Room is empty"}), 400
    return jsonify({"patient" : str(patient)})

@app.route('/api/mass-casualty', methods=['POST'])
def mass_casualty():
    count = er.mass_casualty()
    return jsonify({"redistributed" : count})

@app.route('/api/status')
def get_status():
    return jsonify(er.get_status())

@app.route('/api/rbt')
def get_rbt():
    return jsonify(er.rbt.to_dict())

@app.route('/api/heap/<int:room_id>')
def get_heap(room_id):
    return jsonify(er.rooms[room_id].to_list())

@app.route('/api/search/<cnp>')
def search_patient(cnp):
    patient = er.patient_records.get(cnp)
    if patient is None:
        return jsonify({"error": "Patient not found"}), 404
    return jsonify({
        "name": patient.name,
        "cnp": patient.cnp,
        "severity": patient.severity,
        "room": patient.assigned_room,
        "priority": round(patient.composite_priority(), 2),
        "arrival": patient.arrival_time.strftime("%H:%M:%S")
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)

    