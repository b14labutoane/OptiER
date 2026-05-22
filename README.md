# OptiER — Optimal Emergency Room Patient Distribution

A data structures project implementing an intelligent Emergency Room management system that ensures fair and priority-based patient distribution across multiple treatment rooms.

## Overview

OptiER uses two advanced data structures — **Red-Black Tree** and **Binomial Heap** — to manage patient triage and room assignment in an emergency department. The system prioritizes critical patients while ensuring that lower-severity patients don't wait indefinitely.

## Data Structures

### Red-Black Tree
- Maintains a balanced index of all patients sorted by composite priority
- Supports O(log n) guaranteed insert, delete, and search
- Used for range queries (e.g., "show all critical patients")
- Self-balancing with rotations and recoloring (5 invariant rules)

### Binomial Heap
- One heap per treatment room — acts as a priority queue
- Supports O(log n) **merge** operation (key advantage over binary heaps)
- Used for "mass casualty mode" — merge all room queues and redistribute fairly
- Insert: O(log n) guaranteed, O(1) amortized

## Fair Distribution Algorithm

Each patient gets a **composite priority** score:

```
priority = severity × 10 − (minutes_waiting / 30)
```

- Lower score = more urgent
- Severity dominates, but waiting time gradually increases urgency (prevents starvation)
- Patients are assigned to the room with the fewest current patients

**Mass Casualty Mode:** All room heaps are merged into one, then patients are redistributed round-robin across rooms.

## Complexity Analysis

| Operation | Red-Black Tree | Binomial Heap |
|---|---|---|
| Insert | O(log n) guaranteed | O(log n) guaranteed |
| Delete | O(log n) guaranteed | O(log n) |
| Search | O(log n) | O(n) |
| Find Min | O(log n) | O(log n) |
| Merge two heaps | — | O(log n) |
| Extract Min | O(log n) | O(log n) |
| Space | O(n) | O(n) |

## Project Structure

```
OptiER/
├── models/
│   ├── patient.py              # Patient data class
│   ├── redblack_tree.py        # Red-Black Tree (from scratch)
│   ├── binomial_heap.py        # Binomial Heap (from scratch)
│   └── emergency_room.py       # ER logic (rooms, assignment, merge)
├── app.py                      # Flask web server
├── templates/
│   └── index.html              # Main page
├── static/
│   ├── style.css               # Dark theme styling
│   ├── app.js                  # Frontend logic
│   └── tree_visualizer.js      # SVG tree rendering
├── docs/
│   └── documentation.pdf
├── requirements.txt
└── README.md
```

## How to Run

```bash
# Install dependencies
pip install flask

# Run the application
python app.py
```

Then open `http://localhost:5000` in your browser.

## Technologies

- **Language:** Python
- **Web Framework:** Flask
- **Frontend:** HTML/CSS/JavaScript with SVG visualization
- **Data Structures:** Implemented from scratch (no standard library containers)

## References

- Cormen, Leiserson, Rivest, Stein — *Introduction to Algorithms* (CLRS), Chapters 13 & 19
- GeeksforGeeks — Red-Black Tree & Binomial Heap articles
- Programiz — Data structure tutorials
