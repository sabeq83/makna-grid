import { execSync } from 'child_process';

async function deployStaging() {
  console.log('================================================================');
  console.log('🚀 SINGLE-PASS DEPLOYMENT TO STAGING NODE 1 (Ubuntu Gateway)');
  console.log('================================================================');
  console.log('📌 Specs: Intel Core i3 | RAM 16GB | Estimated Build Time: ~90-120s');

  const remoteScript = `
    export PATH=/home/sabeqmursyid/.local/bin:$PATH
    
    # Cek folder staging, jika tidak ada lakukan clone
    if [ ! -d "/home/sabeqmursyid/makna-grid-staging/.git" ]; then
      echo "[1/5] Cloning repository into makna-grid-staging..."
      rm -rf /home/sabeqmursyid/makna-grid-staging-tmp
      git clone -b staging https://github.com/sabeq83/makna-grid.git /home/sabeqmursyid/makna-grid-staging-tmp
      rm -rf /home/sabeqmursyid/makna-grid-staging
      mv /home/sabeqmursyid/makna-grid-staging-tmp /home/sabeqmursyid/makna-grid-staging
    fi

    cd /home/sabeqmursyid/makna-grid-staging
    
    echo "[2/5] Fetching latest staging branch code..."
    git fetch origin staging || true
    git reset --hard origin/staging || true

    echo "[3/5] Setup environment file .env.local for staging..."
    cat << 'EOF' > .env.local
NODE_ENV=production
NODE_ROLE=gateway
ENABLE_SCHEDULER_WORKER=true
PORT=3010
DATABASE_HOST=100.78.186.123
PGDATABASE=makna_grid_db
PG_SEARCH_PATH=staging
CONTENT_FLOW_API_URL=http://100.78.186.123:3001/api/v1/content/ingest
WEBHOOK_HOST=100.117.59.92
WEBHOOK_PORT=8765
EOF

    echo "[4/5] Installing dependencies and building production bundle..."
    fuser -k -9 3010/tcp 2>/dev/null || true
    fuser -k -9 4010/tcp 2>/dev/null || true
    npm install
    npm run build

    echo "[5/5] Restarting Staging UI (3010) & Staging API Server (4010)..."
    fuser -k -9 3010/tcp 2>/dev/null || true
    fuser -k -9 4010/tcp 2>/dev/null || true
    sleep 1

    HOSTNAME=0.0.0.0 PORT=4010 nohup /home/sabeqmursyid/.local/bin/node apps/api/server.js < /dev/null > backend-api.log 2>&1 &
    HOSTNAME=0.0.0.0 PORT=3010 nohup /home/sabeqmursyid/.local/bin/node node_modules/next/dist/bin/next start -H 0.0.0.0 -p 3010 < /dev/null > gateway.log 2>&1 &

    echo "🎉 Staging Services Deployment Complete on http://100.65.62.63:3010 (API on Port 4010)!"
  `;

  console.log('📡 Executing staging deployment via SSH (Zero-Prompt Mode)...');
  try {
    const cmd = `ssh -o ServerAliveInterval=15 -o ServerAliveCountMax=10 -o ConnectTimeout=30 makna-ui "${remoteScript.replace(/"/g, '\\"')}"`;
    execSync(cmd, { stdio: 'inherit', timeout: 300000 });
    console.log('\n🎉 Single-Pass Staging Deployment triggered successfully on Node 1!');
  } catch (err) {
    console.error('❌ Staging Deployment error:', err.message);
    process.exit(1);
  }
}

deployStaging().catch(console.error);
