const STORAGE_KEY = 'minha-grana-transacoes';
const ACCOUNT_KEY = 'minha-grana-conta';
const API_URL = 'https://financeiro-xkxw.onrender.com';

const form = document.getElementById('transaction-form');
const transactionList = document.getElementById('transaction-list');
const clearAllButton = document.getElementById('clear-all');

const accountForm = document.getElementById('account-form');
const accountNameInput = document.getElementById('account-name-input');
const accountEmailInput = document.getElementById('account-email-input');
const accountPasswordInput = document.getElementById('account-password-input');
const accountPasswordConfirmInput = document.getElementById('account-password-confirm-input');
const initialBalanceInput = document.getElementById('initial-balance-input');

const accountInfoSection = document.getElementById('account-info');
const accountFormWrapper = document.getElementById('account-form-wrapper');
const appContent = document.getElementById('app-content');

const accountNameDisplay = document.getElementById('account-name');
const accountEmailDisplay = document.getElementById('account-email-display');
const accountInitialBalanceDisplay = document.getElementById('initial-balance-display');

const incomeSummaryDisplay = document.getElementById('income-summary');
const expenseSummaryDisplay = document.getElementById('expense-summary');
const balanceDisplay = document.getElementById('balance');
const savingsDisplay = document.getElementById('savings');

const passwordToggles = document.querySelectorAll('.password-toggle');

// MODAL DE EDIÇÃO BONITO
const editBalloon = document.getElementById('edit-balloon');
const editTransactionForm = document.getElementById('edit-transaction-form');
const editDescriptionInput = document.getElementById('edit-description');
const editAmountInput = document.getElementById('edit-amount');
const editCategoryInput = document.getElementById('edit-category');
const editTypeInputs = document.querySelectorAll('input[name="edit-type"]');
const closeEditBalloonButton = document.getElementById('close-edit-balloon');
const cancelEditBalloonButton = document.getElementById('cancel-edit-balloon');

let transactions = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
let account = JSON.parse(localStorage.getItem(ACCOUNT_KEY) || 'null');
let editIndex = null;

function saveTransactions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function saveAccount() {
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

function getInitialBalance() {
  return account ? Number(account.initialBalance) : 0;
}

function calculateSummary() {
  let income = 0;
  let expense = 0;

  transactions.forEach(transaction => {
    if (transaction.type === 'income') {
      income += transaction.amount;
    } else {
      expense += transaction.amount;
    }
  });

  return {
    income,
    expense,
    balance: getInitialBalance() + income - expense,
    savings: Math.max(getInitialBalance() + income - expense, 0)
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

  if (balanceDisplay) {
    balanceDisplay.textContent = formatCurrency(summary.balance);
  }

  if (savingsDisplay) {
    savingsDisplay.textContent = formatCurrency(summary.savings);
  }
}

function renderAccountInfo() {
  if (!account) {
    accountInfoSection?.classList.add('hidden');
    accountFormWrapper?.classList.remove('hidden');
    appContent?.classList.add('hidden');
    return;
  }

  accountInfoSection?.classList.remove('hidden');
  accountFormWrapper?.classList.add('hidden');
  appContent?.classList.remove('hidden');

  if (accountNameDisplay) {
    accountNameDisplay.textContent = account.name;
  }

  if (accountEmailDisplay) {
    accountEmailDisplay.textContent = account.email;
  }

  if (accountInitialBalanceDisplay) {
    accountInitialBalanceDisplay.textContent = formatCurrency(account.initialBalance);
  }
}

function renderTransactions() {
  transactionList.innerHTML = '';

  if (!transactions.length) {
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
  const input = document.getElementById(button.dataset.target);

  if (!input) return;

  if (input.type === 'password') {
    input.type = 'text';
    button.textContent = 'Ocultar';
  } else {
    input.type = 'password';
    button.textContent = 'Mostrar';
  }
}

// CADASTRAR OU ENTRAR
async function handleAccountSubmit(event) {
  event.preventDefault();

  const name = accountNameInput.value.trim();
  const email = accountEmailInput.value.trim().toLowerCase();
  const password = accountPasswordInput.value;
  const passwordConfirm = accountPasswordConfirmInput.value;
  const initialBalance = Number(initialBalanceInput.value);

  if (!email) {
    alert('Informe seu e-mail.');
    return;
  }

  try {
    const registerResponse = await fetch(`${API_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        password,
        initialBalance
      })
    });

    const registerResult = await registerResponse.json();

    if (registerResult.success) {
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
      return;
    }

    if (registerResult.message === 'E-mail já cadastrado.') {
      const loginResponse = await fetch(
        `${API_URL}/api/account?email=${encodeURIComponent(email)}`
      );

      const loginResult = await loginResponse.json();

      if (!loginResult.success) {
        alert('Erro ao entrar.');
        return;
      }

      account = {
        name: loginResult.account.name,
        email: loginResult.account.email,
        initialBalance: loginResult.account.initialBalance
      };

      saveAccount();
      renderAccountInfo();
      renderSummary();
      renderTransactions();

      accountForm.reset();

      alert('Login realizado com sucesso!');
      return;
    }

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
    alert('Preencha corretamente.');
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

// MODAL BONITO
function editTransaction(index) {
  const transaction = transactions[index];
  if (!transaction) return;

  editIndex = index;

  editDescriptionInput.value = transaction.description;
  editAmountInput.value = transaction.amount;
  editCategoryInput.value = transaction.category;

  editTypeInputs.forEach(input => {
    input.checked = input.value === transaction.type;
  });

  editBalloon.classList.remove('hidden');
}

function closeEditModal() {
  editBalloon.classList.add('hidden');
  editTransactionForm.reset();
  editIndex = null;
}

function saveEditedTransaction(event) {
  event.preventDefault();

  if (editIndex === null) return;

  const description = editDescriptionInput.value.trim();
  const amount = Number(editAmountInput.value);
  const category = editCategoryInput.value;
  const type = document.querySelector(
    'input[name="edit-type"]:checked'
  )?.value;

  transactions[editIndex] = {
    ...transactions[editIndex],
    description,
    amount,
    category,
    type
  };

  saveTransactions();
  renderTransactions();
  renderSummary();
  closeEditModal();
}

function removeTransaction(index) {
  transactions.splice(index, 1);
  saveTransactions();
  renderTransactions();
  renderSummary();
}

function clearAllTransactions() {
  if (!confirm('Deseja apagar tudo?')) return;

  transactions = [];
  saveTransactions();
  renderTransactions();
  renderSummary();
}

// EVENTOS
accountForm?.addEventListener('submit', handleAccountSubmit);
form?.addEventListener('submit', addTransaction);
clearAllButton?.addEventListener('click', clearAllTransactions);

passwordToggles.forEach(button => {
  button.addEventListener('click', () => {
    togglePasswordVisibility(button);
  });
});

transactionList?.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const index = Number(button.dataset.index);
  const action = button.dataset.action;

  if (action === 'edit') {
    editTransaction(index);
  }

  if (action === 'delete') {
    removeTransaction(index);
  }
});

editTransactionForm?.addEventListener('submit', saveEditedTransaction);
closeEditBalloonButton?.addEventListener('click', closeEditModal);
cancelEditBalloonButton?.addEventListener('click', closeEditModal);

renderAccountInfo();
renderTransactions();
renderSummary();
