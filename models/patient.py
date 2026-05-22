from datetime import datetime as dt

class Patient:
    def __init__(self, name, cnp, severity):
        self.name = name
        self.cnp = cnp
        self.severity = severity
        self.arrival_time = dt.now()
        self.assigned_room = None

    def composite_priority(self):
        minutes = (dt.now() - self.arrival_time).total_seconds()/60
        return self.severity*10 - (minutes / 30)
    
    def __str__(self):
        return f"{self.name} (sev:{self.severity}, room:{self.assigned_room})"
    
    def __repr__(self):
        return self.__str__()
    