# Minha Grana

Um app simples de controle financeiro com visual inspirado no site do Organizze, para ajudar você a organizar seu dinheiro ao morar sozinha.

## O que ele faz

- Registra entradas e saídas
- Mostra saldo atual, renda, gastos e economia
- Lista movimentos com descrição, categoria e tipo
- Salva os dados direto no navegador com localStorage

## Como usar

1. Abra `index.html` no navegador.
2. Use os botões para navegar nas páginas **App**, **Como funciona** e **Recursos**.
3. No `app.html`, preencha descrição, valor, categoria e tipo.
4. Clique em **Salvar**.
5. Veja o saldo e as movimentações atualizarem imediatamente.

## Backend e verificação de e-mail

O projeto já inclui um backend em `server.js` que pode enviar um código de verificação real por e-mail usando SMTP. Para usar o backend:

1. Crie um arquivo `.env` a partir de `.env.example`.
2. Preencha as variáveis `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS` e `EMAIL_FROM`.
3. Execute `npm install` e depois `npm start`.
4. Abra o app em `http://localhost:3000/app.html`.

> Importante: GitHub Pages não aceita backend em Node.js. Se quiser verificação real de e-mail em produção, você precisa hospedar este backend em um servidor Node externo (Heroku, Railway, Render, etc.).

## Dicas

- Use categorias como `Moradia`, `Alimentação`, `Transporte` e `Lazer` para entender melhor para onde vai seu dinheiro.
- Registre todas as saídas fixas, como aluguel e conta de luz, para planejar seu orçamento.
- Verifique o saldo frequentemente e mantenha as despesas menores que sua renda.
