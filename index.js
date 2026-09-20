const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const { Storage } = require('megajs');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// --- FULL DEBUGGING LOG ---
app.use((req, res, next) => {
    console.log("➡️ URL AAYA:", req.url);
    console.log("➡️ QUERY DATA:", req.query);
    console.log("➡️ BODY DATA:", req.body);
    next();
});
//--------------------------

// File Upload ke liye Multer (Render ke liye safe temporary folder: /tmp/)
const upload = multer({ dest: '/tmp/' });

// ==========================================
// 1. CONFIGURATION (API Keys & Details)
// ==========================================
const BREVO_API_KEY = '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';
const SENDER_EMAIL = 'imtiyaz6201260615@gmail.com';
const SENDER_NAME = 'NB Reels App';

const FIREBASE_DB_URL = 'https://public-real-default-rtdb.firebaseio.com/';
const FIREBASE_SECRET = 'AIzaSyCB7DDmsWmo6zebhyAgA7hRwL255Y8BMi8';

const mega_accounts = [
    { email: 'razadanish2098@gmail.com', password: 'Da-94-##' },
    { email: 'demo2@example.com', password: 'demo_pass_2' },
    { email: 'demo3@example.com', password: 'demo_pass_3' },
    { email: 'demo4@example.com', password: 'demo_pass_4' },
    { email: 'demo5@example.com', password: 'demo_pass_5' },
    { email: 'demo6@example.com', password: 'demo_pass_6' },
    { email: 'demo7@example.com', password: 'demo_pass_7' },
    { email: 'demo8@example.com', password: 'demo_pass_8' },
    { email: 'demo9@example.com', password: 'demo_pass_9' },
    { email: 'demo10@example.com', password: 'demo_pass_10' },
    { email: 'demo11@example.com', password: 'demo_pass_11' },
    { email: 'demo12@example.com', password: 'demo_pass_12' },
    { email: 'demo13@example.com', password: 'demo_pass_13' },
    { email: 'demo14@example.com', password: 'demo_pass_14' },
    { email: 'demo15@example.com', password: 'demo_pass_15' },
    { email: 'demo16@example.com', password: 'demo_pass_16' },
    { email: 'demo17@example.com', password: 'demo_pass_17' },
    { email: 'demo18@example.com', password: 'demo_pass_18' },
    { email: 'demo19@example.com', password: 'demo_pass_19' },
    { email: 'demo20@example.com', password: 'demo_pass_20' }
];

// ==========================================
// 2. DATABASE SETUP (SQLite)
// ==========================================
// Render par error se bachne ke liye database ko bhi /tmp/ mein save kar rahe hain
const db = new sqlite3.Database('/tmp/server_security.sqlite');
db.run(`CREATE TABLE IF NOT EXISTS otp_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    otp TEXT NOT NULL,
    request_time INTEGER NOT NULL,
    ip_address TEXT NOT NULL
)`);

// SQLite Helpers
const getQuery = (query, params) => new Promise((res, rej) => db.get(query, params, (err, row) => err ? rej(err) : res(row)));
const runQuery = (query, params) => new Promise((res, rej) => db.run(query, params, function(err) { err ? rej(err) : res(this); }));

// ==========================================
// 3. API ROUTING (Single Endpoint)
// ==========================================
app.all('/', upload.any(), async (req, res) => {
    const action = req.query.action || req.body.action;
    const ip_address = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    try {
        switch (action) {

            // --- 1. REQUEST OTP ---
            case 'request_otp': {
                const email = req.body.email;
                if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
                    return res.json({ status: "error", message: "Invalid Email" });
                }

                const lastRequest = await getQuery(`SELECT request_time FROM otp_requests WHERE email = ? ORDER BY request_time DESC LIMIT 1`, [email]);
                const currentTime = Math.floor(Date.now() / 1000);

                if (lastRequest && (currentTime - lastRequest.request_time) < 60) {
                    return res.json({ status: "error", message: "Please wait 60 seconds." });
                }

                const otp = Math.floor(100000 + Math.random() * 900000).toString();
                await runQuery(`INSERT INTO otp_requests (email, otp, request_time, ip_address) VALUES (?, ?, ?, ?)`, [email, otp, currentTime, ip_address]);

                const emailTemplate = `
                    <div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;'>
                        <div style='background-color: #f9f9f9; padding: 25px;'>
                            <h2 style='color: #0095f6; text-align: center; margin-top: 0;'>NB Reels App</h2>
                            <p style='color: #333;'>Hello,</p>
                            <p style='color: #333;'>Aapka secure Login OTP niche diya gaya hai:</p>
                            
                            <div style='text-align: center; margin: 25px 0;'>
                                <span style='font-size: 26px; font-weight: bold; background: #000; color: #fff; padding: 12px 25px; border-radius: 6px; letter-spacing: 4px;'>${otp}</span>
                            </div>
                            <p style='font-size: 13px; color: #ff3b30; text-align: center;'>Yeh OTP 5 minute ke liye valid hai.</p>
                        </div>
                        
                        <div style='background-color: #fff; padding: 20px; border-top: 1px solid #ddd; font-size: 13px; color: #555; line-height: 1.6;'>
                            <strong style='font-size: 15px; color: #000;'>D 4K Studio Private Limited</strong><br>
                            <strong>Address:</strong> Naya Basti Bokaro Thermal jharkhand india<br>
                            <strong>Website:</strong> <a href='https://mr4k09.000.pe/?i=1' style='color: #0095f6;'>https://mr4k09.000.pe/?i=1</a><br>
                            <strong>Contact:</strong> 9430320021<br>
                            <strong>Developer:</strong> Danish Raza ji
                            
                            <p style='text-align: center; font-size: 14px; font-weight: bold; color: #0095f6; margin-top: 20px; margin-bottom: 0;'>
                                Thank u for use India's number one reel app
                            </p>
                        </div>
                    </div>
                `;

                await axios.post('https://api.brevo.com/v3/smtp/email', {
                    sender: { name: SENDER_NAME, email: SENDER_EMAIL },
                    to: [{ email: email }],
                    subject: "Your Login OTP - NB Reels App",
                    htmlContent: emailTemplate
                }, { headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json' } });

                return res.json({ status: "success", message: "OTP sent successfully." });
            }

            // --- 2. VERIFY OTP ---
            case 'verify_otp': {
                const { email, otp } = req.body;
                const record = await getQuery(`SELECT * FROM otp_requests WHERE email = ? AND otp = ? ORDER BY request_time DESC LIMIT 1`, [email, otp]);

                if (record) {
                    const currentTime = Math.floor(Date.now() / 1000);
                    if ((currentTime - record.request_time) > 300) { 
                        return res.json({ status: "error", message: "OTP expired." });
                    } else {
                        return res.json({ status: "success", message: "OTP verified successfully." });
                    }
                } else {
                    return res.json({ status: "error", message: "Invalid OTP." });
                }
            }

            // --- 3. UPLOAD VIDEO (WITH AUTO-SWITCH) ---
            case 'upload_video': {
                const videoFile = req.files ? req.files.find(f => f.fieldname === 'video_file') : null;
                if (!videoFile) return res.json({ status: "error", message: "No video file received." });

                const safeName = Date.now() + '_' + videoFile.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '');
                let finalVideoUrl = "";
                let usedAccount = "";
                let uploadSuccess = false;

                for (let account of mega_accounts) {
                    try {
                        const storage = await new Storage({ email: account.email, password: account.password }).ready;
                        const fileStream = fs.createReadStream(videoFile.path);
                        
                        const uploadedFile = await storage.upload({ 
                            name: safeName, 
                            size: videoFile.size 
                        }, fileStream).complete;
                        
                        finalVideoUrl = await uploadedFile.link();
                        usedAccount = account.email;
                        uploadSuccess = true;
                        break; 
                    } catch (err) {
                        console.error(`Mega Error [${account.email}]:`, err.message);
                        continue; 
                    }
                }

                fs.unlinkSync(videoFile.path); 

                if (!uploadSuccess) {
                    return res.json({ status: "error", message: "All 20 Mega Accounts are full or failed to connect." });
                }

                const video_id = Date.now().toString();
                const uploader_uid = req.body.uploader_uid || 'unknown';

                const videoData = {
                    video_url: finalVideoUrl,
                    hosted_on: usedAccount,
                    uploader_uid: uploader_uid,
                    metrics: { views: 0, likes: 0, shares: 0, comments: 0, downloads: 0, impressions: 0 },
                    timestamp: Math.floor(Date.now() / 1000)
                };

                await axios.put(`${FIREBASE_DB_URL}videos/${video_id}.json?auth=${FIREBASE_SECRET}`, videoData);

                return res.json({ status: "success", video_id: video_id, message: "Video uploaded successfully." });
            }

            // --- 4. UPLOAD DP (WITH AUTO-SWITCH) ---
            case 'upload_dp': {
                const dpFile = req.files ? req.files.find(f => f.fieldname === 'dp_file') : null;
                if (!dpFile) return res.json({ status: "error", message: "No image file received." });

                const safeName = "DP_" + Date.now() + "_" + dpFile.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '');
                let finalDpUrl = "";
                let uploadSuccess = false;

                for (let account of mega_accounts) {
                    try {
                        const storage = await new Storage({ email: account.email, password: account.password }).ready;
                        const fileStream = fs.createReadStream(dpFile.path);
                        
                        const uploadedFile = await storage.upload({ 
                            name: safeName, 
                            size: dpFile.size 
                        }, fileStream).complete;
                        
                        finalDpUrl = await uploadedFile.link();
                        uploadSuccess = true;
                        break;
                    } catch (err) {
                        continue;
                    }
                }

                fs.unlinkSync(dpFile.path);

                if (!uploadSuccess) {
                    return res.json({ status: "error", message: "All Mega Accounts are full or failed to connect." });
                }

                return res.json({ status: "success", dp_url: finalDpUrl, message: "DP uploaded successfully." });
            }

            case 'download_video':
                return res.json({ status: "error", message: "Download logic not implemented yet." });

            default:
                return res.json({ status: "error", message: "Invalid Action Request." });
        }
    } catch (err) {
        console.error("Server Error:", err);
        return res.json({ status: "error", message: "Internal Server Error." });
    }
});

// Start Server (Render injects PORT automatically)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Node.js server running on port ${PORT}`);
});
