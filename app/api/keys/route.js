import { NextResponse } from 'next/server';
import { getAllApiKeys, addApiKey, updateApiKey, deleteApiKey, getPoolSummary } from '@/lib/db';

export async function GET() {
  try {
    const keys = getAllApiKeys();
    const pool = getPoolSummary();

    // Mask API keys for security
    const maskedKeys = keys.map(k => ({
      ...k,
      api_key: k.api_key ? k.api_key.slice(0, 8) + '...' + k.api_key.slice(-4) : '',
    }));

    return NextResponse.json({ success: true, data: { keys: maskedKeys, pool } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { key_name, api_key, tier, daily_limit } = await request.json();
    if (!key_name || !api_key) {
      return NextResponse.json({ success: false, error: 'key_name dan api_key wajib diisi' }, { status: 400 });
    }
    addApiKey(key_name, api_key, tier || 'FREE', daily_limit || 20);
    const keys = getAllApiKeys();
    const pool = getPoolSummary();
    return NextResponse.json({ success: true, data: { keys, pool } });
  } catch (error) {
    if (error.message?.includes('UNIQUE')) {
      return NextResponse.json({ success: false, error: 'API Key ini sudah ada di pool' }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { id, ...updates } = await request.json();
    if (!id) {
      return NextResponse.json({ success: false, error: 'id wajib diisi' }, { status: 400 });
    }
    updateApiKey(id, updates);
    const keys = getAllApiKeys();
    const pool = getPoolSummary();
    return NextResponse.json({ success: true, data: { keys, pool } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'id wajib diisi' }, { status: 400 });
    }
    deleteApiKey(Number(id));
    const keys = getAllApiKeys();
    const pool = getPoolSummary();
    return NextResponse.json({ success: true, data: { keys, pool } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
