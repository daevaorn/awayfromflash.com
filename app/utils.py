import os
import sys

def patch_paths():
    sys.path = [
        os.path.join(os.path.dirname(os.path.dirname(__file__)), 'compat')
    ] + sys.path

patch_paths()
