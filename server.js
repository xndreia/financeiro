const express = require('express');
const path = require('path');
const fs = require('fs/promises');
const crypto = require('crypto');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, 'data');
const ACCOUNTS_FILE = path.join(DATA_DIR, 'accounts.json');

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname)));

function hashPassword(password) {
  return crypto
    .createHash('sha256')
    .update(password)
    .digest('hex');
}

async function ensureDataFolder() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('Erro ao criar pasta de dados:', err);
  }
}

async function loadAccounts() {
  try {
    await ensureDataFolder();

    const content = await fs.readFile(
      ACCOUNTS_FILE,
      'utf-8'
    );

    return JSON.parse(content);

  } catch (err) {
    if (err.code === 'ENOENT') {
      return [];
    }

    throw err;
  }
}

async function saveAccounts(accounts) {
  await ensureDataFolder();

  await fs.writeFile(
    ACCOUNTS_FILE,
    JSON.stringify(accounts, null, 2),
    'utf-8'
  );
}

app.post('/api/register', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      initialBalance
    } = req.body;

    if (
      !name ||
      !email ||
      !password ||
      typeof initialBalance !== 'number' ||
      initialBalance < 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos.'
      });
    }

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    const accounts = await loadAccounts();

    if (
      accounts.find(
        account => account.email === normalizedEmail
      )
    ) {
      return res.status(400).json({
        success: false,
        message: 'E-mail já cadastrado.'
      });
    }

    const newAccount = {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: hashPassword(password),
      initialBalance: Number(initialBalance)
    };

    accounts.push(newAccount);

    await saveAccounts(accounts);

    return res.json({
      success: true,
      message: 'Conta criada.'
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: 'Erro interno.'
    });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'E-mail e senha são obrigatórios.'
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const accounts = await loadAccounts();
    const account = accounts.find(
      item => item.email === normalizedEmail
    );

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Conta não encontrada.'
      });
    }

    if (account.passwordHash !== hashPassword(password)) {
      return res.status(401).json({
        success: false,
        message: 'Senha incorreta.'
      });
    }

    return res.json({
      success: true,
      account: {
        name: account.name,
        email: account.email,
        initialBalance: account.initialBalance
      }
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: 'Erro interno.'
    });
  }
});

app.get('/api/account', async (req, res) => {
  try {
    const email = String(
      req.query.email || ''
    )
      .trim()
      .toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'E-mail obrigatório.'
      });
    }

    const accounts = await loadAccounts();

    const account = accounts.find(
      item => item.email === email
    );

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Conta não encontrada.'
      });
    }

    return res.json({
      success: true,
      account: {
        name: account.name,
        email: account.email,
        initialBalance: account.initialBalance
      }
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: 'Erro interno.'
    });
  }
});


app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
