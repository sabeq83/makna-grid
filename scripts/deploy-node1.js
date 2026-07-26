import { execSync } from 'child_process';

async function deployNode1() {
  console.log('================================================================');
  console.log('🚀 SINGLE-PASS DEPLOYMENT TO NODE 1 (Ubuntu UI Gateway)');
  console.log('================================================================');
  console.log('📌 Specs: Intel Core i3 | RAM 16GB | Estimated Build Time: ~120s');

  const remoteScript = `
    export PATH=/home/sabeqmursyid/.local/bin:$PATH
    cd /home/sabeqmursyid/makna-grid
    echo "📥 [1/4] Pulling latest main code from GitHub..."
    git fetch origin main && git reset --hard origin/main

    echo "⚡ [2/4] Building Next.js production bundle (i3 optimized)..."
    npm run build

    echo "🔄 [3/4] Restarting Gateway UI (3000) & API Server (4000)..."
    pkill -f 'next-server' || true
    pkill -f 'apps/api/server.js' || true

    HOSTNAME=0.0.0.0 PORT=4000 nohup /home/sabeqmursyid/.local/bin/node apps/api/server.js < /dev/null > backend-api.log 2>&1 &
    HOSTNAME=0.0.0.0 PORT=3000 nohup /home/sabeqmursyid/.local/bin/node node_modules/next/dist/bin/next start -H 0.0.0.0 -p 3000 < /dev/null > gateway.log 2>&1 &

    echo "✅ [4/4] Node 1 Services Deployment Triggered!"
  `;

  console.log('📡 Executing single-pass deployment via SSH (Zero-Prompt Mode)...');
  try {
    const cmd = `ssh -o ConnectTimeout=15 makna-ui "${remoteScript.replace(/"/g, '\\"')}"`;
    execSync(cmd, { stdio: 'inherit' });
    console.log('\n🎉 Single-Pass Deployment command successfully sent to Node 1!');
  } catch (err) {
    console.error('❌ Deployment error:', err.message);
    process.exit(1);
  }
}

deployNode1().catch(console.error);
