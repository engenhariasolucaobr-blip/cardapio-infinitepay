export default async function handler(req, res) {
  // Headers CORS obrigatórios
  res.setHeader('Access-Control-Allow-Origin', '*');  // Use '*' para teste; depois troque por sua URL exata
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');  // Cache preflight por 24h

  // Trata o preflight OPTIONS (o navegador envia isso antes do POST)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Só aceita POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { total } = req.body;

  if (!total || isNaN(total)) {
    return res.status(400).json({ error: 'Valor total inválido' });
  }

  try {
    const response = await fetch('https://api.infinitepay.io/invoices/public/checkout/links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        handle: 'fernando1570',
        items: [
          {
            quantity: 1,
            price: Math.round(total * 100),
            description: 'Aluguel de hora(s) - Cardápio Digital'
          }
        ],
        order_nsu: 'pedido-' + Date.now()
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: `InfinitePay error ${response.status}: ${errorText}` });
    }

    const data = await response.json();

    // Tente diferentes nomes possíveis para o link (baseado na doc InfinitePay)
    const paymentUrl = data.link || data.checkout_url || data.payment_url || data.url || data.checkoutLink || data.redirectUrl;

    if (paymentUrl) {
      return res.status(200).json({ url: paymentUrl });
    } else {
      return res.status(500).json({ error: 'Link não encontrado. Resposta: ' + JSON.stringify(data) });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno: ' + err.message });
  }
}
