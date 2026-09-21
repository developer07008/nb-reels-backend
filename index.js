const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const cloudinary = require('cloudinary').v2; // Mega ko hatakar Cloudinary add kiya
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const { generateToken04 } = require('zego-server-assistant'); // NEW: ZegoCloud API Token generator

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
// NEW: ZEGOCLOUD TOKEN API (For Live Streaming & Calling)
// ==========================================
app.get('/api/zego_token', (req, res) => {
    const appID = 871581678; // Your Zego AppID
    const serverSecret = "7cb53ea3a1e87bf816a3ac37d0fa24da"; // Your Zego ServerSecret
    const userID = req.query.uid;
    const roomID = req.query.room;
    
    if (!userID || !roomID) {
        return res.status(400).json({ status: 'error', message: 'Missing uid or room parameter' });
    }

    try {
        // Generate Token valid for 24 hours (86400 seconds)
        const token = generateToken04(appID, userID, serverSecret, 86400, '');
        res.json({ status: 'success', token: token });
    } catch (error) {
        console.error("Zego Token Generation Error:", error);
        res.status(500).json({ status: 'error', message: 'Token generation failed' });
    }
});

// ==========================================
// 1. CONFIGURATION (API Keys & Details)
// ==========================================
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const SENDER_EMAIL = 'imtiyaz6201260615@gmail.com';
const SENDER_NAME = 'NB Reels App';

const FIREBASE_DB_URL = 'https://public-real-default-rtdb.firebaseio.com/';
const FIREBASE_SECRET = 'AIzaSyCB7DDmsWmo6zebhyAgA7hRwL255Y8BMi8';

// Yahan aapko apne Cloudinary accounts ki details dalni hain
const cloudinary_accounts = [
    { cloud_name: 'mediaflows_f2ed0bf1', api_key: 'dl3fkAVqga2vQLb92SHl0Sjol7Q', api_secret: 'yE6VnLHL_hqki-xwKCuen17X_ZY' },
    { cloud_name: 'demo_cloud_2', api_key: 'demo_key_2', api_secret: 'demo_secret_2' },
    { cloud_name: 'demo_cloud_3', api_key: 'demo_key_3', api_secret: 'demo_secret_3' },
    { cloud_name: 'demo_cloud_4', api_key: 'demo_key_4', api_secret: 'demo_secret_4' },
    { cloud_name: 'demo_cloud_5', api_key: 'demo_key_5', api_secret: 'demo_secret_5' },
    { cloud_name: 'demo_cloud_6', api_key: 'demo_key_6', api_secret: 'demo_secret_6' },
    { cloud_name: 'demo_cloud_7', api_key: 'demo_key_7', api_secret: 'demo_secret_7' },
    { cloud_name: 'demo_cloud_8', api_key: 'demo_key_8', api_secret: 'demo_secret_8' },
    { cloud_name: 'demo_cloud_9', api_key: 'demo_key_9', api_secret: 'demo_secret_9' },
    { cloud_name: 'demo_cloud_10', api_key: 'demo_key_10', api_secret: 'demo_secret_10' },
    { cloud_name: 'demo_cloud_11', api_key: 'demo_key_11', api_secret: 'demo_secret_11' },
    { cloud_name: 'demo_cloud_12', api_key: 'demo_key_12', api_secret: 'demo_secret_12' },
    { cloud_name: 'demo_cloud_13', api_key: 'demo_key_13', api_secret: 'demo_secret_13' },
    { cloud_name: 'demo_cloud_14', api_key: 'demo_key_14', api_secret: 'demo_secret_14' },
    { cloud_name: 'demo_cloud_15', api_key: 'demo_key_15', api_secret: 'demo_secret_15' },
    { cloud_name: 'demo_cloud_16', api_key: 'demo_key_16', api_secret: 'demo_secret_16' },
    { cloud_name: 'demo_cloud_17', api_key: 'demo_key_17', api_secret: 'demo_secret_17' },
    { cloud_name: 'demo_cloud_18', api_key: 'demo_key_18', api_secret: 'demo_secret_18' },
    { cloud_name: 'demo_cloud_19', api_key: 'demo_key_19', api_secret: 'demo_secret_19' },
    { cloud_name: 'demo_cloud_20', api_key: 'demo_key_20', api_secret: 'demo_secret_20' }
];

// ==========================================
// 2. DATABASE SETUP (SQLite)
// ==========================================
const db = new sqlite3.Database('/tmp/server_security.sqlite');
db.run(`CREATE TABLE IF NOT EXISTS otp_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    otp TEXT NOT NULL,
    request_time INTEGER NOT NULL,
    ip_address TEXT NOT NULL
)`);

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

            // --- 3. UPLOAD VIDEO (CLOUDINARY AUTO-SWITCH) ---
            case 'upload_video': {
                const videoFile = req.files ? req.files.find(f => f.fieldname === 'video_file') : null;
                if (!videoFile) return res.json({ status: "error", message: "No video file received." });

                let finalVideoUrl = "";
                let usedAccount = "";
                let uploadSuccess = false;

                for (let account of cloudinary_accounts) {
                    try {
                        // Cloudinary ko har loop mein naye account se connect karna
                        cloudinary.config({
                            cloud_name: account.cloud_name,
                            api_key: account.api_key,
                            api_secret: account.api_secret,
                            secure: true
                        });

                        // Video upload karna
                        const result = await cloudinary.uploader.upload(videoFile.path, { 
                            resource_type: "video",
                            folder: "nb_reels_videos"
                        });
                        
                        finalVideoUrl = result.secure_url; // Yeh direct play hone wala link hai
                        usedAccount = account.cloud_name;
                        uploadSuccess = true;
                        break; 
                    } catch (err) {
                        console.error(`Cloudinary Error [${account.cloud_name}]:`, err.message);
                        continue; 
                    }
                }

                fs.unlinkSync(videoFile.path); 

                if (!uploadSuccess) {
                    return res.json({ status: "error", message: "All Cloudinary Accounts are full or failed." });
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

            // --- 4. UPLOAD DP (CLOUDINARY AUTO-SWITCH) ---
            case 'upload_dp': {
                const dpFile = req.files ? req.files.find(f => f.fieldname === 'dp_file') : null;
                if (!dpFile) return res.json({ status: "error", message: "No image file received." });

                let finalDpUrl = "";
                let uploadSuccess = false;

                for (let account of cloudinary_accounts) {
                    try {
                        cloudinary.config({
                            cloud_name: account.cloud_name,
                            api_key: account.api_key,
                            api_secret: account.api_secret,
                            secure: true
                        });

                        // DP upload karna
                        const result = await cloudinary.uploader.upload(dpFile.path, { 
                            resource_type: "image",
                            folder: "nb_reels_dp"
                        });
                        
                        finalDpUrl = result.secure_url;
                        uploadSuccess = true;
                        break;
                    } catch (err) {
                        console.error(`Cloudinary DP Error [${account.cloud_name}]:`, err.message);
                        continue;
                    }
                }

                fs.unlinkSync(dpFile.path);

                if (!uploadSuccess) {
                    return res.json({ status: "error", message: "All Cloudinary Accounts are full or failed." });
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

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Node.js server running on port ${PORT}`);
});
