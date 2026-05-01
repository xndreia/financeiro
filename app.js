const STORAGE_KEY = 'minha-grana-transacoes';
const ACCOUNT_KEY = 'minha-grana-conta';

const API_URL = 'https://financeiro-xkxw.onrender.com';

const form = document.getElementById('transaction-form');
const transactionList = document.getElementById('transaction-list');
const incomeSummaryDisplay = document.getElementById('income-summary');
const expenseSummaryDisplay = document.getElementById('expense-summary');
const incomeSummaryCardDisplay = document.getElementById('income-summary-card');
const expenseSummaryCardDisplay = document.getElementById('expense-summary-card');
const balanceDisplay = document.getElementById('balance');
const savingsDisplay = document.getElementById('savings');
const clearAllButton = document.getElementById('clear-all');

const accountInfoSection = document.getElementById('account-info');
const accountFormWrapper = document.getElementById('account-form-wrapper');
const accountNameDisplay = document.getElementById('account-name');
const accountEmailDisplay = document.getElementById('account-email-display');
const accountInitialBalanceDisplay = document.getElementById('initial-balance-display');

const accountForm = document.getElementById('account-form');
const accountNameInput = document.getElementById('account-name-input');
const accountEmailInput = document.getElementById('account-email-input');
const accountPasswordInput = document.getElementById('account-password-input');
const accountPasswordConfirmInput = document.getElementById('account-password-confirm-input');
const initialBalanceInput = document.getElementById('initial-balance-input');

const passwordToggles = document.querySelectorAll('.password-toggle');
const appContent = document.getElementById('app-content');

let transactions = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
let account = JSON.parse(localStorage.getItem(ACCOUNT_KEY) || 'null');

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

function saveTransactions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function saveAccount() {
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
}

function getInitialBalance() {
  return account ? Number(account.initialBalance) : 0;
}

function calculateSummary() {
  let income = 0;
  let expense = 0;

  transactions.forEach((transaction) => {
    if (transaction.type === 'income') {
      income += transaction.amount;
    } else {
      expense += transaction.amount;
    }
  });

  const balance = getInitialBalance() + income - expense;
  const savings = balance >= 0 ? balance : 0;

  return {
    income,
    expense,
    balance,
    savings
  };
}

function renderSummary() {
  const summary = calculateSummary();

  if (incomeSummaryDisplay) {
    incomeSummaryDisplay.textContent = formatCurrency(summary.income);
  }

  if (expenseSummaryDisplay) {
    expenseSummaryDisplay.textContent = formatCurrency(summary.expense);
  }

  if (incomeSummaryCardDisplay) {
    incomeSummaryCardDisplay.textContent = formatCurrency(summary.income);
  }

  if (expenseSummaryCardDisplay) {
    expenseSummaryCardDisplay.textContent = formatCurrency(summary.expense);
  }

  if (balanceDisplay) {
    balanceDisplay.textContent = formatCurrency(summary.balance);
  }

  if (savingsDisplay) {
    savingsDisplay.textContent = formatCurrency(summary.savings);
  }
}

function renderAccountInfo() {
  if (!account) {
    accountInfoSection.classList.add('hidden');
    accountFormWrapper.classList.remove('hidden');
    appContent.classList.add('hidden');
    return;
  }

  accountInfoSection.classList.remove('hidden');
  accountFormWrapper.classList.add('hidden');
  appContent.classList.remove('hidden');

  accountNameDisplay.textContent = account.name;
  accountEmailDisplay.textContent = account.email;
  accountInitialBalanceDisplay.textContent = formatCurrency(account.initialBalance);
}

function renderTransactions() {
  transactionList.innerHTML = '';

  if (transactions.length === 0) {
    transactionList.innerHTML = `
      <tr>
        <td colspan="5">Nenhuma movimentação registrada.</td>
      </tr>
    `;
    return;
  }

  transactions.forEach((transaction, index) => {
    const row = document.createElement('tr');

    row.innerHTML = `
      <td>${transaction.description}</td>
      <td>${transaction.category}</td>
      <td>${formatCurrency(transaction.amount)}</td>
      <td>${transaction.type === 'income' ? 'Entrada' : 'Saída'}</td>
      <td>
        <button class="edit-btn" data-action="edit" data-index="${index}">
          Editar
        </button>

        <button class="delete-btn" data-action="delete" data-index="${index}">
          Remover
        </button>
      </td>
    `;

    transactionList.appendChild(row);
  });
}

function togglePasswordVisibility(button) {
  const targetId = button.dataset.target;
  const input = document.getElementById(targetId);

  if (!input) return;

  if (input.type === 'password') {
    input.type = 'text';
    button.textContent = 'Ocultar';
  } else {
    input.type = 'password';
    button.textContent = 'Mostrar';
  }
}

async function handleAccountSubmit(event) {
  event.preventDefault();

  const name = accountNameInput.value.trim();
  const email = accountEmailInput.value.trim().toLowerCase();
  const password = accountPasswordInput.value;
  const passwordConfirm = accountPasswordConfirmInput.value;
  const initialBalance = Number(initialBalanceInput.value);

  if (!name || !email || !password) {
    alert('Preencha todos os campos.');
    return;
  }

  if (password !== passwordConfirm) {
    alert('As senhas não coincidem.');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/api/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        email,
        password,
        initialBalance
      })
    });

    const result = await response.json();

    if (!result.success) {
      alert(result.message);
      return;
    }

    account = {
      name,
      email,
      initialBalance
    };

    saveAccount();
    renderAccountInfo();
    renderSummary();
    renderTransactions();

    accountForm.reset();

    alert('Conta criada com sucesso!');
  } catch (error) {
    console.error(error);
    alert('Erro ao conectar com servidor.');
  }
}

function addTransaction(event) {
  event.preventDefault();

  const description = document.getElementById('description').value.trim();
  const amount = Number(document.getElementById('amount').value);
  const category = document.getElementById('category').value;
  const type = document.querySelector('input[name="type"]:checked').value;

  if (!description || amount <= 0) {
    alert('Preencha os campos corretamente.');
    return;
  }

  transactions.unshift({
    description,
    amount,
    category,
    type
  });

  saveTransactions();
  renderTransactions();
  renderSummary();

  form.reset();
}

function editTransaction(index) {
  const transaction = transactions[index];

  const newDescription = prompt(
    'Editar descrição:',
    transaction.description
  );

  if (!newDescription) return;

  const newAmount = Number(
    prompt(
      'Editar valor:',
      transaction.amount
    )
  );

  if (!newAmount || newAmount <= 0) {
    alert('Valor inválido.');
    return;
  }

  transaction.description = newDescription;
  transaction.amount = newAmount;

  saveTransactions();
  renderTransactions();
  renderSummary();
}

function removeTransaction(index) {
  transactions.splice(index, 1);

  saveTransactions();
  renderTransactions();
  renderSummary();
}

function clearAllTransactions() {
  const confirmClear = confirm(
    'Deseja apagar todas as movimentações?'
  );

  if (!confirmClear) return;

  transactions = [];

  saveTransactions();
  renderTransactions();
  renderSummary();
}

if (accountForm) {
  accountForm.addEventListener('submit', handleAccountSubmit);
}

if (form) {
  form.addEventListener('submit', addTransaction);
}

if (clearAllButton) {
  clearAllButton.addEventListener('click', clearAllTransactions);
}

if (passwordToggles.length) {
  passwordToggles.forEach((button) => {
    button.addEventListener('click', () => {
      togglePasswordVisibility(button);
    });
  });
}

if (transactionList) {
  transactionList.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');

    if (!button) return;

    const index = Number(button.dataset.index);
    const action = button.dataset.action;

    if (action === 'edit') {
      editTransaction(index);
      return;
    }

    if (action === 'delete') {
      removeTransaction(index);
    }
  });
}

renderAccountInfo();
renderTransactions();
renderSummary();
