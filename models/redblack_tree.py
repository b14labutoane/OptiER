# Red-Black Tree 
RED = 0
BLACK = 1

class RBNode:
    # nodul individual din arborele rosu-negru
    # fiecare nod retine cheia (prioritate pacient) si datele pacientului
    # nodurile au culoare rosu sau negru pentru mentinerea echilibrului
    def __init__(self, key, patient=None):
        self.key = key
        self.patient = patient 
        self.color = RED
        self.left = None
        self.right = None
        self.parent = None

    
class RBTree:
    # arborele principal rosu-negru care gestioneaza toti pacientii
    # mentine echilibrul pentru garantii performanta O(log n) pe toate operatiile
    # foloseste NIL ca nod sentinel pentru simplificarea codului
    def __init__(self):
        self.NIL = RBNode(0)
        self.NIL.color = BLACK
        self.root = self.NIL

    def left_rotate(self, x):
        # rotire la stanga in jurul nodului x
        # y devine radacina subarborelui, x devine copil stang al lui y
        y = x.right
        x.right = y.left
        if y.left != self. NIL:
            y.left.parent = x
        y.parent = x.parent
        if x.parent is None:
            self.root = y
        elif x == x.parent.left:
            x.parent.left = y
        else:
            x.parent.right = y
        y.left = x
        x.parent = y

    def right_rotate(self, x):
        # rotire la dreapta in jurul nodului x  
        # y devine radacina subarborelui, x devine copil drept al lui y
        y = x.left
        x.left = y.right
        if y.right != self. NIL:
            y.right.parent = x
        y.parent = x.parent
        if x.parent is None:
            self.root = y
        elif x == x.parent.right:
            x.parent.right = y
        else:
            x.parent.left = y
        y.right = x
        x.parent = y

    def insert_fixup(self, z):
        # corecteaza violarile regulilor rosu-neg dupa insertie
        # gestioneaza 3 cazuri principale + simetriile lor
        
        # caz 1: unchi rosu - recolorare si mutare sus
        # caz 2: unchi negru + triunghi - rotire pentru a crea linie  
        # caz 3: unchi negru + linie - rotire dubla si recolorare
        while z.parent and z.parent.color == RED:
            if z.parent == z.parent.parent.left:
                y = z.parent.parent.right
                if y.color == RED:
                    z.parent.color = BLACK
                    y.color = BLACK
                    z.parent.parent.color = RED
                    z = z.parent.parent
                else:
                    if z == z.parent.right:
                        z = z.parent
                        self.left_rotate(z)
                    z.parent.color = BLACK
                    z.parent.parent.color = RED
                    self.right_rotate(z.parent.parent)
            else:
                y = z.parent.parent.left
                if y.color == RED:
                    z.parent.color = BLACK
                    y.color = BLACK
                    z.parent.parent.color = RED
                    z = z.parent.parent
                else:
                    if z == z.parent.left:
                        z = z.parent
                        self.right_rotate(z)

                    z.parent.color = BLACK
                    z.parent.parent.color = RED
                    self.left_rotate(z.parent.parent)
            
        self.root.color = BLACK

    def insert(self, key, patient):
        # insereaza un nod nou in arbore si corecteaza echilibrul
        # parcurge arborele pentru a gasci pozitia corecta
        # porneste cu nodul rosu si apel fixup pentru mentinerea regulilor
        z = RBNode(key, patient)
        z.left = self.NIL
        z.right = self.NIL

        y = None
        x = self.root

        while x!=self.NIL:
            y = x
            if z.key < x.key:
                x = x.left
            else:
                x = x.right
        
        z.parent = y
        if y is None:
            self.root = z
        elif z.key < y.key:
            y.left = z
        else:
            y.right = z
        
        z.color = RED
        self.insert_fixup(z)

    def search(self, key):
        # cauta un nod cu cheia specificata in arbore
        # parcurge arborele comparand cheile pana gaseste potrivire
        # returneaza nodul gasit sau NIL daca nu exista
        x = self.root
        while x != self.NIL and key != x.key:
            if key < x.key:
                x = x.left
            else:
                x = x.right
        return x
    
    def minimum(self, node):
        # gaseste nodul cu cea mai mica cheie din subarbore
        # parcurge mereu spre copilul stang pana ajunge la frunza
        while node.left != self.NIL:
            node = node.left
        return node
    
    def transplant(self, u, v):
        # inlocuieste subarborele cu radacina u cu subarborele cu radacina v
        # mentine legaturile parentale corecte
        # folosita in delete pentru a rearanja arborele
        if u.parent is None:
            self.root = v
        elif u == u.parent.left:
            u.parent.left = v
        else:
            u.parent.right = v
        v.parent = u.parent

    def delete_fixup(self, x):
        # corecteaza violarile dupa stergere nod negru
        # gestioneaza 4 cazuri principale pentru mentinerea echilibrului
        # caz 1: frate rosu - rotire pentru a transforma in caz cu frate negru
        # caz 2: frate negru + 2 copii negri - muta negrimea spre sus
        # caz 3: frate negru + copil rosu apropiat - rotire pentru a crea caz final
        # caz 4: frate negru + copil rosu indepartat - rotire dubla si recolorare
        while x != self.root and x.color == BLACK:
            if x == x.parent.left:
                w = x.parent.right
                if w.color == RED:
                    w.color = BLACK
                    x.parent.color = RED
                    self.left_rotate(x.parent)
                    w = x.parent.right
                if w.left.color == BLACK and w.right.color == BLACK:
                    w.color = RED
                    x = x.parent 
                else:
                    if w.right.color == BLACK:
                        w.left.color = BLACK
                        w.color = RED
                        self.right_rotate(w)
                        w = x.parent.right
                    w.color = x.parent.color
                    x.parent.color = BLACK
                    w.right.color = BLACK
                    self.left_rotate(x.parent)
                    x = self.root
            else:
                w = x.parent.left
                if w.color == RED:
                    w.color = BLACK
                    x.parent.color = RED
                    self.right_rotate(x.parent)
                    w = x.parent.left
                if w.right.color == BLACK and w.left.color == BLACK:
                    w.color = RED
                    x = x.parent
                else:
                    if w.left.color == BLACK:
                        w.right.color = BLACK
                        w.color = RED
                        self.left_rotate(w)
                        w = x.parent.left
                    w.color = x.parent.color
                    x.parent.color = BLACK
                    w.left.color = BLACK
                    self.right_rotate(x.parent)
                    x = self.root
            x.color = BLACK

    def delete(self, key):
        # sterge un nod din arbore si mentine echilibrul
        # gestioneaza 3 cazuri: nod cu 0, 1 sau 2 copii
        # daca nodul era negru, trebuie sa corectam echilibrul
        z = self.search(key)
        if z == self.NIL:
            return
        y = z
        y_og_color = y.color

        if z.left == self.NIL:
            x = z.right
            self.transplant(z, z.right)
        elif z.right == self.NIL:
            x = z.left
            self.transplant(z, z.left)
        else:
            y = self.minimum(z.right)
            y_og_color = y.color
            x = y.right
            if y.parent == z:
                x.parent = y
            else:
                self.transplant(y, y.right)
                y.right = z.right
                y.right.parent = y
            self.transplant(z, y)
            y.left = z.left
            y.left.parent = y
            y.color = z.color
        
        if y_og_color == BLACK:
            self.delete_fixup(x)


    def to_dict(self):
        # converteste arborele in dictionar serializabil
        # folosit pentru export date si vizualizare grafica
        if self.root == self.NIL:
            return None
        return self._node_to_dict(self.root)

    def _node_to_dict(self, node):
        # functie recursiva pentru conversie nod in dictionar
        # trateaza cazul NIL pentru a opesi recursia
        if node == self.NIL:
            return None
        return {
            "key": round(node.key, 1),
            "color": "red" if node.color == RED else "black",
            "name": node.patient.name if node.patient else str(node.key),
            "severity": node.patient.severity if node.patient else None,
            "left": self._node_to_dict(node.left),
            "right": self._node_to_dict(node.right),
        }

    def inorder(self, node=None, result=None):
        # parcurgere inordine a arborelui (stanga-radacina-dreapta)
        # returneaza lista nodurilor in ordine sortata
        # folosita pentru vizualizare si debug
        if result is None:
            result = []
            node = self.root
        if node != self.NIL:
            self.inorder(node.left, result)
            color_str = "R" if node.color == RED else "B"
            result.append(f"{node.key}{color_str}")
            self.inorder(node.right, result)
        return result
    
    def print_tree(self, node=None, level=0, prefix="Root: "):
        # afiseaza arborele ierarhic in consola
        # foloseste indentare pentru a arata structura
        # R = rosu, B = negru la sfarsitul cheii
        if node is None:
            node = self.root
        if node != self.NIL:
            color = "R" if node.color == RED else "B"
            print(" " * (level * 4) + prefix + str(node.key) + color)
            self.print_tree(node.left, level+1, "L--")
            self.print_tree(node.right, level + 1, "R--")


if __name__ == "__main__":
    tree = RBTree()

    for key in [10, 20, 5, 15, 30, 25]:
        tree.insert(key, None)

    print("Before delete: ")
    tree.print_tree()

    tree.delete(20)
    print("\nAfter deleting 20:")
    tree.print_tree()
