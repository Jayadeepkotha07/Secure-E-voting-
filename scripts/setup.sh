#!/usr/bin/env bash
# ==============================================================================
# Setup Script for Secure E-Voting System (Linux / macOS / WSL / Git Bash)
# ==============================================================================
set -e

echo "=== [1/4] Installing Backend Dependencies ==="
cd "$(dirname "$0")/../backend"
python3 -m pip install -r requirements.txt

echo "=== [2/4] Seeding Database with Demo Elections and Records ==="
cd ../scripts
python3 seed_demo.py

echo "=== [3/4] Installing Frontend Dependencies ==="
cd ../frontend
npm install

echo "=== [4/4] Verifying Frontend Build ==="
npm run build

echo ""
echo "======================================================================"
echo "Setup completed successfully!"
echo ""
echo "To start the backend (Port 8000):"
echo "  cd backend && uvicorn app.main:app --reload --port 8000"
echo ""
echo "To start the frontend (Port 5173):"
echo "  cd frontend && npm run dev"
echo "======================================================================"
