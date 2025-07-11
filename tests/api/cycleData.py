import os
import random
import json
import time
from fastapi import FastAPI, Response
from threading import Lock

app = FastAPI()

P2P_FOLDER = os.path.join(os.path.dirname(__file__), 'samples', 'p2p')
JMA_FOLDER = os.path.join(os.path.dirname(__file__), 'samples', 'jma')

class RandomJsonCycler:
    def __init__(self, folder):
        self.folder = folder
        self.files = [f for f in os.listdir(folder) if f.endswith('.json')]
        self.last_file = None
        self.last_time = 0
        self.current_file = None
        self.lock = Lock()

    def get_json(self):
        with self.lock:
            now = time.time()
            if self.current_file is None or now - self.last_time >= 10:
                choices = [f for f in self.files if f != self.last_file]
                if not choices:
                    choices = self.files
                self.current_file = random.choice(choices)
                self.last_file = self.current_file
                self.last_time = now
            file_path = os.path.join(self.folder, self.current_file)
            with open(file_path, 'r', encoding='utf-8') as f:
                data = f.read()
            return data

p2p_cycler = RandomJsonCycler(P2P_FOLDER)
jma_cycler = RandomJsonCycler(JMA_FOLDER)

@app.get('/p2p')
def get_p2p():
    data = p2p_cycler.get_json()
    print(f"[p2p] serving {p2p_cycler.current_file}")
    return Response(content=data, media_type='application/json')

@app.get('/jma')
def get_jma():
    data = jma_cycler.get_json()
    print(f"[jma] serving {jma_cycler.current_file}")
    return Response(content=data, media_type='application/json')

# uvicorn cycleData:app --reload --port 1212
