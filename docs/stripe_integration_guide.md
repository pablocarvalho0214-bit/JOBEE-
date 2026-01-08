
# Guia de Integração de Pagamentos Recorrentes (Stripe) no Jobee

Este guia descreve o "Caminho das Pedras" para configurar assinaturas mensais automáticas (SaaS) usando **Stripe** e conectando ao **Supabase**.

A Stripe gerencia automaticamente a cobrança, renovação, tentativas de repagamento (caso o cartão falhe) e recibos.

---

## 🏗️ Passo 1: Configuração na Stripe

1.  **Crie uma Conta**: Acesse [dashboard.stripe.com](https://dashboard.stripe.com/register) e crie sua conta.
2.  **Ative o Modo de Teste**: No canto superior direito, ligue a chave "Test Mode". Não use dados reais até estar tudo pronto.
3.  **Crie os Produtos (Planos)**:
    *   Vá em **Catálogo de Produtos** > **Adicionar Produto**.
    *   **Nome**: "Plano Pólen (Básico)".
    *   **Preço**: R$ 29,90.
    *   **Tipo**: **Recorrente** (Recurring).
    *   **Período de Faturamento**: **Mensal** (Monthly).
    *   Repita para "Favo de Ouro" e "Geleia Real".
4.  **Copie os IDs de Preço**:
    *   Ao criar, você verá um ID que começa com `price_...` (Ex: `price_1MeJw2J...`). Copie esses IDs, vamos usá-los no código.

---

## 🗄️ Passo 2: Banco de Dados (Supabase)

Precisamos saber quem pagou o quê. Vamos adicionar campos na tabela `profiles`.

Execute este SQL no Supabase (SQL Editor):

```sql
-- Adiciona colunas para controlar a assinatura
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id text, -- ID do cliente na Stripe
ADD COLUMN IF NOT EXISTS subscription_id text,    -- ID da assinatura ativa
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'free', -- 'active', 'past_due', 'canceled', 'free'
ADD COLUMN IF NOT EXISTS current_period_end timestamp with time zone; -- Quando a assinatura expira/renova
```

---

## ⚡ Passo 3: Backend (Supabase Edge Functions)

Como é perigoso processar pagamentos no frontend (o usuário pode alterar o preço), usamos uma "Edge Function" segura.

Isso requer instalar o Supabase CLI no seu computador, mas a lógica é esta:

### A. Criar Sessão de Checkout
Quando o usuário clica em "Assinar":
1.  O App chama a função `create-checkout-session`.
2.  A função fala com a Stripe: "Crie um link de pagamento para o plano `price_...` para o usuário X".
3.  A Stripe devolve uma URL (ex: `checkout.stripe.com/...`).
4.  O App redireciona o usuário para essa URL.

### B. O Webhook (A Mágica da Renovação) 🪄
Como saber se o usuário pagou? Ou se a renovação automática funcionou mês que vem?
**Webhooks**.

1.  Você cria uma função chamada `stripe-webhook`.
2.  Configura na Stripe para avisar essa URL sempre que um evento ocorrer.
3.  Eventos importantes para ouvir:
    *   `checkout.session.completed`: O usuário pagou a primeira vez. -> **Ativar Premium no Banco**.
    *   `invoice.payment_succeeded`: A renovação mensal automática ocorreu com sucesso. -> **Estender data no Banco**.
    *   `customer.subscription.deleted`: O usuário cancelou ou o cartão falhou muitas vezes. -> **Voltar para Grátis no Banco**.

---

## 💻 Passo 4: Código Exemplo (Resumo)

### 1. No Frontend (Botão Assinar)

```typescript
// Quando clicar em "Assinar Pólen"
const handleSubscribe = async (priceId) => {
  // Chamada para sua Edge Function
  const { data: { url } } = await supabase.functions.invoke('create-checkout-session', {
    body: { priceId, userId: user.id, email: user.email }
  });
  
  // Leva o usuário para pagar na Stripe
  if (url) window.location.href = url;
};
```

### 2. Na Edge Function (Servidor seguro)

```typescript
// (Requer Deno/Supabase CLI)
import { Stripe } from 'stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

serve(async (req) => {
  const { priceId, email, userId } = await req.json();

  // Cria a sessão na Stripe
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'], // ou 'boleto', 'pix' (se configurado)
    mode: 'subscription', // IMPOORTANTE: Isso ativa a renovação automática
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: 'https://seusite.com/profile?success=true',
    cancel_url: 'https://seusite.com/profile?canceled=true',
    customer_email: email,
    metadata: { supabaseUserId: userId } // Para sabermos quem é no webhook
  });

  return new Response(JSON.stringify({ url: session.url }), { ... });
});
```

---

## 🔄 Renovação Automática

Você **não precisa fazer nada** para a renovação acontecer.
Ao definir `mode: 'subscription'` e intervalo `monthly` no produto:
1.  A Stripe cobra o cartão do usuário todo mês.
2.  Se funcionar, ela envia um webhook `invoice.payment_succeeded`.
3.  Se falhar, ela tenta de novo (conforme suas regras) e te avisa.

## ✅ Próximos Passos Práticos

1.  Crie sua conta Stripe.
2.  Defina seus produtos lá.
3.  Podemos configurar as Tables no Supabase agora se quiser.
4.  A parte das Edge Functions requer configuração do ambiente local (Supabase CLI), podemos fazer isso em uma sessão futura dedicada a Backend.

---
*Jobee Payments Documentation - v1.0*
