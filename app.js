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

const passwordToggles = document.querySelectorAll('.password-toggle');

// MODAL BONITO
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

// MOSTRAR SENHA
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

// CADASTRO
async function handleAccountSubmit(event) {
  event.preventDefault();

  const name = accountNameInput.value.trim();
  const email = accountEmailInput.value.trim();
  const password = accountPasswordInput.value;
  const confirmPassword = accountPasswordConfirmInput.value;
  const initialBalance = Number(initialBalanceInput.value);

  if (!name || !email || !password) {
    alert('Preencha todos os campos.');
    return;
  }

  if (password !== confirmPassword) {
    alert('As senhas não coincidem.');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    alert('Conta criada com sucesso!');
    accountForm.reset();

  } catch (error) {
    alert('Erro ao conectar com servidor.');
  }
}

// ADICIONAR
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
  form.reset();
}

// ABRIR MODAL BONITO
function editTransaction(index) {
  const transaction = transactions[index];
  if (!transaction) return;

  editIndex = index;

  editDescriptionInput.value = transaction.description;
  editAmountInput.value = transaction.amount;
  editCategoryInput.value = transaction.category;

  editTypeInputs.forEach((input) => {
    input.checked = input.value === transaction.type;
  });

  editBalloon.classList.remove('hidden');
}

// FECHAR MODAL
function closeEditModal() {
  editBalloon.classList.add('hidden');
  editTransactionForm.reset();
  editIndex = null;
}

// SALVAR EDIÇÃO
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
  closeEditModal();
}

// REMOVER
function removeTransaction(index) {
  transactions.splice(index, 1);
  saveTransactions();
  renderTransactions();
}

// LIMPAR
function clearAllTransactions() {
  if (!confirm('Deseja apagar tudo?')) return;

  transactions = [];
  saveTransactions();
  renderTransactions();
}

// EVENTOS
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
    }

    if (action === 'delete') {
      removeTransaction(index);
    }
  });
}

if (editTransactionForm) {
  editTransactionForm.addEventListener('submit', saveEditedTransaction);
}

if (closeEditBalloonButton) {
  closeEditBalloonButton.addEventListener('click', closeEditModal);
}

if (cancelEditBalloonButton) {
  cancelEditBalloonButton.addEventListener('click', closeEditModal);
}

renderTransactions();
