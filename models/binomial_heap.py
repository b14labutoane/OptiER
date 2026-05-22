class BinomialNode:
    def __init__(self, key, patient=None):
        self.key = key
        self.patient = patient
        self.degree = 0
        self.parent = None
        self.child = None
        self.sibling = None

def binomial_link(y, z):
    y.parent = z
    y.sibling = z.child
    z.child = y
    z.degree += 1

class BinomialHeap:
    def __init__(self):
        self.head = None
    
    def insert(self, key, patient=None):
        new_node = BinomialNode(key, patient)
        temp = BinomialHeap()
        temp.head = new_node
        self.merge(temp)

    def merge(self, other):
        if self.head is None:
            self.head = other.head
            return
        if other.head is None:
            return
        
        new_head = None
        prev = None
        a = self.head
        b = other.head

        while a is not None and b is not None:
            if a.degree <= b.degree:
                if prev is None:
                    new_head = a
                else:
                    prev.sibling = a
                prev = a
                a = a.sibling
            else:
                if prev is None:
                    new_head = b
                else:
                    prev.sibling = b
                prev = b
                b = b.sibling

        if a is not None:
            prev.sibling = a
        elif b is not None:
            prev.sibling = b
        
        if new_head is None:
            return
    
        self.head = new_head

        prev = None
        crt = self.head
        next_node = crt.sibling

        while next_node is not None:
            if crt.degree != next_node.degree or next_node.sibling is not None and next_node.sibling.degree == crt.degree:
                prev = crt
                crt = next_node
                next_node = next_node.sibling
            else:
                if crt.key <= next_node.key:
                    crt.sibling = next_node.sibling
                    binomial_link(next_node, crt)
                else:
                    if prev is None:
                        self.head = next_node
                    else:
                        prev.sibling = next_node
                    binomial_link(crt, next_node)
                    crt = next_node
                next_node = crt.sibling

    def find_min(self):
        if self.head is None:
            return None
        min_node = self.head
        crt = self.head.sibling
        while crt is not None:
            if crt.key < min_node.key:
                min_node = crt
            crt = crt.sibling
        return min_node
    
    def extract_min(self):
        if self.head is None:
            return None
        min_node = self.head
        prev_min = None
        prev = None
        crt = self.head

        while crt is not None:
            if crt.key < min_node.key:
                min_node = crt
                prev_min = prev
            prev = crt
            crt = crt.sibling
        
        if prev_min is None:
            self.head = min_node.sibling
        else:
            prev_min.sibling = min_node.sibling

        child = min_node.child
        prev_child = None
        while child is not None:
            next_child = child.sibling 
            child.sibling = prev_child
            child.parent = None
            prev_child = child 
            child = next_child
        child_heap = BinomialHeap()
        child_heap.head = prev_child
        self.merge(child_heap)

        return min_node
    
    def is_empty(self):
        return self.head is None

    def to_list(self):
        result = []
        crt = self.head
        while crt is not None:
            result.append(self._node_to_dict(crt))
            crt = crt.sibling
        return result

    def _node_to_dict(self, node):
        children = []
        child = node.child
        while child is not None:
            children.append(self._node_to_dict(child))
            child = child.sibling
        return {
            "key": round(node.key, 1),
            "name": node.patient.name if node.patient else str(node.key),
            "severity": node.patient.severity if node.patient else None,
            "degree": node.degree,
            "children": children
        }

    def print_heap(self):
        crt = self.head
        level = 0
        while crt is not None:
            print(f"Tree degree {crt.degree}, key {crt.key}:")
            self._print_tree(crt, 1)
            crt = crt.sibling

    def _print_tree(self, node, indent):
        if node is None:
            return 
        child = node.child
        while child is not None:
            print(" " * indent + f"key={child.key}")
            self._print_tree(child, indent+1)
            child = child.sibling

if __name__ == "__main__":
    h = BinomialHeap()
    for val in [5, 3, 7, 1, 9, 2, 8]:
        h.insert(val)
        print(f"Inserted {val}")
    print("\nHeap structure:")
    h.print_heap()
    