const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const CF_APP_ID = process.env.CF_APP_ID;
const CF_SECRET_KEY = process.env.CF_SECRET_KEY;
const SCRIPT_URL = process.env.SCRIPT_URL;
const SITE_URL = process.env.SITE_URL || "https://surya-dth-payment.onrender.com";
const OWNER_PHONE = "919963246388";

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Send WhatsApp notification via CallMeBot
async function sendWhatsApp(message) {
  try {
    const apiKey = process.env.WHATSAPP_API_KEY || "";
    if (!apiKey) return;
    const url = `https://api.callmebot.com/whatsapp.php?phone=${OWNER_PHONE}&text=${encodeURIComponent(message)}&apikey=${apiKey}`;
    await fetch(url);
  } catch(e) {
    console.log("WhatsApp notification failed:", e.toString());
  }
}

app.get('/api/payment', async (req, res) => {
  const { amount, mobile, customer, tech, village, vccdsn, service } = req.query;
  if (!amount || !mobile || !customer) return res.json({ error: "Missing fields" });
  const orderId = "SDH_" + Date.now();
  try {
    const cfRes = await fetch("https://api.cashfree.com/pg/orders", {
      method: "POST",
      headers: {
        "x-api-version": "2023-08-01",
        "x-client-id": CF_APP_ID,
        "x-client-secret": CF_SECRET_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        order_id: orderId,
        order_amount: parseFloat(amount),
        order_currency: "INR",
        customer_details: {
          customer_id: "CUST_" + mobile,
          customer_name: customer,
          customer_phone: mobile
        },
        order_meta: { return_url: SITE_URL + "/payment.html" }
      })
    });
    const cfData = await cfRes.json();
    if (!cfData.payment_session_id) return res.json({ error: JSON.stringify(cfData) });

    const saveUrl = `${SCRIPT_URL}?action=save&amount=${encodeURIComponent(amount)}&tech=${encodeURIComponent(tech||"")}&customer=${encodeURIComponent(customer)}&mobile=${encodeURIComponent(mobile)}&village=${encodeURIComponent(village||"")}&vccdsn=${encodeURIComponent(vccdsn||"")}&service=${encodeURIComponent(service||"")}&order_id=${orderId}`;
    await fetch(saveUrl).catch(() => {});

    res.json({ payment_session_id: cfData.payment_session_id, order_id: orderId });
  } catch (error) {
    res.json({ error: error.toString() });
  }
});

app.post('/api/webhook', async (req, res) => {
  try {
    const body = req.body;
    if (body.data && body.data.order) {
      const orderId = body.data.order.order_id;
      const amount = body.data.order.order_amount;
      const status = body.data.payment && body.data.payment.payment_status === "SUCCESS" ? "SUCCESS" : "FAILED";
      const customerName = body.data.customer_details ? body.data.customer_details.customer_name : "Customer";
      const customerPhone = body.data.customer_details ? body.data.customer_details.customer_phone : "";

      await fetch(`${SCRIPT_URL}?action=updatestatus&order_id=${orderId}&status=${status}`).catch(() => {});

      if (status === "SUCCESS") {
        const msg = `✅ *Surya DTH Payment Received!*\n\n👤 Customer: ${customerName}\n📱 Mobile: ${customerPhone}\n💰 Amount: ₹${amount}\n🔖 Order: ${orderId}`;
        await sendWhatsApp(msg);
      }
    }
    res.json({ status: "received" });
  } catch (error) {
    res.json({ status: "ok" });
  }
});

app.get('/api/data', async (req, res) => {
  try {
    const response = await fetch(`${SCRIPT_URL}?action=getdata`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.json({ error: error.toString() });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
