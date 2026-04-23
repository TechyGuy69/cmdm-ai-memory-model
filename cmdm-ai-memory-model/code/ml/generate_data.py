import json
import random

stm_phrases = ["hi","hello","hey","yo","ok","cool"]
ltm_templates = ["assignment due {}", "exam on {}", "meeting at {}"]
times = ["tomorrow","next week","today"]

data = []

# Generate
for _ in range(100):
    data.append({"text": random.choice(stm_phrases), "label": "STM"})

for _ in range(150):
    text = random.choice(ltm_templates).format(random.choice(times))
    data.append({"text": text, "label": "LTM"})

# Load existing safely
try:
    with open("data.json") as f:
        existing = json.load(f)
except:
    existing = []

# Merge
all_data = existing + data

# Save clean JSON
with open("data.json", "w") as f:
    json.dump(all_data, f, indent=2)

print("Data merged successfully!")