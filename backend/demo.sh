#!/usr/bin/env bash
# Drives one full command loop against a locally running broker.
# Usage: npm start (in another shell), then: bash demo.sh
set -euo pipefail
URL="http://localhost:${PORT:-3000}/message"
TK="demo-thread-1"

post() { curl -s -X POST "$URL" -H 'Content-Type: application/json' -d "$1"; echo; }

echo "1) keyword 'diagnose' -> env card:"
post "{\"threadKey\":\"$TK\",\"text\":\"diagnose\"}"

echo "2) pick env=uat -> branch card:"
post "{\"threadKey\":\"$TK\",\"action\":{\"stepId\":\"env\",\"value\":\"uat\"}}"

echo "3) pick branch=main -> ready:"
post "{\"threadKey\":\"$TK\",\"action\":{\"stepId\":\"branch\",\"value\":\"main\"}}"

echo "4) free text -> mock worker report:"
post "{\"threadKey\":\"$TK\",\"text\":\"request failed for user 12345\"}"
