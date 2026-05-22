from models.redblack_tree import RBTree
from models.binomial_heap import BinomialHeap
from models.patient import Patient

class EmergencyRoom:
    def __init__(self, num_rooms=3):
        self.num_rooms = num_rooms
        self.rooms = {i: BinomialHeap() for i in range(1, num_rooms+1)}
        self.room_sizes = {i:0 for i in range(1, num_rooms+1)}
        self.rbt = RBTree()
        self.patient_records = {}
        self.total_treated = 0

    def add_patient(self, name, cnp, severity):
        patient = Patient(name, cnp, severity)
        priority = patient.composite_priority()

        best_room = min(self.room_sizes, key=self.room_sizes.get)
        patient.assigned_room = best_room

        self.rooms[best_room].insert(priority,patient)
        self.rbt.insert(priority, patient)
        self.patient_records[cnp] = patient
        self.room_sizes[best_room] += 1

    def admit_next(self, room_id):
        node = self.rooms[room_id].extract_min()
        if node is None:
            return None
        
        patient = node.patient
        self.rbt.delete(node.key)
        del self.patient_records[patient.cnp]
        self.room_sizes[room_id] -= 1
        self.total_treated += 1
        return patient
    
    def mass_casualty(self):
        all_patients = []
        for room_id in self.rooms:
            while not self.rooms[room_id].is_empty():
                node = self.rooms[room_id].extract_min()
                all_patients.append(node.patient)
            self.room_sizes[room_id] = 0
        
        self.rbt = RBTree()
        for i, patient in enumerate(all_patients):
            room_id = (i % self.num_rooms) + 1
            patient.assigned_room = room_id
            priority = patient.composite_priority()
            self.rooms[room_id].insert(priority, patient)
            self.rbt.insert(priority, patient)
            self.room_sizes[room_id] +=1

        return len(all_patients)
    
    def get_status(self):
        return {
            "room_sizes": dict(self.room_sizes),
            "total_treated": self.total_treated,
            "total_waiting": sum(self.room_sizes.values()),
            "patients": {cnp: str(p) for cnp, p in self.patient_records.items()}
        }
    
if __name__ == "__main__":
    er = EmergencyRoom()

    er.add_patient("Ion", "123", 2)
    er.add_patient("Maria", "456", 5)
    er.add_patient("Andrei", "789", 1)
    er.add_patient("Elena", "321", 3)
    er.add_patient("Mihai", "654", 4)
    er.add_patient("Ana", "987", 1)

    print("=== Status after adding 6 patients ===")
    print(er.get_status())

    print("\n=== Admit next from room 1 ===")
    p = er.admit_next(1)
    print(f"Treated: {p}")
    print(er.get_status())

    print("\n=== Mass casualty ===")
    count = er.mass_casualty()
    print(f"Redistributed {count} patients")
    print(er.get_status())