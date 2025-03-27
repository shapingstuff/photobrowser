#!/bin/bash
cd /home/admin/Servers/PhotoBrowser/hardware-server

# Start Python server with logs
#./venv/bin/python -u server.py >> python.log 2>&1 &

# Start Node server with logs
node websocket-server.js >> node.log 2>&1