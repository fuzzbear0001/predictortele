const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');
const { Connection, LAMPORTS_PER_SOL, PublicKey } = require('@solana/web3.js');

// === CONFIG ===
const BOT_TOKEN = '7869925971:AAHqs4tmrzLekpsdFTr2jHqQzrHFeOZRIFU';
const CHANNEL_ID = '-1002585872966';
const MORALIS_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6ImY3YTRjMjdkLTZiMzAtNGRjMi04MjI5LTI4NTkxNWEzZWFkMiIsIm9yZ0lkIjoiNDYwNjU0IiwidXNlcklkIjoiNDczOTI3IiwidHlwZUlkIjoiZGM3YjQ3MWItZmM3Mi00NmNlLWI5Y2UtZGY0ZDg1YTE0NGI0IiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NTMxNjc1NDYsImV4cCI6NDkwODkyNzU0Nn0.GdWOqVjqJi37fz4Rni9uwaYmH4-srahSXlcxJicB6gE'; // keep rest if real
const MORALIS_URL = 'https://solana-gateway.moralis.io/token/mainnet/exchange/pumpfun/new';
const SOL_RPC = 'https://api.mainnet-beta.solana.com';

const bot = new TelegramBot(BOT_TOKEN, { polling: false });
const connection = new Connection(SOL_RPC);
const seen = new Set();

async function fetchNewTokens(limit = 10) {
  try {
    const res = await axios.get(MORALIS_URL, {
      headers: { 'X-API-Key': MORALIS_API_KEY },
      params: { limit },
    });
    return res.data.result || [];
  } catch (err) {
    console.error('❌ Error fetching tokens:', err.message);
    return [];
  }
}

async function getSolBalance(address) {
  try {
    const lamports = await connection.getBalance(new PublicKey(address));
    return lamports / LAMPORTS_PER_SOL;
  } catch {
    return null;
  }
}

function formatToken(token, solBalance) {
  const mint = token.tokenAddress ?? 'Unknown';
  const symbol = (token.symbol ?? '???').toUpperCase();
  const name = token.name ?? 'Unknown';
  const holders = token.holderCount ?? 'n/a';
  const gmgn = `https://gmgn.ai/sol/token/${mint}`;
  const sol = solBalance !== null ? solBalance.toFixed(4) : 'n/a';
  const devInfo = solBalance === null
    ? '🔍 Unknown'
    : solBalance < 2
    ? '⚠️ Low Dev Balance'
    : '✅ Dev Looks Funded';

  return `
💊💊💊 PUMP DETECTED / LAUNCH 💊💊💊

🔹 ${symbol} (${name})
📦 Contract: ${mint}
🧑‍💻 Dev Wallet: ${token.creatorAddress ?? 'Unknown'}
💰 Dev Balance: ${sol} SOL
📊 Holders: ${holders}
🌐 GMGN: ${gmgn}
NOTE THIS IS A FREE BOT TO BUY INSIDER ACCESS TO PUMPS AND DUMPS MESSAGS @iamkrist0f_uk
🕒 Launched: ${new Date(token.createdAt).toLocaleString()}
`.trim();
}

async function postToken(token) {
  if (!token || seen.has(token.tokenAddress)) return;
  seen.add(token.tokenAddress);

  const solBalance = token.creatorAddress
    ? await getSolBalance(token.creatorAddress)
    : null;

  const message = formatToken(token, solBalance);

  try {
    await bot.sendMessage(CHANNEL_ID, message);
    console.log(`✅ Posted: ${token.symbol ?? 'Unknown'}`);
  } catch (e) {
    console.error('❌ Telegram error:', e.message);
  }
}

async function runBot() {
  console.log('🚀 Starting Meme Coin Bot...');
  while (true) {
    const tokens = await fetchNewTokens(10);
    for (const token of tokens) {
      await postToken(token);
      await new Promise((res) => setTimeout(res, 30_000)); // wait 10 seconds per post
    }
  }
}

runBot();