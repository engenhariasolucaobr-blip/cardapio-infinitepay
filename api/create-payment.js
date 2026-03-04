export default async function handler(req, res) {
  // Configura CORS para permitir qualquer origem (teste; depois restrinja para a sua URL)
  res.setHeader('Access-Control-Allow-Origin', '*');  // ou troque por 'https://cardapio-infinitepay-f04mwxx.vercel.app' quando souber a URL exata
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Trata o pré-voo OPTIONS (obrigatório para CORS POST)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido' });
    return;
  }

  const { total } = req.body;

  if (!total || isNaN(total)) {
    res.status(400).json({ error: 'Valor total inválido' });
    return;
  }

  try {
    console.log('Recebido total:', total);  // debug no Vercel logs

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

    console.log('Status da InfinitePay:', response.status);  // debug

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`InfinitePay error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('Resposta InfinitePay:', data);  // debug para ver o campo do link

    const paymentUrl = data.link || data.checkout_url || data.payment_url || data.url || data.checkoutLink;

    if (paymentUrl) {
      res.status(200).json({ url: paymentUrl });
    } else {
      res.status(500).json({ error: 'Link não encontrado. Resposta completa: ' + JSON.stringify(data) });
    }
  } catch (err) {
    console.error('Erro completo:', err.message);
    res.status(500).json({ error: err.message });
  }
}
