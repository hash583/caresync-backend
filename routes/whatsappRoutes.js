// const express = require('express');
// const router = express.Router();
// const client = require('../utils/twilioClient');

// router.post('/send-reminder', async (req, res) => {
//     const { to, date, time } = req.body;

//     try {
//         const msg = await client.messages.create({
//             from: `whatsapp:${process.env.TWILIO_WHATSAPP}`,
//             contentSid: 'HXb5b62575e6e4ff6129ad7c8efe1f983e',
//             contentVariables: JSON.stringify({
//                 "1": date,
//                 "2": time
//             }),
//             to: `whatsapp:${to}`
//         });

//         res.json({ success: true, sid: msg.sid });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ success: false, error: err.message });
//     }
// });

// module.exports = router;
