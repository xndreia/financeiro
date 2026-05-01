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
const editBalloon = document.getElementById('edit-balloon');
const editTransactionForm = document.getElementById('edit-transaction-form');
const editDescriptionInput = document.getElementById('edit-description');
const editAmountInput = document.getElementById('edit-amount');
const editCategoryInput = document.getElementById('edit-category');
const editTypeInputs = document.querySelectorAll('input[name="edit-type"]');
const closeEditBalloonButton = document.getElementById('close-edit-balloon');
const cancelEditBalloonButton = document.getElementById('cancel-edit-balloon');

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
let editIndex = null;

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

function getInitialBalance() {
  return account ? Number(account.initialBalance) : 0;
}

function calculateSummary(items) {
  const summary = items.reduce((acc, transaction) => {
    if (transaction.type === 'income') {
      acc.income += transaction.amount;
    } else {
      acc.expense += transaction.amount;
    }
    return acc;
  }, {
    income: 0,
    expense: 0
  });

  summary.balance = getInitialBalance() + summary.income - summary.expense;
  summary.savings = summary.balance >= 0 ? summary.balance : 0;

  return summary;
}

function saveTransactions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function saveAccount() {
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
}

function createTransactionRow(transaction, index) {
  const row = document.createElement('tr');
  const typeLabel = transaction.type === 'income' ? 'Entrada' : 'Saída';
  const badgeClass = transaction.type === 'income'
    ? 'badge-income'
    : 'badge-expense';

  row.innerHTML = `
    <td>${transaction.description}</td>
    <td>${transaction.category}</td>
    <td>${formatCurrency(
      transaction.type === 'expense'
        ? -transaction.amount
        : transaction.amount
    )}</td>
    <td><span class="badge ${badgeClass}">${typeLabel}</span></td>
    <td>
      <button class="edit-btn" data-action="edit" data-index="${index}">
        Editar
      </button>
      <button class="delete-btn" data-action="delete" data-index="${index}">
        Remover
      </button>
    </td>
  `;

  return row;
}

function renderTransactions() {
  transactionList.innerHTML = '';

  if (transactions.length === 0) {
    transactionList.innerHTML = `
      <tr>
        <td colspan="5">
          Nenhuma movimentação registrada ainda.
        </td>
      </tr>
    `;
    return;
  }

  transactions.forEach((transaction, index) => {
    transactionList.appendChild(
      createTransactionRow(transaction, index)
    );
  });
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

  if (accountEmailDisplay) {
    accountEmailDisplay.textContent = account.email;
  }

  accountInitialBalanceDisplay.textContent =
    formatCurrency(getInitialBalance());
}

function renderSummary() {
  const summary = calculateSummary(transactions);

  if (incomeSummaryDisplay) {
    incomeSummaryDisplay.textContent =
      formatCurrency(summary.income);
  }

  if (expenseSummaryDisplay) {
    expenseSummaryDisplay.textContent =
      formatCurrency(summary.expense);
  }

  if (incomeSummaryCardDisplay) {
    incomeSummaryCardDisplay.textContent =
      formatCurrency(summary.income);
  }

  if (expenseSummaryCardDisplay) {
    expenseSummaryCardDisplay.textContent =
      formatCurrency(summary.expense);
  }

  if (balanceDisplay) {
    balanceDisplay.textContent =
      formatCurrency(summary.balance);
  }

  if (savingsDisplay) {
    savingsDisplay.textContent =
      formatCurrency(summary.savings);
  }
}

async function handleAccountSubmit(event) {
  event.preventDefault();

  const name = accountNameInput.value.trim();
  const email = accountEmailInput.value.trim().toLowerCase();
  const password = accountPasswordInput.value;
  const passwordConfirm = accountPasswordConfirmInput.value;
  const initialBalance = Number(initialBalanceInput.value);

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!name || !email || !emailPattern.test(email)) {
    alert('Informe nome e e-mail válido.');
    return;
  }

  if (!password || password.length < 6) {
    alert('Senha precisa ter pelo menos 6 caracteres.');
    return;
  }

  if (password !== passwordConfirm) {
    alert('As senhas não coincidem.');
    return;
  }

  if (isNaN(initialBalance) || initialBalance < 0) {
    alert('Informe um saldo inicial válido.');
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
      alert(result.message || 'Erro ao cadastrar.');
      return;
    }

    account = {
      name,
      email,
      initialBalance: initialBalance.toFixed(2)
    };

    saveAccount();
    renderAccountInfo();
    renderSummary();
    renderTransactions();

    accountForm.reset();

    alert('Conta criada com sucesso!');

  } catch (error) {
    console.error(error);
    alert('Erro ao conectar com o servidor.');
  }
}

function addTransaction(event) {
  event.preventDefault();

  const description =
    document.getElementById('description').value.trim();

  const amount =
    Number(document.getElementById('amount').value);

  const category =
    document.getElementById('category').value;

  const type =
    document.querySelector('input[name="type"]:checked').value;

  if (!description || amount <= 0) {
    alert('Preencha os dados corretamente.');
    return;
  }

  transactions.unshift({
    description,
    amount,
    category,
    type,
    createdAt: new Date().toISOString()
  });

  saveTransactions();
  renderTransactions();
  renderSummary();

  form.reset();
}

function removeTransaction(index) {
  transactions.splice(index, 1);
  saveTransactions();
  renderTransactions();
  renderSummary();
}

function clearAllTransactions() {
  const confirmClear =
    confirm('Deseja apagar tudo?');

  if (!confirmClear) return;

  transactions = [];
  saveTransactions();
  renderTransactions();
  renderSummary();
}

if (accountForm) {
  accountForm.addEventListener(
    'submit',
    handleAccountSubmit
  );
}

if (form) {
  form.addEventListener(
    'submit',
    addTransaction
  );
}

if (clearAllButton) {
  clearAllButton.addEventListener(
    'click',
    clearAllTransactions
  );
}

if (transactionList) {
  transactionList.addEventListener('click', (event) => {
    const button =
      event.target.closest('button[data-action]');

    if (!button) return;

    const index =
      Number(button.dataset.index);

    const action =
      button.dataset.action;

    if (action === 'delete') {
      removeTransaction(index);
    }
  });
}

renderAccountInfo();
renderTransactions();
renderSummary();
