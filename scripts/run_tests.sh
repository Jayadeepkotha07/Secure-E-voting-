#!/usr/bin/env bash
# ==============================================================================
# Test Runner for Secure E-Voting System
# ==============================================================================
set -e

echo "=== [1/2] Running Backend Cryptography and API Tests (pytest) ==="
cd "$(dirname "$0")/../backend"
python3 -m pytest -v

echo ""
echo "=== [2/2] Running Frontend Type Checking and Production Build ==="
cd ../frontend
npm run build

echo ""
echo "======================================================================"
echo "All backend cryptographic tests and frontend builds passed cleanly!"
echo "======================================================================"
