# Roteiro de teste — Moda Store (produção)

Guia para **quem não é técnico**. Serve para validar o site de ponta a ponta: cadastros, loja, frete, pagamento e envio de insumos.

**Antes de começar**, peça ao responsável do projeto:

- O **link do site** (ex.: `https://…vercel.app` ou domínio próprio).
- E-mail e senha do **administrador** (ex.: `admin@modastore.com.br`).
- Confirmação de que o site está em **produção** (pagamento real com cartão; não há contas `@demo.local`).

Use **Chrome, Firefox, Safari ou Edge** atualizado. Anote o que der errado (mensagem na tela + em que passo parou).

---

## Visão geral (quem faz o quê)

| Papel | O que faz no teste |
|--------|---------------------|
| **Administrador** | Aprova cadastros, monta a peça, define preços, liga costureira e publica na loja |
| **Fornecedor** | Completa o perfil, cadastra insumos, vê envio de materiais à costureira |
| **Costureira (executor)** | Completa o perfil, pode pedir para produzir uma peça |
| **Cliente** | Compra na loja, informa endereço, paga com cartão |

Recomenda-se **4 pessoas** (ou 1 pessoa com 4 e-mails diferentes). O teste completo leva cerca de **1 a 2 horas** na primeira vez.

---

## Parte 1 — Administrador

### 1.1 Entrar no painel

1. Abra o link do site.
2. Clique em **Entrar**.
3. Use o e-mail e a senha de **admin** que o responsável passou.
4. Deve abrir o **Painel de Administração** (menu com Cadastro de peça, Peças e preços, Cadastros, etc.).

**✓ Deu certo se:** aparece “API + banco ativos” ou equivalente (não “modo demonstração”).

**✗ Se não entrar:** confirme e-mail/senha com o responsável.

---

### 1.2 Aprovar fornecedor e costureira (depois que eles se registrarem)

*Faça isto **depois** das Partes 2 e 3, ou peça para alguém se registrar antes e volte aqui.*

1. No painel admin, abra **Cadastros** (ou área de aprovação de contas).
2. Localize o cadastro do **fornecedor** → **Aprovar**.
3. Localize o cadastro da **costureira** → **Aprovar**.

**✓ Deu certo se:** o status fica ativo e eles conseguem entrar no painel deles.

---

### 1.3 Cadastrar uma peça na loja

1. Abra **Cadastro de peça**.
2. Preencha nome, SKU, descrição, tamanhos (se houver) e **fotos**.
3. Adicione **linhas de insumo** escolhendo os materiais que o fornecedor já cadastrou (quantidade por peça).
4. **Salve** a peça.

**✓ Deu certo se:** a peça aparece na lista em **Peças e preços**.

---

### 1.4 Definir preços

1. Abra **Peças e preços**.
2. Selecione a peça criada.
3. Confira custos dos insumos, taxas e **preço de venda ao público**.
4. **Salve**.

**✓ Deu certo se:** o preço final fica visível e coerente.

---

### 1.5 Ligar costureira e publicar na loja

1. Abra **Combinações** (ou área onde se associa peça + costureira).
2. Vincule a peça à **costureira** do teste.
3. Informe **quantidade disponível** (ex.: 2 peças) e confira o **CEP de origem** do envio (endereço da costureira).
4. **Publique** a oferta para a vitrine.

**✓ Deu certo se:** a peça aparece na **Loja** (`/loja`) com estoque > 0.

---

## Parte 2 — Fornecedor

### 2.1 Criar conta

1. Abra o site → **Registrar** / **Criar conta**.
2. Escolha cadastro como **parceiro** → **fornecedor** (texto pode variar).
3. Preencha e-mail, senha, dados da empresa e endereço.
4. Envie o cadastro.

**✓ Deu certo se:** mensagem de sucesso e instrução para aguardar aprovação (ou entrar após aprovação). Você deve receber um **e-mail** com assunto “Cadastro confirmado” (confira também a pasta de spam).

---

### 2.2 Completar perfil (obrigatório para etiquetas)

1. Entre com a conta do fornecedor (após aprovação do admin).
2. Abra **Minha conta** / perfil.
3. Confirme: **endereço completo**, **CEP**, **telefone**, **CPF ou CNPJ**.

**✓ Deu certo se:** todos os campos obrigatórios estão preenchidos.

---

### 2.3 Cadastrar um insumo

1. No **painel do fornecedor**, cadastre pelo menos **1 insumo** (ex.: tecido).
2. Preencha nome, unidade, custo (se pedido) e dados do **pacote** (altura, largura, comprimento, peso) se o formulário pedir.

**✓ Deu certo se:** o insumo aparece na lista e o admin consegue usá-lo no “Cadastro de peça”.

---

### 2.4 Ver envio à costureira (após admin publicar)

1. Depois que o admin vincular a peça à costureira, abra a área de **entregas** / envios ao executor.
2. Verifique se existe linha de envio de insumos para aquela produção.
3. Se houver botão **Gerar etiqueta (Melhor Envio)**, use-o ou confira se já existe **link da etiqueta**.

**✓ Deu certo se:** aparece etiqueta ou mensagem clara (ex.: falta saldo Melhor Envio — avisar o responsável).

---

## Parte 3 — Costureira (executor)

### 3.1 Criar conta

1. **Registrar** → parceiro → **costureira** / executor.
2. Preencha dados e endereço de postagem.
3. Aguarde **aprovação** do admin.

**✓ Deu certo se:** recebeu e-mail “Cadastro confirmado” e, na tela de entrar, vê aviso de confirmação por e-mail.

### 3.2 Completar perfil

1. Entre após aprovação.
2. Em **Minha conta**, preencha **endereço**, **CEP**, **telefone**, **CPF ou CNPJ**.

**✓ Deu certo se:** endereço completo — é o destino dos insumos e origem do envio ao cliente.

---

### 3.3 (Opcional) Pedir para executar uma peça

1. No **painel da costureira**, veja se pode **solicitar** produção de uma peça.
2. O admin pode aprovar e publicar (Parte 1.5).

---

## Parte 4 — Cliente (compra na loja)

### 4.1 Criar conta de cliente

1. **Registrar** → **cliente** (comprador da loja).
2. Confirme e-mail e senha.
3. **Entre** na conta.

**✓ Deu certo se:** recebeu e-mail “Cadastro confirmado” e consegue entrar na conta.

---

### 4.2 Comprar uma peça

1. Abra **Loja** e escolha a peça publicada no teste.
2. Clique em **Adicionar ao carrinho** (ou **Comprar agora**).
3. Abra **Carrinho** → **Finalizar compra**.

---

### 4.3 Entrega e frete

1. Em **Finalizar compra**, preencha **nome**, **telefone** e **endereço de entrega** (CEP válido).
2. Avance até o passo de **pagamento**.
3. Aguarde o sistema **calcular o frete** (pode levar alguns segundos).

**✓ Deu certo se:** aparece valor de **frete** e **total** (produtos + frete).

**✗ Se o frete não aparecer:** anote a mensagem de erro e avise o responsável (integração Melhor Envio).

---

### 4.4 Pagar com cartão (produção)

1. Clique em **Pagar com cartão**.
2. Será redirecionado para a página segura da **Stripe**.
3. Use um **cartão real** com valor **baixo** (compra de teste real em produção).
4. Conclua o pagamento.

**✓ Deu certo se:** volta para página **Pagamento recebido** / **Obrigado**.

**✗ Não deve aparecer** “Confirmar sem cartão (teste)” em produção.

---

### 4.5 Conferir depois da compra

1. Na página de obrigado, leia a confirmação.
2. Volte à **Loja** e abra o mesmo produto: o **estoque** deve ter **diminuído**.
3. Em **Meus pedidos** (painel do cliente), o pedido deve aparecer (se a secção existir).

---

## Parte 5 — Administrador (conferência final)

1. Entre de novo como **admin**.
2. Abra **Pedidos** e confira se o pedido do cliente aparece.
3. Confira se a peça na loja tem **menos unidades** disponíveis.

---

## Checklist rápido (marque ✓)

| # | Passo | ✓ |
|---|--------|---|
| 1 | Admin entra no painel | |
| 2 | Fornecedor registrado e aprovado | |
| 3 | Costureira registrada e aprovada | |
| 4 | Perfis com endereço + CPF/CNPJ completos | |
| 5 | Fornecedor cadastrou insumo | |
| 6 | Admin cadastrou peça com insumos | |
| 7 | Admin definiu preço | |
| 8 | Admin vinculou costureira e publicou na loja | |
| 9 | Peça visível na Loja com estoque | |
| 10 | Cliente comprou com frete calculado | |
| 11 | Pagamento com cartão concluído (página Obrigado) | |
| 12 | Estoque na loja diminuiu | |
| 13 | (Opcional) Etiqueta insumo fornecedor → costureira | |

---

## Se algo falhar — o que anotar

Envie ao responsável do projeto:

1. **Link** da página onde parou.
2. **Papel** (admin, fornecedor, costureira, cliente).
3. **Texto exato** da mensagem de erro (print ajuda).
4. **Hora** aproximada do teste.

| Sintoma | Possível causa (para o responsável) |
|---------|-------------------------------------|
| Não entra / “erro de rede” | Site não ligado à API |
| Loja vazia | Nenhuma oferta publicada |
| Frete não calcula | Melhor Envio ou CEP inválido |
| Sem botão de cartão | Stripe não configurado no site |
| Etiqueta de insumo não gera | Endereço/documento incompleto ou saldo Melhor Envio |

---

## Avisos importantes

- Em **produção**, o pagamento é **real** — use valor pequeno de propósito.
- Cada pessoa de teste deve usar **e-mail diferente**.
- Não partilhe senhas por mensagens públicas; use canal seguro.
- O endereço cadastrado na **Melhor Envio** (conta do admin) **não** substitui o endereço do fornecedor/costureira nas etiquetas — o sistema usa os cadastros de cada parceiro.

---

*Documento: teste em produção — Moda Store. Atualize o link do site no topo antes de enviar a terceiros.*
