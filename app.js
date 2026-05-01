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

// servir frontend
app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

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
    console.error(err);
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

/*
-----------------------------------
CRIAR CONTA
-----------------------------------
*/
app.post('/api/register', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      initialBalance
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Preencha todos os campos.'
      });
    }

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    const accounts = await loadAccounts();

    const existingAccount = accounts.find(
      acc => acc.email === normalizedEmail
    );

    if (existingAccount) {
      return res.json({
        success: false,
        message: 'E-mail já cadastrado.'
      });
    }

    const newAccount = {
      name,
      email: normalizedEmail,
      passwordHash: hashPassword(password),
      initialBalance: Number(initialBalance) || 0
    };

    accounts.push(newAccount);

    await saveAccounts(accounts);

    return res.json({
      success: true,
      message: 'Conta criada com sucesso.'
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Erro interno.'
    });
  }
});

/*
-----------------------------------
LOGIN
-----------------------------------
*/
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    const accounts = await loadAccounts();

    const account = accounts.find(
      acc => acc.email === normalizedEmail
    );

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Conta não encontrada.'
      });
    }

    const hashedPassword = hashPassword(password);

    if (account.passwordHash !== hashedPassword) {
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

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Erro interno.'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
