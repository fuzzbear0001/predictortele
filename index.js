const { Telegraf, Markup } = require('telegraf');

const bot = new Telegraf('8132249975:AAEoiH1BbbXAiI8ymk0ayTHGUuTFsealkok'); // ← Replace this with your real bot token
const OWNER_ID = 7527489536;
const lastPredictions = new Map();

function getSyncedPrediction() {
  const now = Math.floor(Date.now() / 10000);
  const seed = now * 10000;
  const rng = mulberry32(seed);
  const value = (rng() * 9 + 1).toFixed(2);
  return value;
}

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function getLuckEmoji(value) {
  const x = parseFloat(value);
  if (x < 1.5) return '💩 Rekt!';
  if (x < 2.0) return '😬 Sketchy...';
  if (x < 4.0) return '🧠 Decent';
  if (x < 6.0) return '🔥 Clean!';
  return '🚀 ABSOLUTE BANGER';
}

function mainButtons() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🎯 Predict Again', 'predict')],
    [Markup.button.callback('📈 Last Prediction', 'last')],
    [Markup.button.callback('🎲 Roll Dice', 'roll')],
    [Markup.button.callback('ℹ️ Help', 'help')]
  ]);
}

function isOwner(ctx) {
  const id = ctx.from?.id;
  if (id !== OWNER_ID) {
    const msg = `🚫 *Access Denied*\n\nThis bot is for premium users only.

💰 *One-Time Purchase:* £82.99  
📈 Includes: £1,500 in locked *Shortenr.me* shares (12 months vesting)

To unlock, send *SOL* to:

\`\`\`
GbbktzF5yDFryTi31oweRxxFtezWSfixK1TGt5v87HuT
\`\`\`

Once sent, your access will be automatically activated within ~5 minutes.

🔐 Powered by [Shortenr.me](https://shortenr.me)
`;
    ctx.reply(msg, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    });
    return false;
  }
  return true;
}

bot.start((ctx) => {
  if (!isOwner(ctx)) return;
  ctx.reply(
    '🧠 *Crash Predictor 9000*\n\nTap "Predict" to see what multiplier’s next!',
    {
      parse_mode: 'Markdown',
      reply_markup: mainButtons().reply_markup
    }
  );
});

bot.command('predict', (ctx) => isOwner(ctx) && handlePredict(ctx));
bot.action('predict', (ctx) => isOwner(ctx) && handlePredict(ctx));

function handlePredict(ctx) {
  const userId = ctx.from.id;
  const prediction = getSyncedPrediction();
  lastPredictions.set(userId, prediction);

  const message = `🔮 *Predicted Multiplier:* \`${prediction}x\`\n${getLuckEmoji(prediction)}`;
  ctx.reply(message, {
    parse_mode: 'Markdown',
    reply_markup: mainButtons().reply_markup
  });
  if (ctx.callbackQuery) ctx.answerCbQuery();
}

bot.command('last', (ctx) => isOwner(ctx) && handleLast(ctx));
bot.action('last', (ctx) => isOwner(ctx) && handleLast(ctx));

function handleLast(ctx) {
  const userId = ctx.from.id;
  const last = lastPredictions.get(userId);
  const msg = last
    ? `🕒 Your last prediction was: \`${last}x\`\n${getLuckEmoji(last)}`
    : '❌ No prediction found yet. Tap "Predict" first!';
  ctx.reply(msg, {
    parse_mode: 'Markdown',
    reply_markup: mainButtons().reply_markup
  });
  if (ctx.callbackQuery) ctx.answerCbQuery();
}

bot.command('roll', (ctx) => isOwner(ctx) && handleRoll(ctx));
bot.action('roll', (ctx) => isOwner(ctx) && handleRoll(ctx));

function handleRoll(ctx) {
  const roll = (Math.random() * 100).toFixed(2);
  let reaction = '😐 Meh';
  if (roll > 90) reaction = '💸 JACKPOT';
  else if (roll > 70) reaction = '🔥 Big Win';
  else if (roll < 20) reaction = '☠️ Dead roll';

  ctx.reply(`🎲 *You rolled:* \`${roll}\`\n${reaction}`, {
    parse_mode: 'Markdown',
    reply_markup: mainButtons().reply_markup
  });
  if (ctx.callbackQuery) ctx.answerCbQuery();
}

bot.command('help', (ctx) => isOwner(ctx) && showHelp(ctx));
bot.action('help', (ctx) => isOwner(ctx) && showHelp(ctx));

function showHelp(ctx) {
  const msg = `ℹ️ *Crash Predictor Help*\n
• Tap 🎯 *Predict Again* to get the synced crash multiplier.
• 📈 *Last Prediction* shows your most recent result.
• 🎲 *Roll Dice* for a side mini-game.
• No signup needed. All vibes.

💡 Predictions update every 10 seconds.`;
  ctx.reply(msg, {
    parse_mode: 'Markdown',
    reply_markup: mainButtons().reply_markup
  });
  if (ctx.callbackQuery) ctx.answerCbQuery();
}

bot.launch();
console.log('🚀 Crash Predictor Bot is live & secured.');
