const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

// 1. Initialize Firebase Admin
// (Vercel will inject your FIREBASE_SERVICE_KEY from its environment variables)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_KEY)),
    databaseURL: "https://sports-room-d9b41-default-rtdb.asia-southeast1.firebasedatabase.app/"
  });
}

const db = admin.database();

// 2. Configure the Email Sender (Using a Gmail account)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.v.stefan.is.salvatore@gmail.com, // e.g., your.email@gmail.com
    pass: process.env.bxfzaflrqbgwrmgh  // A 16-character Gmail "App Password"
  }
});

export default async function handler(req, res) {
  // Security check: Only allow Vercel's Cron system to trigger this
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).send('Unauthorized');
  }

  try {
    const snap = await db.ref("loans").once("value");
    const loans = snap.val() || {};
    let emailsSent = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 3. Scan all loans
    for (const [key, loan] of Object.entries(loans)) {
      if (loan.status === "returned" || !loan.due) continue;

      const dueDate = new Date(loan.due);
      dueDate.setHours(0,0,0,0);
      
      // Calculate days until due
      const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

      // If it is due in exactly 1 day (tomorrow)
      if (diffDays === 1) {
        const emailAddress = loan.studentId.toLowerCase() + "@plaksha.edu.in";
        
        await transporter.sendMail({
          from: `"Sports Hub" <${process.env.EMAIL_USER}>`,
          to: emailAddress,
          subject: `Reminder: Return ${loan.name} Tomorrow`,
          text: `Hi ${loan.studentName},\n\nJust a quick reminder that your ${loan.name} is due back at the Sports Hub tomorrow.\n\nThanks!`
        });
        
        emailsSent++;
      }
    }

    return res.status(200).json({ success: true, emailsSent });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
