#!/bin/bash
# ==============================================================================
# MAKNA GRID — NODE 1 (UBUNTU DESKTOP UI GATEWAY) BOOTSTRAP SCRIPT
# Server IP: 100.65.62.63
# ==============================================================================

echo "🚀 Starting MAKNA Grid Node 1 (Ubuntu UI Gateway) Setup..."

# Set environment variables for Gateway role
cat << 'EOF' > .env.local
NODE_ENV=production
NODE_ROLE=gateway
ENABLE_SCHEDULER_WORKER=false
PORT=3000

# Central Master Database Node 3
DATABASE_HOST=100.78.186.123
CONTENT_FLOW_API_URL=http://100.78.186.123:3001/api/v1/content/ingest
EOF

echo "✅ Generated .env.local for Node 1 UI Gateway"
echo "ℹ️ Node 1 Role: GATEWAY (UI & Gemini AI Fase 1 ONLY. Background Queue Worker DISABLED)."
echo "🌐 Launching MAKNA Grid Gateway Service on http://100.65.62.63:3000..."
