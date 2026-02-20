const fs = require('fs');
const path = require('path');
const actualApi = require('@actual-app/api');

const CONFIG_PATH =
  process.env.BALADJUST_CONFIG || path.join(__dirname, 'config.json');
const DEFAULT_PAYEE = 'Balance Adjustment';
const DEFAULT_NOTES = 'Automated balance adjustment from SimpleFin';

// --- Config ---

function loadConfig() {
  const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
  return JSON.parse(raw);
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + '\n');
}

// --- SimpleFin ---

async function claimAccessUrl(setupToken) {
  const claimUrl = Buffer.from(setupToken, 'base64').toString('utf-8');
  const response = await fetch(claimUrl, { method: 'POST' });
  if (!response.ok) {
    throw new Error(
      `SimpleFin claim failed: ${response.status} ${response.statusText}`,
    );
  }
  return (await response.text()).trim();
}

async function fetchSimpleFinAccounts(accessUrl) {
  const url = new URL(accessUrl);
  url.pathname = url.pathname.replace(/\/$/, '') + '/accounts';
  const credentials = Buffer.from(
    `${url.username}:${url.password}`,
  ).toString('base64');
  url.username = '';
  url.password = '';

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Basic ${credentials}` },
  });
  if (!response.ok) {
    throw new Error(
      `SimpleFin fetch failed: ${response.status} ${response.statusText}`,
    );
  }
  const data = await response.json();
  if (data.errors && data.errors.length > 0) {
    console.warn('SimpleFin warnings:', data.errors);
  }
  return data.accounts;
}

// --- Actual Budget ---

async function connectActual(config) {
  await actualApi.init({
    serverURL: config.actual.serverUrl,
    password: config.actual.password,
    dataDir: config.actual.dataDir,
  });
  await actualApi.downloadBudget(config.actual.budgetSyncId);
}

function buildAdjustmentTransaction(date, amount, payeeName, notes, accountId) {
  return {
    date,
    amount,
    payee_name: payeeName,
    notes,
    imported_id: `baladjust-${accountId}-${date}`,
    cleared: true,
  };
}

// --- Main ---

async function main() {
  console.log('Loading config...');
  const config = loadConfig();

  // Handle one-time setup token exchange
  if (!config.simplefin.accessUrl) {
    if (!config.simplefin.setupToken) {
      throw new Error(
        'Config must have either simplefin.accessUrl or simplefin.setupToken',
      );
    }
    console.log('Claiming SimpleFin access URL from setup token...');
    config.simplefin.accessUrl = await claimAccessUrl(
      config.simplefin.setupToken,
    );
    delete config.simplefin.setupToken;
    saveConfig(config);
    console.log('Access URL saved to config.');
  }

  // Fetch SimpleFin balances
  console.log('Fetching SimpleFin account balances...');
  const sfAccounts = await fetchSimpleFinAccounts(config.simplefin.accessUrl);

  const sfBalanceMap = new Map();
  for (const acct of sfAccounts) {
    sfBalanceMap.set(acct.id, acct.balance);
  }

  // Connect to Actual Budget
  console.log('Connecting to Actual Budget...');
  await connectActual(config);

  const today = new Date().toISOString().slice(0, 10);
  const payeeName = config.adjustmentPayee || DEFAULT_PAYEE;
  const notes = config.adjustmentNotes || DEFAULT_NOTES;
  let adjustmentCount = 0;

  try {
    for (const mapping of config.accountMapping) {
      const label = mapping.label || mapping.simpleFinAccountId;
      const sfBalance = sfBalanceMap.get(mapping.simpleFinAccountId);

      if (sfBalance === undefined) {
        console.warn(`  ${label}: SimpleFin account not found, skipping.`);
        continue;
      }

      const actualBalance = await actualApi.getAccountBalance(
        mapping.actualAccountId,
      );
      const sfBalanceCents = actualApi.utils.amountToInteger(sfBalance);
      const diff = sfBalanceCents - actualBalance;

      const fmt = (cents) => {
        const amount = actualApi.utils.integerToAmount(cents).toFixed(2);
        return amount < 0 ? '-$' + amount.slice(1) : '$' + amount;
      };
      console.log(
        `  ${label}: SimpleFin=${fmt(sfBalanceCents)} Actual=${fmt(actualBalance)} diff=${fmt(diff)}`,
      );

      if (diff === 0) {
        console.log(`  ${label}: Balances match, no adjustment needed.`);
        continue;
      }

      const txn = buildAdjustmentTransaction(
        today,
        diff,
        payeeName,
        notes,
        mapping.actualAccountId,
      );
      const result = await actualApi.importTransactions(
        mapping.actualAccountId,
        [txn],
      );

      if (result.errors && result.errors.length > 0) {
        console.error(`  ${label}: Import errors:`, result.errors);
      } else {
        const added = result.added?.length || 0;
        const updated = result.updated?.length || 0;
        console.log(
          `  ${label}: Adjustment of ${fmt(diff)} imported (added=${added}, updated=${updated}).`,
        );
        adjustmentCount++;
      }
    }

    console.log('Syncing...');
    await actualApi.sync();
    console.log(`Done. ${adjustmentCount} adjustment(s) made.`);
  } finally {
    await actualApi.shutdown();
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
