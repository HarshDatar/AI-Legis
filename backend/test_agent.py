import os
import sys

# add backend path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from agents.legal_agent import get_agent
print("Getting agent...")
agent = get_agent()
print("Agent loaded successfully.")
