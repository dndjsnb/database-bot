/*
Script Created By © Amane Ofc
Please don't delete Credits!!
*/
const util = require("util");
const chalk = require("chalk");
const fs = require("fs");
const axios = require("axios");
const fetch = require("node-fetch");
const ssh2 = require("ssh2");
const path = require("path");
const Yts = require("yt-search");
const tiktok = require("./storage/tiktok.js");
const remini = require("./storage/remini.js");
const { hdr } = require('./storage/iloveimg.js');
const uploadToCloudku = require("./storage/upload");
const QRCode = require("qrcode");
const { settingPanel, settingAdp } = require("./config_store.js");
const aiChat = require("./storage/openai.js");
const { exec, spawn, execSync } = require('child_process');
const { addStockDO, getStockDO, getAvailableStockDO, deleteStockDO, markStockDOSold, addStockApps, getStockApps, getAvailableStockApps, deleteStockApps, markStockAppsSold, addStockScript, getStockScript, getAvailableStockScript, deleteStockScript, markStockScriptSold, addTransaction, getStats } = require("./storage/stock_manager.js")
const { prepareWAMessageMedia, generateWAMessageFromContent, downloadContentFromMessage } = require("baileys");
const LoadDataBase = require("./storage/LoadDatabase.js");
const MenuText = require("./storage/MenuText.js");
global.dbTransaksi = global.dbTransaksi ? global.dbTransaksi : {}

module.exports = async (m, sock) => {
try {
await LoadDataBase(sock, m)
const isCmd = m?.body?.startsWith(m.prefix)
const quoted = m.quoted ? m.quoted : m
const mime = quoted?.msg?.mimetype || quoted?.mimetype || null
const args = m.body.trim().split(/ +/).slice(1)
const qmsg = (m.quoted || m)
const text = q = args.join(" ")
const command = isCmd ? m.body.slice(m.prefix.length).trim().split(' ').shift().toLowerCase() : ''
const cmd = m.prefix + command
const botNumber = await sock.user.id.split(":")[0]+"@s.whatsapp.net"
const isOwner = global.owner+"@s.whatsapp.net" == m.sender || m.sender == botNumber || db.settings.developer.includes(m.sender)
const isReseller = db.settings.reseller.includes(m.sender)
  m.isGroup = m.chat.endsWith('g.us');
  m.metadata = {};
  m.isAdmin = false;
  m.isBotAdmin = false;
  if (m.isGroup) {
    let meta = await global.groupMetadataCache.get(m.chat)
    if (!meta) meta = await sock.groupMetadata(m.chat).catch(_ => {})
    m.metadata = meta;
    const p = meta?.participants || [];
    m.isAdmin = p?.some(i => (i.id === m.sender || i.jid === m.sender) && i.admin !== null);
    m.isBotAdmin = p?.some(i => (i.id === botNumber || i.jid == botNumber) && i.admin !== null);
  } 
  
const settingVps = {
  "vps1g1c": { size: "s-1vcpu-1gb",  ram: "1 GB",  cpu: "1 vCPU", disk: "25 GB" },
  "vps2g1c": { size: "s-1vcpu-2gb",  ram: "2 GB",  cpu: "1 vCPU", disk: "50 GB" },
  "vps2g2c": { size: "s-2vcpu-2gb",  ram: "2 GB",  cpu: "2 vCPU", disk: "60 GB" },
  "vps4g2c": { size: "s-2vcpu-4gb",  ram: "4 GB",  cpu: "2 vCPU", disk: "80 GB" },
  "vps8g4c": { size: "s-4vcpu-8gb",  ram: "8 GB",  cpu: "4 vCPU", disk: "160 GB" }
};

const vpsImages = {
  "ubuntu-22": { image: "ubuntu-22-04-x64", name: "Ubuntu 22.04 LTS" },
  "ubuntu-20": { image: "ubuntu-20-04-x64", name: "Ubuntu 20.04 LTS" },
  "debian-11": { image: "debian-11-x64", name: "Debian 11" },
  "centos-8": { image: "centos-8-x64", name: "CentOS 8" }
};

const vpsRegions = {
  "sgp": { code: "sgp1", name: "Singapore" },
  "blr": { code: "blr1", name: "Bangalore, India" },
  "fra": { code: "fra1", name: "Frankfurt, Germany" },
  "nyc": { code: "nyc1", name: "New York, USA" },
  "lon": { code: "lon1", name: "London, UK" },
  "sfo": { code: "sfo3", name: "San Francisco, USA" }
};

async function generateStrongPassword() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let password = "";
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

async function createVPSDroplet(apiKey, hostname, spec, os, region, password) {
  if (!settingVps[spec]) throw new Error(`Spec "${spec}" tidak valid.`);
  if (!vpsImages[os]) throw new Error(`OS "${os}" tidak valid.`);
  if (!vpsRegions[region]) throw new Error(`Region "${region}" tidak valid.`);
  
  const dropletData = {
    name: hostname.toLowerCase().trim().substring(0, 63),
    region: vpsRegions[region].code,
    size: settingVps[spec].size,
    image: vpsImages[os].image,
    ssh_keys: [],
    backups: false,
    ipv6: true,
    monitoring: true,
    tags: ["autoorder-vps", "telegram-bot", `user-${hostname}`, new Date().toISOString().split("T")[0]],
    user_data: `#cloud-config\npassword: ${password}\nchpasswd: { expire: false }\nssh_pwauth: true`
  };

  try {
    const response = await fetch("https://api.digitalocean.com/v2/droplets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "User-Agent": "AutoOrder-Bot/1.0"
      },
      body: JSON.stringify(dropletData)
    });

    const data = await response.json();
    
    if (!response.ok) {
      let errorMsg = data.message || `HTTP ${response.status}: ${response.statusText}`;
      if (data.id === "forbidden") errorMsg = "API Key tidak valid atau expired";
      else if (data.id === "unprocessable_entity") errorMsg = `Invalid request: ${data.message}`;
      else if (response.status === 429) errorMsg = "Rate limit exceeded, coba lagi nanti";
      throw new Error(errorMsg);
    }
    
    if (!data.droplet || !data.droplet.id) {
      throw new Error("Invalid response format from Digital Ocean API");
    }
    
    return data.droplet.id;
  } catch (error) {
    console.error("Create VPS Droplet Error:", error);
    throw new Error(`Gagal membuat VPS: ${error.message}`);
  }
}

async function getDropletIP(apiKey, dropletId) {
  try {
    const response = await fetch(`https://api.digitalocean.com/v2/droplets/${dropletId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "User-Agent": "AutoOrder-Bot/1.0"
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.droplet) throw new Error("Droplet not found");
    
    if (data.droplet.status === 'new') return null;
    
    if (data.droplet.networks && data.droplet.networks.v4) {
      const publicIP = data.droplet.networks.v4.find(net => net.type === "public");
      return publicIP ? publicIP.ip_address : null;
    }
    
    return null;
  } catch (error) {
    console.error("Get Droplet IP Error:", error);
    return null;
  }
}

async function waitForDropletIP(apiKey, dropletId, maxAttempts = 50) {
  for (let i = 0; i < maxAttempts; i++) {
    await sleep(5000);
    const ip = await getDropletIP(apiKey, dropletId);
    if (ip) return ip;
  }
  return null;
}
  
// Konfigurasi
const setting = {
  domain: global.domain || "",
  apikey: global.apikey || "",
  nestid: global.nestid || "1",
  egg: global.egg || "8",
  loc: global.loc || "1",
  orderkuota: {
    username: global.usernameOrderkuota,
    token: global.tokenOrderkuota
  },
  pakasir: {
    slug: global.pakasirSlug,
    apiKey: global.pakasirApiKey
  },
  digitalocean: {
    apiKey: global.apikeyDigitalocean || ""
  }
};

// ===================== PAYMENT GATEWAY =====================
async function createdQris(amount, paymentConfig) {
  const paymentMode = global.paymentMode || "orderkuota";
  
  if (paymentMode === "orderkuota") {
    try {
      const url = `https://skyzopedia-api.vercel.app/orderkuota/createpayment?apikey=skyy&amount=${amount}&username=${paymentConfig.username}&token=${paymentConfig.token}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.result && data.result.imageqris) {
        return {
          idtransaksi: data.result.idtransaksi,
          jumlah: amount,
          imageqris: data.result.imageqris.url,
          type: "orderkuota"
        };
      }
      throw new Error("Gagal membuat QRIS OrderKuota");
    } catch (e) {
      console.error("OrderKuota error:", e);
      return await createPakasirQris(amount);
    }
  } 
  
  else if (paymentMode === "pakasir") {
    return await createPakasirQris(amount);
  }
  
  throw new Error("Payment mode tidak dikenali: " + paymentMode);
}

async function createPakasirQris(amount) {
  try {
    const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const pakasirUrl = "https://app.pakasir.com/api/transactioncreate/qris";
    const body = {
      project: setting.pakasir.slug,
      order_id: orderId,
      amount: amount,
      api_key: setting.pakasir.apiKey
    };
    
    const response = await fetch(pakasirUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    
    const data = await response.json();
    if (data.payment && data.payment.payment_number) {
      const qrDir = path.join(__dirname, "temp_qr");
      try { fs.mkdirSync(qrDir, { recursive: true }); } catch {}
      
      const filePath = path.join(qrDir, `${orderId}.png`);
      await QRCode.toFile(filePath, data.payment.payment_number, {
        width: 500,
        margin: 2
      });
      
      setTimeout(() => {
        try { fs.unlinkSync(filePath); } catch {}
      }, 3600000);
      
      return {
        idtransaksi: orderId,
        jumlah: amount,
        imageqris: filePath,
        type: "pakasir"
      };
    }
    throw new Error("Gagal membuat QRIS Pakasir");
  } catch (e) {
    console.error("Pakasir error:", e);
    throw new Error("Gagal membuat QRIS: " + e.message);
  }
}

async function cekStatus(sock, sender, paymentConfig) {
  const paymentMode = global.paymentMode || "orderkuota";
  const transaksi = dbTransaksi[sender];
  if (!transaksi) return false;
  
  if (paymentMode === "orderkuota") {
    try {
      const url = `https://skyzopedia-api.vercel.app/orderkuota/mutasiqr?apikey=skyy&username=${paymentConfig.username}&token=${paymentConfig.token}`;
      const response = await fetch(url);
      const data = await response.json();
      
      const list = data?.result || [];
      const found = list
        .filter(i => i.status === "IN")
        .find(i => toRupiah(i.kredit) === toRupiah(transaksi.amount));
      
      if (found) {
        return true;
      }
    } catch (e) {
      console.log("Cek status OrderKuota error:", e);
      return await cekPakasirStatus(transaksi);
    }
  } 
  
  else if (paymentMode === "pakasir") {
    return await cekPakasirStatus(transaksi);
  }
  
  return false;
}

async function cekPakasirStatus(transaksi) {
  try {
    const cekUrl = "https://app.pakasir.com/api/transactiondetail";
    const params = {
      project: setting.pakasir.slug,
      order_id: transaksi.idDeposit,
      amount: transaksi.amount,
      api_key: setting.pakasir.apiKey
    };
    
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${cekUrl}?${queryString}`);
    const data = await response.json();
    
    const status = data?.transaction?.status || data?.payment?.status || data?.status || "";
    const isPaid = ["paid", "success", "completed"].includes(String(status).toLowerCase());
    
    return isPaid;
  } catch (e) {
    console.log("Cek status Pakasir error:", e);
    return false;
  }
}
// Fungsi untuk save config ke setting.js
function saveGlobalConfig() {
    const fs = require('fs');
    const path = './setting.js';
    
    // Baca file setting.js
    let content = fs.readFileSync(path, 'utf8');
    
    // Cari dan replace config global.done
    const doneConfig = JSON.stringify(global.done, null, 2);
    const regex = /global\.done\s*=\s*{[^}]+}/s;
    
    if (regex.test(content)) {
        content = content.replace(regex, `global.done = ${doneConfig}`);
    } else {
        // Tambahkan jika belum ada
        content = content.replace(/global\.owner = /, `global.done = ${doneConfig}\n\n$&`);
    }
    
    // Update juga global.proses, ps, don
    content = content.replace(/global\.proses\s*=\s*{[^}]+}/s, `global.proses = global.done`);
    content = content.replace(/global\.ps\s*=\s*{[^}]+}/s, `global.ps = global.done`);
    content = content.replace(/global\.don\s*=\s*{[^}]+}/s, `global.don = global.done`);
    
    fs.writeFileSync(path, content);
    console.log('✅ Config saved to setting.js');
}

// ===== CONSOLE LOG JELAS =====
const logTime = new Date().toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour12: false })
const logDate = new Date().toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' })

if (isCmd) {
  const senderNum = m.sender?.split('@')[0] || 'unknown'
  const chatTarget = m.isGroup 
    ? `Grup: ${m.metadata?.subject || m.chat}` 
    : `Private: ${senderNum}`

  console.log(
    chalk.bgBlue.white.bold(' PERINTAH MASUK ') + '\n' +
    chalk.cyan('┌─────────────────────────────────────') + '\n' +
    chalk.cyan('│') + chalk.yellow(' 🕐 Waktu    : ') + chalk.white(`${logDate} ${logTime} WIB`) + '\n' +
    chalk.cyan('│') + chalk.yellow(' 👤 Pengirim : ') + chalk.greenBright(senderNum) + 
      (isOwner ? chalk.magenta(' [OWNER]') : isReseller ? chalk.blue(' [RESELLER]') : '') + '\n' +
    chalk.cyan('│') + chalk.yellow(' 💬 Chat     : ') + chalk.green(chatTarget) + '\n' +
    chalk.cyan('│') + chalk.yellow(' 📌 Perintah : ') + chalk.whiteBright.bold(cmd) + 
      (text ? chalk.gray(' ' + text.substring(0, 50) + (text.length > 50 ? '...' : '')) : '') + '\n' +
    chalk.cyan('└─────────────────────────────────────')
  )
}

if (!isCmd && m.body) {
  const senderNum = m.sender?.split('@')[0] || 'unknown'
  const chatTarget = m.isGroup 
    ? `Grup: ${m.metadata?.subject || m.chat}` 
    : `Private: ${senderNum}`
  console.log(
    chalk.bgGray.white(' PESAN BIASA ') + '\n' +
    chalk.gray('┌─────────────────────────────────────') + '\n' +
    chalk.gray('│') + chalk.yellow(' 🕐 Waktu    : ') + chalk.white(`${logDate} ${logTime} WIB`) + '\n' +
    chalk.gray('│') + chalk.yellow(' 👤 Pengirim : ') + chalk.green(senderNum) + '\n' +
    chalk.gray('│') + chalk.yellow(' 💬 Chat     : ') + chalk.green(chatTarget) + '\n' +
    chalk.gray('│') + chalk.yellow(' 📝 Pesan    : ') + chalk.white(m.body.substring(0, 80) + (m.body.length > 80 ? '...' : '')) + '\n' +
    chalk.gray('└─────────────────────────────────────')
  )
}

if (!isCmd && m.body) {
const bodyLower = m.body.toLowerCase()
const responder = db.settings.respon.find(v => bodyLower.includes(v.id.toLowerCase()))
if (responder && responder.response) {
await m.reply(responder.response)
}
}

//=============================================//

const FakeChannel = {
  key: {
    remoteJid: 'status@broadcast',
    fromMe: false,
    participant: '0@s.whatsapp.net'
  },
  message: {
    newsletterAdminInviteMessage: {
      newsletterJid: '120363402350499784@newsletter',
      caption: `Powered By ${global.namaOwner}.`,
      inviteExpiration: 0
    }
  }
}

// ===================== FUNGSI BUAT PANEL =====================
async function createPanelAccount(username, ramKey) {
  const email = `${username}@gmail.com`;
  const name = capital(username) + " Server";
  const password = username + "01801";

  const resourceMap = {
    "1gb": { ram: "1000", disk: "1000", cpu: "40" },
    "2gb": { ram: "2000", disk: "1000", cpu: "60" },
    "3gb": { ram: "3000", disk: "2000", cpu: "80" },
    "4gb": { ram: "4000", disk: "2000", cpu: "100" },
    "5gb": { ram: "5000", disk: "3000", cpu: "120" },
    "6gb": { ram: "6000", disk: "3000", cpu: "140" },
    "7gb": { ram: "7000", disk: "4000", cpu: "160" },
    "8gb": { ram: "8000", disk: "4000", cpu: "180" },
    "9gb": { ram: "9000", disk: "5000", cpu: "200" },
    "10gb": { ram: "10000", disk: "5000", cpu: "220" },
    "unlimited": { ram: "0", disk: "0", cpu: "0" },
    "unli": { ram: "0", disk: "0", cpu: "0" }
  };

  const { ram, disk, cpu } = resourceMap[ramKey] || resourceMap["1gb"];

  try {
    // Create user
    const userRes = await fetch(`${setting.domain}/api/application/users`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${setting.apikey}`
      },
      body: JSON.stringify({
        email,
        username: username.toLowerCase(),
        first_name: name,
        last_name: "Server",
        language: "en",
        password
      })
    });

    const userData = await userRes.json();
    if (userData.errors) {
      return { success: false, message: userData.errors[0]?.detail || "Create user failed" };
    }

    const user = userData.attributes;

    // Get egg data
    const eggRes = await fetch(
      `${setting.domain}/api/application/nests/${setting.nestid}/eggs/${setting.egg}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${setting.apikey}`
        }
      }
    );

    const eggData = await eggRes.json();
    const startup = eggData.attributes?.startup || "npm start";

    // Create server
    const serverRes = await fetch(`${setting.domain}/api/application/servers`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${setting.apikey}`
      },
      body: JSON.stringify({
        name,
        description: tanggal(Date.now()),
        user: user.id,
        egg: parseInt(setting.egg),
        docker_image: "ghcr.io/parkervcp/yolks:nodejs_20",
        startup,
        environment: {
          INST: "npm",
          USER_UPLOAD: "0",
          AUTO_UPDATE: "0",
          CMD_RUN: "npm start"
        },
        limits: { memory: ram, swap: 0, disk, io: 500, cpu },
        feature_limits: { databases: 5, backups: 5, allocations: 5 },
        deploy: {
          locations: [parseInt(setting.loc)],
          dedicated_ip: false,
          port_range: []
        }
      })
    });

    const serverData = await serverRes.json();
    if (serverData.errors) {
      return { success: false, message: serverData.errors[0]?.detail || "Create server failed" };
    }

    const server = serverData.attributes;
    const domainClean = (setting.domain || "").replace(/https?:\/\//g, "");

    return {
      success: true,
      data: {
        username: user.username,
        email,
        password,
        serverId: server.id,
        serverName: server.name,
        panelUrl: `https://${domainClean}`,
        ram: ram === "0" ? "Unlimited" : `${parseInt(ram) / 1000}GB`,
        disk: disk === "0" ? "Unlimited" : `${parseInt(disk) / 1000}GB`,
        cpu: cpu === "0" ? "Unlimited" : `${cpu}%`
      }
    };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

async function createAdminAccount(username) {
  const email = `${username}@gmail.com`;
  const name = capital(username);
  const password = username + "001";

  try {
    const res = await fetch(`${setting.domain}/api/application/users`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${setting.apikey}`,
      },
      body: JSON.stringify({
        email,
        username: username.toLowerCase(),
        first_name: name,
        last_name: "Admin",
        root_admin: true,
        language: "en",
        password,
      }),
    });

    const data = await res.json();
    if (data.errors) {
      return { success: false, message: data.errors[0]?.detail || "Create admin failed" };
    }

    const user = data.attributes;
    const domainClean = (setting.domain || "").replace(/https?:\/\//g, "");

    return {
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        password,
        panel: `https://${domainClean}`,
        isAdmin: true
      }
    };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// ─── Helper: Buat Panel Account untuk V1-V6 (mirror createPanelAccount) ───────
async function createPanelAccountVN(username, ramKey, panelConfig, vNum) {
    const email    = `${username}@gmail.com`;
    const name     = global.capital(username) + ` Server V${vNum}`;
    const password = `${username}00${vNum}`;

    // Resource map per versi
    const resourceMaps = {
        1: {
            "1gb": { ram: "1000", disk: "1000",  cpu: "40"  },
            "2gb": { ram: "2000", disk: "1000",  cpu: "60"  },
            "3gb": { ram: "3000", disk: "2000",  cpu: "80"  },
            "4gb": { ram: "4000", disk: "2000",  cpu: "100" },
            "5gb": { ram: "5000", disk: "3000",  cpu: "120" },
            "6gb": { ram: "6000", disk: "3000",  cpu: "140" },
            "7gb": { ram: "7000", disk: "4000",  cpu: "160" },
            "8gb": { ram: "8000", disk: "4000",  cpu: "180" },
            "9gb": { ram: "9000", disk: "5000",  cpu: "200" },
            "10gb":{ ram: "10000",disk: "5000",  cpu: "220" },
            "unlimited": { ram: "0", disk: "0",  cpu: "0"   },
            "unli":      { ram: "0", disk: "0",  cpu: "0"   }
        },
        2: {
            "1gb": { ram: "1000", disk: "2000",  cpu: "60"  },
            "2gb": { ram: "2000", disk: "3000",  cpu: "80"  },
            "3gb": { ram: "3000", disk: "4000",  cpu: "100" },
            "4gb": { ram: "4000", disk: "5000",  cpu: "120" },
            "5gb": { ram: "5000", disk: "6000",  cpu: "140" },
            "6gb": { ram: "6000", disk: "7000",  cpu: "160" },
            "7gb": { ram: "7000", disk: "8000",  cpu: "180" },
            "8gb": { ram: "8000", disk: "9000",  cpu: "200" },
            "9gb": { ram: "9000", disk: "10000", cpu: "220" },
            "10gb":{ ram: "10000",disk: "11000", cpu: "240" },
            "unlimited": { ram: "0", disk: "0",  cpu: "0"   },
            "unli":      { ram: "0", disk: "0",  cpu: "0"   }
        },
        3: {
            "1gb": { ram: "1000", disk: "1500",  cpu: "50"  },
            "2gb": { ram: "2000", disk: "2500",  cpu: "70"  },
            "3gb": { ram: "3000", disk: "3500",  cpu: "90"  },
            "4gb": { ram: "4000", disk: "4500",  cpu: "110" },
            "5gb": { ram: "5000", disk: "5500",  cpu: "130" },
            "6gb": { ram: "6000", disk: "6500",  cpu: "150" },
            "7gb": { ram: "7000", disk: "7500",  cpu: "170" },
            "8gb": { ram: "8000", disk: "8500",  cpu: "190" },
            "9gb": { ram: "9000", disk: "9500",  cpu: "210" },
            "10gb":{ ram: "10000",disk: "10500", cpu: "230" },
            "unlimited": { ram: "0", disk: "0",  cpu: "0"   },
            "unli":      { ram: "0", disk: "0",  cpu: "0"   }
        },
        4: {
            "1gb": { ram: "1000", disk: "2000",  cpu: "70"  },
            "2gb": { ram: "2000", disk: "4000",  cpu: "90"  },
            "3gb": { ram: "3000", disk: "6000",  cpu: "110" },
            "4gb": { ram: "4000", disk: "8000",  cpu: "130" },
            "5gb": { ram: "5000", disk: "10000", cpu: "150" },
            "6gb": { ram: "6000", disk: "12000", cpu: "170" },
            "7gb": { ram: "7000", disk: "14000", cpu: "190" },
            "8gb": { ram: "8000", disk: "16000", cpu: "210" },
            "9gb": { ram: "9000", disk: "18000", cpu: "230" },
            "10gb":{ ram: "10000",disk: "20000", cpu: "250" },
            "unlimited": { ram: "0", disk: "0",  cpu: "0"   },
            "unli":      { ram: "0", disk: "0",  cpu: "0"   }
        },
        5: {
            "1gb": { ram: "1000", disk: "3000",  cpu: "80"  },
            "2gb": { ram: "2000", disk: "5000",  cpu: "100" },
            "3gb": { ram: "3000", disk: "7000",  cpu: "120" },
            "4gb": { ram: "4000", disk: "9000",  cpu: "140" },
            "5gb": { ram: "5000", disk: "11000", cpu: "160" },
            "6gb": { ram: "6000", disk: "13000", cpu: "180" },
            "7gb": { ram: "7000", disk: "15000", cpu: "200" },
            "8gb": { ram: "8000", disk: "17000", cpu: "220" },
            "9gb": { ram: "9000", disk: "19000", cpu: "240" },
            "10gb":{ ram: "10000",disk: "21000", cpu: "260" },
            "unlimited": { ram: "0", disk: "0",  cpu: "0"   },
            "unli":      { ram: "0", disk: "0",  cpu: "0"   }
        },
        6: {
            "1gb": { ram: "1000", disk: "4000",  cpu: "100" },
            "2gb": { ram: "2000", disk: "7000",  cpu: "120" },
            "3gb": { ram: "3000", disk: "10000", cpu: "140" },
            "4gb": { ram: "4000", disk: "13000", cpu: "160" },
            "5gb": { ram: "5000", disk: "16000", cpu: "180" },
            "6gb": { ram: "6000", disk: "19000", cpu: "200" },
            "7gb": { ram: "7000", disk: "22000", cpu: "220" },
            "8gb": { ram: "8000", disk: "25000", cpu: "240" },
            "9gb": { ram: "9000", disk: "28000", cpu: "260" },
            "10gb":{ ram: "10000",disk: "31000", cpu: "280" },
            "unlimited": { ram: "0", disk: "0",  cpu: "0"   },
            "unli":      { ram: "0", disk: "0",  cpu: "0"   }
        }
    };

    const map     = resourceMaps[vNum] || resourceMaps[1];
    const cleanKey = ramKey.replace(new RegExp(`v${vNum}$`), "");
    const { ram, disk, cpu } = map[cleanKey] || map["1gb"];

    try {
        // 1. Buat user
        const userRes = await fetch(`${panelConfig.domain}/api/application/users`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${panelConfig.apikey}`
            },
            body: JSON.stringify({
                email,
                username: username.toLowerCase(),
                first_name: name,
                last_name: `Server V${vNum}`,
                language: "en",
                password
            })
        });

        const userData = await userRes.json();
        if (userData.errors) {
            return { success: false, message: userData.errors[0]?.detail || "Gagal membuat user" };
        }
        const user = userData.attributes;

        // 2. Ambil data egg
        const eggRes = await fetch(
            `${panelConfig.domain}/api/application/nests/${panelConfig.nestid}/eggs/${panelConfig.egg}`,
            {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${panelConfig.apikey}`
                }
            }
        );
        const eggData   = await eggRes.json();
        const startupCmd = eggData.attributes?.startup || "npm start";

        // 3. Buat server
        const serverRes = await fetch(`${panelConfig.domain}/api/application/servers`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${panelConfig.apikey}`
            },
            body: JSON.stringify({
                name,
                description: global.tanggal(Date.now()),
                user: user.id,
                egg: parseInt(panelConfig.egg),
                docker_image: "ghcr.io/parkervcp/yolks:nodejs_20",
                startup: startupCmd,
                environment: { INST: "npm", USER_UPLOAD: "0", AUTO_UPDATE: "0", CMD_RUN: "npm start" },
                limits: { memory: ram, swap: 0, disk, io: 500, cpu },
                feature_limits: { databases: 5, backups: 5, allocations: 5 },
                deploy: { locations: [parseInt(panelConfig.loc)], dedicated_ip: false, port_range: [] }
            })
        });

        const serverData = await serverRes.json();
        if (serverData.errors) {
            return { success: false, message: serverData.errors[0]?.detail || "Gagal membuat server" };
        }
        const server      = serverData.attributes;
        const domainClean = (panelConfig.domain || "").replace(/https?:\/\//g, "");

        return {
            success: true,
            data: {
                username: user.username,
                email,
                password,
                serverId:   server.id,
                serverName: server.name,
                panelUrl:   `https://${domainClean}`,
                ram:  ram  === "0" ? "Unlimited" : `${parseInt(ram)  / 1000}GB`,
                disk: disk === "0" ? "Unlimited" : `${parseInt(disk) / 1000}GB`,
                cpu:  cpu  === "0" ? "Unlimited" : `${cpu}%`
            }
        };
    } catch (err) {
        return { success: false, message: err.message };
    }
}

// ─── Helper: Buat Admin Account untuk V1-V6 ─────────────────────────────────
async function createAdminAccountVN(username, panelConfig, vNum) {
    const email    = `${username}@gmail.com`;
    const name     = global.capital(username);
    const password = `${username}00${vNum}`;

    try {
        const res = await fetch(`${panelConfig.domain}/api/application/users`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${panelConfig.apikey}`
            },
            body: JSON.stringify({
                email,
                username: username.toLowerCase(),
                first_name: name,
                last_name: `Admin V${vNum}`,
                root_admin: true,
                language: "en",
                password
            })
        });

        const data = await res.json();
        if (data.errors) {
            return { success: false, message: data.errors[0]?.detail || "Gagal membuat admin" };
        }

        const user = data.attributes;
        return {
            success: true,
            data: { id: user.id, username: user.username, email, password }
        };
    } catch (err) {
        return { success: false, message: err.message };
    }
}

async function updateApiKeys(updates) {
  const settingsPath = './setting.js';
  try {
    let fileContent = fs.readFileSync(settingsPath, 'utf8');
    updates.forEach(update => {
      const regex = new RegExp(`(global\\.${update.key}\\s*=\\s*)['"].*?['"]`);
      if (regex.test(fileContent)) {
        fileContent = fileContent.replace(regex, `$1'${update.value}'`);
      }
    });
    fs.writeFileSync(settingsPath, fileContent, 'utf8');
    return true;
  } catch (error) {
    console.error(chalk.red('❌ Gagal menyimpan API Key ke settings.js:', error));
    return false;
  }
}
// ─── Helper: Jalankan AutoJPM Channel ────────────────────────────────────────
async function runAutoJpmCh(config, listPath, sockRef) {
    if (global.autoJpmChRunning) return  // Cegah double-run
    global.autoJpmChRunning = true
    try {
        if (!fs.existsSync(listPath)) return
        let channelList = JSON.parse(fs.readFileSync(listPath))
        if (!channelList.length) return

        // Batasi jumlah channel jika jpmCount diset (0 = semua)
        const count = config.jpmCount > 0 ? config.jpmCount : channelList.length
        const targets = channelList.slice(0, count)

        let berhasil = 0
        let gagal = 0

        for (let ch of targets) {
            // Normalisasi: bisa string biasa atau object {id, pesan, media, mime}
            const chId = typeof ch === 'string' ? ch : (ch.id || null)
            if (!chId) { gagal++; continue }

            try {
                let content = {}
                const chMedia = typeof ch === 'object' ? ch.media : null
                const chMime  = typeof ch === 'object' ? ch.mime  : null
                const chPesan = typeof ch === 'object' ? ch.pesan : null

                if (chMedia && fs.existsSync(chMedia)) {
                    // Media per-channel
                    let buffer = fs.readFileSync(chMedia)
                    content = chMime === 'image'
                        ? { image: buffer, caption: chPesan || config.pesan || '' }
                        : { video: buffer, caption: chPesan || config.pesan || '', mimetype: 'video/mp4' }
                } else if (config.media && fs.existsSync(config.media)) {
                    // Media global dari autojpmch
                    let buffer = fs.readFileSync(config.media)
                    content = config.mime === 'image'
                        ? { image: buffer, caption: config.pesan || '' }
                        : { video: buffer, caption: config.pesan || '', mimetype: 'video/mp4' }
                } else {
                    // Teks saja
                    content = { text: chPesan || config.pesan || '' }
                }
                await sockRef.sendMessage(chId, content)
                berhasil++
                console.log(chalk.green(`  ✅ [AUTOJPMCH] Terkirim → ${chId}`))
                await new Promise(r => setTimeout(r, 4000))
            } catch (e) {
                gagal++
                console.log(chalk.yellow(`[AUTOJPMCH] Gagal kirim ke ${chId}: ${e.message}`))
            }
        }

        // Notifikasi selesai ke owner - hanya 1x per run
        const modeLabel = config.mode === 'interval'
            ? `Interval ${Math.round(config.intervalMs / 60000)} menit`
            : `Jadwal ${config.time} WIB`
        await sockRef.sendMessage(global.owner + "@s.whatsapp.net", {
            text: `*[ ✅ AutoJPM Channel Selesai ]*\n\nMode: ${modeLabel}\nTotal Channel: ${channelList.length}\nBerhasil: ${berhasil} ✅\nGagal: ${gagal} ❌`
        }).catch(() => {})
    } finally {
        global.autoJpmChRunning = false
    }
}

// ─── Scheduler AutoJPM Channel (sekali jalan, tidak duplikat) ────────────────
if (!global.autoJpmChStarted) {
    global.autoJpmChStarted = true
    setInterval(async () => {
        const dbPath = './data/autojpmch.json'
        const listPath = './data/list_channel.json'
        if (!fs.existsSync(dbPath) || !fs.existsSync(listPath)) return

        let config
        try { config = JSON.parse(fs.readFileSync(dbPath)) } catch { return }
        if (!config.status) return

        const mode = config.mode || 'jadwal'

        if (mode === 'jadwal') {
            // Mode jadwal: cocokkan jam:menit (abaikan detik agar lebih toleran)
            const now = new Date().toLocaleTimeString('en-GB', { hour12: false, timeZone: 'Asia/Jakarta' })
            const nowHHMM = now.substring(0, 5)
            const targetHHMM = (config.time || '').trim().substring(0, 5)
            if (nowHHMM === targetHHMM && !global.autoJpmChFired) {
                global.autoJpmChFired = true
                setTimeout(() => { global.autoJpmChFired = false }, 62000) // reset setelah 62 detik
                await runAutoJpmCh(config, listPath, sock)
            }
        } else if (mode === 'interval') {
            // Mode interval: cek selisih waktu dari lastRun
            const now = Date.now()
            const lastRun = config.lastRun || 0
            if (now - lastRun >= config.intervalMs) {
                // Langsung update lastRun sebelum eksekusi agar tidak dobel
                config.lastRun = now
                try { fs.writeFileSync(dbPath, JSON.stringify(config, null, 2)) } catch {}
                await runAutoJpmCh(config, listPath, sock)
            }
        }
    }, 1000)
}

if (global.autojoingc) {
  if (m.text && m.text.includes("chat.whatsapp.com/")) {
    let regex = /(chat\.whatsapp\.com\/(?:invite\/)?([0-9A-Za-z]{20,24}))/i;
    let [_, __, code] = m.text.match(regex) || [];
    if (code) {
      try {
        await sock.groupAcceptInvite(code);
      } catch (e) {
        // Bisa log error kalau mau: console.log("Autojoin failed:", e.message)
      }
    }
  }
}    

const FakeLocation = {
  key: {
    participant: '0@s.whatsapp.net',
    ...(m.chat ? { remoteJid: 'status@broadcast' } : {})
  },
  message: {
    locationMessage: {
      name: `Powered By ${global.namaOwner}.`,
      jpegThumbnail: ''
    }
  }
}

const FakeSticker = {
        key: {
            fromMe: false,
            participant: "0@s.whatsapp.net",
            remoteJid: "status@broadcast"
        },
        message: {
            stickerPackMessage: {
                stickerPackId: "\000",
                name: `Powered By ${global.namaOwner}.`,
                publisher: "kkkk"
            }
        }
    }


//=============================================//
const autojpmFile = "./data/autojpm.json";
global.sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
function saveAutoJpm(data) {
    try {
        fs.writeFileSync(autojpmFile, JSON.stringify(data, null, 2), "utf-8");
    } catch (err) {
        console.error("[AUTOJPM] Gagal menyimpan data:", err);
    }
}

function loadAutoJpm() {
    try {
        if (fs.existsSync(autojpmFile)) {
            const rawData = fs.readFileSync(autojpmFile, "utf-8");
            return JSON.parse(rawData);
        }
        return null;
    } catch (err) {
        console.error("[AUTOJPM] Gagal membaca data:", err);
        return null;
    }
}

function parseInterval(str) {
    const match = str.match(/(\d+)([a-zA-Z]+)/);
    if (!match) return -1;
    const val = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    const map = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    const full = { detik: 's', second: 's', menit: 'm', minute: 'm', jam: 'h', hour: 'h', hari: 'd', day: 'd' };
    return val * (map[full[unit] || unit] || 0);
}
//=============================================//
if (global.db.groups[m.chat]?.antilink === true) {
    const textMessage = m.text || ""
    const groupInviteLinkRegex = /(https?:\/\/)?(www\.)?chat\.whatsapp\.com\/[A-Za-z0-9]+(\?[^\s]*)?/gi
    const links = textMessage.match(groupInviteLinkRegex)
    if (links && !isOwner && !m.isAdmin && m.isBotAdmin) {
        const senderJid = m.sender
        const messageId = m.key.id
        const participantToDelete = m.key.participant || m.sender
        await sock.sendMessage(m.chat, {
            delete: {
                remoteJid: m.chat,
                fromMe: false,
                id: messageId,
                participant: participantToDelete
            }
        })
        await sleep(800)
        await sock.groupParticipantsUpdate(m.chat, [senderJid], "remove")
    }
}

if (global.db.groups[m.chat]?.antilink2 === true) {
    const textMessage = m.text || ""
    const groupInviteLinkRegex = /(https?:\/\/)?(www\.)?chat\.whatsapp\.com\/[A-Za-z0-9]+(\?[^\s]*)?/gi
    const links = textMessage.match(groupInviteLinkRegex)
    if (links && !isOwner && !m.isAdmin && m.isBotAdmin) {
        const messageId = m.key.id
        const participantToDelete = m.key.participant || m.sender
        await sock.sendMessage(m.chat, {
            delete: {
                remoteJid: m.chat,
                fromMe: false,
                id: messageId,
                participant: participantToDelete
            }
        })
    }
}

try {
    const filePath = "./data/autojoingrup.json"

    // Buat file JSON otomatis jika belum ada
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify({ status: false }, null, 2))
    }

    // Baca status dari file
    const { status } = JSON.parse(fs.readFileSync(filePath, "utf8"))

    // Kalau fitur aktif, cek link grup
    if (status) {
        const textMsg = m.text || m.body || ""
        const regex = /(https?:\/\/)?(www\.)?chat\.whatsapp\.com\/[A-Za-z0-9]+/gi
        const links = textMsg.match(regex)

        if (links && links.length > 0) {
            for (const link of links) {
                const inviteCode = link.split("https://chat.whatsapp.com/")[1]
                if (!inviteCode) continue

                try {
                    const res = await sock.groupAcceptInvite(inviteCode.trim())
                    console.log(`✅ [AUTOJOIN] Berhasil join ke grup: ${res}`)
                } catch (err) {
                    console.error(`❌ [AUTOJOIN] Gagal join ke ${link} | ${err.message}`)
                }

                // Delay kecil antar join biar aman
                await new Promise(resolve => setTimeout(resolve, 5000))
            }
        }
    }
} catch (err) {
    console.error("AutoJoin Error:", err)
}
// ====== SISTEM GRUP RESELLER PANEL ======
const grupResellerFile = './grupreseller.json';
let grupReseller = [];

if (fs.existsSync(grupResellerFile)) {
    grupReseller = JSON.parse(fs.readFileSync(grupResellerFile));
} else {
    fs.writeFileSync(grupResellerFile, JSON.stringify([]));
}

// Simpan data ke file
function saveGrupReseller() {
    fs.writeFileSync(grupResellerFile, JSON.stringify(grupReseller, null, 2));
}
//=============================================//

switch (command) {
case "mane":
case "menu": {
    let menu = MenuText.menuUtama(m.sender, sock, runtime)

    await sock.sendMessage(m.chat, {
        interactiveMessage: {
            title: menu, 
            footer: `© 2026 ${global.Dev} • Premium System`, 
            thumbnail: global.thumbnail2,
            nativeFlowMessage: {
                messageParamsJson: JSON.stringify({
                    limited_time_offer: {
                        text: `Special Version ${global.version}`,
                        url: "t.me/maneeofficiall",
                        copy_code: "PREMIUM-2026",
                        expiration_time: Date.now() * 999
                    },
                    bottom_sheet: {
                        in_thread_buttons_limit: 2,
                        divider_indices: [1, 2, 3, 4, 5, 999],
                        list_title: "Main Dashboard",
                        button_title: "Explore Menu 🔥"
                    },
                    tap_target_configuration: {
                        title: "Mane Official",
                        description: "Professional Bot Services",
                        canonical_url: "https://t.me/maneeofficiall",
                        domain: "shop.example.com",
                        button_index: 0
                    }
                }),
                buttons: [
                    {
                        name: "single_select",
                        buttonParamsJson: JSON.stringify({
                            title: "Support Info ⤵️",
                            sections: [
                                {
                                    title: "COMMUNITY & DEV ♻️",
                                    rows: [
                                        {
                                            title: "Saluran Developer", 
                                            description: "https://whatsapp.com/channel/0029VbB7WPzAYlUQFsoSwS0d",
                                            id: "row_1"
                                        },
                                        { 
                                            title: "Owner Contact",
                                            description: "https://wa.me/6289529161314",
                                            id: "row_2"
                                        }
                                    ]
                                }
                            ]
                        })
                    },
                    {
                        name: "cta_copy",
                        buttonParamsJson: JSON.stringify({
                            display_text: "Copy Owner Number 📋",
                            id: "123456789",
                            copy_code: "wa.me/6289529161314"
                        })
                    },
                    {
                        name: "quick_reply",
                        buttonParamsJson: JSON.stringify({ display_text: "All Menu 🕊", id: `.allmenu` })
                    },
                                        {
                        name: "quick_reply",
                        buttonParamsJson: JSON.stringify({ display_text: "All Menu Vid🎥", id: `.allmenuvid` })
                    },
                                        {
                        name: "quick_reply",
                        buttonParamsJson: JSON.stringify({ display_text: "Menu Ios📱", id: `.menuios` })
                    },
                                        {
                        name: "quick_reply",
                        buttonParamsJson: JSON.stringify({ display_text: "Kembali ke Menu🏠", id: `.menu` })
                    },
                                        {
                        name: "quick_reply",
                        buttonParamsJson: JSON.stringify({ display_text: "Contact 👑", id: `.developer` })
                    },
                                        {
                        name: "quick_reply",
                        buttonParamsJson: JSON.stringify({ display_text: "Tips penggunaan 💡", id: `.panduan` })
                    },
                    {
                        name: "quick_reply",
                        buttonParamsJson: JSON.stringify({ display_text: "Ping 🚀", id: `.ping` })
                    }
                ]
            }
        }
    }, { quoted: m });
    await sleep(1000)
    sock.sendMessage(m.chat, {
        audio: fs.readFileSync('./amaneofc/mane.mp3'),
        mimetype: 'audio/mp4',
        ptt: true
    }, { quoted: m })
}
break
case "tips":
case "panduan": {
    let menu = MenuText.menuPanduan(m.sender)

    await sock.sendMessage(m.chat, {
        interactiveMessage: {
            title: menu, 
            footer: `© 2026 ${global.Dev} • Premium System`, 
            thumbnail: global.thumbnail2,
            nativeFlowMessage: {
                messageParamsJson: JSON.stringify({
                    limited_time_offer: {
                        text: `Special Version ${global.version}`,
                        url: "t.me/maneeofficiall",
                        copy_code: "PREMIUM-2026",
                        expiration_time: Date.now() * 999
                    },
                    bottom_sheet: {
                        in_thread_buttons_limit: 2,
                        divider_indices: [1, 2, 3, 4, 5, 999],
                        list_title: "Main Dashboard",
                        button_title: "Explore Menu 🔥"
                    },
                    tap_target_configuration: {
                        title: "Mane Official",
                        description: "Professional Bot Services",
                        canonical_url: "https://t.me/maneeofficiall",
                        domain: "shop.example.com",
                        button_index: 0
                    }
                }),
                buttons: [
                    {
                        name: "single_select",
                        buttonParamsJson: JSON.stringify({
                            title: "Support Info ⤵️",
                            sections: [
                                {
                                    title: "COMMUNITY & DEV ♻️",
                                    rows: [
                                        {
                                            title: "Saluran Developer", 
                                            description: "https://whatsapp.com/channel/0029VbB7WPzAYlUQFsoSwS0d",
                                            id: "row_1"
                                        },
                                        { 
                                            title: "Owner Contact",
                                            description: "https://wa.me/6289529161314",
                                            id: "row_2"
                                        }
                                    ]
                                }
                            ]
                        })
                    },
                    {
                        name: "cta_copy",
                        buttonParamsJson: JSON.stringify({
                            display_text: "Copy Owner Number 📋",
                            id: "123456789",
                            copy_code: "wa.me/6289529161314"
                        })
                    },
                    {
                        name: "quick_reply",
                        buttonParamsJson: JSON.stringify({ display_text: "Coba Sekarang ⚡", id: `.allmenu` })
                    },
                    {
                        name: "quick_reply",
                        buttonParamsJson: JSON.stringify({ display_text: "Ping 🚀", id: `.ping` })
                    }
                ]
            }
        }
    }, { quoted: m });
    await sleep(1000)
    sock.sendMessage(m.chat, {
        audio: fs.readFileSync('./amaneofc/mane.mp3'),
        mimetype: 'audio/mp4',
        ptt: true
    }, { quoted: m })
}
break

case "allmenuvid": {
    await sock.sendMessage(m.chat, { react: { text: "🎬", key: m.key }});
    const fs = require('fs');
    const jimp = require('jimp');
    const os = require('os');

    const videoPath = './amaneofc/neon.mp4';
    const thumbnailPath = './amaneofc/neon.jpg';

    try {
        if (!fs.existsSync(videoPath) || !fs.existsSync(thumbnailPath)) {
            return m.reply("Error: File video/thumbnail tidak ditemukan.");
        }

        const videoBuffer = fs.readFileSync(videoPath);
        const image = await jimp.read(thumbnailPath);
        image.resize(300, jimp.AUTO).quality(90);
        const thumbnailBuffer = await image.getBufferAsync(jimp.MIME_JPEG);
        
        const menuCaption = MenuText.menuAllVidCaption(m.sender, sock);

        await sock.sendMessage(m.chat, {
            video: videoBuffer, 
            gifPlayback: true,
            caption: menuCaption,
            mentions: [m.sender],
            contextInfo: {
                forwardingScore: 1,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterName: `${global.namaOwner}`,
                    newsletterJid: `120363400297473298@newsletter`,
                },
                externalAdReply: {
                    title: `MANE STORE V${global.version}`,
                    body: `Status: Online & Ready!`,
                    thumbnail: thumbnailBuffer,
                    mediaType: 1,
                    renderLargerThumbnail: true,
                    sourceUrl: global.linkChannel,
                    mentionedJid: [m.sender]
                }
            }
        }, { quoted: m });

        if (fs.existsSync('./amaneofc/neon.mp3')) {
            await sock.sendMessage(m.chat, {
                audio: fs.readFileSync('./amaneofc/neon.mp3'),
                mimetype: 'audio/mp4',
                ptt: true,
            }, { quoted: m });
        }

    } catch (error) {
        console.error(error);
        m.reply(`Error: ${error.message}`);
    }
}
break;
case "amane":
case "allmenu": {
let menu = MenuText.menuAll(m.sender)

    await sock.sendMessage(m.chat, {
        interactiveMessage: {
            title: menu, 
            footer: `Premium Store Bot v${global.version}`, 
            thumbnail: global.thumbnail,
            nativeFlowMessage: {
                messageParamsJson: JSON.stringify({
                    limited_time_offer: {
                        text: "Premium Script Version",
                        url: "t.me/maneeofficiall",
                        copy_code: "2026",
                        expiration_time: Date.now() * 999
                    },
                    bottom_sheet: {
                        in_thread_buttons_limit: 2,
                        divider_indices: [1, 5, 999],
                        list_title: "Quick Action",
                        button_title: "Select Menu 🚀"
                    }
                }),
                buttons: [
                    { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "Ping Bot 🚀", id: `.ping` }) },
                    { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "Owner 👑", id: `.owner` }) },
                    { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "Back ↩️", id: `.menu` }) }
                ]
            }
        }
    }, { quoted: m });
    
    await sleep(1000)
    sock.sendMessage(m.chat, { audio: fs.readFileSync('./amaneofc/amane.mp3'), mimetype: 'audio/mp4', ptt: true }, { quoted: m })
}
break
case "menuios": {
    await sock.sendMessage(m.chat, { react: { text: "🍏", key: m.key }});
    const teks = MenuText.menuIos(m.sender, runtime);

    let msg = await generateWAMessageFromContent(m.chat, {
        viewOnceMessageV2: {
            message: {
                interactiveMessage: {
                    header: {
                        title: " Mane Store Premium",
                        hasMediaAttachment: true,
                        ...(await prepareWAMessageMedia({ image: { url: global.thumbnail }}, { upload: sock.waUploadToServer }))
                    },
                    body: { text: teks },
                    footer: { text: `Premium Experience` },
                    nativeFlowMessage: {
                        buttons: [
                            {
                                name: "cta_url",
                                buttonParamsJson: JSON.stringify({
                                    display_text: "Official Channel 📢",
                                    url: global.linkChannel,
                                    merchant_url: global.linkChannel
                                })
                            },
                            {
                                name: "quick_reply",
                                buttonParamsJson: JSON.stringify({ display_text: "All Menu 🔥", id: ".allmenu" })
                            },
                            {
                                name: "quick_reply",
                                buttonParamsJson: JSON.stringify({ display_text: "Owner 👑", id: ".owner" })
                            }
                        ]
                    },
                    contextInfo: {
                        mentionedJid: [m.sender],
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterName: "Amane Official Updates",
                            newsletterJid: global.idChannel
                        }
                    }
                }
            }
        }
    }, { userJid: m.sender, quoted: m });

    await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
    await sleep(1000)
    sock.sendMessage(m.chat, { audio: fs.readFileSync('./amaneofc/amane.mp3'), mimetype: 'audio/mp4', ptt: true }, { quoted: m });
}
break;
case "buypanel":
    case "belipanel": {
      if (dbTransaksi[m.sender]) return m.reply(`Masih ada transaksi yang belum selesai.\n*.batalbeli* untuk membatalkan`);
      if (!text) return m.reply(`Masukan username\n*Contoh :* ${cmd} amane`);
      if (args.length > 1) return m.reply("Username dilarang menggunakan spasi!");

      if (!text.includes("|")) {
  let usn = text.toLowerCase();
  const rows = [];

  for (const [key, val] of Object.entries(settingPanel)) {
    rows.push({
      title: `Ram ${val.ram} || Cpu ${val.cpu} || Disk ${val.disk}`,
      description: `Rp${val.price.toLocaleString("id-ID")}`,
      id: `.buypanel ${key}|${usn}`
    });
  }

        return sock.sendMessage(
          m.chat,
          {
            buttons: [
              {
                buttonId: "action",
                buttonText: { displayText: "Pilih RAM Panel" },
                type: 4,
                nativeFlowInfo: {
                  name: "single_select",
                  paramsJson: JSON.stringify({
                    title: "Pilih Ram Server",
                    sections: [{ highlight_label: "High Quality", rows }],
                  }),
                },
              },
            ],
            headerType: 1,
            viewOnce: true,
            text: `\nPilih ram server Panel Pterodactyl\n`,
            contextInfo: { isForwarded: true, mentionedJid: [m.sender] },
          },
          { quoted: m }
        );
      }

const [cmds, username] = text.split("|");
const key = cmds.toLowerCase();

const panel = settingPanel[key];
if (!panel) return m.reply("Pilihan paket panel tidak valid!");

const isUnlimited = key === "unlimited" || key === "unli";

const Obj = {
  username,
  ram: isUnlimited ? "0" : panel.ram.replace(/GB/i, "") * 1000 + "",
  disk: isUnlimited ? "0" : panel.disk.replace(/GB/i, "") * 1000 + "",
  cpu: isUnlimited ? "0" : panel.cpu.replace(/%/g, ""),
  harga:
    panel.price +
    (global.generateRandomNumber
      ? global.generateRandomNumber(110, 250)
      : 150),
};

      try {
        const qris = await createdQris(Obj.harga, {
          username: global.usernameOrderkuota,
          token: global.tokenOrderkuota,
        });

        const teks3 = `
*INFORMASI PEMBAYARAN*
- ID: *${qris.idtransaksi}*
- Total Pembayaran: *Rp${toRupiah(qris.jumlah)}*
- Barang: *Panel Pterodactyl (${Obj.ram == "0" ? "Unlimited" : Obj.ram / 1000 + "GB"})*
- Username: *${Obj.username}*
- Expired QRIS: *5 menit*
`;

        const msgQr = await sock.sendMessage(m.chat, {
          buttons: [
            { buttonId: `.batalbeli`, buttonText: { displayText: "Batalkan Pembelian" }, type: 1 },
          ],
          headerType: 1,
          viewOnce: true,
          image: { url: qris.imageqris },
          caption: teks3,
          contextInfo: { mentionedJid: [m.sender], isForwarded: true },
        });
        
        if (fs.existsSync(qris.imageqris)) fs.unlinkSync(qris.imageqris);

        dbTransaksi[m.sender] = {
          msg: msgQr,
          chat: m.sender,
          chatId: m.chat, 
          idDeposit: qris.idtransaksi,
          amount: qris.jumlah.toString(),
          panelData: Obj,
          ramKey: panel.ram,
          type: "panel",
          status: true,
          exp: setTimeout(async () => {
            if (dbTransaksi[m.sender] && dbTransaksi[m.sender].status) {
              await sock.sendMessage(dbTransaksi[m.sender].chatId, { text: "⚠️ QRIS Pembayaran Telah Expired.\nTransaksi Dibatalkan!" }, { quoted: dbTransaksi[m.sender].msg });
              await sock.sendMessage(dbTransaksi[m.sender].chatId, { delete: dbTransaksi[m.sender].msg.key });
              delete dbTransaksi[m.sender];
            }
          }, 300000),
        };

        while (dbTransaksi[m.sender] && dbTransaksi[m.sender].status) {
          await sleep(7000);
          const success = await cekStatus(sock, m.sender, {
            username: global.usernameOrderkuota,
            token: global.tokenOrderkuota,
          });

          if (success) {
            dbTransaksi[m.sender].status = false;
            clearTimeout(dbTransaksi[m.sender].exp);
            
          if (m.isGroup) sock.sendMessage(dbTransaksi[m.sender].chatId, {
              text: `\n✅ *PEMBAYARAN BERHASIL*\nData barang berhasil dikirim ke private chat.\n`
            }, { quoted: dbTransaksi[m.sender].msg });

            await sock.sendMessage(dbTransaksi[m.sender].chat, {
              text: `\n*PEMBAYARAN BERHASIL ✅*\n\n- ID: *${dbTransaksi[m.sender].idDeposit}*\n- Total: *Rp${toRupiah(dbTransaksi[m.sender].amount)}*\n- Barang: *Panel Pterodactyl*\n- Username: *${Obj.username}*\n`,
            }, { quoted: dbTransaksi[m.sender].msg });

            // Buat akun panel
            const result = await createPanelAccount(Obj.username, panel.ram);
            
            if (result.success) {
              const panel = result.data;
              const detail = `
*Berikut detail akun panel kamu*

*📡 Server ID:* ${panel.serverId}
*👤 Username:* ${panel.username}
*🔐 Password:* ${panel.password}
*📧 Email:* ${panel.email}
*🗓️ Aktivasi:* ${tanggal()}

⚙️ *Spesifikasi*
- RAM: ${panel.ram}
- DISK: ${panel.disk}
- CPU: ${panel.cpu}
- Panel: ${panel.panelUrl}

*Syarat & Ketentuan Pembelian*  
- Masa aktif 30 hari  
- Garansi 15 hari (1x replace)  
- Simpan data ini baik-baik
`;

              let msg = await generateWAMessageFromContent(dbTransaksi[m.sender].chat, {
                  viewOnceMessage: {
                      message: {
                          interactiveMessage: {
                              body: { text: detail },
                              nativeFlowMessage: {
                                  buttons: [
                                      { 
                                          name: "cta_copy",
                                          buttonParamsJson: `{"display_text":"Copy Username","copy_code":"${panel.username}"}`
                                      },
                                      { 
                                          name: "cta_copy",
                                          buttonParamsJson: `{"display_text":"Copy Password","copy_code":"${panel.password}"}`
                                      },
                                      { 
                                          name: "cta_url",
                                          buttonParamsJson: `{"display_text":"Login Panel","url":"${panel.panelUrl}"}`
                                      }
                                  ]
                              }
                          }
                      }
                  }
              }, {});

              await sock.relayMessage(dbTransaksi[m.sender].chat, msg.message, { messageId: msg.key.id });
              
              addTransaction({
                type: 'panel',
                userId: m.sender,
                amount: Obj.harga,
                paymentId: dbTransaksi[m.sender].idDeposit,
                status: 'success',
                description: `Panel ${panel.ram} ${panel.username}`,
                details: {
                  username: panel.username,
                  serverId: panel.serverId,
                  ram: panel.ram,
                  disk: panel.disk,
                  cpu: panel.cpu
                }
              });
            } else {
              await sock.sendMessage(dbTransaksi[m.sender].chat, {
                text: `❌ Gagal membuat panel: ${result.message}\n\nSilakan hubungi admin untuk bantuan.`
              }, { quoted: dbTransaksi[m.sender].msg });
              
              addTransaction({
                type: 'panel',
                userId: m.sender,
                amount: Obj.harga,
                paymentId: dbTransaksi[m.sender].idDeposit,
                status: 'failed',
                description: `Panel Buyer Panel`,
                error: result.message
              });
            }
            
            await sock.sendMessage(dbTransaksi[m.sender].chatId, { delete: dbTransaksi[m.sender].msg.key });
            delete dbTransaksi[m.sender];
          }
        }
      } catch (err) {
        console.error(err);
        m.reply("Terjadi kesalahan saat memproses pembayaran.");
      }
    }
    break;

    // ===================== BUYADMIN =====================
    case "buyadmin":
    case "beliadmin": {
      if (dbTransaksi[m.sender]) return m.reply(`Masih ada transaksi yang belum selesai.\n*.batalbeli* untuk membatalkan`);
      if (!text) return m.reply(`Masukan username\n*Contoh :* ${cmd} skyzopedia`);
      
      const hargaAdmin = settingAdp || 15000;
      const username = text.toLowerCase();
      
      try {
        const qris = await createdQris(hargaAdmin, {
          username: global.usernameOrderkuota,
          token: global.tokenOrderkuota,
        });

        const teks3 = `
*INFORMASI PEMBAYARAN*
- ID: *${qris.idtransaksi}*
- Total Pembayaran: *Rp${toRupiah(qris.jumlah)}*
- Barang: *Admin Panel Pterodactyl*
- Username: *${username}*
- Expired QRIS: *5 menit*
`;

        const msgQr = await sock.sendMessage(m.chat, {
          buttons: [
            { buttonId: `.batalbeli`, buttonText: { displayText: "Batalkan Pembelian" }, type: 1 },
          ],
          headerType: 1,
          viewOnce: true,
          image: { url: qris.imageqris },
          caption: teks3,
          contextInfo: { mentionedJid: [m.sender], isForwarded: true },
        });
        
        if (fs.existsSync(qris.imageqris)) fs.unlinkSync(qris.imageqris);

        dbTransaksi[m.sender] = {
          msg: msgQr,
          chat: m.sender,
          idDeposit: qris.idtransaksi,
          amount: qris.jumlah.toString(),
          adminData: { username },
          type: "admin",
          status: true,
          exp: setTimeout(async () => {
            if (dbTransaksi[m.sender] && dbTransaksi[m.sender].status) {
              await sock.sendMessage(dbTransaksi[m.sender].chatId, { text: "⚠️ QRIS Pembayaran Telah Expired.\nTransaksi Dibatalkan!" }, { quoted: dbTransaksi[m.sender].msg });
              await sock.sendMessage(dbTransaksi[m.sender].chatId, { delete: dbTransaksi[m.sender].msg.key });
              delete dbTransaksi[m.sender];
            }
          }, 300000),
        };

        while (dbTransaksi[m.sender] && dbTransaksi[m.sender].status) {
          await sleep(7000);
          const success = await cekStatus(sock, m.sender, {
            username: global.usernameOrderkuota,
            token: global.tokenOrderkuota,
          });

          if (success) {
            dbTransaksi[m.sender].status = false;
            clearTimeout(dbTransaksi[m.sender].exp);

            // Create admin account
            const result = await createAdminAccount(username);
            
            if (result.success) {
              const admin = result.data;
              const detail = `
*Admin Panel Berhasil Dibuat ✅*

*👤 Username:* ${admin.username}
*🔐 Password:* ${admin.password}
*📧 Email:* ${admin.email}
*🔑 Root Admin:* ✅
*🌐 Panel URL:* ${admin.panel}
*🆔 User ID:* ${admin.id}

*Cara Login:*
1. Buka ${admin.panel}
2. Masukkan email atau username
3. Masukkan password di atas
4. Tekan tombol login

*Note:* Simpan data ini dengan baik!
`;

              await sock.sendMessage(dbTransaksi[m.sender].chat, {
                text: detail
              }, { quoted: dbTransaksi[m.sender].msg } );

              addTransaction({
                type: 'admin',
                userId: m.sender,
                amount: hargaAdmin,
                paymentId: dbTransaksi[m.sender].idDeposit,
                status: 'success',
                description: `Admin Panel ${admin.username}`,
                details: {
                  username: admin.username,
                  userId: admin.id,
                  isAdmin: true
                }
              });
            } else {
              await sock.sendMessage(dbTransaksi[m.sender].chat, {
                text: `❌ Gagal membuat admin: ${result.message}\n\nSilakan hubungi admin untuk bantuan.`
              }, { quoted: dbTransaksi[m.sender].msg });
              
              addTransaction({
                type: 'admin',
                userId: m.sender,
                amount: hargaAdmin,
                paymentId: dbTransaksi[m.sender].idDeposit,
                status: 'failed',
                description: `Admin Panel ${username}`,
                error: result.message
              });
            }
            
            await sock.sendMessage(dbTransaksi[m.sender].chatId, { delete: dbTransaksi[m.sender].msg.key });
            delete dbTransaksi[m.sender];
          }
        }
      } catch (err) {
        console.error(err);
        m.reply("Terjadi kesalahan saat memproses pembayaran.");
      }
    }
    break;
    case "batalbeli": {
      if (dbTransaksi[m.sender]) {
        clearTimeout(dbTransaksi[m.sender].exp);
        try {
          await sock.sendMessage(dbTransaksi[m.sender].chat, { 
            delete: dbTransaksi[m.sender].msg.key 
          });
        } catch {}
        delete dbTransaksi[m.sender];
        return m.reply("✅ Transaksi dibatalkan.");
      } else {
        return
      }
    }
    break;
case "rvo": case "readviewonce": {
if (!m.quoted) return m.reply(`Balas pesan sekali lihat dengan ketik *${cmd}*`)
let msg = m.quoted.message
if (!msg.viewOnce && m.quoted.mtype !== "viewOnceMessageV2") return m.reply("Pesan itu bukan sekali lihat!")
    let mesages = m.quoted.message?.videoMessage || m.quoted.message?.imageMessage || m.quoted.message?.audioMessage || ""
    let type = m.quoted.message?.imageMessage ? "image" : m.quoted.message?.videoMessage ? "video" : m.quoted.message?.audioMessage ? "audio" : ""
let media = await downloadContentFromMessage(mesages, type)
    let buffer = Buffer.from([])
    for await (const chunk of media) {
        buffer = Buffer.concat([buffer, chunk])
    }
    const cap = mesages?.caption ? `*Caption:* ${mesages.caption}` : ""
    if (/video/.test(type)) {
        await sock.sendMessage(m.chat, {video: buffer, caption: cap}, {quoted: m})
    } else if (/image/.test(type)) {
        await sock.sendMessage(m.chat, {image: buffer, caption: cap}, {quoted: m})
    } else if (/audio/.test(type)) {
        await sock.sendMessage(m.chat, {audio: buffer, mimetype: "audio/mpeg", ptt: true}, {quoted: m})
    }
    
}
break
case 'hd':
case 'remini':
case 'hdr': {
if (!quoted) return m.reply(`📸 Reply gambar atau video dengan perintah *${prefix + command}*`)

const mime = quoted.mimetype || ''
if (/video/.test(mime)) {

try {
await m.reply('bentar lagi diproses🕓');

let buffer = await quoted.download()
let resultUrl = await hdvideo(buffer)

await sock.sendMessage(m.chat, {
video: { url: resultUrl },
caption: global.mess.success
}, { quoted: m })

} catch (error) {
console.error(error)
m.reply(global.mess.error.fitur)
}

} else if (/image/.test(mime) || /webp/.test(mime)) {

try {
const buffer = await quoted.download()
let result = await hdr(buffer, 4)

await sock.sendMessage(m.chat, {
image: result,
caption: global.mess.success
}, { quoted: m })

} catch (e) {
console.error(e)
m.reply(global.mess.error.fitur)
}

} else {
m.reply("❗ Format tidak didukung. Harap reply gambar atau video.")
}
}
break
case 'play':
case 'ytplay': {
    const yts = require('yt-search');

    if (!text) return m.reply(`Masukkan judul video!\n\nContoh:\n${cmd} lathi`);

    const search = await yts(text);
    if (!search.videos || search.videos.length === 0) {
        return m.reply('❌ Tidak ada hasil yang ditemukan.');
    }

    const video = search.videos[0]; // Ambil video pertama
    const title = video.title;
    const channel = video.author.name;
    const publishedAt = video.ago;
    const thumbnail = video.thumbnail;
    const videoUrl = video.url;

    const caption = `
🌟✨ *YOUTUBE MAGIC PLAYER* ✨🌟

📣 *JUDUL:* _${title}_
🏷️ *CHANNEL:* _${channel}_
🗓️ *RILIS:* _${publishedAt}_

🎉 Pilih mode unduhan:
🔊 *Audio Only* 🎧
🎥 *Full Video* 🎞️
`.trim();

    const buttons = [
        {
            buttonId: `.ytmp3 ${videoUrl}`,
            buttonText: { displayText: 'Audio 🎧' },
            type: 1
        },
        {
            buttonId: `.ytmp4 ${videoUrl}`,
            buttonText: { displayText: 'Video 🎞️' },
            type: 1
        }
    ];

    await sock.sendMessage(m.chat, {
        image: { url: thumbnail },
        caption,
        footer: global.Dev,
        buttons,
        headerType: 4
    }, { quoted: m });
}
break;
case "ytmp4": {
    if (!text || !text.includes("https://")) return m.reply(`*ex:* ${cmd} https://youtu.be/xxx`)

    try { 
        const url = text.trim()
        const data = await fetchJson(`https://api.skyzopedia.web.id/download/ytdl-mp4?apikey=skyy&url=${url}`)
        await m.reply("Sedang memproses video... 🔄")        
        if (!data?.result?.download) return m.reply("Error! data vidio tidak ditemukan.")       
        await sock.sendMessage(
            m.chat,
            {
                video: { url: data.result.download },
                mimetype: "video/mp4"
            },
            { quoted: m }
        )

    } catch (err) {
        console.log(err)
        m.reply("Error! Terjadi kesalahan saat mengambil video")
    }
}
break

case "ytmp3": {
    if (!text || !text.includes("https://")) return m.reply(`*ex:* ${cmd} https://youtu.be/xxx`)
    try {        
        let url = text.trim()
        await m.reply("Sedang memproses audio... 🔄")
        const data = await fetchJson(`https://api.skyzopedia.web.id/download/ytdl-mp3?apikey=skyy&url=${url}`)        
        if (!data?.result?.download) return m.reply("Error! data audio tidak ditemukan.")

        await sock.sendMessage(
            m.chat,
            {
                audio: { url: data.result.download },
                mimetype: "audio/mpeg",
                ptt: false
            },
            { quoted: m }
        )

    } catch (err) {
        console.log(err)
        m.reply("Error! Terjadi kesalahan saat mengambil audio")
    }
}
break;
case "ping": {
const os = require('os');
  const nou = require('node-os-utils');
  const speed = require('performance-now');

  async function getServerInfo(m) {
    const timestamp = speed();
    const tio = await nou.os.oos();
    const tot = await nou.drive.info();
    const memInfo = await nou.mem.info();
    const totalGB = (memInfo.totalMemMb / 1024).toFixed(2);
    const usedGB = (memInfo.usedMemMb / 1024).toFixed(2);
    const freeGB = (memInfo.freeMemMb / 1024).toFixed(2);
    const cpuCores = os.cpus().length;
    const vpsUptime = runtime(os.uptime());
    const botUptime = runtime(process.uptime());
    const latency = (speed() - timestamp).toFixed(4);
    const respon = `
*-- Server Information*
 • OS Platform: ${nou.os.type()}
 • RAM: ${usedGB}/${totalGB} GB used (${freeGB} GB free)
 • Disk Space: ${tot.usedGb}/${tot.totalGb} GB used
 • CPU Cores: ${cpuCores} Core(s)
 • VPS Uptime: ${vpsUptime}

*-- Bot Information*
 • Response Time: ${latency} sec
 • Bot Uptime: ${botUptime}
 • CPU: ${os.cpus()[0].model}
 • Architecture: ${os.arch()}
 • Hostname: ${os.hostname()}
`;
    return m.reply(respon);
  }

  return getServerInfo(m);
}
break
case "bratvid":
case "neon": {
if (!text) return m.reply(`*Contoh:* ${cmd} hallo aku Amane!`)
var media = await getBuffer(`https://api.siputzx.my.id/api/m/brat?text=${text}&isAnimated=true&delay=500`)
await sock.sendStimg(m.chat, media, m, {packname: "YT Amane Ofc"})
}
break
case "openai": case "ai": {
    if (!text) return m.reply(`*Contoh :* ${cmd} jelaskan apa itu javascript`);
    const result = await aiChat("", text, "openai/gpt-oss-120b")
    return m.reply(result)
}
break
case "hdvid":
case "tohdvid":
case "hdvidio":
case "hdvideo": {
  if (!/video/.test(mime)) 
        return m.reply(`Vidio tidak ditemukan!\nKetik *${cmd}* dengan reply/kirim Vidio`)
  await m.reply(`Memproses Peningkatan Kualitas Vidio ⏳`)
  let media = await m.quoted ? await m.quoted.download() : await m.download()
let video = Math.floor(Math.random() * 100) + 1;
  const inputFilePath = `./input${video}.mp4`;
  fs.writeFileSync(inputFilePath, media)
  const outputFilePath = `./output${video}.mp4`;
  const dir = './';
  if (!fs.existsSync(dir)){
      fs.mkdirSync(dir)
  }

  const ffmpegCommand = `ffmpeg -i ${inputFilePath} -vf "hqdn3d=1.5:1.5:6:6,unsharp=3:3:0.6,eq=brightness=0.05:contrast=1.1:saturation=1.06" -vcodec libx264 -preset slower -crf 22 -acodec copy -movflags +faststart ${outputFilePath}`;

  exec(ffmpegCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`)
      return
    }
    console.log(`stdout: ${stdout}`)
    console.error(`stderr: ${stderr}`)
    sock.sendMessage(m.chat, { caption: `Berhasil HD Vidio ✅`, video: { url: outputFilePath } }, { quoted: m })
    fs.unlinkSync(inputFilePath)
  })
}
break
case "pinterest":
case "pin": {
    if (!text) return m.reply(`*Contoh penggunaan:*\n${cmd} gojo\n\nCari gambar dari Pinterest menggunakan APIKEY.`)

    try {
        const query = text.trim()
        await m.reply(`🔍 Mencari gambar *${query}* di Pinterest...`)

        const apiUrl = `https://sitesfyxzpedia-api.vercel.app/search/pinterest?apikey=Fyxz&q=${encodeURIComponent(query)}`
        const res = await axios.get(apiUrl)
        const data = res.data

        if (!data.result || data.result.length === 0) {
            return m.reply(`❌ Tidak ditemukan gambar untuk kata kunci *${query}*.`)
        }

        // Ambil gambar random dari hasil API
        const randomImg = data.result[Math.floor(Math.random() * data.result.length)]

        await sock.sendMessage(m.chat, {
            image: { url: randomImg },
            caption: `✨ *Hasil Pencarian Pinterest*\n\n🔎 Kata Kunci: *${query}*\n📸 Sumber: Pinterest`
        }, { quoted: m })

    } catch (err) {
        console.error("Pinterest Error:", err)
        m.reply("❌ Gagal mencari gambar di Pinterest.\nCoba lagi nanti atau periksa API.")
    }
}
break;
case "tt": case "tiktok": case "ttdl": {
if (!text) return m.reply(`*Contoh :* ${cmd} link`)
if (!text.startsWith("https://")) return m.reply(`*Contoh :* ${cmd} link`)
const res = await tiktok(`${text}`)
if (!res.data) return m.reply("Error! result tidak ditemukan")
if (res.data.images && res.data.images.length !== 0) {
let album = []
for (let i of res.data.images) {
album.push({ image: { url: i }, caption: "Tiktok Slide Downloader ✅" })
}
await sock.sendMessage(m.chat, {album: album}, {quoted: m})
} else {
await sock.sendMessage(m.chat, {video: {url: res.data.hdplay || res.result.data.play}, caption: "Tiktok Downloader ✅"}, { quoted: m})
}
if (res.data.music) {
await sock.sendMessage(m.chat, {audio: {url: res.data.music}, mimetype: "audio/mpeg", ptt: false}, {quoted: m})
}
}
break
case 'addcase': {
          if (!isOwner) return m.reply(mess.owner);
          if (!text) return m.reply(`Contoh: ${cmd}case`);
          const namaFile = path.join(__dirname, 'Amane.js');
          const caseBaru = `${text}\n\n`;
          const tambahCase = (data, caseBaru) => {
            const posisiDefault = data.lastIndexOf("default:");
            if (posisiDefault !== -1) {
              const kodeBaruLengkap = data.slice(0, posisiDefault) + caseBaru + data.slice(posisiDefault);
              return {
                success: true,
                kodeBaruLengkap
              };
            } else {
              return {
                success: false,
                message: "Tidak dapat menemukan case default di dalam file!"
              };
            }
          };
          fs.readFile(namaFile, 'utf8', (err, data) => {
            if (err) {
              console.error('Terjadi kesalahan saat membaca file:', err);
              return m.reply(`Terjadi kesalahan saat membaca file: ${err.message}`);
            }
            const result = tambahCase(data, caseBaru);
            if (result.success) {
              fs.writeFile(namaFile, result.kodeBaruLengkap, 'utf8', (err) => {
                if (err) {
                  console.error('Terjadi kesalahan saat menulis file:', err);
                  return m.reply(`Terjadi kesalahan saat menulis file: ${err.message}`);
                } else {
                  console.log('Sukses menambahkan case baru:');
                  console.log(caseBaru);
                  return m.reply('Sukses menambahkan case!');
                }
              });
            } else {
              console.error(result.message);
              return m.reply(result.message);
            }
          });
        }
        break
case "listidgrup": {
    if (!isOwner) return m.reply(mess.owner);

    try {
        const allGroups = await sock.groupFetchAllParticipating();
        const groupIds = Object.keys(allGroups);

        if (groupIds.length < 1) return m.reply("❌ Bot tidak sedang bergabung di grup manapun.");

        let teks = "📋 *Daftar ID Grup yang Bot Ikuti:*\n\n";
        let no = 1;

        for (const id of groupIds) {
            const name = allGroups[id]?.subject || "Tidak diketahui";
            teks += `${no++}. ${name}\n🆔 ${id}\n\n`;
        }

        await m.reply(teks.trim());
    } catch (err) {
        console.error("ListIDGrup Error:", err);
        m.reply("❌ Terjadi kesalahan saat mengambil daftar grup.");
    }
}
break;
case "ssweb": {
    if (!text) return m.reply(`*Contoh penggunaan:*\n${cmd} https://google.com`)
    
    try {
        const targetUrl = text.trim()
        if (!targetUrl.startsWith("http")) return m.reply("❌ URL tidak valid! Harus diawali dengan http:// atau https://")

        await m.reply("⏳ Sedang mengambil screenshot website...")

        const apiUrl = `https://sitesfyxzpedia-api.vercel.app/tools/ssweb?apikey=Fyxz&url=${encodeURIComponent(targetUrl)}`
        const res = await axios.get(apiUrl, { responseType: "arraybuffer" })
        const buffer = Buffer.from(res.data)

        await sock.sendMessage(m.chat, {
            image: buffer,
            caption: `✅ Screenshot berhasil diambil!\n\n🌐 URL: ${targetUrl}\n📸 Powered by Amane API`
        }, { quoted: m })

    } catch (err) {
        console.error("SSWeb Error:", err)
        m.reply("❌ Gagal mengambil screenshot website.\nPeriksa URL atau coba lagi nanti.")
    }
}
break;

// Case tagsw
// Tambahkan case ini di dalam switch (command) pada file Amane.js

case "swgrupall":
case "swgall":
case "statusall": {
    if (!isOwner) return m.reply(mess.owner);
    
    try {
        // Ambil semua grup yang diikuti bot
        const allGroups = await sock.groupFetchAllParticipating();
        const groupIds = Object.keys(allGroups);
        
        if (groupIds.length < 1) {
            return m.reply("❌ Bot tidak sedang bergabung di grup manapun.");
        }
        
        // Konfirmasi jumlah grup
        await m.reply(`📢 *Mempersiapkan Status ke ${groupIds.length} Grup*\n\n` +
                     `📝 *Pesan:* ${text || '(tanpa teks)'}\n` +
                     `📎 *Media:* ${/image|video/.test(mime) ? '✅ Ada' : '❌ Tidak ada'}\n\n` +
                     `⏳ Proses akan dimulai...`);
        
        // Tentukan konten yang akan dikirim
        let content;
        let successCount = 0;
        let failCount = 0;
        let mediaBuffer = null;
        let mediaType = null;
        
        // Jika ada media (gambar/video) yang di-reply
        if (/image|video/.test(mime)) {
            mediaBuffer = await qmsg.download();
            mediaType = /image/.test(mime) ? 'image' : 'video';
            
            content = mediaType === 'image' 
                ? { image: mediaBuffer, caption: text || '' }
                : { video: mediaBuffer, caption: text || '' };
        } else {
            // Hanya teks
            content = { text: text || '📢 *Status Grup All*\n\nPesan dari bot' };
        }
        
        // Kirim ke semua grup
        for (const groupId of groupIds) {
            try {
                // Kirim sebagai status grup
                await sock.sendMessage(groupId, {
                    groupStatusMessage: content
                }, { quoted: m });
                
                successCount++;
                console.log(`✅ Status terkirim ke grup: ${allGroups[groupId]?.subject || groupId}`);
                
                // Delay antar pengiriman biar aman
                await sleep(3000);
                
            } catch (err) {
                failCount++;
                console.error(`❌ Gagal kirim ke ${groupId}:`, err.message);
            }
        }
        
        // Laporan hasil
        let resultMsg = `📊 *Laporan Pengiriman Status Grup*\n\n` +
                       `✅ Berhasil: ${successCount} grup\n` +
                       `❌ Gagal: ${failCount} grup\n` +
                       `📋 Total grup: ${groupIds.length}\n\n`;
        
        if (successCount > 0) {
            resultMsg += `✨ Status berhasil dikirim ke semua grup!`;
        } else {
            resultMsg += `⚠️ Tidak ada status yang terkirim.`;
        }
        
        await m.reply(resultMsg);
        
    } catch (err) {
        console.error("Error SW Grup All:", err);
        m.reply(`❌ Terjadi kesalahan: ${err.message}`);
    }
}
break;

 case "swtaggc": {
    if (!isOwner) return m.reply(mess.owner)
    if (!text) return m.reply(`*Contoh :* ${cmd} 1203630xxxxx@g.us\n\nBisa dengan caption & reply media juga`)

    const groupId = text.trim()
    try {
        const meta = await sock.groupMetadata(groupId)
        const participants = meta.participants.map(p => p.id)
        const caption = `📢 *Status Mention Grup*\n\n👥 Grup: ${meta.subject}\n🆔 ${groupId}\n\n${m.text || ""}`

        let content

        if (/image|video/.test(mime)) {
            const mediaPath = await sock.downloadAndSaveMediaMessage(qmsg)
            const buffer = fs.readFileSync(mediaPath)
            const isVideo = /video/.test(mime)

            content = isVideo
                ? { video: buffer, caption, mentions: participants }
                : { image: buffer, caption, mentions: participants }

            await sock.sendMessage("status@broadcast", content)
            fs.unlinkSync(mediaPath)
        } else {
            content = { text: caption, mentions: participants }
            await sock.sendMessage("status@broadcast", content)
        }

        await m.reply(`✅ Berhasil upload status dengan tag semua member dari grup *${meta.subject}*`)
    } catch (err) {
        console.error("SWTagGC Error:", err)
        m.reply(`❌ Gagal upload status.\nCek kembali ID grup atau coba lagi.\n\nError: ${err.message}`)
    }
}
break;

case 'upstatuswa':
        case 'upstatusgc':
        case 'gcsw':
        case 'upsw':
        case 'upswgc': {
          if (!m.isGroup) return m.reply('⚠️ Command ini hanya bisa digunakan di dalam grup!');
          if (!isOwner) return m.reply(mess.owner);

          try {
            const quotedMsg = m.quoted ? m.quoted : m
            const caption = text || quotedMsg.text || ''
            let payload

            if (/image/.test(mime)) {
              const buffer = await quotedMsg.download()
              payload = {
                groupStatusMessage: {
                  image: buffer,
                  caption: caption || ''
                }
              }
            } else if (/video/.test(mime)) {
              const buffer = await quotedMsg.download()
              payload = {
                groupStatusMessage: {
                  video: buffer,
                  caption: caption || ''
                }
              }
            } else if (/audio/.test(mime)) {
              const buffer = await quotedMsg.download()
              payload = {
                groupStatusMessage: {
                  audio: buffer,
                  mimetype: 'audio/mp4'
                }
              }
            } else if (caption) {
              payload = {
                groupStatusMessage: {
                  text: caption
                }
              }
            } else {
              return await m.reply(
                `Balas media atau tambahkan teks.\n\nContoh:\n${prefix + command} (reply image/video/audio) Halo semuanya!`
              )
            }

            await sock.sendMessage(m.chat, payload, {
              quoted: m
            })
            await m.reply('✅ Status grup berhasil dikirim.')
          } catch (err) {
            console.error('Error saat kirim status grup:', err)
            await m.reply('❌ Terjadi kesalahan saat mengirim status grup.')
          }
        }
        break
        

// 🟣 Tambah Grup Reseller
case 'addgrupreseller': {
    if (!isOwner) return m.reply('❌ Hanya owner yang bisa menambahkan grup reseller!');
    if (!m.isGroup) return m.reply('⚠️ Command ini hanya bisa digunakan di dalam grup!');

    if (grupReseller.includes(m.chat)) return m.reply('✅ Grup ini sudah terdaftar sebagai *Grup Reseller Panel*!');

    grupReseller.push(m.chat);
    saveGrupReseller();

    m.reply('✅ Grup ini berhasil ditambahkan sebagai *Grup Reseller Panel*!');
}
break;

// 🔴 Hapus Grup Reseller
case 'delgrupreseller': {
    if (!isOwner) return m.reply('❌ Hanya owner yang bisa menghapus grup reseller!');
    if (!m.isGroup) return m.reply('⚠️ Command ini hanya bisa digunakan di dalam grup!');

    if (!grupReseller.includes(m.chat)) return m.reply('❌ Grup ini belum terdaftar sebagai grup reseller.');

    grupReseller = grupReseller.filter(g => g !== m.chat);
    saveGrupReseller();

    m.reply('🗑️ Grup ini berhasil dihapus dari daftar *Grup Reseller Panel*.');
}
break;

// 📋 Daftar Grup Reseller
case 'listgrupreseller': {
    if (!isOwner) return m.reply('❌ Hanya owner yang bisa melihat daftar grup reseller!');
    if (grupReseller.length === 0) return m.reply('📭 Belum ada grup reseller yang terdaftar.');

    let teks = '📋 *Daftar Grup Reseller Panel:*\n\n';
    let no = 1;
    for (let id of grupReseller) {
        const name = await sock.groupMetadata(id).then(v => v.subject).catch(() => 'Grup tidak ditemukan');
        teks += `${no++}. ${name}\n🆔 ${id}\n\n`;
    }
    m.reply(teks.trim());
}
break;
//======================//
case "delsampahbot": {
    if (!isOwner) return m.reply(mess.owner);

    const dir = "./Amane";
    const keepFiles = ["creds.json", "app-state.json", "session.data.json"]; // file penting jangan dihapus

    if (!fs.existsSync(dir)) return m.reply("⚠️ Folder session tidak ditemukan.");

    let deleted = 0;
    let failed = 0;

    function deleteFolderRecursive(path) {
        if (fs.existsSync(path)) {
            fs.readdirSync(path).forEach((file) => {
                const curPath = path + "/" + file;
                try {
                    if (fs.lstatSync(curPath).isDirectory()) {
                        deleteFolderRecursive(curPath);
                        if (!keepFiles.includes(file)) {
                            fs.rmdirSync(curPath, { recursive: true });
                        }
                    } else if (!keepFiles.includes(file)) {
                        fs.unlinkSync(curPath);
                        deleted++;
                    }
                } catch (err) {
                    console.error("❌ Error hapus:", err);
                    failed++;
                }
            });
        }
    }

    deleteFolderRecursive(dir);

    m.reply(`🧹 *Pembersihan Selesai!*\n\n✅ File terhapus: ${deleted}\n⚠️ Gagal hapus: ${failed}\n\nKoneksi bot tetap aman ✨`);
}
break;
 
case "autojoingrup": {
    if (!isOwner) return m.reply(mess.owner)
    if (!text) return m.reply(`*Contoh :* ${cmd} on/off`)

    const filePath = "./data/autojoingrup.json"

    // Buat file otomatis kalau belum ada
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify({ status: false }, null, 2))
    }

    let data = JSON.parse(fs.readFileSync(filePath, "utf8"))

    if (/on/i.test(text)) {
        if (data.status) return m.reply("⚠️ Auto Join Grup sudah aktif.")
        data.status = true
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
        return m.reply("✅ Auto Join Grup berhasil diaktifkan (mode diam).")
    }

    if (/off/i.test(text)) {
        if (!data.status) return m.reply("⚠️ Auto Join Grup sudah nonaktif.")
        data.status = false
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
        return m.reply("✅ Auto Join Grup berhasil dimatikan.")
    }

    return m.reply(`Gunakan format:\n• ${cmd} on\n• ${cmd} off`)
}
break;

case "autojoingc": {
    if (!isOwner) return m.reply(mess.owner)
    if (!text) return m.reply(`ketik dengan benar!! contoh ${cmd} on`)

    let input = text.trim().toLowerCase()
    if (input === "on") {
    if (global.autojoingc) return m.reply("*Autojoingc* Sudah Aktif")
        global.autojoingc = true
        m.reply("✅ Fitur Auto Join GC berhasil diaktifkan.")
    } else if (input === "off") {
    if (global.autojoingc) return m.reply("*Autojoingc* Sudah Tidak Aktif!")
        global.autojoingc = false
        m.reply("✅ Fitur Auto Join GC berhasil dimatikan.")
    } else {
        return m.chat("on/off")
    }
}
break

case "setjpm": {
    if (!isOwner) return m.reply(mess.owner);
    if (!text.includes("|")) return m.reply(`*Contoh penggunaan :*\nketik ${cmd} pesan|1jam bisa dengan foto juga\n\nFormat waktu yang tersedia:\n- jam\n- menit`);

    const allGroups = await sock.groupFetchAllParticipating();
    const groupIds = Object.keys(allGroups);
    if (groupIds.length < 1) return m.reply("Tidak ada grup WhatsApp yang tersedia.");

    const [messageText, timeText] = text.split("|").map(x => x.trim());
    const intervalMs = parseInterval(timeText);
    if (!messageText || !intervalMs) return m.reply("Format salah atau waktu tidak valid!");

    let isImage = false;
    let imageBase64 = "";

    if (/image/.test(mime)) {
        isImage = true;
        const filePath = await sock.downloadAndSaveMediaMessage(qmsg);
        const imgBuffer = fs.readFileSync(filePath);
        imageBase64 = imgBuffer.toString("base64");
        fs.unlinkSync(filePath);
    }

    saveAutoJpm({
        active: false, // belum aktif langsung
        intervalMs,
        message: messageText,
        isImage,
        imageBase64
    });

    m.reply(`✅ AutoJPM Grup berhasil disetting\n\nPesan: ${messageText}\nInterval: ${timeText}\n\nGunakan *.autojpm on* untuk mengaktifkan.`);
    break;
}

case "delsetjpm": {
    if (!isOwner) return m.reply(mess.owner);

    if (fs.existsSync(autojpmFile)) {
        fs.unlinkSync(autojpmFile);
        if (global.autoJpmInterval) {
            clearInterval(global.autoJpmInterval);
            global.autoJpmInterval = null;
        }
        m.reply("✅ Setingan AutoJPM Grup berhasil dihapus.");
    } else {
        m.reply("❌ Tidak ada setingan AutoJPM Grup yang tersimpan.");
    }
    break;
}

case "autojpm": {
    if (!isOwner) return m.reply(mess.owner);
    if (!args[0]) return m.reply(`*Contoh penggunaan :*\nketik ${cmd} on/off`);

    const data = loadAutoJpm();
    if (!data || !data.message) return m.reply("❌ Belum ada setingan AutoJPM Grup.\nGunakan *.setjpm*");

    const allGroups = await sock.groupFetchAllParticipating();
    const groupIds = Object.keys(allGroups);

    if (args[0].toLowerCase() === "on") {
        if (global.autoJpmInterval) return m.reply("✅ AutoJPM Grup sudah aktif.");

        const messageContent = data.isImage
            ? { image: Buffer.from(data.imageBase64, "base64"), caption: data.message }
            : { text: data.message };

        global.autoJpmInterval = setInterval(async () => {
            // Guard: skip jika run sebelumnya belum selesai (cegah spam notif)
            if (global.autoJpmRunning) return;
            global.autoJpmRunning = true;

            // Ambil daftar grup fresh tiap run agar selalu up-to-date
            let currentGroups;
            try {
                const fresh = await sock.groupFetchAllParticipating();
                currentGroups = Object.keys(fresh);
            } catch {
                currentGroups = groupIds;
            }

            // Ambil blacklist dari db (bukan dari global.BlJpm yang tidak pernah diisi)
            const blacklist = db.settings?.bljpm || [];
            const targets = currentGroups.filter(id => !blacklist.includes(id));

            await sock.sendMessage(global.owner + "@s.whatsapp.net", {
                text: `*[ 🔄 AutoJPM Grup Berjalan ]*\n\nTotal Grup: ${currentGroups.length}\nDilewati (BL): ${blacklist.length}\nTarget Kirim: ${targets.length}`
            }).catch(() => {});

            let successCount = 0;
            let failCount = 0;
            for (const groupId of targets) {
                try {
                    await sock.sendMessage(groupId, messageContent, { quoted: FakeChannel });
                    successCount++;
                } catch (err) {
                    failCount++;
                    console.error(`[AUTOJPM] Gagal kirim ke grup ${groupId}:`, err.message);
                }
                await sleep(3500);
            }

            await sock.sendMessage(global.owner + "@s.whatsapp.net", {
                text: `*[ ✅ AutoJPM Grup Selesai ]*\n\nBerhasil: ${successCount} ✅\nGagal: ${failCount} ❌`
            }).catch(() => {});

            global.autoJpmRunning = false;
        }, data.intervalMs);

        data.active = true;
        saveAutoJpm(data);

        m.reply(`✅ AutoJPM Grup diaktifkan. Pesan dikirim setiap ${(data.intervalMs / 1000 / 60)} menit.`);
    } else if (args[0].toLowerCase() === "off") {
        if (global.autoJpmInterval) {
            clearInterval(global.autoJpmInterval);
            global.autoJpmInterval = null;
        }
        global.autoJpmRunning = false;
        data.active = false;
        saveAutoJpm(data);
        m.reply("✅ AutoJPM Grup berhasil dimatikan.");
    } else {
        m.reply(`*Contoh penggunaan :*\nketik ${cmd} on/off`);
    }
    break;
}

case "autojpmch": {
    if (!isOwner) return m.reply(mess.owner)
    const dbPath = './data/autojpmch.json'
    if (!fs.existsSync('./data')) fs.mkdirSync('./data')

    // ─── ON / OFF ─────────────────────────────────────────────────────────────
    if (text.toLowerCase() === 'on' || text.toLowerCase() === 'off') {
        if (!fs.existsSync(dbPath)) return m.reply("❌ Belum ada jadwal yang diset. Silakan set jadwal dulu.")
        let config = JSON.parse(fs.readFileSync(dbPath))
        config.status = text.toLowerCase() === 'on'
        if (!config.status) config.lastRun = 0  // reset lastRun saat off agar tidak skip run pertama
        fs.writeFileSync(dbPath, JSON.stringify(config, null, 2))
        const modeLabel = config.mode === 'interval'
            ? `Mode: Interval ${Math.round((config.intervalMs || 0) / 60000)} menit`
            : `Mode: Jadwal ${config.time || '-'} WIB`
        return m.reply(`Auto JPM Channel berhasil di-${config.status ? '✅ AKTIFKAN' : '❌ MATIKAN'}.\n\n${modeLabel}`)
    }

    // ─── SET JUMLAH JPM (berapa channel per run) ──────────────────────────────
    // Format: .autojpmch setjpm 10
    if (text.toLowerCase().startsWith('setjpm ')) {
        const jpmVal = parseInt(text.split(' ')[1])
        if (isNaN(jpmVal) || jpmVal < 0) return m.reply("❌ Format: .autojpmch setjpm [angka]\nContoh: .autojpmch setjpm 10\nKetik 0 untuk kirim ke semua channel.")
        if (!fs.existsSync(dbPath)) return m.reply("❌ Belum ada jadwal yang diset. Set jadwal dulu.")
        let config = JSON.parse(fs.readFileSync(dbPath))
        config.jpmCount = jpmVal
        fs.writeFileSync(dbPath, JSON.stringify(config, null, 2))
        return m.reply(`✅ Jumlah JPM per-run diset ke: *${jpmVal === 0 ? 'Semua Channel' : jpmVal + ' Channel'}*`)
    }

    // ─── MODE INTERVAL: "tiap Xmenit" atau "tiap Xjam" ───────────────────────
    if (text.toLowerCase().startsWith('tiap ')) {
        const parts = text.split('|')
        const intervalStr = parts[0].replace(/tiap\s*/i, '').trim()  // contoh: "30menit", "1jam"
        let msgText = (parts[1] || '').trim()

        const intervalMs = parseInterval(intervalStr)
        if (intervalMs <= 0) return m.reply(
            `❌ Format interval tidak valid.\n\n*Contoh:*\n${cmd} tiap 30menit | Pesan promo\n${cmd} tiap 1jam | Pesan promo\n\n_Format waktu: menit, jam_`
        )

        // Tangani media (foto/video)
        let mediaPath = null, typeMedia = null
        let q = m.quoted ? m.quoted : m
        let mimeType = (q.msg || q).mimetype || q.mediaType || ''
        if (/image|video/.test(mimeType)) {
            let extension = /image/.test(mimeType) ? '.jpg' : '.mp4'
            mediaPath = `./data/autojpm_media_global${extension}`
            let buffer = await q.download()
            fs.writeFileSync(mediaPath, buffer)
            typeMedia = /image/.test(mimeType) ? 'image' : 'video'
            if (!msgText && q.text) msgText = q.text
        }

        let existing = fs.existsSync(dbPath) ? JSON.parse(fs.readFileSync(dbPath)) : {}
        let config = {
            status: true,
            mode: 'interval',
            intervalMs,
            jpmCount: existing.jpmCount || 0,
            pesan: msgText || existing.pesan || '',
            media: mediaPath || existing.media || null,
            mime: typeMedia || existing.mime || null,
            lastRun: 0
        }
        fs.writeFileSync(dbPath, JSON.stringify(config, null, 2))

        return m.reply(
            `*✅ AUTO JPM CHANNEL — MODE INTERVAL*\n\n` +
            `● *Status:* ON\n` +
            `● *Interval:* Setiap ${intervalStr}\n` +
            `● *JPM per-run:* ${config.jpmCount === 0 ? 'Semua Channel' : config.jpmCount + ' Channel'}\n` +
            `● *Media:* ${config.mime || 'Tidak ada'}\n` +
            `● *Pesan:* ${config.pesan || '-'}\n\n` +
            `_Gunakan .autojpmch on/off untuk mengaktifkan/mematikan._`
        )
    }

    // ─── MODE JADWAL: "HH:MM | pesan" ────────────────────────────────────────
    let [jam, ...pesan] = text.split("|")
    let msgText = pesan.join("|").trim()

    if (!jam || !jam.includes(":")) {
        return m.reply(
            `*📋 PANDUAN AUTO JPM CHANNEL*\n\n` +
            `*Set Jadwal (jam tertentu):*\n  ${cmd} 08:30 | Pesan promo\n\n` +
            `*Set Interval (tiap X menit/jam):*\n  ${cmd} tiap 30menit | Pesan promo\n  ${cmd} tiap 2jam | Pesan promo\n\n` +
            `*Set Jumlah JPM per-run:*\n  ${cmd} setjpm 10\n  _(0 = semua channel)_\n\n` +
            `*Toggle:*\n  ${cmd} on / ${cmd} off\n\n` +
            `_Bisa sambil kirim/balas foto atau video._`
        )
    }

    // Tangani media
    let mediaPath = null, typeMedia = null
    let q = m.quoted ? m.quoted : m
    let mimeType = (q.msg || q).mimetype || q.mediaType || ''
    if (/image|video/.test(mimeType)) {
        let extension = /image/.test(mimeType) ? '.jpg' : '.mp4'
        mediaPath = `./data/autojpm_media_global${extension}`
        let buffer = await q.download()
        fs.writeFileSync(mediaPath, buffer)
        typeMedia = /image/.test(mimeType) ? 'image' : 'video'
        if (!msgText) msgText = q.text || ''
    }

    let existing = fs.existsSync(dbPath) ? JSON.parse(fs.readFileSync(dbPath)) : {}
    let config = {
        status: true,
        mode: 'jadwal',
        time: jam.trim(),
        jpmCount: existing.jpmCount || 0,
        pesan: msgText || '',
        media: mediaPath,
        mime: typeMedia,
        lastRun: null
    }
    fs.writeFileSync(dbPath, JSON.stringify(config, null, 2))

    m.reply(
        `*✅ AUTO JPM CHANNEL — MODE JADWAL*\n\n` +
        `● *Status:* ON\n` +
        `● *Jadwal:* ${config.time} WIB\n` +
        `● *JPM per-run:* ${config.jpmCount === 0 ? 'Semua Channel' : config.jpmCount + ' Channel'}\n` +
        `● *Media:* ${config.mime || 'Tidak ada'}\n` +
        `● *Pesan:* ${config.pesan || '-'}\n\n` +
        `_Gunakan .autojpmch on/off untuk mengaktifkan/mematikan._`
    )
}
break


case "setjpmch": {
    if (!isOwner) return m.reply(mess.owner)
    const listPath = './data/list_channel.json'
    
    // Pastikan folder & file ada
    if (!fs.existsSync('./data')) fs.mkdirSync('./data')
    if (!fs.existsSync(listPath)) fs.writeFileSync(listPath, JSON.stringify([]))
    
    let channelList = JSON.parse(fs.readFileSync(listPath))
    let [aksi, idInput] = text.split(" ")

    if (aksi === 'add') {
        // Ambil ID: dari input, atau dari balasan pesan, atau chat saat ini
        let targetId = idInput || (m.quoted ? (m.quoted.sender || m.quoted.chat) : m.chat)
        
        if (!targetId.endsWith('@newsletter')) {
            return m.reply("ID harus berakhiran @newsletter. Silakan balas pesan dari Channel/Saluran.")
        }

        // Cek apakah sudah ada
        if (channelList.find(i => i.id === targetId)) {
            return m.reply("Channel ini sudah ada dalam database.")
        }

        let mediaPath = null
        let typeMedia = null
        let captionText = text.replace(aksi, '').replace(idInput || '', '').trim()

        // Jika membalas pesan yang ada media (foto/video)
        if (m.quoted && /image|video/.test(m.quoted.mtype || m.quoted.mime)) {
            let q = m.quoted
            let mimeType = q.mtype || q.mime
            let extension = /image/.test(mimeType) ? '.jpg' : '.mp4'
            // Nama file unik berdasarkan ID channel agar tidak tertukar
            mediaPath = `./data/media_${targetId.split('@')[0]}${extension}`
            
            let buffer = await q.download()
            fs.writeFileSync(mediaPath, buffer)
            typeMedia = /image/.test(mimeType) ? 'image' : 'video'
            captionText = q.text || captionText // Ambil caption dari pesan yang di-quote
        }

        // Simpan sebagai object
        channelList.push({
            id: targetId,
            pesan: captionText || '',
            media: mediaPath,
            mime: typeMedia
        })

        fs.writeFileSync(listPath, JSON.stringify(channelList, null, 2))
        m.reply(`*BERHASIL MENAMBAH CHANNEL* ✅\n\nID: ${targetId}\nMedia: ${typeMedia || 'Tidak ada'}\nPesan: ${captionText || '-'}`)

    } else if (aksi === 'del' || aksi === 'delete') {
        let targetId = idInput || (m.quoted ? m.quoted.sender : null)
        if (!targetId) return m.reply("Masukkan ID atau balas pesan channel yang ingin dihapus.")
        
        let index = channelList.findIndex(i => i.id === targetId)
        if (index === -1) return m.reply("ID tidak ditemukan di database.")

        // Hapus file media terkait jika ada agar tidak memenuhi penyimpanan
        if (channelList[index].media && fs.existsSync(channelList[index].media)) {
            fs.unlinkSync(channelList[index].media)
        }

        channelList.splice(index, 1)
        fs.writeFileSync(listPath, JSON.stringify(channelList, null, 2))
        m.reply(`Berhasil menghapus channel:\n${targetId}`)

    } else if (aksi === 'list') {
        if (channelList.length === 0) return m.reply("Database channel kosong.")
        let teks = `*DAFTAR CHANNEL JPM (${channelList.length})*\n\n`
        channelList.forEach((ch, i) => {
            teks += `${i + 1}. ID: ${ch.id}\n`
            teks += `   Media: ${ch.mime || '❌'}\n`
            teks += `   Pesan: ${ch.pesan ? ch.pesan.substring(0, 20) + '...' : '❌'}\n\n`
        })
        m.reply(teks)
    } else {
        m.reply(`*PANDUAN SETJPMCH:*\n\n` +
                `1. *Tambah Channel + Media:* Balas foto/video dari channel, ketik \`${cmd} add\`\n` +
                `2. *Tambah ID saja:* \`${cmd} add ID_CHANNEL\`\n` +
                `3. *Hapus:* \`${cmd} del ID_CHANNEL\`\n` +
                `4. *Lihat List:* \`${cmd} list\``)
    }
}
break
case "listjpmch": {
    if (!isOwner) return m.reply(mess.owner)
    const dbPath = './data/autojpmch.json'
    const listPath = './data/list_channel.json'

    if (!fs.existsSync(dbPath)) return m.reply("Belum ada jadwal JPM yang diatur. Gunakan perintah .autojpmch")

    let config = JSON.parse(fs.readFileSync(dbPath))
    let channelList = fs.existsSync(listPath) ? JSON.parse(fs.readFileSync(listPath)) : []

    let caption = `*DETAIL KONFIGURASI AUTO JPM CHANNEL* 📢\n\n`
    caption += `● *Status:* ${config.status ? '✅ AKTIF' : '❌ NONAKTIF'}\n`
    const modeLabel = config.mode === 'interval'
        ? `Interval ${Math.round((config.intervalMs || 0) / 60000)} menit`
        : `Jadwal ${config.time || '-'} WIB`
    caption += `● *Mode:* ${modeLabel}\n`
    caption += `● *JPM per-run:* ${config.jpmCount === 0 ? 'Semua Channel' : config.jpmCount + ' Channel'}\n`
    caption += `● *Total Channel:* ${channelList.length} Channel\n`
    caption += `● *Tipe Media:* ${config.mime ? config.mime.toUpperCase() : 'Hanya Teks'}\n`
    caption += `● *Pesan:* \n${config.pesan || '-'}\n\n`
    caption += `_Gunakan .autojpmch on/off untuk mengubah status._`

    // Jika ada media, kirim pesan beserta gambarnya sebagai preview
    if (config.media && fs.existsSync(config.media)) {
        if (config.mime === 'image') {
            await sock.sendMessage(m.chat, { image: fs.readFileSync(config.media), caption: caption }, { quoted: m })
        } else if (config.mime === 'video') {
            await sock.sendMessage(m.chat, { video: fs.readFileSync(config.media), caption: caption }, { quoted: m })
        }
    } else {
        // Jika tidak ada media, kirim teks saja
        m.reply(caption)
    }
}
break

case "addproduk":
case "addrespon": {
if (!isOwner) return m.reply(mess.owner)
if (!text || !text.includes("|")) return m.reply(`*Contoh :* ${cmd} cmd|response`)
let [ id, response ] = text.split("|")
id = id.toLowerCase()
const res = db.settings.respon
if (res.find(v => v.id.toLowerCase() == id)) return m.reply(`Cmd ${id} sudah terdaftar dalam listproduk\nGunakan Cmd lain!`)
db.settings.respon.push({
id, 
response
})
return m.reply(`*Sukses Menambah Listproduk ✅*

- Barang: ${id}
- Response: ${response}
`)
}
break

case "listproduk":
case "listrespon": {
if (db.settings.respon.length < 1) return m.reply("Tidak ada listproduk.")
let teks = ""
for (let i of db.settings.respon) {
teks += `\n- *Cmd:* ${i.id}
- *Response:* ${i.response}\n`
}
return m.reply(teks)
}
break

case "delproduk":
case "delrespon": {
if (!isOwner) return m.reply(mess.owner)
if (!text) return m.reply(`*Contoh :* ${cmd} cmdnya`)
if (text.toLowerCase() == "all") {
db.settings.respon = []
return m.reply(`Berhasil menghapus semua Cmd ListProduk ✅`)
}
let res = db.settings.respon.find(v => v.id == text.toLowerCase())
if (!res) return m.reply(`Cmd Respon Tidak Ditemukan!\nKetik *.listproduk* Untuk Melihat Semua Cmd ListProduk`)
const posi = db.settings.respon.indexOf(res)
db.settings.respon.splice(posi, 1)
return m.reply(`Berhasil menghapus Cmd List Produk *${text}* ✅`)
}
break

case "bljpm": case "bl": {
if (!isOwner) return m.reply(mess.owner);
let rows = []
const a = await sock.groupFetchAllParticipating()
if (a.length < 1) return m.reply("Tidak ada grup chat.")
const Data = Object.values(a)
let number = 0
for (let u of Data) {
const name = u.subject || "Unknown"
rows.push({
title: name,
description: `ID - ${u.id}`, 
id: `.bljpm-response ${u.id}|${name}`
})
}
await sock.sendMessage(m.chat, {
  buttons: [
    {
    buttonId: 'action',
    buttonText: { displayText: 'ini pesan interactiveMeta' },
    type: 4,
    nativeFlowInfo: {
        name: 'single_select',
        paramsJson: JSON.stringify({
          title: 'Pilih Grup',
          sections: [
            {
              title: `© Powered By ${namaOwner}`,
              rows: rows
            }
          ]
        })
      }
      }
  ],
  headerType: 1,
  viewOnce: true,
  text: `\nPilih Salah Grup Chat\n`
}, { quoted: m })
}
break

case "bljpm-response": {
if (!isOwner) return m.reply(mess.owner)
if (!text || !text.includes("|")) return
const [ id, grupName ] = text.split("|")
if (db.settings.bljpm.includes(id)) return m.reply(`Grup ${grupName} sudah terdaftar dalam Blacklist Jpm`)
db.settings.bljpm.push(id)
return m.reply(`Berhasil Blacklist Grup ${grupName} Dari Jpm`)
}
break


case "delbl":
case "delbljpm": {
    if (!isOwner) return m.reply(mess.owner);

    if (db.settings.bljpm.length < 1) 
        return m.reply("Tidak ada data blacklist grup.");

    const groups = await sock.groupFetchAllParticipating();
    const Data = Object.values(groups);

    let rows = [];
    // opsi hapus semua
    rows.push({
        title: "🗑️ Hapus Semua",
        description: "Hapus semua grup dari blacklist",
        id: `.delbl-response all`
    });

    for (let id of db.settings.bljpm) {
        let name = "Unknown";
        // cari nama grup dari daftar grup aktif
        let grup = Data.find(g => g.id === id);
        if (grup) name = grup.subject || "Unknown";

        rows.push({
            title: name,
            description: `ID Grup - ${id}`,
            id: `.delbl-response ${id}|${name}`
        });
    }

    let msg = generateWAMessageFromContent(m.chat, {
        viewOnceMessage: {
            message: {
                interactiveMessage: {
                    body: { 
                        text: `Pilih Grup Untuk Dihapus Dari Blacklist\n\nTotal Blacklist: ${db.settings.bljpm.length}` 
                    },
                    nativeFlowMessage: {
                        buttons: [
                            {
                                name: "single_select",
                                buttonParamsJson: JSON.stringify({
                                    title: "Daftar Blacklist Grup",
                                    sections: [
                                        {
                                            title: "Blacklist Terdaftar",
                                            rows: rows
                                        }
                                    ]
                                })
                            }
                        ]
                    }
                }
            }
        }
    }, { userJid: m.sender, quoted: m });

    await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
}
break;

case "delbl-response": {
    if (!isOwner) return m.reply(mess.owner);
    if (!text) return;

    if (text === "all") {
        db.settings.bljpm = [];
        return m.reply("✅ Semua data blacklist grup berhasil dihapus.");
    }

    if (text.includes("|")) {
        const [id, grupName] = text.split("|");
        if (!db.settings.bljpm.includes(id)) 
            return m.reply(`❌ Grup *${grupName}* tidak ada dalam blacklist.`);

        db.settings.bljpm = db.settings.bljpm.filter(g => g !== id);
        return m.reply(`✅ Grup *${grupName}* berhasil dihapus dari blacklist.`);
    }
}
break;

case "payment":
case "pay": {
    let msg = generateWAMessageFromContent(m.chat, {
        viewOnceMessage: {
            message: {
                interactiveMessage: {
                    header: {
                    hasMediaAttachment: true, 
                    ...(await prepareWAMessageMedia({ image: { url: global.qris } }, { upload: sock.waUploadToServer })),
                    }, 
                    body: { 
                        text: `*Daftar Payment ${namaOwner} 🔖*`
                    },
                    footer: { 
                        text: "Klik tombol di bawah untuk menyalin nomor e-wallet" 
                    },
                    nativeFlowMessage: {
                        buttons: [
                            { 
                                name: "cta_copy",
                                buttonParamsJson: `{"display_text":"Copy Dana","copy_code":"${global.dana}"}`
                            },
                            { 
                                name: "cta_copy",
                                buttonParamsJson: `{"display_text":"Copy OVO","copy_code":"${global.ovo}"}`
                            },
                            { 
                                name: "cta_copy",
                                buttonParamsJson: `{"display_text":"Copy Gopay","copy_code":"${global.gopay}"}`
                            }
                        ]
                    }
                }
            }
        }
    }, { userJid: m.sender, quoted: m });

    await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
}
break;

case "cekidch":
case "idch": {
    if (!text) return m.reply(`*Contoh :* ${cmd} link channel`); 
    if (!text.includes("https://whatsapp.com/channel/")) {
        return m.reply("Link channel tidak valid");
    }

    let result = text.split("https://whatsapp.com/channel/")[1];
    let res = await sock.newsletterMetadata("invite", result);
    let teks = `*Channel ID Ditemukan ✅*\n\n- ${res.id}`;

    let msg = generateWAMessageFromContent(m.chat, {
        viewOnceMessage: {
            message: {
                interactiveMessage: {
                    body: { text: teks },
                    nativeFlowMessage: {
                        buttons: [
                            { 
                                name: "cta_copy",
                                buttonParamsJson: `{"display_text":"Copy Channel ID","copy_code":"${res.id}"}`
                            }
                        ]
                    }
                }
            }
        }
    }, { userJid: m.sender, quoted: m });

    await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
}
break;

case "status":
case "statusgrup": {
    if (!isOwner) return m.reply(mess.owner);
    if (!m.isGroup) return m.reply(mess.group);
    const group = global.db.groups[m.chat] || {};
    const teks = `
- Antilink  : ${group.antilink ? "✅" : "❌"}
- Antilink2 : ${group.antilink2 ? "✅" : "❌"}
- Welcome   : ${global.db.settings.welcome ? "✅" : "❌"}

_✅ = Aktif_
_❌ = Tidak Aktif_
`;
    return m.reply(teks);
}
break;

case "done":
case "don":
case "proses":
case "ps": {
    if (!isOwner) return m.reply(mess.owner);
    if (!text && !m.quoted) return m.reply(`📦 *Contoh:* ${cmd} Panel 2GB\nDengan harga: ${cmd} Panel 2GB|50000\n\nAtau reply pesan/foto/video dengan ${cmd} <keterangan>`);
    
    // Cek apakah fitur aktif
    if (!global.done.enabled) {
        return m.reply('❌ Fitur auto-reply done sedang dinonaktifkan. Aktifkan dengan .setdone toggle');
    }
    
    // Parse harga dari text dengan validasi lebih ketat
    let produkText = text || "";
    let hargaVal = "";
    let hargaValid = false;

    // Cek format dengan pipe: .done Panel 2GB|50000
    if (produkText.includes("|")) {
        const pipeIdx = produkText.lastIndexOf("|");
        const maybeHarga = produkText.substring(pipeIdx + 1).trim();
        // Validasi angka minimal 4 digit dan maksimal 12 digit (sesuai range harga wajar)
        if (/^\d{4,12}$/.test(maybeHarga)) {
            hargaVal = maybeHarga;
            hargaValid = true;
            produkText = produkText.substring(0, pipeIdx).trim();
        }
    } else {
        // Cek apakah kata terakhir angka: .done Panel 2GB 50000
        const parts = produkText.trim().split(/\s+/);
        const lastWord = parts[parts.length - 1];
        // Validasi lebih ketat: harus angka 4-12 digit dan tidak boleh ada huruf
        if (/^\d{4,12}$/.test(lastWord)) {
            hargaVal = lastWord;
            hargaValid = true;
            produkText = parts.slice(0, -1).join(" ");
        }
    }

    // Validasi tambahan: pastikan harga masuk akal (min 1000, max 999M)
    if (hargaValid) {
        const hargaNum = parseInt(hargaVal);
        if (hargaNum < 1000 || hargaNum > 999999999999) {
            return m.reply(`❌ Harga tidak valid! Minimal Rp1.000 dan maksimal Rp999.999.999.999`);
        }
    }

    // Format harga ke rupiah
    const hargaFormatted = hargaValid
        ? "Rp" + parseInt(hargaVal).toLocaleString("id-ID")
        : (global.done.defaultHarga || "-");
    
    // Pilih config berdasarkan command
    const config = global[command] || global.done;
    
    // Pilih status text
    const status = config.status[command] || "✅ *Pesanan Selesai!*";
    
    // Format template dengan memastikan harga masuk
    let teks = config.template
        .replace(/{status}/g, status)
        .replace(/{text}/g, produkText || "-")
        .replace(/{harga}/g, hargaFormatted)
        .replace(/{tanggal}/g, global.tanggal(Date.now()))
        .replace(/{storeName}/g, config.storeName)
        .replace(/{channelLink}/g, global.linkChannel || "-")
        .replace(/{groupLink}/g, global.linkGrup || "-");
    
    // Tambahkan info harga di bagian bawah jika belum ada di template
    if (!teks.includes(hargaFormatted) && hargaValid) {
        teks += `\n\n💰 *Total Harga:* ${hargaFormatted}`;
    }
    
    // Format tombol
    const buttons = [];
    
    if (config.buttons.channel && global.linkChannel) {
        buttons.push({
            name: "cta_url",
            buttonParamsJson: JSON.stringify({
                display_text: config.buttons.channel.text.replace(/{channelLink}/g, global.linkChannel),
                url: config.buttons.channel.url.replace(/{channelLink}/g, global.linkChannel)
            })
        });
    }
    
    if (config.buttons.group && global.linkGrup) {
        buttons.push({
            name: "cta_url", 
            buttonParamsJson: JSON.stringify({
                display_text: config.buttons.group.text.replace(/{groupLink}/g, global.linkGrup),
                url: config.buttons.group.url.replace(/{groupLink}/g, global.linkGrup)
            })
        });
    }
    
    // Buat message interactive
    const messageContent = {
        body: { text: teks },
        nativeFlowMessage: buttons.length > 0 ? { buttons } : undefined,
        contextInfo: config.forwarded ? {
            isForwarded: true,
            forwardingScore: 999,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '',
                newsletterName: config.storeName,
                serverMessageId: 0
            }
        } : undefined
    };
    
    let msg;
    if (config.viewOnce) {
        msg = generateWAMessageFromContent(m.chat, {
            viewOnceMessage: {
                message: {
                    interactiveMessage: messageContent
                }
            }
        }, {});
    } else {
        msg = generateWAMessageFromContent(m.chat, {
            interactiveMessage: messageContent
        }, {});
    }
    
    await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });

    // Log untuk debugging
    console.log(chalk.green('✅ [DONE] Pesan terkirim dengan harga:'), hargaFormatted);

    // ===== KIRIM KE CHANNEL =====
    try {
        const chListPath = './data/list_channel.json';
        if (!fs.existsSync(chListPath)) {
            console.log(chalk.yellow('⚠️ [DONE→CH] File list_channel.json tidak ditemukan, skip kirim channel.'));
            break;
        }

        const rawList = JSON.parse(fs.readFileSync(chListPath, 'utf8'));
        // Ambil semua ID string langsung
        const channelIds = rawList
            .map(i => typeof i === 'string' ? i : (i.id || null))
            .filter(id => id && id.endsWith('@newsletter'));

        if (channelIds.length === 0) {
            console.log(chalk.yellow('⚠️ [DONE→CH] Tidak ada ID channel di list_channel.json'));
            break;
        }

        // ---- Tentukan konten dari pesan yang di-reply ----
        let chMediaBuffer = null;
        let chMediaType = null;  // 'image' | 'video'
        let chCaption = teks;    // Default: pakai teks template dengan harga

        // Tambahkan informasi harga ke caption channel jika belum ada
        if (!chCaption.includes(hargaFormatted) && hargaValid) {
            chCaption += `\n\n💰 *Total Harga:* ${hargaFormatted}`;
        }

        if (m.quoted) {
            const qMime = m.quoted?.msg?.mimetype || m.quoted?.mimetype || '';
            
            if (/image/.test(qMime)) {
                console.log(chalk.cyan('📷 [DONE→CH] Mendeteksi FOTO dari pesan yang di-reply...'));
                try {
                    chMediaBuffer = await m.quoted.download();
                    chMediaType = 'image';
                    // Pastikan harga tetap masuk di caption
                    chCaption = teks;
                    if (!chCaption.includes(hargaFormatted) && hargaValid) {
                        chCaption += `\n\n💰 *Total Harga:* ${hargaFormatted}`;
                    }
                } catch (dlErr) {
                    console.log(chalk.red('❌ [DONE→CH] Gagal download foto:', dlErr.message));
                }
            } else if (/video/.test(qMime)) {
                console.log(chalk.cyan('🎬 [DONE→CH] Mendeteksi VIDEO dari pesan yang di-reply...'));
                try {
                    chMediaBuffer = await m.quoted.download();
                    chMediaType = 'video';
                    // Pastikan harga tetap masuk di caption
                    chCaption = teks;
                    if (!chCaption.includes(hargaFormatted) && hargaValid) {
                        chCaption += `\n\n💰 *Total Harga:* ${hargaFormatted}`;
                    }
                } catch (dlErr) {
                    console.log(chalk.red('❌ [DONE→CH] Gagal download video:', dlErr.message));
                }
            } else {
                // Hanya teks dari quoted, gabungkan dengan harga
                const quotedText = m.quoted?.text || m.quoted?.caption || '';
                if (quotedText && !teks.includes(quotedText)) {
                    chCaption = teks;
                    if (!chCaption.includes(hargaFormatted) && hargaValid) {
                        chCaption += `\n\n💰 *Total Harga:* ${hargaFormatted}`;
                    }
                }
            }
        }

        // ---- Bangun konten pesan untuk channel ----
        let chContent;
        if (chMediaBuffer && chMediaType === 'image') {
            chContent = { image: chMediaBuffer, caption: chCaption };
        } else if (chMediaBuffer && chMediaType === 'video') {
            chContent = { video: chMediaBuffer, caption: chCaption, mimetype: 'video/mp4' };
        } else {
            chContent = { text: chCaption };
        }

        // ---- Kirim ke semua channel ----
        console.log(chalk.bgGreen.black.bold(' DONE→CHANNEL ') + ` Mengirim ke ${channelIds.length} channel...`);
        console.log(chalk.green('├─ Tipe konten  : ') + chalk.white(chMediaType ? chMediaType.toUpperCase() : 'TEKS'));
        console.log(chalk.green('├─ Harga        : ') + chalk.white(hargaFormatted));
        console.log(chalk.green('├─ Total channel: ') + chalk.white(channelIds.length));
        console.log(chalk.green('└─ Caption/Teks : ') + chalk.gray(chCaption.substring(0, 60) + '...'));

        let doneSucc = 0, doneFail = 0;
        for (const chId of channelIds) {
            try {
                await sock.sendMessage(chId, chContent);
                doneSucc++;
                console.log(chalk.green(`  ✅ [DONE→CH] Terkirim ke: ${chId}`));
            } catch (chErr) {
                doneFail++;
                console.log(chalk.red(`  ❌ [DONE→CH] Gagal ke ${chId} : ${chErr.message}`));
            }
            await sleep(2000);
        }

        console.log(
            chalk.bgGreen.black(' SELESAI ') +
            chalk.white(` ✅ Berhasil: ${doneSucc} | ❌ Gagal: ${doneFail}`)
        );

        // Kirim laporan ke chat
        let reportMsg = `✅ *Pesan Done + Channel Terkirim!*\n\n`;
        reportMsg += `📤 Berhasil : ${doneSucc} channel\n`;
        reportMsg += `❌ Gagal    : ${doneFail} channel\n`;
        reportMsg += `📎 Tipe     : ${chMediaType ? chMediaType.toUpperCase() : 'Teks'}\n`;
        
        if (hargaValid) {
            reportMsg += `💰 Harga    : ${hargaFormatted}\n`;
        }
        
        reportMsg += `\n📝 *Produk:* ${produkText || '-'}`;
        
        await m.reply(reportMsg);

    } catch (chErr) {
        console.log(chalk.red('❌ [DONE→CH] Error:', chErr.message));
        // Tetap beri notifikasi bahwa pesan utama berhasil
        await m.reply(`✅ *Pesan Done berhasil dikirim*\n❌ Gagal kirim ke channel: ${chErr.message}`);
    }
}
break;
case "setdone": {
    if (!isOwner) return m.reply(mess.owner);
    
    const args = text.split(' ');
    const subcmd = args[0].toLowerCase();
    
    switch(subcmd) {
        case 'status': {
            const type = args[1]; // done/don/proses/ps
            const newStatus = text.substring(subcmd.length + type.length + 2);
            
            if (!type || !newStatus) {
                return m.reply(`📝 *Format:* ${cmd} status <type> <text>\n📌 *Contoh:* ${cmd} status done "✅ Order Completed!"\n📌 *Type tersedia:* done, don, proses, ps`);
            }
            
            if (global.done.status[type]) {
                global.done.status[type] = newStatus;
                
                // Update juga di global lain biar sync
                if (global.proses) global.proses.status[type] = newStatus;
                if (global.ps) global.ps.status[type] = newStatus;
                if (global.don) global.don.status[type] = newStatus;
                
                m.reply(`✅ Status "${type}" diubah menjadi:\n${newStatus}`);
            } else {
                m.reply(`❌ Type tidak valid. Pilih: ${Object.keys(global.done.status).join(', ')}`);
            }
            break;
        }
        
        case 'template': {
            const newTemplate = text.substring(subcmd.length + 1);
            
            if (!newTemplate) {
                return m.reply(`📝 *Format:* ${cmd} template <text>\n📌 *Variable yang tersedia:*\n• {status} - Status pesan\n• {text} - Nama produk\n• {tanggal} - Tanggal sekarang\n• {storeName} - Nama store\n• {channelLink} - Link channel\n• {groupLink} - Link group\n\n📌 *Contoh:* ${cmd} template {status}\\nProduk: {text}\\n{storeName}`);
            }
            
            global.done.template = newTemplate;
            
            // Sync ke semua
            if (global.proses) global.proses.template = newTemplate;
            if (global.ps) global.ps.template = newTemplate;
            if (global.don) global.don.template = newTemplate;
            
            m.reply('✅ Template berhasil diupdate!');
            break;
        }
        
        case 'storename': {
            const newName = text.substring(subcmd.length + 1);
            
            if (!newName) {
                return m.reply(`📝 *Format:* ${cmd} storename <nama>\n📌 *Contoh:* ${cmd} storename "My Premium Store"`);
            }
            
            global.done.storeName = newName;
            
            // Sync ke semua
            if (global.proses) global.proses.storeName = newName;
            if (global.ps) global.ps.storeName = newName;
            if (global.don) global.don.storeName = newName;
            
            m.reply(`✅ Store name diubah menjadi: ${newName}`);
            break;
        }
        
        case 'harga': {
            const hargaInput = text.substring(subcmd.length + 1).trim();
            
            if (!hargaInput) {
                return m.reply(`📝 *Format:* ${cmd} harga <nominal>\n📌 *Contoh:* ${cmd} harga 50000\n📌 Kosongkan dengan: ${cmd} harga -`);
            }
            
            const hargaBaru = hargaInput === "-" ? "" : hargaInput;
            const hargaDisplay = hargaBaru
                ? "Rp" + parseInt(hargaBaru).toLocaleString("id-ID")
                : "(tidak ada)";
            
            global.done.defaultHarga = hargaBaru
                ? "Rp" + parseInt(hargaBaru).toLocaleString("id-ID")
                : "";
            
            // Sync ke semua
            if (global.proses) global.proses.defaultHarga = global.done.defaultHarga;
            if (global.ps) global.ps.defaultHarga = global.done.defaultHarga;
            if (global.don) global.don.defaultHarga = global.done.defaultHarga;
            
            m.reply(`✅ Default harga diubah menjadi: ${hargaDisplay}\n\n💡 Tip: Untuk harga per-transaksi, gunakan:\n• .done Nama Produk|50000\n• .done Nama Produk 50000`);
            break;
        }
        
        case 'button': {
            const buttonType = args[1]; // channel/group
            const action = args[2]; // text/url
            
            if (!buttonType || !action) {
                return m.reply(`📝 *Format:* ${cmd} button <channel/group> <text/url> <value>\n📌 *Contoh:*\n• ${cmd} button channel text "📢 Channel Baru"\n• ${cmd} button channel url "https://t.me/newchannel"`);
            }
            
            const value = text.substring(subcmd.length + buttonType.length + action.length + 3);
            
            if (!value) {
                return m.reply('❌ Masukkan value!');
            }
            
            if (global.done.buttons[buttonType]) {
                global.done.buttons[buttonType][action] = value;
                
                // Sync ke semua
                if (global.proses) global.proses.buttons[buttonType][action] = value;
                if (global.ps) global.ps.buttons[buttonType][action] = value;
                if (global.don) global.don.buttons[buttonType][action] = value;
                
                m.reply(`✅ Button ${buttonType} ${action} diubah menjadi:\n${value}`);
            } else {
                m.reply(`❌ Button type tidak valid. Pilih: ${Object.keys(global.done.buttons).join(', ')}`);
            }
            break;
        }
        
        case 'toggle': {
            global.done.enabled = !global.done.enabled;
            
            // Sync ke semua
            if (global.proses) global.proses.enabled = global.done.enabled;
            if (global.ps) global.ps.enabled = global.done.enabled;
            if (global.don) global.don.enabled = global.done.enabled;
            
            m.reply(`✅ Fitur done ${global.done.enabled ? 'diaktifkan' : 'dinonaktifkan'}`);
            break;
        }
        
        case 'view': {
            const config = global.done;
            const statusList = Object.entries(config.status).map(([key, val]) => 
                `  • ${key}: ${val}`
            ).join('\n');
            
            const buttonList = Object.entries(config.buttons).map(([key, val]) => 
                `  • ${key}: ${val.text} | ${val.url}`
            ).join('\n');
            
            m.reply(`
📋 *CONFIG AUTO-REPLY DONE/PROSES*

🔧 *Status Fitur:* ${config.enabled ? '✅ AKTIF' : '❌ NONAKTIF'}
🏪 *Store Name:* ${config.storeName}
💰 *Default Harga:* ${config.defaultHarga || '-'}
👁️ *View Once:* ${config.viewOnce ? '✅' : '❌'}
🔄 *Forwarded:* ${config.forwarded ? '✅' : '❌'}

📝 *Status Texts:*
${statusList}

🔘 *Buttons:*
${buttonList}

📋 *Template Preview:*
\`\`\`
${config.template.substring(0, 150)}...
\`\`\`

📌 *Variable Template:*
{status}, {text}, {harga}, {tanggal}, {storeName}, {channelLink}, {groupLink}

📍 *Perintah Setting:*
• ${cmd} status <type> <text>
• ${cmd} template <text>
• ${cmd} storename <nama>
• ${cmd} harga <nominal>
• ${cmd} button <type> <text/url> <value>
• ${cmd} toggle
• ${cmd} view

📝 *Cara pakai harga di done:*
• ${cmd.replace('setdone','done')} Panel 2GB|50000
• ${cmd.replace('setdone','done')} Panel 2GB 50000
            `.trim());
            break;
        }
        
        case 'reset': {
            // Reset ke default
            global.done = {
                status: {
                    done: "✅ *Pesanan Selesai!*",
                    don: "✅ *Pesanan Selesai!*", 
                    proses: "💰 *Pembayaran Diterima!*",
                    ps: "💰 *Pembayaran Diterima!*"
                },
                template: `{status}\n\n🛍️ *Produk:* {text}\n💰 *Harga:* {harga}\n📅 *Tanggal:* {tanggal}\n\n📦 *Terima kasih sudah bertransaksi di {storeName}!*\nSemoga puas dengan layanan kami 🙏\n\n📢 *Cek testimoni & info terbaru:*\n{channelLink}`,
                buttons: {
                    channel: {
                        text: "📺 Channel Testimoni",
                        url: "{channelLink}"
                    },
                    group: {
                        text: "💬 Grup Reseller",
                        url: "{groupLink}"
                    }
                },
                storeName: "Fyxz Store",
                defaultHarga: "",
                forwarded: true,
                viewOnce: true,
                enabled: true
            };
            
            // Sync ke semua
            global.proses = global.done;
            global.ps = global.done;
            global.don = global.done;
            
            m.reply('✅ Config berhasil direset ke default!\n\n💡 Template sekarang sudah include {harga}');
            break;
        }
        
        default: {
            m.reply(`
📝 *MENU SETDONE*

📍 *Perintah:*
• ${cmd} status <type> <text>
• ${cmd} template <text>
• ${cmd} storename <nama>
• ${cmd} harga <nominal>
• ${cmd} button <channel/group> <text/url> <value>
• ${cmd} toggle
• ${cmd} view
• ${cmd} reset

📌 *Type status:* done, don, proses, ps
📌 *Variable template:* {status}, {text}, {harga}, {tanggal}, {storeName}, {channelLink}, {groupLink}

💡 *Cara set harga per-transaksi:*
• .done Nama Produk|50000
• .done Nama Produk 50000
            `.trim());
        }
    }
}
break;
case "tourl": {
    if (!/image|video|audio|application/.test(mime)) 
        return m.reply(`Media tidak ditemukan!\nKetik *${cmd}* dengan reply/kirim media`)

    const FormData = require('form-data');
    const { fromBuffer } = require('file-type');    

    async function dt(buffer) {
        const fetchModule = await import('node-fetch');
        const fetch = fetchModule.default;
        let { ext } = await fromBuffer(buffer);
        let bodyForm = new FormData();
        bodyForm.append("fileToUpload", buffer, "file." + ext);
        bodyForm.append("reqtype", "fileupload");
        let res = await fetch("https://catbox.moe/user/api.php", {
            method: "POST",
            body: bodyForm,
        });
        let data = await res.text();
        return data;
    }

    let aa = m.quoted ? await m.quoted.download() : await m.download();
    let dd = await dt(aa);

    // bikin button copy url
    let msg = generateWAMessageFromContent(m.chat, {
        viewOnceMessage: {
            message: {
                interactiveMessage: {
                    body: { text: `✅ Media berhasil diupload!\n\nURL: ${dd}` },
                    nativeFlowMessage: {
                        buttons: [
                            { 
                                name: "cta_copy", 
                                buttonParamsJson: `{"display_text":"Copy URL","copy_code":"${dd}"}`
                            }
                        ]
                    }
                }
            }
        }
    }, { userJid: m.sender, quoted: m });

    await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
}
break;

case "tourl2": {
    if (!/image/.test(mime)) 
        return m.reply(`Media tidak ditemukan!\nKetik *${cmd}* dengan reply/kirim foto`)
    try {
        const { ImageUploadService } = require('node-upload-images');
        let mediaPath = await sock.downloadAndSaveMediaMessage(qmsg);
        const service = new ImageUploadService('pixhost.to');
        let buffer = fs.readFileSync(mediaPath);
        let { directLink } = await service.uploadFromBinary(buffer, 'skyzo.png');
        await fs.unlinkSync(mediaPath);

        // button copy url
        let msg = generateWAMessageFromContent(m.chat, {
            viewOnceMessage: {
                message: {
                    interactiveMessage: {
                        body: { text: `✅ Foto berhasil diupload!\n\nURL: ${directLink}` },
                        nativeFlowMessage: {
                            buttons: [
                                { 
                                    name: "cta_copy", 
                                    buttonParamsJson: `{"display_text":"Copy URL","copy_code":"${directLink}"}`
                                }
                            ]
                        }
                    }
                }
            }
        }, { userJid: m.sender, quoted: m });

        await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });

    } catch (err) {
        console.error("Tourl Error:", err);
        m.reply("Terjadi kesalahan saat mengubah media menjadi URL.");
    }
}
break;

case "backupsc":
case "bck":
case "backup": {
    // Memastikan hanya owner yang bisa menjalankan
    if (m.sender.split("@")[0] !== global.owner) return m.reply(mess.owner);

    try {
        await m.reply("Sedang memproses backup script, mohon tunggu...");

        // 1. Inisialisasi Nama & Folder (Globalisasi)
        const botName = global.namebot ? global.namebot.replace(/\s+/g, "_") : "bot_script";
        const timestamp = new Date().toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/:/g, '-');
        const zipFileName = `backup_${botName}_${timestamp}.zip`;

        // 2. Bersihkan folder Tmp jika ada (Optimalisasi)
        const tmpDir = "./Tmp";
        if (fs.existsSync(tmpDir)) {
            const tmpFiles = fs.readdirSync(tmpDir);
            for (let file of tmpFiles) {
                // Menghapus file di folder Tmp kecuali file .gitkeep atau folder penting
                fs.unlinkSync(path.join(tmpDir, file));
            }
        }

        // 3. Tentukan file/folder yang akan DIABAIKAN
        const exclude = [
            "node_modules", 
            "ConnectSession", 
            "session", 
            ".npm", 
            ".cache", 
            "package-lock.json", 
            "yarn.lock",
            zipFileName // Abaikan file zip yang sedang dibuat
        ];

        // 4. Ambil list file di direktori utama
        const filesToZip = fs.readdirSync(".")
            .filter(f => !exclude.includes(f) && !f.endsWith(".zip"));

        if (filesToZip.length === 0) return m.reply("Tidak ada file yang dapat di-backup.");

        // 5. Proses Kompresi menggunakan Zip (System Call)
        // Menggunakan execSync untuk kemudahan, pastikan server sudah terinstall 'zip'
        execSync(`zip -r ${zipFileName} ${filesToZip.join(" ")}`);

        // 6. Kirim file ke Private Chat Owner
        await sock.sendMessage(m.sender, {
            document: fs.readFileSync(`./${zipFileName}`),
            fileName: zipFileName,
            mimetype: "application/zip",
            caption: `*BACKUP COMPLETED*\n\n• *Bot Name:* ${global.namebot || "Unknown"}\n• *Date:* ${new Date().toLocaleString()}\n• *Size:* ${(fs.statSync(zipFileName).size / 1024 / 1024).toFixed(2)} MB`
        }, { quoted: m });

        // 7. Hapus file zip setelah dikirim agar tidak memenuhi penyimpanan
        fs.unlinkSync(`./${zipFileName}`);

        // Beri notifikasi di grup jika perintah dilakukan di grup
        if (m.chat !== m.sender) {
            m.reply("Script berhasil di-backup dan telah dikirim ke chat pribadi Anda.");
        }

    } catch (err) {
        console.error("Backup Error:", err);
        m.reply(`Terjadi kesalahan saat melakukan backup: ${err.message}`);
    }
}
break;


case "kick":
case "kik": {
    if (!m.isGroup) return m.reply(mess.group);
    if (!isOwner && !m.isAdmin) return m.reply(mess.admin);
    if (!m.isBotAdmin) return m.reply(mess.botadmin);

    let target;

    if (m.mentionedJid?.[0]) {
        target = m.mentionedJid[0];
    } else if (m.quoted?.sender) {
        target = m.quoted.sender;
    } else if (text) {
        const cleaned = text.replace(/[^0-9]/g, "");
        if (cleaned) target = cleaned + "@s.whatsapp.net";
    }

    if (!target) return m.reply(`*Contoh :* .kick @tag/6283XXX`);

    try {
        await sock.groupParticipantsUpdate(m.chat, [target], "remove");
        return sock.sendMessage(m.chat, {
            text: `✅ Berhasil mengeluarkan @${target.split("@")[0]}`,
            mentions: [target]
        }, { quoted: m });
    } catch (err) {
        console.error("Kick error:", err);
        return m.reply("Gagal mengeluarkan anggota. Coba lagi atau cek hak akses bot.");
    }
}
break;

case "closegc":
case "close":
case "opengc":
case "open": {
    if (!m.isGroup) return m.reply(mess.group);
    if (!isOwner && !m.isAdmin) return m.reply(mess.admin);
    if (!m.isBotAdmin) return m.reply(mess.botadmin);

    try {
        const cmd = command.toLowerCase();

        if (cmd === "open" || cmd === "opengc") {
            await sock.groupSettingUpdate(m.chat, 'not_announcement');
            return m.reply("Grup berhasil dibuka! Sekarang semua anggota dapat mengirim pesan.");
        }

        if (cmd === "close" || cmd === "closegc") {
            await sock.groupSettingUpdate(m.chat, 'announcement');
            return m.reply("Grup berhasil ditutup! Sekarang hanya admin yang dapat mengirim pesan.");
        }

    } catch (error) {
        console.error("Error updating group settings:", error);
        return m.reply("Terjadi kesalahan saat mencoba mengubah pengaturan grup.");
    }
}
break;

case "ht":
case "hidetag": {
    if (!m.isGroup) return m.reply(mess.group);
    if (!isOwner && !m.isAdmin) return m.reply(mess.admin);
    if (!text) return m.reply(`*Contoh :* ${cmd} pesannya`);
    try {
        if (!m.metadata || !m.metadata.participants) return m.reply("Gagal mendapatkan daftar anggota grup. Coba lagi.");
        const members = m.metadata.participants.map(v => v.id.includes("@s.whatsapp.net") ? v.id : v.jid);
        await sock.sendMessage(m.chat, {
            text: text,
            mentions: members
        }, {
            quoted: null
        });
    } catch (error) {
        console.error("Error sending hidetag message:", error);
        return m.reply("Terjadi kesalahan saat mencoba mengirim pesan hidetag.");
    }
}
break;

case "welcome": {
    if (!isOwner && !m.isAdmin) return m.reply(mess.admin);
    if (!text) return m.reply(`*Contoh :* ${cmd} on/off`);
    if (!/on|off/.test(text)) return m.reply(`*Contoh :* ${cmd} on/off`);

    if (text === "on") {
        if (global.db.settings.welcome) 
            return m.reply("Welcome sudah aktif ✅");
        global.db.settings.welcome = true;
        return m.reply("Berhasil menyalakan welcome ✅");
    }

    if (text === "off") {
        if (!global.db.settings.welcome) 
            return m.reply("Welcome sudah tidak aktif ✅");
        global.db.settings.welcome = false;
        return m.reply("Berhasil mematikan welcome ✅");
    }
}
break;

case "antilink": {
    if (!isOwner && !m.isAdmin) return m.reply(mess.admin);
    if (!m.isGroup) return m.reply(mess.group);
    if (!text) return m.reply(`*Contoh :* ${cmd} on/off`);

    let group = global.db.groups[m.chat];
    if (text === "on") {
        if (group.antilink) return m.reply(`Antilink di grup ini sudah aktif!`);
        group.antilink = true;
        group.antilink2 = false;
        return m.reply(`Berhasil menyalakan antilink di grup ini ✅`);
    }

    if (text === "off") {
        if (!group.antilink) return m.reply(`Antilink di grup ini sudah tidak aktif!`);
        group.antilink = false;
        return m.reply(`Berhasil mematikan antilink di grup ini ✅`);
    }
}
break;

case "antilink2": {
    if (!isOwner && !m.isAdmin) return m.reply(mess.admin);
    if (!m.isGroup) return m.reply(mess.group);
    if (!text) return m.reply(`*Contoh :* ${cmd} on/off`);

    let group = global.db.groups[m.chat];
    if (text === "on") {
        if (group.antilink2) return m.reply(`Antilink2 di grup ini sudah aktif!`);
        group.antilink2 = true;
        group.antilink = false;
        return m.reply(`Berhasil menyalakan antilink2 di grup ini ✅`);
    }

    if (text === "off") {
        if (!group.antilink2) return m.reply(`Antilink2 di grup ini sudah tidak aktif!`);
        group.antilink2 = false;
        return m.reply(`Berhasil mematikan antilink2 di grup ini ✅`);
    }
}
break;

case "jasher": case "jpm": case "jaser": {
if (!isOwner) return m.reply(mess.owner)
if (!text && !quoted) return m.reply(`*Contoh :* ${cmd} pesannya & bisa dengan foto/video juga`)

let mediaPath
const mimeType = mime
if (/image/.test(mimeType) || /video/.test(mimeType)) {
mediaPath = await sock.downloadAndSaveMediaMessage(qmsg)
}

const allGroups = await sock.groupFetchAllParticipating()
const groupIds = Object.keys(allGroups)
let successCount = 0

// Tentukan tipe media yang akan dikirim
let messageContent
if (mediaPath) {
const fileBuffer = await fs.readFileSync(mediaPath)
if (/image/.test(mimeType)) {
messageContent = { image: fileBuffer, caption: text || '' }
} else if (/video/.test(mimeType)) {
messageContent = { video: fileBuffer, caption: text || '' }
}
} else {
messageContent = { text: text }
}

global.messageJpm = messageContent
const senderChat = m.chat
await m.reply(`Memproses JPM ${mediaPath ? ( /image/.test(mimeType) ? "dengan foto" : "dengan video" ) : "teks"} ke ${groupIds.length} grup chat`)
global.statusjpm = true

for (const groupId of groupIds) {
if (db.settings.bljpm?.includes(groupId)) continue
if (global.stopjpm) {
delete global.stopjpm
delete global.statusjpm
break
}
try {
await sock.sendMessage(groupId, global.messageJpm, { quoted: FakeChannel })
successCount++
} catch (err) {
console.error(`Gagal kirim ke grup ${groupId}:`, err)
}
await sleep(global.JedaJpm || 3000)
}

if (mediaPath) await fs.unlinkSync(mediaPath)
delete global.statusjpm
await sock.sendMessage(senderChat, {
text: `JPM ${mediaPath ? ( /image/.test(mimeType) ? "dengan foto" : "dengan video" ) : "teks"} berhasil dikirim ke ${successCount} grup.`,
}, { quoted: m })
}
break

case "jpmht": {
if (!isOwner) return m.reply(mess.owner)
if (!text && !quoted) return m.reply(`*Contoh :* ${cmd} pesannya & bisa dengan foto/video juga`)

let mediaPath
const mimeType = mime
if (/image/.test(mimeType) || /video/.test(mimeType)) {
mediaPath = await sock.downloadAndSaveMediaMessage(qmsg)
}

const allGroups = await sock.groupFetchAllParticipating()
const groupIds = Object.keys(allGroups)
let successCount = 0

// Tentukan tipe media yang akan dikirim
let messageContent
if (mediaPath) {
const fileBuffer = await fs.readFileSync(mediaPath)
if (/image/.test(mimeType)) {
messageContent = { image: fileBuffer, caption: text || '' }
} else if (/video/.test(mimeType)) {
messageContent = { video: fileBuffer, caption: text || '' }
}
} else {
messageContent = { text: text }
}

global.messageJpm = messageContent
const senderChat = m.chat
await m.reply(`Memproses JPM ${mediaPath ? ( /image/.test(mimeType) ? "dengan foto" : "dengan video" ) : "teks"} hidetag ke ${groupIds.length} grup chat`)
global.statusjpm = true

for (const groupId of groupIds) {
if (db.settings.bljpm?.includes(groupId)) continue
if (global.stopjpm) {
delete global.stopjpm
delete global.statusjpm
break
}

// Tambahkan mentions untuk hidetag
const groupParticipants = allGroups[groupId]?.participants || []
const mentions = groupParticipants.map(p => p.id)
messageContent.mentions = mentions

// Jika ada media, pastikan mentions tetap ada
if (mediaPath) {
if (/image/.test(mimeType)) {
messageContent = { 
image: await fs.readFileSync(mediaPath), 
caption: text || '',
mentions: mentions 
}
} else if (/video/.test(mimeType)) {
messageContent = { 
video: await fs.readFileSync(mediaPath), 
caption: text || '',
mentions: mentions 
}
}
} else {
messageContent = { text: text, mentions: mentions }
}

try {
await sock.sendMessage(groupId, messageContent, { quoted: FakeChannel })
successCount++
} catch (err) {
console.error(`Gagal kirim ke grup ${groupId}:`, err)
}
await sleep(global.JedaJpm || 3000)
}

if (mediaPath) await fs.unlinkSync(mediaPath)
delete global.statusjpm
await sock.sendMessage(senderChat, {
text: `JPM ${mediaPath ? ( /image/.test(mimeType) ? "dengan foto" : "dengan video" ) : "teks"} hidetag berhasil dikirim ke ${successCount} grup.`,
}, { quoted: m })
}
break

case "sticker": case "stiker": case "sgif": case "s": {
if (!/image|video/.test(mime)) return m.reply("Kirim foto dengan caption .sticker")
if (/video/.test(mime)) {
if ((qmsg).seconds > 15) return m.reply("Durasi vidio maksimal 15 detik!")
}
var media = await sock.downloadAndSaveMediaMessage(qmsg)
await sock.sendStimg(m.chat, media, m, {packname: "Amane."})
}
break

case "emojimix": {
    if (!text || !text.includes("+")) {
        return m.reply(`*Contoh penggunaan:*\n${cmd} 😁+😘`)
    }

    try {
        const [emoji1, emoji2] = text.split("+").map(e => e.trim())
        if (!emoji1 || !emoji2) return m.reply("Format salah! Gunakan dua emoji, contoh: 😎+😆")

        await m.reply("⏳ Sedang membuat kombinasi emoji...")

        const apiUrl = `https://sitesfyxzpedia-api.vercel.app/tools/emojimix?apikey=Fyxz&emoji1=${encodeURIComponent(emoji1)}&emoji2=${encodeURIComponent(emoji2)}`
        const response = await axios.get(apiUrl, { responseType: "arraybuffer" })

        const buffer = Buffer.from(response.data)
        await sock.sendStimg(m.chat, buffer, m, {
            packname: "Amane.",
            author: "EmojiMix Bot"
        })
    } catch (err) {
        console.error("EmojiMix Error:", err)
        return m.reply("❌ Gagal membuat kombinasi emoji.\nPastikan kamu menggunakan dua emoji valid.")
    }
}
break;
case "brat": {
    if (!text) return m.reply(`📜 *Contoh:* ${cmd} Hallo Aku Amane!`);

    try {
        const apiUrl = `https://sitesfyxzpedia-api.vercel.app/imagecreator/bratv?apikey=Fyxz&text=${encodeURIComponent(text)}`;
        const media = await getBuffer(apiUrl);

        await sock.sendStimg(m.chat, media, m, {
            packname: "bot.",
            author: "Mane Store V3.0.0"
        });
    } catch (err) {
        console.log("❌ Error di case brat:", err);
        m.reply("⚠️ Gagal membuat sticker, coba lagi nanti ya!");
    }
}
break;

case "public":
case "self": {
    if (!isOwner) return m.reply(mess.owner);
    let path = require.resolve("./setting.js");
    let data = fs.readFileSync(path, "utf-8");

    if (command === "public") {
        global.mode_public = true;
        sock.public = global.mode_public
        let newData = data.replace(/global\.mode_public\s*=\s*(true|false)/, "global.mode_public = true");
        fs.writeFileSync(path, newData, "utf-8");
        return m.reply("✅ Mode berhasil diubah menjadi *Public*");
    }

    if (command === "self") {
        global.mode_public = false;
        sock.public = global.mode_public
        let newData = data.replace(/global\.mode_public\s*=\s*(true|false)/, "global.mode_public = false");
        fs.writeFileSync(path, newData, "utf-8");
        return m.reply("✅ Mode berhasil diubah menjadi *Self*");
    }
}
break;

case "setjeda": {
    if (!isOwner) return m.reply(mess.owner);
    if (!text) return m.reply(`*Contoh :*\n${cmd} push 5000\n${cmd} jpm 6000\n\nKeterangan format waktu:\n1 detik = 1000\n\nJeda waktu saat ini:\nJeda Pushkontak > ${global.JedaPushkontak}\nJeda JPM > ${global.JedaJpm}`);

    let args = text.split(" ");
    if (args.length < 2) return m.reply(`*Contoh :*\n${cmd} push 5000\n${cmd} jpm 6000\n\nKeterangan format waktu:\n1 detik = 1000\n\nJeda waktu saat ini:\nJeda Pushkontak > ${global.JedaPushkontak}\nJeda JPM > ${global.JedaJpm}`);

    let target = args[0].toLowerCase(); // push / jpm
    let value = args[1];

    if (isNaN(value)) return m.reply("Harus berupa angka!");
    let jeda = parseInt(value);

    let fs = require("fs");
    let path = require.resolve("./setting.js");
    let data = fs.readFileSync(path, "utf-8");

    if (target === "push") {
        let newData = data.replace(/global\.JedaPushkontak\s*=\s*\d+/, `global.JedaPushkontak = ${jeda}`);
        fs.writeFileSync(path, newData, "utf-8");
        global.JedaPushkontak = jeda;
        return m.reply(`✅ Berhasil mengubah *Jeda Push Kontak* menjadi *${jeda}* ms`);
    } 
    
    if (target === "jpm") {
        let newData = data.replace(/global\.JedaJpm\s*=\s*\d+/, `global.JedaJpm = ${jeda}`);
        fs.writeFileSync(path, newData, "utf-8");
        global.JedaJpm = jeda;
        return m.reply(`✅ Berhasil mengubah *Jeda JPM* menjadi *${jeda}* ms`);
    }

    return m.reply(`Pilihan tidak valid!\nGunakan: *push* atau *jpm*`);
}
break;

case "pushkontak": case "puskontak": {
if (!isOwner) return m.reply(mess.owner)
if (!text) return m.reply(`*Contoh :* ${cmd} pesannya`)
global.textpushkontak = text
let rows = []
const a = await sock.groupFetchAllParticipating()
if (a.length < 1) return m.reply("Tidak ada grup chat.")
const Data = Object.values(a)
let number = 0
for (let u of Data) {
const name = u.subject || "Unknown"
rows.push({
title: name,
description: `Total Member: ${u.participants.length}`, 
id: `.pushkontak-response ${u.id}`
})
}
await sock.sendMessage(m.chat, {
  buttons: [
    {
    buttonId: 'action',
    buttonText: { displayText: 'ini pesan interactiveMeta' },
    type: 4,
    nativeFlowInfo: {
        name: 'single_select',
        paramsJson: JSON.stringify({
          title: 'Pilih Grup',
          sections: [
            {
              title: `© Powered By ${namaOwner}`,
              rows: rows
            }
          ]
        })
      }
      }
  ],
  headerType: 1,
  viewOnce: true,
  text: `\nPilih Target Grup Pushkontak\n`
}, { quoted: m })
}
break

case "pushkontak-response": {
  if (!isOwner) return m.reply(mess.owner)
  if (!global.textpushkontak) return m.reply(`Data teks pushkontak tidak ditemukan!\nSilahkan ketik *.pushkontak* pesannya`);
  const teks = global.textpushkontak
  const jidawal = m.chat
  const data = await sock.groupMetadata(text)
  const halls = data.participants
    .filter(v => v.id.includes("@s.whatsapp.net") ? v.id : v.jid)
    .map(v => v.id.includes("@s.whatsapp.net") ? v.id : v.jid)
    .filter(id => id !== botNumber && id.split("@")[0] !== global.owner); 

  await m.reply(`🚀 Memulai pushkontak ke dalam grup ${data.subject} dengan total member ${halls.length}`);
  
  global.statuspush = true
  
 delete global.textpushkontak
 let count = 0
 
  for (const mem of halls) {
    if (global.stoppush) {
    delete global.stoppush
    delete global.statuspush
    break
    }
    await sock.sendMessage(mem, { text: teks }, { quoted: FakeChannel });
    // Jeda acak antara 20 sampai 50 detik
const delayAcak = Math.floor(Math.random() * (50000 - 20000 + 1)) + 20000;
await global.sleep(delayAcak);

    count += 1
  }
  
  delete global.statuspush
  await m.reply(`✅ Sukses pushkontak!\nPesan berhasil dikirim ke *${count}* member.`, jidawal)
}
break

case "pushkontak2":
case "puskontak2": {
  if (!isOwner) return m.reply(mess.owner)
  if (!text) return m.reply(`*ex:* ${cmd} namakontak\ndengan reply pesan yang akan dikirim`)
  if (!text) return m.reply(`*ex:* ${cmd} namakontak`)
  if (text.includes(" ")) return m.reply(`Format namakontak dilarang memakai spasi!`)  

  global.namaPushKontak = text
  global.textpushkontak = m?.quoted?.text || m?.quoted?.caption || null
  if (!global.textpushkontak) return m.reply(`*ex:* ${cmd} namakontak\ndengan reply pesan yang akan dikirim`)

  if (!global.textpushkontak)
    return m.reply("Pesan tidak valid")

  const groups = await sock.groupFetchAllParticipating()
  if (!groups || Object.keys(groups).length === 0)
    return m.reply("Bot tidak tergabung di grup manapun")

  global.dataAllGrup = groups

  const rows = Object.values(groups).map(g => ({
    title: g.subject || "Tanpa Nama",
    description: `${g.participants.length} member`,
    id: `.pushkontak-response ${g.id}`
  }))

  await sock.sendMessage(m.chat, {
    text: "\nPilih grup target pushkontak\n",
    viewOnce: true,
    buttons: [
      {
        buttonId: "select_gc",
        buttonText: { displayText: "Pilih Grup" },
        type: 4,
        nativeFlowInfo: {
          name: "single_select",
          paramsJson: JSON.stringify({
            title: "Daftar Grup",
            sections: [
              {
                rows
              }
            ]
          })
        }
      }
    ],
    headerType: 1
  }, { quoted: m })
}
break

case "pushkontak-response": {
  if (!isOwner) return m.reply(mess.owner)

  if (
    !global.textpushkontak ||
    !global.dataAllGrup ||
    !global.namaPushKontak
  ) {
    return m.reply(
      "Data pushkontak tidak ditemukan\nUlangi dengan .pushkontak namakontak"
    )
  }

  const groupId = text
  const groupData = global.dataAllGrup[groupId]
  if (!groupData) return m.reply("Grup tidak ditemukan")

  const members = groupData.participants
    .map(v => v.jid || v.id)
    .filter(jid => jid && jid !== m.botNumber)

  global.statusPushkontak = true

  await m.reply(
    `Memulai pushkontak...\n\n` +
    `Grup: ${groupData.subject}\n` +
    `Total: ${members.length} member`
  )

  let success = 0

  for (const jid of members) {
    try {
      if (!global.statusPushkontak) break
      
       await sock.chatModify({
        contact: {
          fullName:
            global.namaPushKontak + " #" + jid.split("@")[0],
          lidJid: jid,
          saveOnPrimaryAddressbook: true
        }
      }, jid).then( async() => {
      await sleep(3000)
      await sock.sendMessage(
        jid,
        { text: global.textpushkontak },
        { quoted: qtext }
      )

      success++
      await sleep(global.jedaPush)
     
     })
     
    } catch (e) {
      console.log("Gagal kirim ke:", jid)
    }
  }

  delete global.textpushkontak
  delete global.dataAllGrup
  delete global.namaPushKontak

  return m.reply(
    `Pushkontak selesai ✅\nBerhasil ke ${success} member`
  )
}
break

case "savenomor":
case "sv":
case "save": {
    if (!isOwner) return m.reply(mess.owner)

    let nomor, nama

    if (m.isGroup) {
        if (!text) return m.reply(`*Contoh penggunaan di grup:*\n${cmd} @tag|nama\natau reply target dengan:\n${cmd} nama`)

        // Jika ada tag
        if (m.mentionedJid[0]) {
            nomor = m.mentionedJid[0]
            nama = text.split("|")[1]?.trim()
            if (!nama) return m.reply(`Harap tulis nama setelah "|"\n*Contoh:* ${cmd} @tag|nama`)
        } 
        // Jika reply
        else if (m.quoted) {
            nomor = m.quoted.sender
            nama = text.trim()
        } 
        // Jika input manual nomor
        else if (/^\d+$/.test(text.split("|")[0])) {
            nomor = text.split("|")[0].replace(/[^0-9]/g, "") + "@s.whatsapp.net"
            nama = text.split("|")[1]?.trim()
            if (!nama) return m.reply(`Harap tulis nama setelah "|"\n*Contoh:* ${cmd} 628xxxx|nama`)
        } 
        else {
            return m.reply(`*Contoh penggunaan di grup:*\n${cmd} @tag|nama\natau reply target dengan:\n${cmd} nama`)
        }
    } else {
        // Private chat hanya nama
        if (!text) return m.reply(`*Contoh penggunaan di private:*\n${cmd} nama`)
        nomor = m.chat
        nama = text.trim()
    }

    const contactAction = {
        "fullName": nama,
        "lidJid": nomor,
        "saveOnPrimaryAddressbook": true
    };

    await sock.addOrEditContact(nomor, contactAction);

    return m.reply(`✅ Berhasil menyimpan kontak

- Nomor: ${nomor.split("@")[0]}
- Nama: ${nama}`)
}
break

case "savekontak": case "svkontak": {
if (!isOwner) return m.reply(mess.owner)
if (!text) return m.reply(`Masukan namakontak\n*Contoh :* ${cmd} Amane`)
global.namakontak = text
let rows = []
const a = await sock.groupFetchAllParticipating()
if (a.length < 1) return m.reply("Tidak ada grup chat.")
const Data = Object.values(a)
let number = 0
for (let u of Data) {
const name = u.subject || "Unknown"
rows.push({
title: name,
description: `Total Member: ${u.participants.length}`, 
id: `.savekontak-response ${u.id}`
})
}
await sock.sendMessage(m.chat, {
  buttons: [
    {
    buttonId: 'action',
    buttonText: { displayText: 'ini pesan interactiveMeta' },
    type: 4,
    nativeFlowInfo: {
        name: 'single_select',
        paramsJson: JSON.stringify({
          title: 'Pilih Grup',
          sections: [
            {
              title: `© Powered By ${namaOwner}`,
              rows: rows
            }
          ]
        })
      }
      }
  ],
  headerType: 1,
  viewOnce: true,
  text: `\nPilih Target Grup Savekontak\n`
}, { quoted: m })
}
break

case "savekontak-response": {
  if (!isOwner) return m.reply(mess.owner)
  if (!global.namakontak) return m.reply(`Data nama savekontak tidak ditemukan!\nSilahkan ketik *.savekontak* namakontak`);
  try {
    const res = await sock.groupMetadata(text)
    const halls = res.participants
      .filter(v => v.id.includes("@s.whatsapp.net") ? v.id : v.jid)
      .map(v => v.id.includes("@s.whatsapp.net") ? v.id : v.jid)
      .filter(id => id !== botNumber && id.split("@")[0] !== global.owner)

    if (!halls.length) return m.reply("Tidak ada kontak yang bisa disimpan.")
    let names = text
    const existingContacts = JSON.parse(fs.readFileSync('./data/contacts.json', 'utf8') || '[]')
    const newContacts = [...new Set([...existingContacts, ...halls])]

    fs.writeFileSync('./data/contacts.json', JSON.stringify(newContacts, null, 2))

    // Buat file .vcf
    const vcardContent = newContacts.map(contact => {
      const phone = contact.split("@")[0]
      return [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `FN:${global.namakontak} - ${phone}`,
        `TEL;type=CELL;type=VOICE;waid=${phone}:+${phone}`,
        "END:VCARD",
        ""
      ].join("\n")
    }).join("")

    fs.writeFileSync("./data/contacts.vcf", vcardContent, "utf8")

    // Kirim ke private chat
    if (m.chat !== m.sender) {
      await m.reply(`Berhasil membuat file kontak dari grup ${res.subject}\n\nFile kontak telah dikirim ke private chat\nTotal ${halls.length} kontak`)
    }

    await sock.sendMessage(
      m.sender,
      {
        document: fs.readFileSync("./data/contacts.vcf"),
        fileName: "contacts.vcf",
        caption: `File kontak berhasil dibuat ✅\nTotal ${halls.length} kontak`,
        mimetype: "text/vcard",
      },
      { quoted: m }
    )
    
    delete global.namakontak

    fs.writeFileSync("./data/contacts.json", "[]")
    fs.writeFileSync("./data/contacts.vcf", "")

  } catch (err) {
    m.reply("Terjadi kesalahan saat menyimpan kontak:\n" + err.toString())
  }
}
break

case "stopjpm": {
if (!isOwner) return m.reply(mess.owner)
if (!global.statusjpm) return m.reply("Jpm sedang tidak berjalan!")
global.stopjpm = true
return m.reply("Berhasil menghentikan jpm ✅")
}
break

case "stoppushkontak": case "stoppush": case "stoppus": {
if (!isOwner) return m.reply(mess.owner)
if (!global.statuspush) return m.reply("Pushkontak sedang tidak berjalan!")
global.stoppush = true
return m.reply("Berhasil menghentikan pushkontak ✅")
}
break

case "subdo":
case "subdomain": {
    if (!isOwner) return m.reply(mess.owner);
    if (!text.includes("|")) return m.reply(`*Contoh penggunaan :*
ketik ${cmd} hostname|ipvps`);

    const obj = Object.keys(subdomain);
    if (obj.length < 1) return m.reply("Tidak ada domain yang tersedia.");

    const hostname = text.split("|")[0].toLowerCase();
    const ip = text.split("|")[1];
    const rows = obj.map((domain, index) => ({
        title: `🌐 ${domain}`,
        description: `Result: https://${hostname}.${domain}`,
        id: `.subdomain-response ${index + 1} ${hostname.trim()}|${ip}`
    }));

    await sock.sendMessage(m.chat, {
        buttons: [
            {
                buttonId: 'action',
                buttonText: { displayText: 'ini pesan interactiveMeta' },
                type: 4,
                nativeFlowInfo: {
                    name: 'single_select',
                    paramsJson: JSON.stringify({
                        title: 'Pilih Domain',
                        sections: [
                            {
                                title: `© Powered By ${namaOwner}`,
                                rows: rows
                            }
                        ]
                    })
                }
            }
        ],
        headerType: 1,
        viewOnce: true,
        text: `\nPilih Domain Server Yang Tersedia\nTotal Domain: ${obj.length}\n`
    }, { quoted: m });
}
break;

case "subdomain-response": { 
    if (!isOwner) return m.reply(mess.owner);
    if (!text) return;

    if (!args[0] || isNaN(args[0])) return m.reply("Domain tidak ditemukan!");
    const dom = Object.keys(subdomain);
    const domainIndex = Number(args[0]) - 1;
    if (domainIndex >= dom.length || domainIndex < 0) return m.reply("Domain tidak ditemukan!");

    if (!args[1] || !args[1].includes("|")) return m.reply("Hostname/IP Tidak ditemukan!");

    let tldnya = dom[domainIndex];
    const [host, ip] = args[1].split("|").map(str => str.trim());

    async function subDomain1(host, ip) {
        return new Promise((resolve) => {
            axios.post(
                `https://api.cloudflare.com/client/v4/zones/${subdomain[tldnya].zone}/dns_records`,
                {
                    type: "A",
                    name: `${host.replace(/[^a-z0-9.-]/gi, "")}.${tldnya}`,
                    content: ip.replace(/[^0-9.]/gi, ""),
                    ttl: 3600,
                    priority: 10,
                    proxied: false,
                },
                {
                    headers: {
                        Authorization: `Bearer ${subdomain[tldnya].apitoken}`,
                        "Content-Type": "application/json",
                    },
                }
            ).then(response => {
                let res = response.data;
                if (res.success) {
                    resolve({ success: true, name: res.result?.name, ip: res.result?.content });
                } else {
                    resolve({ success: false, error: "Gagal membuat subdomain." });
                }
            }).catch(error => {
                let errorMsg = error.response?.data?.errors?.[0]?.message || error.message || "Terjadi kesalahan!";
                resolve({ success: false, error: errorMsg });
            });
        });
    }

    const domnode = `node${getRandom("")}.${host}`;
    let panelDomain = "";
    let nodeDomain = "";

    for (let i = 0; i < 2; i++) {
        let subHost = i === 0 ? host.toLowerCase() : domnode;
        try {
            let result = await subDomain1(subHost, ip);
            if (result.success) {
                if (i === 0) panelDomain = result.name;
                else nodeDomain = result.name;
            } else {
                return m.reply(result.error);
            }
        } catch (err) {
            return m.reply("Error: " + err.message);
        }
    }

    let teks = `
*✅ Subdomain Berhasil Dibuat*

- IP: ${ip}
- Panel: ${panelDomain}
- Node: ${nodeDomain}
`;

    let msg = await generateWAMessageFromContent(m.chat, {
        viewOnceMessage: {
            message: {
                interactiveMessage: {
                    body: { text: teks },
                    nativeFlowMessage: {
                        buttons: [
                            { 
                                name: "cta_copy",
                                buttonParamsJson: `{"display_text":"Copy Subdomain Panel","copy_code":"${panelDomain}"}`
                            },
                            { 
                                name: "cta_copy",
                                buttonParamsJson: `{"display_text":"Copy Subdomain Node","copy_code":"${nodeDomain}"}`
                            }
                        ]
                    }
                }
            }
        }
    }, { userJid: m.sender, quoted: m });

    await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
}
break;

case "installpanel": {
    if (!isOwner) return m.reply(mess.owner)
    if (!text) return m.reply("\nFormat salah!\n\n*Contoh penggunaan :*\nketik .installpanel ipvps|pwvps|panel.com|node.com|ramserver *(contoh 100000)*");
    
    let vii = text.split("|");
    if (vii.length < 5) return m.reply("\nFormat salah!\n\n*Contoh penggunaan :*\nketik .installpanel ipvps|pwvps|panel.com|node.com|ramserver *(contoh 100000)*");
    
    const ssh2 = require("ssh2");
    const ress = new ssh2.Client();
    const connSettings = {
        host: vii[0],
        port: '22',
        username: 'root',
        password: vii[1]
    };
    
    const jids = m.chat
    const usn = "admin"; 
    const pass = "admin001";
    let usernamePanel = usn;
    let passwordPanel = pass;
    const domainpanel = vii[2];
    const domainnode = vii[3];
    const ramserver = vii[4];
    const deletemysql = `\n`;
    const commandPanel = `bash <(curl -s https://pterodactyl-installer.se)`;
    
    async function instalWings() {
    ress.exec(commandPanel, async (err, stream) => {
        if (err) {
            console.error('Wings installation error:', err);
            m.reply(`Gagal memulai instalasi Wings: ${err.message}`);
            return ress.end();
        }
        
        stream.on('close', async (code, signal) => {
            await InstallNodes()            
        }).on('data', async (data) => {
            const dataStr = data.toString();
            console.log('Wings Install: ' + dataStr);
            
            if (dataStr.includes('Input 0-6')) {
                stream.write('1\n');
            }
            else if (dataStr.includes('(y/N)')) {
                stream.write('y\n');
            }
            else if (dataStr.includes('Enter the panel address (blank for any address)')) {
                stream.write(`${domainpanel}\n`);
            }
            else if (dataStr.includes('Database host username (pterodactyluser)')) {
                stream.write('admin\n');
            }
            else if (dataStr.includes('Database host password')) {
                stream.write('admin\n');
            }
            else if (dataStr.includes('Set the FQDN to use for Let\'s Encrypt (node.example.com)')) {
                stream.write(`${domainnode}\n`);
            }
            else if (dataStr.includes('Enter email address for Let\'s Encrypt')) {
                stream.write('admin@gmail.com\n');
            }
        }).stderr.on('data', async (data) => {
            console.error('Wings Install Error: ' + data);
            m.reply(`Error pada instalasi Wings:\n${data}`);
        });
    });
}

    async function InstallNodes() {
        ress.exec('bash <(curl -s https://raw.githubusercontent.com/SkyzoOffc/Pterodactyl-Theme-Autoinstaller/main/createnode.sh)', async (err, stream) => {
            if (err) throw err;
            
            stream.on('close', async (code, signal) => {
                
    let teks = `
*Install Panel Telah Berhasil ✅*

*Berikut Detail Akun Panel Kamu 📦*

👤 Username : \`${usernamePanel}\`
🔐 Password : \`${passwordPanel}\`
🌐 ${domainpanel}

Silahkan setting allocation & ambil token node di node yang sudah dibuat oleh bot.

*Cara menjalankan wings :*
\`.startwings ipvps|pwvps|tokennode\`
    `;

    let msg = await generateWAMessageFromContent(m.chat, {
        viewOnceMessage: {
            message: {
                interactiveMessage: {
                    body: { text: teks },
                    nativeFlowMessage: {
                        buttons: [
                            { 
                                name: "cta_copy",
                                buttonParamsJson: `{"display_text":"Copy Username","copy_code":"${usernamePanel}"}`
                            },
                            { 
                                name: "cta_copy",
                                buttonParamsJson: `{"display_text":"Copy Password","copy_code":"${passwordPanel}"}`
                            },
                            { 
                                name: "cta_url",
                                buttonParamsJson: `{"display_text":"Login Panel","url":"${domainpanel}"}`
                            }
                        ]
                    }, 
                    contextInfo: {
                    isForwarded: true
                    }
                }
            }
        }
    }, {});

    await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
                
                ress.end();
            }).on('data', async (data) => {
                await console.log(data.toString());
                if (data.toString().includes("Masukkan nama lokasi: ")) {
                    stream.write('Singapore\n');
                }
                if (data.toString().includes("Masukkan deskripsi lokasi: ")) {
                    stream.write('Node By Skyzo\n');
                }
                if (data.toString().includes("Masukkan domain: ")) {
                    stream.write(`${domainnode}\n`);
                }
                if (data.toString().includes("Masukkan nama node: ")) {
                    stream.write('Amane\n');
                }
                if (data.toString().includes("Masukkan RAM (dalam MB): ")) {
                    stream.write(`${ramserver}\n`);
                }
                if (data.toString().includes("Masukkan jumlah maksimum disk space (dalam MB): ")) {
                    stream.write(`${ramserver}\n`);
                }
                if (data.toString().includes("Masukkan Locid: ")) {
                    stream.write('1\n');
                }
            }).stderr.on('data', async (data) => {
                console.log('Stderr : ' + data);
                m.reply(`Error pada instalasi Wings: ${data}`);
            });
        });
    }

    async function instalPanel() {
        ress.exec(commandPanel, (err, stream) => {
            if (err) throw err;
            
            stream.on('close', async (code, signal) => {
                await instalWings();
            }).on('data', async (data) => {
                if (data.toString().includes('Input 0-6')) {
                    stream.write('0\n');
                } 
                if (data.toString().includes('(y/N)')) {
                    stream.write('y\n');
                } 
                if (data.toString().includes('Database name (panel)')) {
                    stream.write('\n');
                }
                if (data.toString().includes('Database username (pterodactyl)')) {
                    stream.write('admin\n');
                }
                if (data.toString().includes('Password (press enter to use randomly generated password)')) {
                    stream.write('admin\n');
                } 
                if (data.toString().includes('Select timezone [Europe/Stockholm]')) {
                    stream.write('Asia/Jakarta\n');
                } 
                if (data.toString().includes('Provide the email address that will be used to configure Let\'s Encrypt and Pterodactyl')) {
                    stream.write('admin@gmail.com\n');
                } 
                if (data.toString().includes('Email address for the initial admin account')) {
                    stream.write('admin@gmail.com\n');
                } 
                if (data.toString().includes('Username for the initial admin account')) {
                    stream.write('admin\n');
                } 
                if (data.toString().includes('First name for the initial admin account')) {
                    stream.write('admin\n');
                } 
                if (data.toString().includes('Last name for the initial admin account')) {
                    stream.write('admin\n');
                } 
                if (data.toString().includes('Password for the initial admin account')) {
                    stream.write(`${passwordPanel}\n`);
                } 
                if (data.toString().includes('Set the FQDN of this panel (panel.example.com)')) {
                    stream.write(`${domainpanel}\n`);
                } 
                if (data.toString().includes('Do you want to automatically configure UFW (firewall)')) {
                    stream.write('y\n')
                } 
                if (data.toString().includes('Do you want to automatically configure HTTPS using Let\'s Encrypt? (y/N)')) {
                    stream.write('y\n');
                } 
                if (data.toString().includes('Select the appropriate number [1-2] then [enter] (press \'c\' to cancel)')) {
                    stream.write('1\n');
                } 
                if (data.toString().includes('I agree that this HTTPS request is performed (y/N)')) {
                    stream.write('y\n');
                }
                if (data.toString().includes('Proceed anyways (your install will be broken if you do not know what you are doing)? (y/N)')) {
                    stream.write('y\n');
                } 
                if (data.toString().includes('(yes/no)')) {
                    stream.write('y\n');
                } 
                if (data.toString().includes('Initial configuration completed. Continue with installation? (y/N)')) {
                    stream.write('y\n');
                } 
                if (data.toString().includes('Still assume SSL? (y/N)')) {
                    stream.write('y\n');
                } 
                if (data.toString().includes('Please read the Terms of Service')) {
                    stream.write('y\n');
                }
                if (data.toString().includes('(A)gree/(C)ancel:')) {
                    stream.write('A\n');
                } 
                console.log('Logger: ' + data.toString());
            }).stderr.on('data', (data) => {
                m.reply(`Error Terjadi kesalahan :\n${data}`);
                console.log('STDERR: ' + data);
            });
        });
    }

    ress.on('ready', async () => {
        await m.reply(`*Memproses install server panel 🚀*\n\n` +
                     `*IP Address:* ${vii[0]}\n` +
                     `*Domain Panel:* ${domainpanel}\n\n` +
                     `Mohon tunggu 10-20 menit hingga proses install selesai`);
        
        ress.exec(deletemysql, async (err, stream) => {
            if (err) throw err;
            
            stream.on('close', async (code, signal) => {
                await instalPanel();
            }).on('data', async (data) => {
                await stream.write('\t');
                await stream.write('\n');
                await console.log(data.toString());
            }).stderr.on('data', async (data) => {
                m.reply(`Error Terjadi kesalahan :\n${data}`);
                console.log('Stderr : ' + data);
            });
        });
    });

    ress.on('error', (err) => {
        console.error('SSH Connection Error:', err);
        m.reply(`Gagal terhubung ke server: ${err.message}`);
    });

    ress.connect(connSettings);
}
break

case "startwings":
case "configurewings": {
    if (!isOwner) return m.reply(mess.owner)
    let t = text.split('|');
    if (t.length < 3) return m.reply("\nFormat salah!\n\n*Contoh penggunaan :*\nketik .startwings ipvps|pwvps|token_wings");

    let ipvps = t[0].trim();
    let passwd = t[1].trim();
    let token = t[2].trim();

    const connSettings = {
        host: ipvps,
        port: 22,
        username: 'root',
        password: passwd
    };

    const command = `${token} && systemctl start wings`;

    const ress = new ssh2.Client();

    ress.on('ready', () => {
        ress.exec(command, (err, stream) => {
            if (err) {
                m.reply('Gagal menjalankan perintah di VPS');
                ress.end();
                return;
            }

            stream.on('close', async (code, signal) => {
                await m.reply("Berhasil menjalankan wings node panel pterodactyl ✅");
                ress.end();
            }).on('data', (data) => {
                console.log("STDOUT:", data.toString());
            }).stderr.on('data', (data) => {
                console.log("STDERR:", data.toString());
                // Opsi jika perlu input interaktif
                stream.write("y\n");
                stream.write("systemctl start wings\n");
                m.reply('Terjadi error saat eksekusi:\n' + data.toString());
            });
        });
    }).on('error', (err) => {
        console.log('Connection Error:', err.message);
        m.reply('Gagal terhubung ke VPS: IP atau password salah.');
    }).connect(connSettings);
}
break;

case "cvps":
case "createvps": {
  if (!isOwner) return m.reply(mess.owner)

  const rows = Object.entries(settingVps).map(([key, spec]) => ({
    title: `⚡ ${spec.ram} RAM / ${spec.cpu} / ${spec.disk} Disk`,
    description: `Spec: ${key}`,
    id: `.cvps-spec ${key}`
  }))

  return sock.sendMessage(m.chat, {
    text: `\n🖥️ *Pilih Spesifikasi VPS*\n`,
    buttons: [{
      buttonId: "select_cvps_spec",
      buttonText: { displayText: "⚡ Pilih Spec" },
      type: 4,
      nativeFlowInfo: {
        name: "single_select",
        paramsJson: JSON.stringify({
          title: "Pilih Spesifikasi",
          sections: [{ rows }]
        })
      }
    }],
    headerType: 1,
    viewOnce: true
  }, { quoted: m })
}
break

case "cvps-spec": {
  if (!isOwner) return m.reply(mess.owner)
  if (!text) return m.reply("Spec tidak ditemukan!")

  const specKey = text
  if (!settingVps[specKey]) return reply("Spec tidak valid!")

  const rows = Object.entries(vpsImages).map(([key, os]) => ({
    title: `🐧 ${os.name}`,
    description: `OS: ${key}`,
    id: `.cvps-os ${specKey}|${key}`
  }))

  return sock.sendMessage(m.chat, {
    text: `\n🐧 *Pilih OS VPS*\n\nSpec: *${settingVps[specKey].ram} / ${settingVps[specKey].cpu}*\n`,
    buttons: [{
      buttonId: "select_cvps_os",
      buttonText: { displayText: "🐧 Pilih OS" },
      type: 4,
      nativeFlowInfo: {
        name: "single_select",
        paramsJson: JSON.stringify({
          title: "Pilih OS",
          sections: [{ rows }]
        })
      }
    }],
    headerType: 1,
    viewOnce: true
  }, { quoted: m })
}
break

case "cvps-os": {
  if (!isOwner) return m.reply(mess.owner)
  if (!text) return m.reply("Data tidak ditemukan!")

  const [specKey, osKey] = text.split("|")
  if (!settingVps[specKey] || !vpsImages[osKey]) return reply("Data tidak valid!")

  const rows = Object.entries(vpsRegions).map(([key, region]) => ({
    title: `🌍 ${region.name}`,
    description: `Region: ${key}`,
    id: `.cvps-region ${specKey}|${osKey}|${key}`
  }))

  return sock.sendMessage(m.chat, {
    text: `\n🌍 *Pilih Region VPS*\n\nSpec: *${settingVps[specKey].ram} / ${settingVps[specKey].cpu}*\nOS: *${vpsImages[osKey].name}*\n`,
    buttons: [{
      buttonId: "select_cvps_region",
      buttonText: { displayText: "🌍 Pilih Region" },
      type: 4,
      nativeFlowInfo: {
        name: "single_select",
        paramsJson: JSON.stringify({
          title: "Pilih Region",
          sections: [{ rows }]
        })
      }
    }],
    headerType: 1,
    viewOnce: true
  }, { quoted: m })
}
break

case "cvps-region": {
  if (!isOwner) return m.reply(mess.owner)
  if (!text) return m.reply("Data tidak ditemukan!")

  const [specKey, osKey, regionKey] = text.split("|")
  if (!settingVps[specKey] || !vpsImages[osKey] || !vpsRegions[regionKey]) {
    return reply("Data tidak valid!")
  }

  const spec = settingVps[specKey]
  const os = vpsImages[osKey]
  const region = vpsRegions[regionKey]

  const hostname = `cvps-${generateRandomNumber(100,999)}`

  const teks = `
🖥️ *Konfirmasi Create VPS*

├ Hostname: *${hostname}*
├ Spec: ${spec.ram} / ${spec.cpu} / ${spec.disk}
├ OS: ${os.name}
└ Region: ${region.name} (${regionKey})
`

  return sock.sendMessage(m.chat, {
    buttons: [
      { buttonId: `.cvps-confirm ${hostname}|${specKey}|${osKey}|${regionKey}`, buttonText: { displayText: "🚀 Create VPS" }, type: 1 }
    ],
    headerType: 1,
    viewOnce: true,
    text: teks
  }, { quoted: m })
}
break

case "cvps-confirm": {
  if (!isOwner) return m.reply(mess.owner)
  if (!text) return m.reply("Format salah!")

  const [hostname, specKey, osKey, regionKey] = text.split("|")
  if (!hostname || !settingVps[specKey] || !vpsImages[osKey] || !vpsRegions[regionKey]) {
    return reply("Data tidak valid!")
  }

  try {
    const pw = await generateStrongPassword()
    const pws = pw
    const password = pws

    await m.reply("🚀 Membuat VPS Digital Ocean... Mohon tunggu ±1-3 menit")

    const dropletId = await createVPSDroplet(
      setting.digitalocean.apiKey,
      hostname,
      specKey,
      osKey,
      regionKey,
      password
    )

    const ipAddress = await waitForDropletIP(setting.digitalocean.apiKey, dropletId)

    const detail = `
✅ *VPS BERHASIL DIBUAT*

├ Hostname: *${hostname}*
├ IP: *${ipAddress}*
├ Username: *root*
├ Password: *${password}*
├ Droplet ID: *${dropletId}*
├ Region: *${vpsRegions[regionKey].name}*
├ Spec: ${settingVps[specKey].ram} / ${settingVps[specKey].cpu} / ${settingVps[specKey].disk}
└ Dibuat: ${tanggal()}
`

    return sock.sendMessage(m.chat, { text: detail }, { quoted: m })

  } catch (err) {
    console.error(err)
    return m.reply(`❌ Gagal membuat VPS\n\nError: ${err.message}`)
  }
}
break

//==================================//

case "delvps":
case "deldroplet":
case "deletevps": {
  if (!isOwner) return m.reply(mess.owner)
  const doApiKey = setting.digitalocean.apiKey
  if (!doApiKey) return m.reply(`⚠️ *ᴅɪɢɪᴛᴀʟᴏᴄᴇᴀɴ ʙᴇʟᴜᴍ ᴅɪsᴇᴛᴜᴘ*

> Isi \`apikeyDigitalocean\` di config`)
  if (!text) return m.reply(`⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*

> \`${cmd} <droplet_id>\`
> Gunakan \`${m.prefix}listdroplet\` untuk melihat ID`)

  const dropletId = text.trim()
  await m.reply(`🗑️ *ᴍᴇɴɢʜᴀᴘᴜs ᴠᴘs...*

> ID: \`${dropletId}\``)

  try {
    const response = await fetch(`https://api.digitalocean.com/v2/droplets/${dropletId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${doApiKey}`
      }
    })

    if (response.ok) {
      m.react("✅")
      return m.reply(`✅ *ᴠᴘs ʙᴇʀʜᴀsɪʟ ᴅɪʜᴀᴘᴜs*

> ID: \`${dropletId}\``)
    } else {
      const errorData = await response.json()
      return m.reply(`❌ *ɢᴀɢᴀʟ ᴍᴇɴɢʜᴀᴘᴜs*

> ${errorData.message || "Unknown error"}`)
    }
  } catch (err) {
    console.error("[delvps] Error:", err)
    return m.reply(`❌ *Terjadi kesalahan*

> ${err.message}`)
  }
}
break

//==================================//

case 'listvps':
case 'listdroplet':
case 'vpslist': {
  if (!isOwner) return m.reply(mess.owner)
  const doApiKey = setting.digitalocean.apiKey
  if (!doApiKey) return m.reply(`⚠️ *ᴅɪɢɪᴛᴀʟᴏᴄᴇᴀɴ ʙᴇʟᴜᴍ ᴅɪsᴇᴛᴜᴘ*\n\n> Isi \`apikeyDigitalocean\` di config`)

  await m.reply(`⏳ *ᴍᴇɴɢᴀᴍʙɪʟ ᴅᴀᴛᴀ ᴠᴘs...*`)

  try {
    const [accountRes, dropletsRes] = await Promise.all([
      fetch('https://api.digitalocean.com/v2/account', {
        headers: { 'Authorization': `Bearer ${doApiKey}` }
      }),
      fetch('https://api.digitalocean.com/v2/droplets', {
        headers: { 'Authorization': `Bearer ${doApiKey}` }
      })
    ])

    if (!accountRes.ok || !dropletsRes.ok) {
      return m.reply(`❌ *Gagal mengambil data DigitalOcean*`)
    }

    const accountData = await accountRes.json()
    const dropletsData = await dropletsRes.json()
    const account = accountData.account
    const droplets = dropletsData.droplets || []
    const dropletLimit = account.droplet_limit
    const remainingDroplets = dropletLimit - droplets.length

    let txt = `📋 *ʟɪsᴛ ᴠᴘs ᴅɪɢɪᴛᴀʟᴏᴄᴇᴀɴ*\n`
    txt += `> Total: *${droplets.length}* droplet | Limit: *${dropletLimit}* | Sisa: *${remainingDroplets}*\n\n`

    if (droplets.length === 0) {
      txt += `> Tidak ada VPS yang tersedia.`
    } else {
      for (const droplet of droplets) {
        const ip = droplet.networks?.v4?.find(n => n.type === 'public')?.ip_address || '-'
        const status = droplet.status === 'active' ? '🟢' : '🔴'
        txt += `╭─────────────\n`
        txt += `┃ ${status} *${droplet.name}*\n`
        txt += `┃ 🆔 ID: \`${droplet.id}\`\n`
        txt += `┃ 🌐 IP: \`${ip}\`\n`
        txt += `┃ 💾 RAM: ${droplet.memory} MB\n`
        txt += `┃ ⚡ CPU: ${droplet.vcpus} vCPU\n`
        txt += `┃ 💿 Disk: ${droplet.disk} GB\n`
        txt += `┃ 🖥️ OS: ${droplet.image?.distribution} ${droplet.image?.name}\n`
        txt += `┃ 📍 Region: ${droplet.region?.name || droplet.region?.slug}\n`
        txt += `┃ 📊 Status: ${droplet.status}\n`
        txt += `╰─────────────\n\n`
      }
    }

    return sock.sendMessage(m.chat, { text: txt }, { quoted: m })
  } catch (err) {
    console.error('[listvps] Error:', err)
    return m.reply(`❌ *Terjadi kesalahan*\n\n> ${err.message}`)
  }
}
break;

//==================================//

case "cekvps":
case "cekdroplet":
case "vpsstatus":
case "infovps": {
  if (!isOwner) return m.reply(mess.owner)
  const doApiKey = setting.digitalocean.apiKey
  if (!doApiKey) return m.reply(`⚠️ *ᴅɪɢɪᴛᴀʟᴏᴄᴇᴀɴ ʙᴇʟᴜᴍ ᴅɪsᴇᴛᴜᴘ*`)

  const dropletId = text?.trim()
  if (!dropletId) return m.reply(`⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n> \`${cmd} <droplet_id>\``)

  try {
    const response = await fetch(`https://api.digitalocean.com/v2/droplets/${dropletId}`, {
      headers: { 'Authorization': `Bearer ${doApiKey}` }
    })

    if (!response.ok) {
      const errData = await response.json()
      return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${errData.message || 'Droplet tidak ditemukan'}`)
    }

    const data = await response.json()
    const droplet = data.droplet
    const ip = droplet.networks?.v4?.find(n => n.type === 'public')?.ip_address || '-'
    const ipv6 = droplet.networks?.v6?.[0]?.ip_address || '-'
    const status = droplet.status === 'active' ? '🟢 Active' : '🔴 ' + droplet.status

    let txt = `📋 *ᴅᴇᴛᴀɪʟ ᴠᴘs*\n\n`
    txt += `╭─「 🖥️ *ɪɴꜰᴏ* 」\n`
    txt += `┃ 🆔 \`ɪᴅ\`: *${droplet.id}*\n`
    txt += `┃ 🏷️ \`ɴᴀᴍᴇ\`: *${droplet.name}*\n`
    txt += `┃ 📊 \`sᴛᴀᴛᴜs\`: *${status}*\n`
    txt += `┃ 🌐 \`ɪᴘᴠ4\`: *${ip}*\n`
    txt += `┃ 🌍 \`ɪᴘᴠ6\`: *${ipv6}*\n`
    txt += `╰───────────────\n\n`
    txt += `╭─「 🧠 *sᴘᴇᴄ* 」\n`
    txt += `┃ 💾 \`ʀᴀᴍ\`: *${droplet.memory} MB*\n`
    txt += `┃ ⚡ \`ᴄᴘᴜ\`: *${droplet.vcpus} vCPU*\n`
    txt += `┃ 💿 \`ᴅɪsᴋ\`: *${droplet.disk} GB*\n`
    txt += `┃ 🌏 \`ʀᴇɢɪᴏɴ\`: *${droplet.region?.name || droplet.region?.slug}*\n`
    txt += `┃ 💻 \`ᴏs\`: *${droplet.image?.distribution} ${droplet.image?.name}*\n`
    txt += `╰───────────────\n\n`
    txt += `> 📅 Created: ${new Date(droplet.created_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`

    return m.reply(txt)
  } catch (err) {
    console.error('[cekvps] Error:', err)
    return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${err.message}`)
  }
}
break

//==================================//

case "sisavps":
case "sisadroplet":
case "vpsquota": {
  if (!isOwner) return m.reply(mess.owner)
  const doApiKey = setting.digitalocean.apiKey
  if (!doApiKey) return m.reply(`⚠️ *ᴅɪɢɪᴛᴀʟᴏᴄᴇᴀɴ ʙᴇʟᴜᴍ ᴅɪsᴇᴛᴜᴘ*`)

  try {
    const [accountRes, dropletsRes] = await Promise.all([
      fetch('https://api.digitalocean.com/v2/account', {
        headers: { 'Authorization': `Bearer ${doApiKey}` }
      }),
      fetch('https://api.digitalocean.com/v2/droplets', {
        headers: { 'Authorization': `Bearer ${doApiKey}` }
      })
    ])

    if (!accountRes.ok || !dropletsRes.ok) {
      return m.reply(`❌ *Gagal mengambil data DigitalOcean*`)
    }

    const accountData = await accountRes.json()
    const dropletsData = await dropletsRes.json()
    const account = accountData.account
    const droplets = dropletsData.droplets || []
    const dropletLimit = account.droplet_limit
    const dropletsUsed = droplets.length
    const dropletsRemaining = dropletLimit - dropletsUsed

    let txt = `📊 *ᴋᴜᴏᴛᴀ ᴅɪɢɪᴛᴀʟᴏᴄᴇᴀɴ*\n\n`
    txt += `╭─────────────\n`
    txt += `┃ 📦 Limit: *${dropletLimit}* droplet\n`
    txt += `┃ ✅ Terpakai: *${dropletsUsed}* droplet\n`
    txt += `┃ 📋 Sisa: *${dropletsRemaining}* droplet\n`
    txt += `╰─────────────\n\n`
    txt += `> 👤 Email: ${account.email}\n`
    txt += `> ✅ Status: ${account.status}`

    return m.reply(txt)
  } catch (err) {
    console.error('[sisavps] Error:', err)
    return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${err.message}`)
  }
}
break

//==================================//

case "turnon":
case "turnoff":
case "restartvps":
case "rebootvps": {
  if (!isOwner) return m.reply(mess.owner)
  const doApiKey = setting.digitalocean.apiKey
  if (!doApiKey) return m.reply(`⚠️ *ᴅɪɢɪᴛᴀʟᴏᴄᴇᴀɴ ʙᴇʟᴜᴍ ᴅɪsᴇᴛᴜᴘ*`)

  const dropletId = text?.trim()
  if (!dropletId) return m.reply(`⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n> \`${cmd} <droplet_id>\``)

  const vpsActions = {
    'turnon':     { type: 'power_on',  emoji: '🟢', text: 'menghidupkan' },
    'turnoff':    { type: 'power_off', emoji: '🔴', text: 'mematikan' },
    'restartvps': { type: 'reboot',    emoji: '🔄', text: 'merestart' },
    'rebootvps':  { type: 'reboot',    emoji: '🔄', text: 'merestart' }
  }

  const vpsAction = vpsActions[command]
  if (!vpsAction) return m.reply(`❌ Aksi tidak dikenali.`)

  await m.reply(`${vpsAction.emoji} *sᴇᴅᴀɴɢ ${vpsAction.text.toUpperCase()} ᴠᴘs...*\n\n> ID: \`${dropletId}\``)

  try {
    const response = await fetch(
      `https://api.digitalocean.com/v2/droplets/${dropletId}/actions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${doApiKey}`
        },
        body: JSON.stringify({ type: vpsAction.type })
      }
    )

    if (!response.ok) {
      const errData = await response.json()
      return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${errData.message || 'Terjadi kesalahan'}`)
    }

    const actionData = await response.json()
    const actionResult = actionData.action

    m.react('✅')
    return m.reply(`✅ *ᴀᴋsɪ ʙᴇʀʜᴀsɪʟ*\n\n> ${vpsAction.emoji} VPS sedang di-${vpsAction.text}\n> Status: ${actionResult.status}`)
  } catch (err) {
    console.error('[vpskontrol] Error:', err)
    return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${err.message}`)
  }
}
break

//==================================//

// ─── Create Panel V1 ─────────────────────────────────────────────────────────
case "1gbv1": case "2gbv1": case "3gbv1": case "4gbv1": case "5gbv1":
case "6gbv1": case "7gbv1": case "8gbv1": case "9gbv1": case "10gbv1":
case "unlimitedv1": case "unliv1": {
    if (!isOwner && !global.resellerV1.includes(m.sender)) {
        return m.reply(`❌ Fitur ini hanya untuk *Owner* dan *Reseller Panel V1*!`);
    }
    if (!text) return m.reply(`*Contoh :* ${cmd} username,6283XXX\nAtau: ${cmd} username (otomatis ke pengirim)`);

    let nomor1, usernem1;
    const tek1 = text.split(",");
    if (tek1.length > 1) {
        const [u1, n1] = tek1.map(t => t.trim());
        if (!u1 || !n1) return m.reply(`*Contoh :* ${cmd} username,6283XXX`);
        nomor1   = n1.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
        usernem1 = u1.toLowerCase();
    } else {
        usernem1 = text.toLowerCase();
        nomor1   = m.isGroup ? m.sender : m.chat;
    }

    try {
        const onWa1 = await sock.onWhatsApp(nomor1.split("@")[0]);
        if (onWa1.length < 1) return m.reply("Nomor target tidak terdaftar di WhatsApp!");
    } catch (e1) {
        return m.reply("Terjadi kesalahan saat mengecek nomor WhatsApp: " + e1.message);
    }

    try {
        const result1 = await createPanelAccountVN(usernem1, command, global.panelV1, 1);
        if (!result1.success) return m.reply(`❌ Gagal membuat panel V1:\n${result1.message}`);

        const p1 = result1.data;
        if (nomor1 !== m.chat) {
            await m.reply(`✅ Berhasil membuat panel V1\nData akun terkirim ke nomor ${nomor1.split("@")[0]}`);
        }

        const teks1 = `
*✅ PANEL VERSI 1 BERHASIL*

📡 *Server ID:* ${p1.serverId}
👤 *Username:* \`${p1.username}\`
🔐 *Password:* \`${p1.password}\`
📧 *Email:* ${p1.email}
🗓️ *Aktivasi:* ${global.tanggal(Date.now())}

⚙️ *Spesifikasi Server*
- RAM  : ${p1.ram}
- DISK : ${p1.disk}
- CPU  : ${p1.cpu}
- Panel: ${p1.panelUrl}

*Rules Pembelian Panel V1*
- Masa aktif 30 hari
- Data bersifat pribadi, mohon disimpan dengan aman
- Garansi 15 hari (1x replace)
- Klaim garansi wajib menyertakan *bukti chat pembelian*
`;
        const msg1 = await generateWAMessageFromContent(nomor1, {
            viewOnceMessage: { message: { interactiveMessage: {
                body: { text: teks1 },
                nativeFlowMessage: { buttons: [
                    { name: "cta_copy", buttonParamsJson: `{"display_text":"Copy Username","copy_code":"${p1.username}"}` },
                    { name: "cta_copy", buttonParamsJson: `{"display_text":"Copy Password","copy_code":"${p1.password}"}` },
                    { name: "cta_url",  buttonParamsJson: `{"display_text":"Login Panel","url":"${p1.panelUrl}"}` }
                ]}
            }}}
        }, {});
        await sock.relayMessage(nomor1, msg1.message, { messageId: msg1.key.id });
    } catch (err1) {
        return m.reply("Terjadi kesalahan: " + err1.message);
    }
}
break;

// ─── Create Admin Panel V1 ───────────────────────────────────────────────────
case "cadminv1": {
    if (!isOwner && !global.resellerV1.includes(m.sender)) {
        return m.reply(`❌ Fitur ini hanya untuk *Owner* dan *Reseller Panel V1*!`);
    }
    if (!text) return m.reply(`*Contoh :* ${cmd} username,628XXX`);

    let nomorA1, usernameA1;
    const tekA1 = text.split(",");
    if (tekA1.length > 1) {
        const [uA1, nA1] = tekA1.map(t => t.trim());
        if (!uA1 || !nA1) return m.reply(`*Contoh :* ${cmd} username,628XXX`);
        nomorA1    = nA1.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
        usernameA1 = uA1.toLowerCase();
    } else {
        usernameA1 = text.toLowerCase();
        nomorA1    = m.isGroup ? m.sender : m.chat;
    }

    try {
        const onWaA1 = await sock.onWhatsApp(nomorA1.split("@")[0]);
        if (onWaA1.length < 1) return m.reply("Nomor target tidak terdaftar di WhatsApp!");
    } catch (eA1) {
        return m.reply("Terjadi kesalahan saat mengecek nomor WhatsApp: " + eA1.message);
    }

    try {
        const resA1 = await createAdminAccountVN(usernameA1, global.panelV1, 1);
        if (!resA1.success) return m.reply(`❌ Gagal membuat admin V1:\n${resA1.message}`);

        const dA1 = resA1.data;
        if (nomorA1 !== m.chat) {
            await m.reply(`✅ Berhasil membuat admin panel V1\nData akun terkirim ke nomor ${nomorA1.split("@")[0]}`);
        }

        const teksA1 = `
*✅ ADMIN PANEL VERSI 1 BERHASIL*

📡 *User ID:* ${dA1.id}
👤 *Username:* \`${dA1.username}\`
🔐 *Password:* \`${dA1.password}\`
📧 *Email:* ${dA1.email}
🗓️ *Aktivasi:* ${global.tanggal(Date.now())}
👑 *Role:* Root Admin
🌐 *Panel:* ${global.panelV1.domain}

*Rules Admin Panel V1*
- Masa aktif 30 hari
- Data bersifat pribadi, mohon disimpan dengan aman
- Garansi 15 hari (1x replace)
- Klaim garansi wajib menyertakan *bukti chat pembelian*
`;
        const msgA1 = await generateWAMessageFromContent(nomorA1, {
            viewOnceMessage: { message: { interactiveMessage: {
                body: { text: teksA1 },
                nativeFlowMessage: { buttons: [
                    { name: "cta_copy", buttonParamsJson: `{"display_text":"Copy Username","copy_code":"${dA1.username}"}` },
                    { name: "cta_copy", buttonParamsJson: `{"display_text":"Copy Password","copy_code":"${dA1.password}"}` },
                    { name: "cta_url",  buttonParamsJson: `{"display_text":"Login Panel","url":"${global.panelV1.domain}"}` }
                ]}
            }}}
        }, {});
        await sock.relayMessage(nomorA1, msgA1.message, { messageId: msgA1.key.id });
    } catch (errA1) {
        m.reply("Terjadi kesalahan saat membuat akun admin panel V1: " + errA1.message);
    }
}
break;

// ─── Create Panel V2 ─────────────────────────────────────────────────────────
case "1gbv2": case "2gbv2": case "3gbv2": case "4gbv2": case "5gbv2":
case "6gbv2": case "7gbv2": case "8gbv2": case "9gbv2": case "10gbv2":
case "unlimitedv2": case "unliv2": {
    if (!isOwner && !global.resellerV2.includes(m.sender)) {
        return m.reply(`❌ Fitur ini hanya untuk *Owner* dan *Reseller Panel V2*!`);
    }
    if (!text) return m.reply(`*Contoh :* ${cmd} username,6283XXX`);

    let nomor2, usernem2;
    const tek2 = text.split(",");
    if (tek2.length > 1) {
        const [u2, n2] = tek2.map(t => t.trim());
        if (!u2 || !n2) return m.reply(`*Contoh :* ${cmd} username,6283XXX`);
        nomor2   = n2.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
        usernem2 = u2.toLowerCase();
    } else {
        usernem2 = text.toLowerCase();
        nomor2   = m.isGroup ? m.sender : m.chat;
    }

    try {
        const onWa2 = await sock.onWhatsApp(nomor2.split("@")[0]);
        if (onWa2.length < 1) return m.reply("Nomor target tidak terdaftar di WhatsApp!");
    } catch (e2) {
        return m.reply("Terjadi kesalahan saat mengecek nomor WhatsApp: " + e2.message);
    }

    try {
        const result2 = await createPanelAccountVN(usernem2, command, global.panelV2, 2);
        if (!result2.success) return m.reply(`❌ Gagal membuat panel V2:\n${result2.message}`);

        const p2 = result2.data;
        if (nomor2 !== m.chat) {
            await m.reply(`✅ Berhasil membuat panel V2\nData akun terkirim ke nomor ${nomor2.split("@")[0]}`);
        }

        const teks2 = `
*✅ PANEL VERSI 2 BERHASIL*

📡 *Server ID:* ${p2.serverId}
👤 *Username:* \`${p2.username}\`
🔐 *Password:* \`${p2.password}\`
📧 *Email:* ${p2.email}
🗓️ *Aktivasi:* ${global.tanggal(Date.now())}

⚙️ *Spesifikasi Server*
- RAM  : ${p2.ram}
- DISK : ${p2.disk}
- CPU  : ${p2.cpu}
- Panel: ${p2.panelUrl}

*Rules Pembelian Panel V2*
- Masa aktif 30 hari
- Data bersifat pribadi, mohon disimpan dengan aman
- Garansi 15 hari (1x replace)
- Klaim garansi wajib menyertakan *bukti chat pembelian*
`;
        const msg2 = await generateWAMessageFromContent(nomor2, {
            viewOnceMessage: { message: { interactiveMessage: {
                body: { text: teks2 },
                nativeFlowMessage: { buttons: [
                    { name: "cta_copy", buttonParamsJson: `{"display_text":"Copy Username","copy_code":"${p2.username}"}` },
                    { name: "cta_copy", buttonParamsJson: `{"display_text":"Copy Password","copy_code":"${p2.password}"}` },
                    { name: "cta_url",  buttonParamsJson: `{"display_text":"Login Panel","url":"${p2.panelUrl}"}` }
                ]}
            }}}
        }, {});
        await sock.relayMessage(nomor2, msg2.message, { messageId: msg2.key.id });
    } catch (err2) {
        return m.reply("Terjadi kesalahan: " + err2.message);
    }
}
break;

// ─── Create Admin Panel V2 ───────────────────────────────────────────────────
case "cadminv2": {
    if (!isOwner && !global.resellerV2.includes(m.sender)) {
        return m.reply(`❌ Fitur ini hanya untuk *Owner* dan *Reseller Panel V2*!`);
    }
    if (!text) return m.reply(`*Contoh :* ${cmd} username,628XXX`);

    let nomorA2, usernameA2;
    const tekA2 = text.split(",");
    if (tekA2.length > 1) {
        const [uA2, nA2] = tekA2.map(t => t.trim());
        if (!uA2 || !nA2) return m.reply(`*Contoh :* ${cmd} username,628XXX`);
        nomorA2    = nA2.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
        usernameA2 = uA2.toLowerCase();
    } else {
        usernameA2 = text.toLowerCase();
        nomorA2    = m.isGroup ? m.sender : m.chat;
    }

    try {
        const onWaA2 = await sock.onWhatsApp(nomorA2.split("@")[0]);
        if (onWaA2.length < 1) return m.reply("Nomor target tidak terdaftar di WhatsApp!");
    } catch (eA2) {
        return m.reply("Terjadi kesalahan saat mengecek nomor WhatsApp: " + eA2.message);
    }

    try {
        const resA2 = await createAdminAccountVN(usernameA2, global.panelV2, 2);
        if (!resA2.success) return m.reply(`❌ Gagal membuat admin V2:\n${resA2.message}`);

        const dA2 = resA2.data;
        if (nomorA2 !== m.chat) {
            await m.reply(`✅ Berhasil membuat admin panel V2\nData akun terkirim ke nomor ${nomorA2.split("@")[0]}`);
        }

        const teksA2 = `
*✅ ADMIN PANEL VERSI 2 BERHASIL*

📡 *User ID:* ${dA2.id}
👤 *Username:* \`${dA2.username}\`
🔐 *Password:* \`${dA2.password}\`
📧 *Email:* ${dA2.email}
🗓️ *Aktivasi:* ${global.tanggal(Date.now())}
👑 *Role:* Root Admin
🌐 *Panel:* ${global.panelV2.domain}

*Rules Admin Panel V2*
- Masa aktif 30 hari
- Data bersifat pribadi, mohon disimpan dengan aman
- Garansi 15 hari (1x replace)
- Klaim garansi wajib menyertakan *bukti chat pembelian*
`;
        const msgA2 = await generateWAMessageFromContent(nomorA2, {
            viewOnceMessage: { message: { interactiveMessage: {
                body: { text: teksA2 },
                nativeFlowMessage: { buttons: [
                    { name: "cta_copy", buttonParamsJson: `{"display_text":"Copy Username","copy_code":"${dA2.username}"}` },
                    { name: "cta_copy", buttonParamsJson: `{"display_text":"Copy Password","copy_code":"${dA2.password}"}` },
                    { name: "cta_url",  buttonParamsJson: `{"display_text":"Login Panel","url":"${global.panelV2.domain}"}` }
                ]}
            }}}
        }, {});
        await sock.relayMessage(nomorA2, msgA2.message, { messageId: msgA2.key.id });
    } catch (errA2) {
        m.reply("Terjadi kesalahan saat membuat akun admin panel V2: " + errA2.message);
    }
}
break;

// ─── Create Panel V3 ─────────────────────────────────────────────────────────
case "1gbv3": case "2gbv3": case "3gbv3": case "4gbv3": case "5gbv3":
case "6gbv3": case "7gbv3": case "8gbv3": case "9gbv3": case "10gbv3":
case "unlimitedv3": case "unliv3": {
    if (!isOwner && !global.resellerV3.includes(m.sender)) {
        return m.reply(`❌ Fitur ini hanya untuk *Owner* dan *Reseller Panel V3*!`);
    }
    if (!text) return m.reply(`*Contoh :* ${cmd} username,6283XXX`);

    let nomor3, usernem3;
    const tek3 = text.split(",");
    if (tek3.length > 1) {
        const [u3, n3] = tek3.map(t => t.trim());
        if (!u3 || !n3) return m.reply(`*Contoh :* ${cmd} username,6283XXX`);
        nomor3   = n3.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
        usernem3 = u3.toLowerCase();
    } else {
        usernem3 = text.toLowerCase();
        nomor3   = m.isGroup ? m.sender : m.chat;
    }

    try {
        const onWa3 = await sock.onWhatsApp(nomor3.split("@")[0]);
        if (onWa3.length < 1) return m.reply("Nomor target tidak terdaftar di WhatsApp!");
    } catch (e3) {
        return m.reply("Terjadi kesalahan saat mengecek nomor WhatsApp: " + e3.message);
    }

    try {
        const result3 = await createPanelAccountVN(usernem3, command, global.panelV3, 3);
        if (!result3.success) return m.reply(`❌ Gagal membuat panel V3:\n${result3.message}`);

        const p3 = result3.data;
        if (nomor3 !== m.chat) {
            await m.reply(`✅ Berhasil membuat panel V3\nData akun terkirim ke nomor ${nomor3.split("@")[0]}`);
        }

        const teks3 = `
*✅ PANEL VERSI 3 BERHASIL*

📡 *Server ID:* ${p3.serverId}
👤 *Username:* \`${p3.username}\`
🔐 *Password:* \`${p3.password}\`
📧 *Email:* ${p3.email}
🗓️ *Aktivasi:* ${global.tanggal(Date.now())}

⚙️ *Spesifikasi Server*
- RAM  : ${p3.ram}
- DISK : ${p3.disk}
- CPU  : ${p3.cpu}
- Panel: ${p3.panelUrl}

*Rules Pembelian Panel V3*
- Masa aktif 30 hari
- Data bersifat pribadi, mohon disimpan dengan aman
- Garansi 15 hari (1x replace)
- Klaim garansi wajib menyertakan *bukti chat pembelian*
`;
        const msg3 = await generateWAMessageFromContent(nomor3, {
            viewOnceMessage: { message: { interactiveMessage: {
                body: { text: teks3 },
                nativeFlowMessage: { buttons: [
                    { name: "cta_copy", buttonParamsJson: `{"display_text":"Copy Username","copy_code":"${p3.username}"}` },
                    { name: "cta_copy", buttonParamsJson: `{"display_text":"Copy Password","copy_code":"${p3.password}"}` },
                    { name: "cta_url",  buttonParamsJson: `{"display_text":"Login Panel","url":"${p3.panelUrl}"}` }
                ]}
            }}}
        }, {});
        await sock.relayMessage(nomor3, msg3.message, { messageId: msg3.key.id });
    } catch (err3) {
        return m.reply("Terjadi kesalahan: " + err3.message);
    }
}
break;

// ─── Create Admin Panel V3 ───────────────────────────────────────────────────
case "cadminv3": {
    if (!isOwner && !global.resellerV3.includes(m.sender)) {
        return m.reply(`❌ Fitur ini hanya untuk *Owner* dan *Reseller Panel V3*!`);
    }
    if (!text) return m.reply(`*Contoh :* ${cmd} username,628XXX`);

    let nomorA3, usernameA3;
    const tekA3 = text.split(",");
    if (tekA3.length > 1) {
        const [uA3, nA3] = tekA3.map(t => t.trim());
        if (!uA3 || !nA3) return m.reply(`*Contoh :* ${cmd} username,628XXX`);
        nomorA3    = nA3.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
        usernameA3 = uA3.toLowerCase();
    } else {
        usernameA3 = text.toLowerCase();
        nomorA3    = m.isGroup ? m.sender : m.chat;
    }

    try {
        const onWaA3 = await sock.onWhatsApp(nomorA3.split("@")[0]);
        if (onWaA3.length < 1) return m.reply("Nomor target tidak terdaftar di WhatsApp!");
    } catch (eA3) {
        return m.reply("Terjadi kesalahan saat mengecek nomor WhatsApp: " + eA3.message);
    }

    try {
        const resA3 = await createAdminAccountVN(usernameA3, global.panelV3, 3);
        if (!resA3.success) return m.reply(`❌ Gagal membuat admin V3:\n${resA3.message}`);

        const dA3 = resA3.data;
        if (nomorA3 !== m.chat) {
            await m.reply(`✅ Berhasil membuat admin panel V3\nData akun terkirim ke nomor ${nomorA3.split("@")[0]}`);
        }

        const teksA3 = `
*✅ ADMIN PANEL VERSI 3 BERHASIL*

📡 *User ID:* ${dA3.id}
👤 *Username:* \`${dA3.username}\`
🔐 *Password:* \`${dA3.password}\`
📧 *Email:* ${dA3.email}
🗓️ *Aktivasi:* ${global.tanggal(Date.now())}
👑 *Role:* Root Admin
🌐 *Panel:* ${global.panelV3.domain}

*Rules Admin Panel V3*
- Masa aktif 30 hari
- Data bersifat pribadi, mohon disimpan dengan aman
- Garansi 15 hari (1x replace)
- Klaim garansi wajib menyertakan *bukti chat pembelian*
`;
        const msgA3 = await generateWAMessageFromContent(nomorA3, {
            viewOnceMessage: { message: { interactiveMessage: {
                body: { text: teksA3 },
                nativeFlowMessage: { buttons: [
                    { name: "cta_copy", buttonParamsJson: `{"display_text":"Copy Username","copy_code":"${dA3.username}"}` },
                    { name: "cta_copy", buttonParamsJson: `{"display_text":"Copy Password","copy_code":"${dA3.password}"}` },
                    { name: "cta_url",  buttonParamsJson: `{"display_text":"Login Panel","url":"${global.panelV3.domain}"}` }
                ]}
            }}}
        }, {});
        await sock.relayMessage(nomorA3, msgA3.message, { messageId: msgA3.key.id });
    } catch (errA3) {
        m.reply("Terjadi kesalahan saat membuat akun admin panel V3: " + errA3.message);
    }
}
break;

// ─── Create Panel V4 ─────────────────────────────────────────────────────────
case "1gbv4": case "2gbv4": case "3gbv4": case "4gbv4": case "5gbv4":
case "6gbv4": case "7gbv4": case "8gbv4": case "9gbv4": case "10gbv4":
case "unlimitedv4": case "unliv4": {
    if (!isOwner && !global.resellerV4.includes(m.sender)) {
        return m.reply(`❌ Fitur ini hanya untuk *Owner* dan *Reseller Panel V4*!`);
    }
    if (!text) return m.reply(`*Contoh :* ${cmd} username,6283XXX`);

    let nomor4, usernem4;
    const tek4 = text.split(",");
    if (tek4.length > 1) {
        const [u4, n4] = tek4.map(t => t.trim());
        if (!u4 || !n4) return m.reply(`*Contoh :* ${cmd} username,6283XXX`);
        nomor4   = n4.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
        usernem4 = u4.toLowerCase();
    } else {
        usernem4 = text.toLowerCase();
        nomor4   = m.isGroup ? m.sender : m.chat;
    }

    try {
        const onWa4 = await sock.onWhatsApp(nomor4.split("@")[0]);
        if (onWa4.length < 1) return m.reply("Nomor target tidak terdaftar di WhatsApp!");
    } catch (e4) {
        return m.reply("Terjadi kesalahan saat mengecek nomor WhatsApp: " + e4.message);
    }

    try {
        const result4 = await createPanelAccountVN(usernem4, command, global.panelV4, 4);
        if (!result4.success) return m.reply(`❌ Gagal membuat panel V4:\n${result4.message}`);

        const p4 = result4.data;
        if (nomor4 !== m.chat) {
            await m.reply(`✅ Berhasil membuat panel V4\nData akun terkirim ke nomor ${nomor4.split("@")[0]}`);
        }

        const teks4 = `
*✅ PANEL VERSI 4 BERHASIL*

📡 *Server ID:* ${p4.serverId}
👤 *Username:* \`${p4.username}\`
🔐 *Password:* \`${p4.password}\`
📧 *Email:* ${p4.email}
🗓️ *Aktivasi:* ${global.tanggal(Date.now())}

⚙️ *Spesifikasi Server*
- RAM  : ${p4.ram}
- DISK : ${p4.disk}
- CPU  : ${p4.cpu}
- Panel: ${p4.panelUrl}

*Rules Pembelian Panel V4*
- Masa aktif 30 hari
- Data bersifat pribadi, mohon disimpan dengan aman
- Garansi 15 hari (1x replace)
- Klaim garansi wajib menyertakan *bukti chat pembelian*
`;
        const msg4 = await generateWAMessageFromContent(nomor4, {
            viewOnceMessage: { message: { interactiveMessage: {
                body: { text: teks4 },
                nativeFlowMessage: { buttons: [
                    { name: "cta_copy", buttonParamsJson: `{"display_text":"Copy Username","copy_code":"${p4.username}"}` },
                    { name: "cta_copy", buttonParamsJson: `{"display_text":"Copy Password","copy_code":"${p4.password}"}` },
                    { name: "cta_url",  buttonParamsJson: `{"display_text":"Login Panel","url":"${p4.panelUrl}"}` }
                ]}
            }}}
        }, {});
        await sock.relayMessage(nomor4, msg4.message, { messageId: msg4.key.id });
    } catch (err4) {
        return m.reply("Terjadi kesalahan: " + err4.message);
    }
}
break;

// ─── Create Admin Panel V4 ───────────────────────────────────────────────────
case "cadminv4": {
    if (!isOwner && !global.resellerV4.includes(m.sender)) {
        return m.reply(`❌ Fitur ini hanya untuk *Owner* dan *Reseller Panel V4*!`);
    }
    if (!text) return m.reply(`*Contoh :* ${cmd} username,628XXX`);

    let nomorA4, usernameA4;
    const tekA4 = text.split(",");
    if (tekA4.length > 1) {
        const [uA4, nA4] = tekA4.map(t => t.trim());
        if (!uA4 || !nA4) return m.reply(`*Contoh :* ${cmd} username,628XXX`);
        nomorA4    = nA4.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
        usernameA4 = uA4.toLowerCase();
    } else {
        usernameA4 = text.toLowerCase();
        nomorA4    = m.isGroup ? m.sender : m.chat;
    }

    try {
        const onWaA4 = await sock.onWhatsApp(nomorA4.split("@")[0]);
        if (onWaA4.length < 1) return m.reply("Nomor target tidak terdaftar di WhatsApp!");
    } catch (eA4) {
        return m.reply("Terjadi kesalahan saat mengecek nomor WhatsApp: " + eA4.message);
    }

    try {
        const resA4 = await createAdminAccountVN(usernameA4, global.panelV4, 4);
        if (!resA4.success) return m.reply(`❌ Gagal membuat admin V4:\n${resA4.message}`);

        const dA4 = resA4.data;
        if (nomorA4 !== m.chat) {
            await m.reply(`✅ Berhasil membuat admin panel V4\nData akun terkirim ke nomor ${nomorA4.split("@")[0]}`);
        }

        const teksA4 = `
*✅ ADMIN PANEL VERSI 4 BERHASIL*

📡 *User ID:* ${dA4.id}
👤 *Username:* \`${dA4.username}\`
🔐 *Password:* \`${dA4.password}\`
📧 *Email:* ${dA4.email}
🗓️ *Aktivasi:* ${global.tanggal(Date.now())}
👑 *Role:* Root Admin
🌐 *Panel:* ${global.panelV4.domain}

*Rules Admin Panel V4*
- Masa aktif 30 hari
- Data bersifat pribadi, mohon disimpan dengan aman
- Garansi 15 hari (1x replace)
- Klaim garansi wajib menyertakan *bukti chat pembelian*
`;
        const msgA4 = await generateWAMessageFromContent(nomorA4, {
            viewOnceMessage: { message: { interactiveMessage: {
                body: { text: teksA4 },
                nativeFlowMessage: { buttons: [
                    { name: "cta_copy", buttonParamsJson: `{"display_text":"Copy Username","copy_code":"${dA4.username}"}` },
                    { name: "cta_copy", buttonParamsJson: `{"display_text":"Copy Password","copy_code":"${dA4.password}"}` },
                    { name: "cta_url",  buttonParamsJson: `{"display_text":"Login Panel","url":"${global.panelV4.domain}"}` }
                ]}
            }}}
        }, {});
        await sock.relayMessage(nomorA4, msgA4.message, { messageId: msgA4.key.id });
    } catch (errA4) {
        m.reply("Terjadi kesalahan saat membuat akun admin panel V4: " + errA4.message);
    }
}
break;

// ─── Create Panel V5 ─────────────────────────────────────────────────────────
case "1gbv5": case "2gbv5": case "3gbv5": case "4gbv5": case "5gbv5":
case "6gbv5": case "7gbv5": case "8gbv5": case "9gbv5": case "10gbv5":
case "unlimitedv5": case "unliv5": {
    if (!isOwner && !global.resellerV5.includes(m.sender)) {
        return m.reply(`❌ Fitur ini hanya untuk *Owner* dan *Reseller Panel V5*!`);
    }
    if (!text) return m.reply(`*Contoh :* ${cmd} username,6283XXX`);

    let nomor5, usernem5;
    const tek5 = text.split(",");
    if (tek5.length > 1) {
        const [u5, n5] = tek5.map(t => t.trim());
        if (!u5 || !n5) return m.reply(`*Contoh :* ${cmd} username,6283XXX`);
        nomor5   = n5.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
        usernem5 = u5.toLowerCase();
    } else {
        usernem5 = text.toLowerCase();
        nomor5   = m.isGroup ? m.sender : m.chat;
    }

    try {
        const onWa5 = await sock.onWhatsApp(nomor5.split("@")[0]);
        if (onWa5.length < 1) return m.reply("Nomor target tidak terdaftar di WhatsApp!");
    } catch (e5) {
        return m.reply("Terjadi kesalahan saat mengecek nomor WhatsApp: " + e5.message);
    }

    try {
        const result5 = await createPanelAccountVN(usernem5, command, global.panelV5, 5);
        if (!result5.success) return m.reply(`❌ Gagal membuat panel V5:\n${result5.message}`);

        const p5 = result5.data;
        if (nomor5 !== m.chat) {
            await m.reply(`✅ Berhasil membuat panel V5\nData akun terkirim ke nomor ${nomor5.split("@")[0]}`);
        }

        const teks5 = `
*✅ PANEL VERSI 5 BERHASIL*

📡 *Server ID:* ${p5.serverId}
👤 *Username:* \`${p5.username}\`
🔐 *Password:* \`${p5.password}\`
📧 *Email:* ${p5.email}
🗓️ *Aktivasi:* ${global.tanggal(Date.now())}

⚙️ *Spesifikasi Server*
- RAM  : ${p5.ram}
- DISK : ${p5.disk}
- CPU  : ${p5.cpu}
- Panel: ${p5.panelUrl}

*Rules Pembelian Panel V5*
- Masa aktif 30 hari
- Data bersifat pribadi, mohon disimpan dengan aman
- Garansi 15 hari (1x replace)
- Klaim garansi wajib menyertakan *bukti chat pembelian*
`;
        const msg5 = await generateWAMessageFromContent(nomor5, {
            viewOnceMessage: { message: { interactiveMessage: {
                body: { text: teks5 },
                nativeFlowMessage: { buttons: [
                    { name: "cta_copy", buttonParamsJson: `{"display_text":"Copy Username","copy_code":"${p5.username}"}` },
                    { name: "cta_copy", buttonParamsJson: `{"display_text":"Copy Password","copy_code":"${p5.password}"}` },
                    { name: "cta_url",  buttonParamsJson: `{"display_text":"Login Panel","url":"${p5.panelUrl}"}` }
                ]}
            }}}
        }, {});
        await sock.relayMessage(nomor5, msg5.message, { messageId: msg5.key.id });
    } catch (err5) {
        return m.reply("Terjadi kesalahan: " + err5.message);
    }
}
break;

// ─── Create Admin Panel V5 ───────────────────────────────────────────────────
case "cadminv5": {
    if (!isOwner && !global.resellerV5.includes(m.sender)) {
        return m.reply(`❌ Fitur ini hanya untuk *Owner* dan *Reseller Panel V5*!`);
    }
    if (!text) return m.reply(`*Contoh :* ${cmd} username,628XXX`);

    let nomorA5, usernameA5;
    const tekA5 = text.split(",");
    if (tekA5.length > 1) {
        const [uA5, nA5] = tekA5.map(t => t.trim());
        if (!uA5 || !nA5) return m.reply(`*Contoh :* ${cmd} username,628XXX`);
        nomorA5    = nA5.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
        usernameA5 = uA5.toLowerCase();
    } else {
        usernameA5 = text.toLowerCase();
        nomorA5    = m.isGroup ? m.sender : m.chat;
    }

    try {
        const onWaA5 = await sock.onWhatsApp(nomorA5.split("@")[0]);
        if (onWaA5.length < 1) return m.reply("Nomor target tidak terdaftar di WhatsApp!");
    } catch (eA5) {
        return m.reply("Terjadi kesalahan saat mengecek nomor WhatsApp: " + eA5.message);
    }

    try {
        const resA5 = await createAdminAccountVN(usernameA5, global.panelV5, 5);
        if (!resA5.success) return m.reply(`❌ Gagal membuat admin V5:\n${resA5.message}`);

        const dA5 = resA5.data;
        if (nomorA5 !== m.chat) {
            await m.reply(`✅ Berhasil membuat admin panel V5\nData akun terkirim ke nomor ${nomorA5.split("@")[0]}`);
        }

        const teksA5 = `
*✅ ADMIN PANEL VERSI 5 BERHASIL*

📡 *User ID:* ${dA5.id}
👤 *Username:* \`${dA5.username}\`
🔐 *Password:* \`${dA5.password}\`
📧 *Email:* ${dA5.email}
🗓️ *Aktivasi:* ${global.tanggal(Date.now())}
👑 *Role:* Root Admin
🌐 *Panel:* ${global.panelV5.domain}

*Rules Admin Panel V5*
- Masa aktif 30 hari
- Data bersifat pribadi, mohon disimpan dengan aman
- Garansi 15 hari (1x replace)
- Klaim garansi wajib menyertakan *bukti chat pembelian*
`;
        const msgA5 = await generateWAMessageFromContent(nomorA5, {
            viewOnceMessage: { message: { interactiveMessage: {
                body: { text: teksA5 },
                nativeFlowMessage: { buttons: [
                    { name: "cta_copy", buttonParamsJson: `{"display_text":"Copy Username","copy_code":"${dA5.username}"}` },
                    { name: "cta_copy", buttonParamsJson: `{"display_text":"Copy Password","copy_code":"${dA5.password}"}` },
                    { name: "cta_url",  buttonParamsJson: `{"display_text":"Login Panel","url":"${global.panelV5.domain}"}` }
                ]}
            }}}
        }, {});
        await sock.relayMessage(nomorA5, msgA5.message, { messageId: msgA5.key.id });
    } catch (errA5) {
        m.reply("Terjadi kesalahan saat membuat akun admin panel V5: " + errA5.message);
    }
}
break;

// ─── Create Panel V6 ─────────────────────────────────────────────────────────
case "1gbv6": case "2gbv6": case "3gbv6": case "4gbv6": case "5gbv6":
case "6gbv6": case "7gbv6": case "8gbv6": case "9gbv6": case "10gbv6":
case "unlimitedv6": case "unliv6": {
    if (!isOwner && !global.resellerV6.includes(m.sender)) {
        return m.reply(`❌ Fitur ini hanya untuk *Owner* dan *Reseller Panel V6*!`);
    }
    if (!text) return m.reply(`*Contoh :* ${cmd} username,6283XXX`);

    let nomor6, usernem6;
    const tek6 = text.split(",");
    if (tek6.length > 1) {
        const [u6, n6] = tek6.map(t => t.trim());
        if (!u6 || !n6) return m.reply(`*Contoh :* ${cmd} username,6283XXX`);
        nomor6   = n6.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
        usernem6 = u6.toLowerCase();
    } else {
        usernem6 = text.toLowerCase();
        nomor6   = m.isGroup ? m.sender : m.chat;
    }

    try {
        const onWa6 = await sock.onWhatsApp(nomor6.split("@")[0]);
        if (onWa6.length < 1) return m.reply("Nomor target tidak terdaftar di WhatsApp!");
    } catch (e6) {
        return m.reply("Terjadi kesalahan saat mengecek nomor WhatsApp: " + e6.message);
    }

    try {
        const result6 = await createPanelAccountVN(usernem6, command, global.panelV6, 6);
        if (!result6.success) return m.reply(`❌ Gagal membuat panel V6:\n${result6.message}`);

        const p6 = result6.data;
        if (nomor6 !== m.chat) {
            await m.reply(`✅ Berhasil membuat panel V6\nData akun terkirim ke nomor ${nomor6.split("@")[0]}`);
        }

        const teks6 = `
*✅ PANEL VERSI 6 BERHASIL*

📡 *Server ID:* ${p6.serverId}
👤 *Username:* \`${p6.username}\`
🔐 *Password:* \`${p6.password}\`
📧 *Email:* ${p6.email}
🗓️ *Aktivasi:* ${global.tanggal(Date.now())}

⚙️ *Spesifikasi Server*
- RAM  : ${p6.ram}
- DISK : ${p6.disk}
- CPU  : ${p6.cpu}
- Panel: ${p6.panelUrl}

*Rules Pembelian Panel V6*
- Masa aktif 30 hari
- Data bersifat pribadi, mohon disimpan dengan aman
- Garansi 15 hari (1x replace)
- Klaim garansi wajib menyertakan *bukti chat pembelian*
`;
        const msg6 = await generateWAMessageFromContent(nomor6, {
            viewOnceMessage: { message: { interactiveMessage: {
                body: { text: teks6 },
                nativeFlowMessage: { buttons: [
                    { name: "cta_copy", buttonParamsJson: `{"display_text":"Copy Username","copy_code":"${p6.username}"}` },
                    { name: "cta_copy", buttonParamsJson: `{"display_text":"Copy Password","copy_code":"${p6.password}"}` },
                    { name: "cta_url",  buttonParamsJson: `{"display_text":"Login Panel","url":"${p6.panelUrl}"}` }
                ]}
            }}}
        }, {});
        await sock.relayMessage(nomor6, msg6.message, { messageId: msg6.key.id });
    } catch (err6) {
        return m.reply("Terjadi kesalahan: " + err6.message);
    }
}
break;

// ─── Create Admin Panel V6 ───────────────────────────────────────────────────
case "cadminv6": {
    if (!isOwner && !global.resellerV6.includes(m.sender)) {
        return m.reply(`❌ Fitur ini hanya untuk *Owner* dan *Reseller Panel V6*!`);
    }
    if (!text) return m.reply(`*Contoh :* ${cmd} username,628XXX`);

    let nomorA6, usernameA6;
    const tekA6 = text.split(",");
    if (tekA6.length > 1) {
        const [uA6, nA6] = tekA6.map(t => t.trim());
        if (!uA6 || !nA6) return m.reply(`*Contoh :* ${cmd} username,628XXX`);
        nomorA6    = nA6.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
        usernameA6 = uA6.toLowerCase();
    } else {
        usernameA6 = text.toLowerCase();
        nomorA6    = m.isGroup ? m.sender : m.chat;
    }

    try {
        const onWaA6 = await sock.onWhatsApp(nomorA6.split("@")[0]);
        if (onWaA6.length < 1) return m.reply("Nomor target tidak terdaftar di WhatsApp!");
    } catch (eA6) {
        return m.reply("Terjadi kesalahan saat mengecek nomor WhatsApp: " + eA6.message);
    }

    try {
        const resA6 = await createAdminAccountVN(usernameA6, global.panelV6, 6);
        if (!resA6.success) return m.reply(`❌ Gagal membuat admin V6:\n${resA6.message}`);

        const dA6 = resA6.data;
        if (nomorA6 !== m.chat) {
            await m.reply(`✅ Berhasil membuat admin panel V6\nData akun terkirim ke nomor ${nomorA6.split("@")[0]}`);
        }

        const teksA6 = `
*✅ ADMIN PANEL VERSI 6 BERHASIL*

📡 *User ID:* ${dA6.id}
👤 *Username:* \`${dA6.username}\`
🔐 *Password:* \`${dA6.password}\`
📧 *Email:* ${dA6.email}
🗓️ *Aktivasi:* ${global.tanggal(Date.now())}
👑 *Role:* Root Admin
🌐 *Panel:* ${global.panelV6.domain}

*Rules Admin Panel V6*
- Masa aktif 30 hari
- Data bersifat pribadi, mohon disimpan dengan aman
- Garansi 15 hari (1x replace)
- Klaim garansi wajib menyertakan *bukti chat pembelian*
`;
        const msgA6 = await generateWAMessageFromContent(nomorA6, {
            viewOnceMessage: { message: { interactiveMessage: {
                body: { text: teksA6 },
                nativeFlowMessage: { buttons: [
                    { name: "cta_copy", buttonParamsJson: `{"display_text":"Copy Username","copy_code":"${dA6.username}"}` },
                    { name: "cta_copy", buttonParamsJson: `{"display_text":"Copy Password","copy_code":"${dA6.password}"}` },
                    { name: "cta_url",  buttonParamsJson: `{"display_text":"Login Panel","url":"${global.panelV6.domain}"}` }
                ]}
            }}}
        }, {});
        await sock.relayMessage(nomorA6, msgA6.message, { messageId: msgA6.key.id });
    } catch (errA6) {
        m.reply("Terjadi kesalahan saat membuat akun admin panel V6: " + errA6.message);
    }
}
break;

// Reseller V6
case "addsellerv6": {
    if (!isOwner) return m.reply(mess.owner);
    if (!text && !m.quoted) return m.reply(`*contoh:* ${cmd} 6283XXX`);

    const inputV6 = m.mentionedJid[0]
        ? m.mentionedJid[0]
        : m.quoted
            ? m.quoted.sender
            : text.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

    const inputV6num = inputV6.split("@")[0];

    if (inputV6num === global.owner || global.resellerV6.includes(inputV6) || inputV6 === botNumber)
        return m.reply(`Nomor ${inputV6num} sudah menjadi reseller V6!`);

    global.resellerV6.push(inputV6);
    m.reply(`✅ Berhasil menambah reseller V6: ${inputV6num}`);
}
break;

case "listsellerv6": {
    const listV6 = global.resellerV6;
    if (!listV6 || listV6.length < 1) return m.reply("Tidak ada reseller V6");

    let teksLV6 = `📋 *Daftar Reseller Panel V6:*\n`;
    for (let i of listV6) {
        const num = i.split("@")[0];
        teksLV6 += `\n• ${num} (@${num})`;
    }

    sock.sendMessage(m.chat, { text: teksLV6, mentions: listV6 }, { quoted: m });
}
break;

case "delsellerv6": {
    if (!isOwner) return m.reply(mess.owner);
    if (!m.quoted && !text) return m.reply(`*Contoh :* ${cmd} 6283XXX`);

    const delV6 = m.mentionedJid[0]
        ? m.mentionedJid[0]
        : m.quoted
            ? m.quoted.sender
            : text.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

    const delV6num = delV6.split("@")[0];

    if (!global.resellerV6.includes(delV6))
        return m.reply(`Nomor ${delV6num} bukan reseller V6!`);

    global.resellerV6 = global.resellerV6.filter(v => v !== delV6);
    m.reply(`✅ Berhasil menghapus reseller V6: ${delV6num}`);
}
break;

// Reseller V1
case "addsellerv1": {
    if (!isOwner) return m.reply(mess.owner);
    if (!text && !m.quoted) return m.reply(`*contoh:* ${cmd} 6283XXX`);

    const input = m.mentionedJid[0] 
        ? m.mentionedJid[0] 
        : m.quoted 
            ? m.quoted.sender 
            : text.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

    const input2 = input.split("@")[0];

    if (input2 === global.owner || global.resellerV1.includes(input) || input === botNumber)
        return m.reply(`Nomor ${input2} sudah menjadi reseller V1!`);

    global.resellerV1.push(input);
    m.reply(`✅ Berhasil menambah reseller V1: ${input2}`);
}
break;

case "listsellerv1": {
    const list = global.resellerV1;
    if (!list || list.length < 1) return m.reply("Tidak ada reseller V1");

    let teks = `📋 *Daftar Reseller Panel V1:*\n`;
    for (let i of list) {
        const num = i.split("@")[0];
        teks += `\n• ${num} (@${num})`;
    }

    sock.sendMessage(m.chat, { text: teks, mentions: list }, { quoted: m });
}
break;

case "delsellerv1": {
    if (!isOwner) return m.reply(mess.owner);
    if (!m.quoted && !text) return m.reply(`*Contoh :* ${cmd} 6283XXX`);

    const input = m.mentionedJid[0] 
        ? m.mentionedJid[0] 
        : m.quoted 
            ? m.quoted.sender 
            : text.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

    const input2 = input.split("@")[0];

    if (!global.resellerV1.includes(input))
        return m.reply(`Nomor ${input2} bukan reseller V1!`);

    global.resellerV1 = global.resellerV1.filter(v => v !== input);
    m.reply(`✅ Berhasil menghapus reseller V1: ${input2}`);
}
break;

// Reseller V2
case "addsellerv2": {
    if (!isOwner) return m.reply(mess.owner);
    if (!text && !m.quoted) return m.reply(`*contoh:* ${cmd} 6283XXX`);

    const input = m.mentionedJid[0] 
        ? m.mentionedJid[0] 
        : m.quoted 
            ? m.quoted.sender 
            : text.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

    const input2 = input.split("@")[0];

    if (input2 === global.owner || global.resellerV2.includes(input) || input === botNumber)
        return m.reply(`Nomor ${input2} sudah menjadi reseller V2!`);

    global.resellerV2.push(input);
    m.reply(`✅ Berhasil menambah reseller V2: ${input2}`);
}
break;

case "listsellerv2": {
    const list = global.resellerV2;
    if (!list || list.length < 1) return m.reply("Tidak ada reseller V2");

    let teks = `📋 *Daftar Reseller Panel V2:*\n`;
    for (let i of list) {
        const num = i.split("@")[0];
        teks += `\n• ${num} (@${num})`;
    }

    sock.sendMessage(m.chat, { text: teks, mentions: list }, { quoted: m });
}
break;

case "delsellerv2": {
    if (!isOwner) return m.reply(mess.owner);
    if (!m.quoted && !text) return m.reply(`*Contoh :* ${cmd} 6283XXX`);

    const input = m.mentionedJid[0] 
        ? m.mentionedJid[0] 
        : m.quoted 
            ? m.quoted.sender 
            : text.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

    const input2 = input.split("@")[0];

    if (!global.resellerV2.includes(input))
        return m.reply(`Nomor ${input2} bukan reseller V2!`);

    global.resellerV2 = global.resellerV2.filter(v => v !== input);
    m.reply(`✅ Berhasil menghapus reseller V2: ${input2}`);
}
break;

// Reseller V3
case "addsellerv3": {
    if (!isOwner) return m.reply(mess.owner);
    if (!text && !m.quoted) return m.reply(`*contoh:* ${cmd} 6283XXX`);

    const input = m.mentionedJid[0] 
        ? m.mentionedJid[0] 
        : m.quoted 
            ? m.quoted.sender 
            : text.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

    const input2 = input.split("@")[0];

    if (input2 === global.owner || global.resellerV3.includes(input) || input === botNumber)
        return m.reply(`Nomor ${input2} sudah menjadi reseller V3!`);

    global.resellerV3.push(input);
    m.reply(`✅ Berhasil menambah reseller V3: ${input2}`);
}
break;

case "listsellerv3": {
    const list = global.resellerV3;
    if (!list || list.length < 1) return m.reply("Tidak ada reseller V3");

    let teks = `📋 *Daftar Reseller Panel V3:*\n`;
    for (let i of list) {
        const num = i.split("@")[0];
        teks += `\n• ${num} (@${num})`;
    }

    sock.sendMessage(m.chat, { text: teks, mentions: list }, { quoted: m });
}
break;

case "delsellerv3": {
    if (!isOwner) return m.reply(mess.owner);
    if (!m.quoted && !text) return m.reply(`*Contoh :* ${cmd} 6283XXX`);

    const input = m.mentionedJid[0] 
        ? m.mentionedJid[0] 
        : m.quoted 
            ? m.quoted.sender 
            : text.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

    const input2 = input.split("@")[0];

    if (!global.resellerV3.includes(input))
        return m.reply(`Nomor ${input2} bukan reseller V3!`);

    global.resellerV3 = global.resellerV3.filter(v => v !== input);
    m.reply(`✅ Berhasil menghapus reseller V3: ${input2}`);
}
break;

// Reseller V4
case "addsellerv4": {
    if (!isOwner) return m.reply(mess.owner);
    if (!text && !m.quoted) return m.reply(`*contoh:* ${cmd} 6283XXX`);

    const input = m.mentionedJid[0] 
        ? m.mentionedJid[0] 
        : m.quoted 
            ? m.quoted.sender 
            : text.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

    const input2 = input.split("@")[0];

    if (input2 === global.owner || global.resellerV4.includes(input) || input === botNumber)
        return m.reply(`Nomor ${input2} sudah menjadi reseller V4!`);

    global.resellerV4.push(input);
    m.reply(`✅ Berhasil menambah reseller V4: ${input2}`);
}
break;

case "listsellerv4": {
    const list = global.resellerV4;
    if (!list || list.length < 1) return m.reply("Tidak ada reseller V4");

    let teks = `📋 *Daftar Reseller Panel V4:*\n`;
    for (let i of list) {
        const num = i.split("@")[0];
        teks += `\n• ${num} (@${num})`;
    }

    sock.sendMessage(m.chat, { text: teks, mentions: list }, { quoted: m });
}
break;

case "delsellerv4": {
    if (!isOwner) return m.reply(mess.owner);
    if (!m.quoted && !text) return m.reply(`*Contoh :* ${cmd} 6283XXX`);

    const input = m.mentionedJid[0] 
        ? m.mentionedJid[0] 
        : m.quoted 
            ? m.quoted.sender 
            : text.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

    const input2 = input.split("@")[0];

    if (!global.resellerV4.includes(input))
        return m.reply(`Nomor ${input2} bukan reseller V4!`);

    global.resellerV4 = global.resellerV4.filter(v => v !== input);
    m.reply(`✅ Berhasil menghapus reseller V4: ${input2}`);
}
break;

// Reseller V5
case "addsellerv5": {
    if (!isOwner) return m.reply(mess.owner);
    if (!text && !m.quoted) return m.reply(`*contoh:* ${cmd} 6283XXX`);

    const input = m.mentionedJid[0] 
        ? m.mentionedJid[0] 
        : m.quoted 
            ? m.quoted.sender 
            : text.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

    const input2 = input.split("@")[0];

    if (input2 === global.owner || global.resellerV5.includes(input) || input === botNumber)
        return m.reply(`Nomor ${input2} sudah menjadi reseller V5!`);

    global.resellerV5.push(input);
    m.reply(`✅ Berhasil menambah reseller V5: ${input2}`);
}
break;

case "listsellerv5": {
    const list = global.resellerV5;
    if (!list || list.length < 1) return m.reply("Tidak ada reseller V5");

    let teks = `📋 *Daftar Reseller Panel V5:*\n`;
    for (let i of list) {
        const num = i.split("@")[0];
        teks += `\n• ${num} (@${num})`;
    }

    sock.sendMessage(m.chat, { text: teks, mentions: list }, { quoted: m });
}
break;

case "delsellerv5": {
    if (!isOwner) return m.reply(mess.owner);
    if (!m.quoted && !text) return m.reply(`*Contoh :* ${cmd} 6283XXX`);

    const input = m.mentionedJid[0] 
        ? m.mentionedJid[0] 
        : m.quoted 
            ? m.quoted.sender 
            : text.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

    const input2 = input.split("@")[0];

    if (!global.resellerV5.includes(input))
        return m.reply(`Nomor ${input2} bukan reseller V5!`);

    global.resellerV5 = global.resellerV5.filter(v => v !== input);
    m.reply(`✅ Berhasil menghapus reseller V5: ${input2}`);
}
break;

case "1gb": case "2gb": case "3gb": case "4gb": case "5gb": 
case "6gb": case "7gb": case "8gb": case "9gb": case "10gb": 
case "unlimited": case "unli": {
if (!isOwner && !isReseller) {
    if (!m.isGroup || !grupReseller.includes(m.chat)) {
        return m.reply(`⚠️ Fitur ini hanya untuk *grup reseller panel*.\n\n` +
                       `👉 Jika kamu admin grup, minta owner untuk ketik *.addgrupreseller* di grup ini.`);
    }
}
    if (!text) return m.reply(`*Contoh :* ${cmd} username,6283XXX`)

    let nomor, usernem;
    let tek = text.split(",");
    if (tek.length > 1) {
        let [users, nom] = tek.map(t => t.trim());
        if (!users || !nom) return m.reply(`*Contoh :* ${cmd} username,6283XXX`)
        nomor = nom.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
        usernem = users.toLowerCase();
    } else {
        usernem = text.toLowerCase();
        nomor = m.isGroup ? m.sender : m.chat
    }

    try {
        var onWa = await sock.onWhatsApp(nomor.split("@")[0]);
        if (onWa.length < 1) return m.reply("Nomor target tidak terdaftar di WhatsApp!");
    } catch (err) {
        return m.reply("Terjadi kesalahan saat mengecek nomor WhatsApp: " + err.message);
    }

    // Mapping RAM, Disk, dan CPU
    const resourceMap = {
        "1gb": { ram: "1000", disk: "1000", cpu: "40" },
        "2gb": { ram: "2000", disk: "1000", cpu: "60" },
        "3gb": { ram: "3000", disk: "2000", cpu: "80" },
        "4gb": { ram: "4000", disk: "4000", cpu: "200" },
        "5gb": { ram: "5000", disk: "5000", cpu: "210" },
        "6gb": { ram: "6000", disk: "6000", cpu: "220" },
        "7gb": { ram: "7000", disk: "7000", cpu: "230" },
        "8gb": { ram: "8000", disk: "8000", cpu: "240" },
        "9gb": { ram: "9000", disk: "5000", cpu: "270" },
        "10gb": { ram: "10000", disk: "5000", cpu: "300" },
        "unlimited": { ram: "0", disk: "0", cpu: "0" }
    };
    
    let { ram, disk, cpu } = resourceMap[command] || { ram: "0", disk: "0", cpu: "0" };

    let username = usernem.toLowerCase();
    let email = username + "@gmail.com";
    let name = global.capital(username) + " Server";
    let password = username + "001";

    try {
        let f = await fetch(domain + "/api/application/users", {
            method: "POST",
            headers: { "Accept": "application/json", "Content-Type": "application/json", "Authorization": "Bearer " + apikey },
            body: JSON.stringify({ email, username, first_name: name, last_name: "Server", language: "en", password })
        });
        let data = await f.json();
        if (data.errors) return m.reply("Error: " + JSON.stringify(data.errors[0], null, 2));
        let user = data.attributes;

        let f1 = await fetch(domain + `/api/application/nests/${nestid}/eggs/` + egg, {
            method: "GET",
            headers: { "Accept": "application/json", "Content-Type": "application/json", "Authorization": "Bearer " + apikey }
        });
        let data2 = await f1.json();
        let startup_cmd = data2.attributes.startup;

        let f2 = await fetch(domain + "/api/application/servers", {
            method: "POST",
            headers: { "Accept": "application/json", "Content-Type": "application/json", "Authorization": "Bearer " + apikey },
            body: JSON.stringify({
                name,
                description: global.tanggal(Date.now()),
                user: user.id,
                egg: parseInt(egg),
                docker_image: "ghcr.io/parkervcp/yolks:nodejs_20",
                startup: startup_cmd,
                environment: { INST: "npm", USER_UPLOAD: "0", AUTO_UPDATE: "0", CMD_RUN: "npm start" },
                limits: { memory: ram, swap: 0, disk, io: 500, cpu },
                feature_limits: { databases: 5, backups: 5, allocations: 5 },
                deploy: { locations: [parseInt(loc)], dedicated_ip: false, port_range: [] },
            })
        });
        let result = await f2.json();
        if (result.errors) return m.reply("Error: " + JSON.stringify(result.errors[0], null, 2));
        
        let server = result.attributes;
        var orang = nomor
        if (orang !== m.chat) {
        await m.reply(`Berhasil membuat akun panel ✅\ndata akun terkirim ke nomor ${nomor.split("@")[0]}`)
        }

let teks = `
*Behasil membuat panel ✅*

📡 Server ID: ${server.id}
👤 Username: \`${user.username}\`
🔐 Password: \`${password}\`
🗓️ Tanggal Aktivasi: ${global.tanggal(Date.now())}

*Spesifikasi server panel*
- RAM: ${ram == "0" ? "Unlimited" : ram / 1000 + "GB"}
- Disk: ${disk == "0" ? "Unlimited" : disk / 1000 + "GB"}
- CPU: ${cpu == "0" ? "Unlimited" : cpu + "%"}
- Panel: ${global.domain}

*Rules pembelian panel*  
- Masa aktif 30 hari  
- Data bersifat pribadi, mohon disimpan dengan aman  
- Garansi berlaku 15 hari (unli replace)  
- Klaim garansi wajib menyertakan *bukti chat pembelian*
`

let msg = await generateWAMessageFromContent(orang, {
    viewOnceMessage: {
        message: {
            interactiveMessage: {
                body: { text: teks },
                nativeFlowMessage: {
                    buttons: [
                        { 
                            name: "cta_copy",
                            buttonParamsJson: `{"display_text":"Copy Username","copy_code":"${user.username}"}`
                        },
                        { 
                            name: "cta_copy",
                            buttonParamsJson: `{"display_text":"Copy Password","copy_code":"${password}"}`
                        },
                        { 
                            name: "cta_url",
                            buttonParamsJson: `{"display_text":"Open Panel","url":"${global.domain}"}`
                        }
                    ]
                }
            }
        }
    }
}, {});

await sock.relayMessage(orang, msg.message, { messageId: msg.key.id });
    } catch (err) {
        return m.reply("Terjadi kesalahan: " + err.message);
    }
}
break

case "delpanel": {
    if (!isOwner && !isReseller) {
        return m.reply(mess.owner);
    }
    const rows = []
    rows.push({
title: `Hapus Semua`,
description: `Hapus semua server panel`, 
id: `.delpanel-all`
})            
    try {
        const response = await fetch(`${domain}/api/application/servers`, {
            method: "GET",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${apikey}`,
            },
        });

        const result = await response.json();
        const servers = result.data;

        if (!servers || servers.length === 0) {
            return m.reply("Tidak ada server panel!");
        }

        let messageText = `\n*Total server panel :* ${servers.length}\n`

        for (const server of servers) {
            const s = server.attributes;

            const resStatus = await fetch(`${domain}/api/client/servers/${s.uuid.split("-")[0]}/resources`, {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${capikey}`,
                },
            });

            const statusData = await resStatus.json();

            const ram = s.limits.memory === 0
                ? "Unlimited"
                : s.limits.memory >= 1024
                ? `${Math.floor(s.limits.memory / 1024)} GB`
                : `${s.limits.memory} MB`;

            const disk = s.limits.disk === 0
                ? "Unlimited"
                : s.limits.disk >= 1024
                ? `${Math.floor(s.limits.disk / 1024)} GB`
                : `${s.limits.disk} MB`;

            const cpu = s.limits.cpu === 0
                ? "Unlimited"
                : `${s.limits.cpu}%`;
            rows.push({
title: `${s.name} || ID:${s.id}`,
description: `Ram ${ram} || Disk ${disk} || CPU ${cpu}`, 
id: `.delpanel-response ${s.id}`
})            
        }                  
        await sock.sendMessage(m.chat, {
  buttons: [
    {
    buttonId: 'action',
    buttonText: { displayText: 'ini pesan interactiveMeta' },
    type: 4,
    nativeFlowInfo: {
        name: 'single_select',
        paramsJson: JSON.stringify({
          title: 'Pilih Server Panel',
          sections: [
            {
              title: `© Powered By ${namaOwner}`,
              rows: rows
            }
          ]
        })
      }
      }
  ],
  headerType: 1,
  viewOnce: true,
  text: `\nPilih Server Panel Yang Ingin Dihapus\n`
}, { quoted: m })

    } catch (err) {
        console.error("Error listing panel servers:", err);
        m.reply("Terjadi kesalahan saat mengambil data server.");
    }
}
break;

case "delpanel-response": {
    if (!isOwner) return m.reply(mess.owner);
    if (!text) return 
    
    try {
        const serverResponse = await fetch(domain + "/api/application/servers", {
            method: "GET",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": "Bearer " + apikey
            }
        });
        const serverData = await serverResponse.json();
        const servers = serverData.data;
        
        let serverName;
        let serverSection;
        let serverFound = false;
        
        for (const server of servers) {
            const serverAttr = server.attributes;
            
            if (Number(text) === serverAttr.id) {
                serverSection = serverAttr.name.toLowerCase();
                serverName = serverAttr.name;
                serverFound = true;
                
                const deleteServerResponse = await fetch(domain + `/api/application/servers/${serverAttr.id}`, {
                    method: "DELETE",
                    headers: {
                        "Accept": "application/json",
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + apikey
                    }
                });
                
                if (!deleteServerResponse.ok) {
                    const errorData = await deleteServerResponse.json();
                    console.error("Gagal menghapus server:", errorData);
                }
                
                break;
            }
        }
        
        if (!serverFound) {
            return m.reply("Gagal menghapus server!\nID server tidak ditemukan");
        }
        
        const userResponse = await fetch(domain + "/api/application/users", {
            method: "GET",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": "Bearer " + apikey
            }
        });
        const userData = await userResponse.json();
        const users = userData.data;
        
        for (const user of users) {
            const userAttr = user.attributes;
            
            if (userAttr.first_name.toLowerCase() === serverSection) {
                const deleteUserResponse = await fetch(domain + `/api/application/users/${userAttr.id}`, {
                    method: "DELETE",
                    headers: {
                        "Accept": "application/json",
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + apikey
                    }
                });
                
                if (!deleteUserResponse.ok) {
                    const errorData = await deleteUserResponse.json();
                    console.error("Gagal menghapus user:", errorData);
                }
                
                break;
            }
        }
        
        await m.reply(`*Barhasil Menghapus Sever Panel ✅*\n- ID: ${text}\n- Nama Server: ${capital(serverName)}`);
        
    } catch (error) {
        console.error("Error dalam proses delpanel:", error);
        await m.reply("Terjadi kesalahan saat memproses permintaan");
    }
}
break;

case "delpanel-all": {
if (!isOwner) return m.reply(mess.owner)
await m.reply(`Memproses penghapusan semua user & server panel yang bukan admin`)
try {
const PTERO_URL = global.domain
// Ganti dengan URL panel Pterodactyl
const API_KEY = global.apikey// API Key dengan akses admin

// Konfigurasi headers
const headers = {
  "Authorization": "Bearer " + API_KEY,
  "Content-Type": "application/json",
  "Accept": "application/json",
};

// Fungsi untuk mendapatkan semua user
async function getUsers() {
  try {
    const res = await axios.get(`${PTERO_URL}/api/application/users`, { headers });
    return res.data.data;
  } catch (error) {
    m.reply(JSON.stringify(error.response?.data || error.message, null, 2))
    
    return [];
  }
}

// Fungsi untuk mendapatkan semua server
async function getServers() {
  try {
    const res = await axios.get(`${PTERO_URL}/api/application/servers`, { headers });
    return res.data.data;
  } catch (error) {
    m.reply(JSON.stringify(error.response?.data || error.message, null, 2))
    return [];
  }
}

// Fungsi untuk menghapus server berdasarkan UUID
async function deleteServer(serverUUID) {
  try {
    await axios.delete(`${PTERO_URL}/api/application/servers/${serverUUID}`, { headers });
    console.log(`Server ${serverUUID} berhasil dihapus.`);
  } catch (error) {
    console.error(`Gagal menghapus server ${serverUUID}:`, error.response?.data || error.message);
  }
}

// Fungsi untuk menghapus user berdasarkan ID
async function deleteUser(userID) {
  try {
    await axios.delete(`${PTERO_URL}/api/application/users/${userID}`, { headers });
    console.log(`User ${userID} berhasil dihapus.`);
  } catch (error) {
    console.error(`Gagal menghapus user ${userID}:`, error.response?.data || error.message);
  }
}

// Fungsi utama untuk menghapus semua user & server yang bukan admin
async function deleteNonAdminUsersAndServers() {
  const users = await getUsers();
  const servers = await getServers();
  let totalSrv = 0

  for (const user of users) {
    if (user.attributes.root_admin) {
      console.log(`Lewati admin: ${user.attributes.username}`);
      continue; // Lewati admin
    }

    const userID = user.attributes.id;
    const userEmail = user.attributes.email;

    console.log(`Menghapus user: ${user.attributes.username} (${userEmail})`);

    // Cari server yang dimiliki user ini
    const userServers = servers.filter(srv => srv.attributes.user === userID);

    // Hapus semua server user ini
    for (const server of userServers) {
      await deleteServer(server.attributes.id);
      totalSrv += 1
    }

    // Hapus user setelah semua servernya terhapus
    await deleteUser(userID);
  }
await m.reply(`Berhasil menghapus *${totalSrv} user & server* panel yang bukan admin ✅`)
}

// Jalankan fungsi
return deleteNonAdminUsersAndServers();
} catch (err) {
return m.reply(`${JSON.stringify(err, null, 2)}`)
}
}
break

case "listpanel":
case "listserver": {
    if (!isOwner && !isReseller) {
        return m.reply(`Fitur ini hanya untuk di dalam grup reseller panel`);
    }

    try {
        const response = await fetch(`${domain}/api/application/servers`, {
            method: "GET",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${apikey}`,
            },
        });

        const result = await response.json();
        const servers = result.data;

        if (!servers || servers.length === 0) {
            return m.reply("Tidak ada server panel!");
        }

        let messageText = `\n*Total server panel :* ${servers.length}\n`

        for (const server of servers) {
            const s = server.attributes;

            const resStatus = await fetch(`${domain}/api/client/servers/${s.uuid.split("-")[0]}/resources`, {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${capikey}`,
                },
            });

            const statusData = await resStatus.json();

            const ram = s.limits.memory === 0
                ? "Unlimited"
                : s.limits.memory >= 1024
                ? `${Math.floor(s.limits.memory / 1024)} GB`
                : `${s.limits.memory} MB`;

            const disk = s.limits.disk === 0
                ? "Unlimited"
                : s.limits.disk >= 1024
                ? `${Math.floor(s.limits.disk / 1024)} GB`
                : `${s.limits.disk} MB`;

            const cpu = s.limits.cpu === 0
                ? "Unlimited"
                : `${s.limits.cpu}%`;

            messageText += `
- ID : *${s.id}*
- Nama Server : *${s.name}*
- Ram : *${ram}*
- Disk : *${disk}*
- CPU : *${cpu}*
- Created : *${s.created_at.split("T")[0]}*\n`;
        }                  
        await m.reply(messageText)

    } catch (err) {
        console.error("Error listing panel servers:", err);
        m.reply("Terjadi kesalahan saat mengambil data server.");
    }
}
break;

case "cadmin": {
    if (!isOwner) return m.reply(mess.owner);
    if (!text) return m.reply(`Masukan username & nomor (opsional)\n*contoh:* ${cmd} Amane,628XXX`)
    let nomor, usernem;
    const tek = text.split(",");
    if (tek.length > 1) {
        let [users, nom] = tek;
        if (!users || !nom) return m.reply(`Masukan username & nomor (opsional)\n*contoh:* ${cmd} Amane,628XXX`)

        nomor = nom.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
        usernem = users.toLowerCase();
    } else {
        usernem = text.toLowerCase();
        nomor = m.isGroup ? m.sender : m.chat;
    }

    const onWa = await sock.onWhatsApp(nomor.split("@")[0]);
    if (onWa.length < 1) return m.reply("Nomor target tidak terdaftar di WhatsApp!");

    const username = usernem.toLowerCase();
    const email = `${username}@gmail.com`;
    const name = global.capital(args[0]);
    const password = `${username}001`;

    try {
        const res = await fetch(`${domain}/api/application/users`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${apikey}`
            },
            body: JSON.stringify({
                email,
                username,
                first_name: name,
                last_name: "Admin",
                root_admin: true,
                language: "en",
                password
            })
        });

        const data = await res.json();
        if (data.errors) return m.reply(JSON.stringify(data.errors[0], null, 2));

        const user = data.attributes;
        const orang = nomor;

        if (nomor !== m.chat) {
            await m.reply(`Berhasil membuat akun admin panel ✅\nData akun terkirim ke nomor ${nomor.split("@")[0]}`);
        }

const teks = `
*Berikut membuat admin panel ✅*

📡 Server ID: ${user.id}
👤 Username: \`${user.username}\`
🔐 Password: \`${password}\`
🗓️ Tanggal Aktivasi: ${global.tanggal(Date.now())}
*🌐* ${global.domain}

*Rules pembelian admin panel*  
- Masa aktif 30 hari  
- Data bersifat pribadi, mohon disimpan dengan aman  
- Garansi berlaku 15 hari (1x replace)  
- Klaim garansi wajib menyertakan *bukti chat pembelian*
`;

let msg = generateWAMessageFromContent(orang, {
    viewOnceMessage: {
        message: {
            interactiveMessage: {
                body: { text: teks },
                nativeFlowMessage: {
                    buttons: [
                        { 
                            name: "cta_copy",
                            buttonParamsJson: `{"display_text":"Copy Username","copy_code":"${user.username}"}`
                        },
                        { 
                            name: "cta_copy",
                            buttonParamsJson: `{"display_text":"Copy Password","copy_code":"${password}"}`
                        },
                        { 
                            name: "cta_url",
                            buttonParamsJson: `{"display_text":"Open Panel","url":"${global.domain}"}`
                        }
                    ]
                }
            }
        }
    }
}, {});

await sock.relayMessage(orang, msg.message, { messageId: msg.key.id });
    } catch (err) {
        console.error(err);
        m.reply("Terjadi kesalahan saat membuat akun admin panel.");
    }
}
break;

case "deladmin": {
    if (!isOwner) return m.reply(mess.owner);
    try {
        const res = await fetch(`${domain}/api/application/users`, {
            method: "GET",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${apikey}`
            }
        });
        const rows = []
        const data = await res.json();
        const users = data.data;

        const adminUsers = users.filter(u => u.attributes.root_admin === true);
        if (adminUsers.length < 1) return m.reply("Tidak ada admin panel.");

        let teks = `\n*Total admin panel :* ${adminUsers.length}\n`
        adminUsers.forEach((admin, idx) => {
            teks += `
- ID : *${admin.attributes.id}*
- Nama : *${admin.attributes.first_name}*
- Created : ${admin.attributes.created_at.split("T")[0]}
`;
rows.push({
title: `${admin.attributes.first_name} || ID:${admin.attributes.id}`,
description: `Created At: ${admin.attributes.created_at.split("T")[0]}`, 
id: `.deladmin-response ${admin.attributes.id}`
})            
        });

        await sock.sendMessage(m.chat, {
  buttons: [
    {
    buttonId: 'action',
    buttonText: { displayText: 'ini pesan interactiveMeta' },
    type: 4,
    nativeFlowInfo: {
        name: 'single_select',
        paramsJson: JSON.stringify({
          title: 'Pilih Admin Panel',
          sections: [
            {
              title: `© Powered By ${namaOwner}`,
              rows: rows
            }
          ]
        })
      }
      }
  ],
  headerType: 1,
  viewOnce: true,
  text: `\nPilih Admin Panel Yang Ingin Dihapus\n`
}, { quoted: m })

    } catch (err) {
        console.error(err);
        m.reply("Terjadi kesalahan saat mengambil data admin.");
    }
}
break;

case "deladmin-response": {
    if (!isOwner) return m.reply(mess.owner);
    if (!text) return 
    try {
        const res = await fetch(`${domain}/api/application/users`, {
            method: "GET",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${apikey}`
            }
        });

        const data = await res.json();
        const users = data.data;

        let targetAdmin = users.find(
            (e) => e.attributes.id == args[0] && e.attributes.root_admin === true
        );

        if (!targetAdmin) {
            return m.reply("Gagal menghapus akun!\nID user tidak ditemukan");
        }

        const idadmin = targetAdmin.attributes.id;
        const username = targetAdmin.attributes.username;

        const delRes = await fetch(`${domain}/api/application/users/${idadmin}`, {
            method: "DELETE",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${apikey}`
            }
        });

        if (!delRes.ok) {
            const errData = await delRes.json();
            return m.reply(`Gagal menghapus akun admin!\n${JSON.stringify(errData.errors[0], null, 2)}`);
        }

        await m.reply(`*Berhasil Menghapus Admin Panel ✅*\n- ID: ${text}\n- Nama User: ${global.capital(username)}`);

    } catch (err) {
        console.error(err);
        m.reply("Terjadi kesalahan saat menghapus akun admin.");
    }
}
break;

case "listadmin": {
    if (!isOwner) return m.reply(mess.owner);

    try {
        const res = await fetch(`${domain}/api/application/users`, {
            method: "GET",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${apikey}`
            }
        });

        const data = await res.json();
        const users = data.data;

        const adminUsers = users.filter(u => u.attributes.root_admin === true);
        if (adminUsers.length < 1) return m.reply("Tidak ada admin panel.");

        let teks = `\n*Total admin panel :* ${adminUsers.length}\n`
        adminUsers.forEach((admin, idx) => {
            teks += `
- ID : *${admin.attributes.id}*
- Nama : *${admin.attributes.first_name}*
- Created : ${admin.attributes.created_at.split("T")[0]}
`;
        });

        await m.reply(teks)

    } catch (err) {
        console.error(err);
        m.reply("Terjadi kesalahan saat mengambil data admin.");
    }
}
break;

case "addseller": {
    if (!isOwner) return m.reply(mess.owner);
    if (!text && !m.quoted) return m.reply(`*contoh:* ${cmd} 6283XXX`);

    const input = m.mentionedJid[0] 
        ? m.mentionedJid[0] 
        : m.quoted 
            ? m.quoted.sender 
            : text.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

    const input2 = input.split("@")[0];

    if (input2 === global.owner || global.db.settings.reseller.includes(input) || input === botNumber)
        return m.reply(`Nomor ${input2} sudah menjadi reseller!`);

    global.db.settings.reseller.push(input);
    m.reply(`Berhasil menambah reseller ✅`);
}
break;

case "listseller": {
    const list = global.db.settings.reseller;
    if (!list || list.length < 1) return m.reply("Tidak ada user reseller");

    let teks = `Daftar reseller:\n`;
    for (let i of list) {
        const num = i.split("@")[0];
        teks += `\n• ${num}\n  Tag: @${num}\n`;
    }

    sock.sendMessage(m.chat, { text: teks, mentions: list }, { quoted: m });
}
break;

case "delseller": {
    if (!isOwner) return m.reply(mess.owner);
    if (!m.quoted && !text) return m.reply(`*Contoh :* ${cmd} 6283XXX`);

    const input = m.mentionedJid[0] 
        ? m.mentionedJid[0] 
        : m.quoted 
            ? m.quoted.sender 
            : text.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

    const input2 = input.split("@")[0];

    if (input2 === global.owner || input === botNumber)
        return m.reply(`Tidak bisa menghapus owner!`);

    const list = global.db.settings.reseller;
    if (!list.includes(input))
        return m.reply(`Nomor ${input2} bukan reseller!`);

    list.splice(list.indexOf(input), 1);
    m.reply(`Berhasil menghapus reseller ✅`);
}
break;

case "own": case "owner": {
await sock.sendContact(m.chat, [global.owner], global.namaOwner, "Owner Bot 👑", m)
}
break
case "developer": case "dev": {
await sock.sendContact(m.chat, ["6289529161314"], "Yt Amane Ofc", "Developer Bot 👑", m)
}
break
case "addowner": case "addown": {
    if (!isOwner) return m.reply(mess.owner);

    const input = m.quoted 
        ? m.quoted.sender 
        : m.mentionedJid[0] 
            ? m.mentionedJid[0] 
            : text 
                ? text.replace(/[^0-9]/g, "") + "@s.whatsapp.net" 
                : null;

    if (!input) return m.reply(`*Contoh penggunaan :*\n${cmd} 6285XXX`);

    const jid = input.split("@")[0];
    const botNumber = sock.user.id.split(":")[0] + "@s.whatsapp.net";

    if (jid == global.owner || input == botNumber) 
        return m.reply(`Nomor ${jid} sudah menjadi ownerbot.`);

    if (global.db.settings.developer.includes(input)) 
        return m.reply(`Nomor ${jid} sudah menjadi ownerbot.`);

    global.db.settings.developer.push(input);
    return m.reply(`Berhasil menambah owner ✅\n- ${jid}`);
}
break;

case "delowner": case "delown": {
    if (!isOwner) return m.reply(mess.owner);

    const input = m.quoted 
        ? m.quoted.sender 
        : m.mentionedJid[0] 
            ? m.mentionedJid[0] 
            : text 
                ? text.replace(/[^0-9]/g, "") + "@s.whatsapp.net" 
                : null;

    if (!input) return m.reply(`*Contoh penggunaan :*\n${cmd} 6285XXX`);

    if (input.toLowerCase() === "all") {
        global.db.settings.developer = [];
        return m.reply("Berhasil menghapus semua owner ✅");
    }

    if (!global.db.settings.developer.includes(input)) 
        return m.reply("Nomor tidak ditemukan!");

    global.db.settings.developer = global.db.settings.developer.filter(i => i !== input);
    return m.reply(`Berhasil menghapus owner ✅\n- ${input.split("@")[0]}`);
}
break;

case "listowner": case "listown": {
    const Own = global.db.settings.developer;
    if (!Own || Own.length < 1) return m.reply("Tidak ada owner tambahan.");

    let teks = "Daftar owner tambahan:\n";
    for (let i of Own) {
        const num = i.split("@")[0];
        teks += `\n- Number: ${num}\n- Tag: @${num}\n`;
    }
    return sock.sendMessage(m.chat, { text: teks, mentions: Own }, { quoted: m });
}
break;
case 'delcase': {

 if (!isOwner) return m.reply(mess.owner);

 if (!text) return m.reply(`Contoh: ${cmd} nama case`);

 const fs = require('fs').promises;

 async function dellCase(filePath, caseNameToRemove) {

 try {

 let data = await fs.readFile(filePath, 'utf8');

 const regex = new RegExp(`case\\s+'${caseNameToRemove}':[\\s\\S]*?break`, 'g');

 const modifiedData = data.replace(regex, '');

 if (data === modifiedData) {

 m.reply('Case tidak ditemukan atau sudah dihapus.');

 return;

 }

 await fs.writeFile(filePath, modifiedData, 'utf8');

 m.reply('Sukses menghapus case!');

 } catch (err) {

 m.reply(`Terjadi kesalahan: ${err.message}`);

 }

 }

 dellCase('./Amane.js', q);

 }

 break
case "resetdb": case "rstdb": {
if (!isOwner) return m.reply(mess.owner)
global.db = {}
return m.reply("Berhasil mereset database ✅")
}
break
// ✨ AUTO RESPON UNTUK LIST PRODUK
if (!body.startsWith(prefix)) {
    const lower = body.toLowerCase().trim();

    // Cek jika user kirim nomor (misal "1" untuk pilih list ke-1)
    if (!isNaN(lower)) {
        const idx = parseInt(lower) - 1;
        if (idx >= 0 && idx < listProduk.length) {
            const found = listProduk[idx];
            try {
                await sock.sendMessage(m.chat, {
                    image: { url: found.url },
                    caption: found.isi
                }, { quoted: m });
            } catch (err) {
                console.error("❌ Error kirim list:", err);
                m.reply("⚠️ Gagal menampilkan list, periksa link gambar!");
            }
        }
        return;
    }

    // Cek jika user ketik nama list langsung
    const found = listProduk.find(v => v.judul.toLowerCase() === lower);
    if (found) {
        try {
            await sock.sendMessage(m.chat, {
                image: { url: found.url },
                caption: found.isi
            }, { quoted: m });
        } catch (err) {
            console.error("❌ Error kirim list:", err);
            m.reply("⚠️ Gagal menampilkan list, periksa link gambar!");
        }
    }
}
case "alldown":
case "downr": {
 if (!text) return m.reply(`Link nya mana?!\nContoh: *${cmd} https://vt.tiktok.com/ZSygRMVNM/*`)

 await m.reply('Waitt! Loading download all download!')

 try {
 const { data } = await axios.post(
 'https://downr.org/.netlify/functions/download',
 { url: text },
 {
 headers: {
 'content-type': 'application/json',
 origin: 'https://downr.org',
 referer: 'https://downr.org/',
 'user-agent': 
 'Mozilla/5.0 (Linux; Android 15; SM-F958 Build/AP3A.240905.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36',
 }
 }
 );

 if (!data || !data.medias || !data.medias.length)
 return m.reply('E-eh? Aku gak nemu medianya nih... apa linknya salah?')

 const video = data.medias.find(v => v.quality === 'hd_no_watermark') || data.medias[0]
 const videoUrl = video.url

 await sock.sendMessage(
 m.chat,
 {
 video: { url: videoUrl },
 caption: `🎬 *${data.title || 'Berhasil kok!'}*\n👤 ${data.author || '-'}\n\nStatus Done✅`,
 mimetype: 'video/mp4',
 jpegThumbnail: data.thumbnail ? await getBuffer(data.thumbnail) : null
 },
 { quoted: m }
 );

 } catch (e) {
 console.error('Error downloader:', e)
 await m.reply(`A-apa?! Ada error nih...\n${e.message || e}`)
 }
}
break

case "paustart2":
case "paustad":
case "pak-ustad2": {
 if (!text) return m.reply(`Contoh: ${cmd} Makan sambil kayang bisa gak pak ustad`)

 try {
 const url = `https://api.taka.my.id/pak-ustadv2?text=${encodeURIComponent(text)}`
 const img = await getBuffer(url)

 await sock.sendMessage(
 m.chat,
 {
 image: img,
 caption: `📿 *Pak Ustad Menjawab*\n\n${text}`
 },
 { quoted: m }
 )

 } catch (err) {
 console.error(err)
 m.reply("❌ Terjadi kesalahan saat membuat gambar pak ustad.")
 }
}
break
case 'mf':
case 'mediafire':
case 'mfdl': {
 try {
 if (!text) return m.reply(`Ugh... Kamu ini nggak bisa baca ya?! >///<\n💢 Contohnya gini:\n${cmd} https://www.mediafire.com/file/...`);
 if (!/mediafire\.com/.test(text)) return m.reply('Hmph~ Itu bukan link MediaFire yang benar, bodoh! 💢');

 // FIX: xreact dihapus agar tidak error
 await sock.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

 await m.reply('Y-ya udah, hmph~ tunggu sebentar ya... Aku *lagi kerja keras* buat ngambil datanya 😳');

 const axios = require('axios');
 const cheerio = await import('cheerio').then(m => m.default || m);

 const res = await axios.get(text, {
 headers: {
 "User-Agent": "Mozilla/5.0",
 "Accept": "text/html,application/xhtml+xml"
 },
 timeout: 30000
 });

 const $ = cheerio.load(res.data);

 let fileName =
 $('.filename').first().text().trim() ||
 $('h1.filename').first().text().trim() ||
 $('title').text().trim() ||
 'file.unknown';

 fileName = decodeURIComponent(fileName).replace(/\s+/g, ' ').trim();

 let fileSize =
 $('.details li span').first().text().trim() ||
 $('li:contains("Size")').text().replace(/Size/i, '').trim() ||
 'Tidak diketahui';

 let downloadLink = $('#downloadButton').attr('href');

 if (!downloadLink) {
 const scrambled = $('#downloadButton').attr('data-scrambled-url');
 if (scrambled) downloadLink = Buffer.from(scrambled, 'base64').toString('ascii');
 }

 if (!downloadLink) {
 return m.reply('A-aku nggak nemu link download-nya! Mungkin... kamu kasih link salah ya, baka! 💢');
 }

 await sock.sendMessage(
 m.chat,
 {
 document: { url: downloadLink },
 mimetype: 'application/octet-stream',
 fileName: fileName,
 caption:
`Ehh?! Nih... aku udah berhasil dapetin file-nya 😳

📦 *MediaFire Downloader*
-------------------------
📄 Nama : ${fileName}
💾 Ukuran : ${fileSize}
🔗 Link : ${text}

Jangan bilang makasih berlebihan ya!! Bukan karena aku perhatian kok!! >///<`
 },
 { quoted: m }
 );

 await sock.sendMessage(m.chat, { react: { text: '💢', key: m.key } });

 } catch (err) {
 console.error(err);

 if (String(err).includes('413')) {
 return m.reply(`Ugh... file-nya kegedean (>300MB) 😣 aku nggak bisa kirim yang segede itu!\n\nIni link aslinya aja deh:\n${text}`);
 }

 m.reply(`A-ada kesalahan... 😖\n${err.message}`);
 }
}
break
case 'reactch':
case 'rch': {
 if (!isOwner) return m.reply(mess.owner);
 if (!text) return m.reply(`Contoh: ${cmd}reactch https://whatsapp.com/channel/xxxx 😂,😮,👍`)


 let [link, emoji] = text.includes('|') ? text.split('|') : text.split(' ')

 if (!link || !emoji) return m.reply(`Format salah!\nContoh:\n${cmd}reactch https://whatsapp.com/channel/xxxx 😂,😮,👍`)

 try {
 const res = await fetch(
 `https://react.whyux-xec.my.id/api/rch?link=${encodeURIComponent(link)}&emoji=${encodeURIComponent(emoji)}`,
 {
 method: "GET",
 headers: {
 "x-api-key": "211b9a4e520a973ba2e18d16d8e4e1ea021f822dd0e3322b46e9dcf72cd8ccb1"
 }
 }
 )

 // ambil mentah
 const raw = await res.text()

 // tampilkan raw di console (supaya tahu hasil asli API)
 console.log("RAW RESP:", raw)

 // coba parse json
 let json
 try {
 json = JSON.parse(raw)
 } catch {
 // API tidak kirim JSON tapi react tetap jalan
 return m.reply(`✅ *React Channel Berhasil!*\n(Non JSON response API)`)
 }

 // API tidak kirim status → kita langsung anggap success
 m.reply(`✅ *React Channel Berhasil!*\n• Link: ${link}\n• Emoji: ${emoji}`)
 
 } catch (e) {
 m.reply(`❌ Error: ${e}`)
 }
}
break

case "setptla": {
 if (!isOwner) return m.reply(mess.owner);
 if (!text) return m.reply(`*Contoh :* ${cmd} apikey_ptla`);
 try {
 global.apikey = text.trim();
 let f = "./setting.js";
 let c = fs.readFileSync(f, "utf8");
 let u = c.replace(/global\.apikey\s*=\s*["'].*?["']/, `global.apikey = "${global.apikey}"`);
 fs.writeFileSync(f, u, "utf8");
 await m.reply(`✅ Apikey panel berhasil diganti!\n${global.apikey}`);
 } catch (err) {
 console.error("Set API Key Error:", err);
 m.reply("Terjadi kesalahan saat mengganti API Key.");
 }
}
break;

case "setptlc": {
 if (!isOwner) return m.reply(mess.owner);
 if (!text) return m.reply(`*Contoh :* ${cmd} apikey_ptlc`);
 try {
 global.capikey = text.trim();
 let f = "./setting.js";
 let c = fs.readFileSync(f, "utf8");
 let u = c.replace(/global\.capikey\s*=\s*["'].*?["']/, `global.capikey = "${global.capikey}"`);
 fs.writeFileSync(f, u, "utf8");
 await m.reply(`✅ Capikey panel berhasil diganti!\n${global.capikey}`);
 } catch (err) {
 console.error("Set CAPiKey Error:", err);
 m.reply("Terjadi kesalahan saat mengganti CAPiKey.");
 }
}
break;

case "setdomain": {
 if (!isOwner) return m.reply(mess.owner);
 if (!text) return m.reply(`*Contoh :* ${cmd} link_panel`);
 try {
 // Hanya ambil domain utama, buang path tambahan
 let input = text.trim();
 let url;
 try {
 url = new URL(input);
 } catch {
 return m.reply("Link domain tidak valid! Pastikan formatnya: https://namadomain.com");
 }
 global.domain = `${url.protocol}//${url.hostname}`;
 
 let f = "./setting.js";
 let c = fs.readFileSync(f, "utf8");
 let u = c.replace(/global\.domain\s*=\s*["'].*?["']/, `global.domain = "${global.domain}"`);
 fs.writeFileSync(f, u, "utf8");
 
 await m.reply(`✅ Domain panel berhasil diganti!\n${global.domain}`);
 } catch (err) {
 console.error("Set Domain Error:", err);
 m.reply("Terjadi kesalahan saat mengganti domain.");
 }
}
break;

case "setthumbnail": case "setthumb": {
 if (!isOwner) return reply(mess.owner)
 if (!/image/.test(mime)) return m.reply(`Kirim gambar dengan caption *${cmd}* untuk mengganti thumbnail menu`);
 const { ImageUploadService } = require('node-upload-images');
 try {
 let mediaPath = m.quoted ? await m.quoted.download() : await m.download()
 const service = new ImageUploadService('pixhost.to');
 let buffer = mediaPath
 let { directLink } = await service.uploadFromBinary(buffer, 'thumbnail.png');
 
 global.thumbnail = directLink;
 let f = "./setting.js";
 let c = fs.readFileSync(f, "utf8");
 let u = c.replace(/global\.thumbnail\s*=\s*["'].*?["']/, `global.thumbnail = "${directLink}"`);
 fs.writeFileSync(f, u, "utf8");
 
 await m.reply(`Thumbnail menu berhasil diganti ✅\nURL: ${directLink}`);
 } catch (err) {
 console.error("Ganti Thumbnail Error:", err);
 m.reply("Terjadi kesalahan saat mengganti thumbnail.");
 }
}
break;

case "listch": case "listchannel": {
if (!isOwner) return m.reply(mess.owner)

try {
// Baca file list_channel.json dari folder data
const fs = require('fs')
const path = require('path')
const filePath = path.join(process.cwd(), 'data', 'list_channel.json')

// Cek apakah file exists
if (!fs.existsSync(filePath)) {
return m.reply('File list_channel.json tidak ditemukan di folder data!')
}

// Baca dan parse JSON
const rawData = fs.readFileSync(filePath, 'utf8')
const channelIds = JSON.parse(rawData)

// Cek apakah hasil parse adalah array
if (!Array.isArray(channelIds)) {
return m.reply('Format file salah! Bukan array.')
}

let teks = `*DAFTAR CHANNEL (ID ONLY)*\n`
teks += `*Total channel :* ${channelIds.length}\n`
teks += `─────────────────\n\n`

// Loop melalui setiap channel ID
for (let i = 0; i < channelIds.length; i++) {
const channelId = channelIds[i]
teks += `*${i+1}.* ${channelId}\n`
}

// Jika tidak ada channel
if (channelIds.length === 0) {
teks += 'Belum ada channel yang terdaftar.'
}

return m.reply(teks)

} catch (error) {
console.error('Error reading list_channel.json:', error)
return m.reply('Terjadi kesalahan saat membaca database channel!')
}
}
break

case 'upapikey': {
 if (!isOwner) return m.reply("Perintah ini hanya untuk Creator Bot.");
 const text = args.join(" ");
 const parts = text.split(',');
 if (parts.length !== 3) {
 return m.reply("Format salah.\nGunakan: .upapikey domain,ptla,ptlc\n\nContoh:\n.upapikey https://panel.domain.com,ptla_xxx,ptlc_xxx");
 }
 const [newDomain, newPtla, newPtlc] = parts.map(p => p.trim());
 if (!newDomain.startsWith('http')) {
 return m.reply("Peringatan: Format domain tidak valid. Harap gunakan 'http://' atau 'https://'.");
 }
 if (!newPtla.startsWith('ptla_')) {
 return m.reply("Peringatan: API Key (PTLA) tidak valid. Kunci harus diawali dengan 'ptla_'.");
 }
 if (!newPtlc.startsWith('ptlc_')) {
 return m.reply("Peringatan: Client Key (PTLC) tidak valid. Kunci harus diawali dengan 'ptlc_'.");
 }
 global.domain = newDomain;
 global.apikey = newPtla;
 global.capikey = newPtlc;
 const updates = [
 { key: 'domain', value: newDomain },
 { key: 'apikey', value: newPtla },
 { key: 'capikey', value: newPtlc }
 ];
 const success = await updateApiKeys(updates);
 if (success) {
 m.reply("✅ Berhasil memperbarui API Key Server Panel");
 } else {
 m.reply("❌ Gagal memperbarui API Key. Silakan cek konsol untuk error.");
 }
 }
 break;
case 'tiktok2':
case 'tt2':
case 'ttdl2': {
 const axios = require('axios');
 const cheerio = require('cheerio');
 const FormData = require('form-data');
 const moment = require('moment-timezone');
 const { exec } = require('child_process');
 const fs = require('fs');
 const path = require('path');

 async function tiktokV1(query) {
 const encodedParams = new URLSearchParams();
 encodedParams.set('url', query);
 encodedParams.set('hd', '1');

 const { data } = await axios.post('https://tikwm.com/api/', encodedParams, {
 headers: {
 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
 'Cookie': 'current_language=en',
 'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36'
 }
 });
 return data;
 }

 async function tiktokV2(query) {
 const form = new FormData();
 form.append('q', query);

 const { data } = await axios.post('https://savetik.co/api/ajaxSearch', form, {
 headers: {
 ...form.getHeaders(),
 'Accept': '*/*',
 'Origin': 'https://savetik.co',
 'Referer': 'https://savetik.co/en2',
 'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36',
 'X-Requested-With': 'XMLHttpRequest'
 }
 });

 const rawHtml = data.data;
 const $ = cheerio.load(rawHtml);
 const title = $('.thumbnail .content h3').text().trim();
 const thumbnail = $('.thumbnail .image-tik img').attr('src');
 const video_url = $('video#vid').attr('data-src');

 const slide_images = [];
 $('.photo-list .download-box li').each((_, el) => {
 const imgSrc = $(el).find('.download-items__thumb img').attr('src');
 if (imgSrc) slide_images.push(imgSrc);
 });

 return { title, thumbnail, video_url, slide_images };
 }

 if (!text) return m.reply('Masukkan URL TikTok yang valid.\nContoh: .tiktok https://vt.tiktok.com/xxxxxx');

 await m.reply('Mohon tunggu, sedang memproses dan mengkonversi video...');

 try {
 let res;
 let images = [];

 const dataV1 = await tiktokV1(text);
 if (dataV1?.data) {
 const d = dataV1.data;
 if (Array.isArray(d.images) && d.images.length > 0) {
 images = d.images;
 } else if (Array.isArray(d.image_post) && d.image_post.length > 0) {
 images = d.image_post;
 }
 res = {
 title: d.title,
 region: d.region,
 duration: d.duration,
 create_time: d.create_time,
 play_count: d.play_count,
 digg_count: d.digg_count,
 comment_count: d.comment_count,
 share_count: d.share_count,
 download_count: d.download_count,
 author: {
 unique_id: d.author?.unique_id,
 nickname: d.author?.nickname
 },
 music_info: {
 title: d.music_info?.title,
 author: d.music_info?.author
 },
 cover: d.cover,
 play: d.play,
 hdplay: d.hdplay,
 wmplay: d.wmplay
 };
 }

 const dataV2 = await tiktokV2(text);
 if ((!res?.play && images.length === 0) && dataV2.video_url) {
 res = res || { play: dataV2.video_url, title: dataV2.title };
 }
 if (images.length === 0 && Array.isArray(dataV2.slide_images) && dataV2.slide_images.length > 0) {
 images = dataV2.slide_images;
 }

 if (images.length > 0) {
 await m.reply(`Terdeteksi ${images.length} gambar, sedang mengirim...`);
 for (const img of images) {
 await sock.sendMessage(m.chat, {
 image: { url: img },
 caption: res.title || ''
 }, { quoted: m });
 }
 return;
 }

 const time = res.create_time ?
 moment.unix(res.create_time).tz('Asia/Jakarta').format('dddd, D MMMM YYYY [pukul] HH:mm:ss') :
 '-';

 const caption = `*Video TikTok Info*
*Judul:* ${res.title || '-'}
*Region:* ${res.region || 'N/A'}
*Durasi:* ${res.duration || '-'} detik
*Waktu Upload:* ${time}
*Author:* ${res.author?.nickname || '-'}`;

 const videoUrl = res.hdplay || res.play || res.wmplay;
 if (videoUrl) {
 const tempDir = './tmp';
 if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
 const inputPath = path.join(tempDir, `tiktok_in_${Date.now()}.mp4`);
 const outputPath = path.join(tempDir, `tiktok_out_${Date.now()}.mp4`);

 try {
 const response = await axios({
 url: videoUrl,
 method: 'GET',
 responseType: 'stream'
 });
 const writer = fs.createWriteStream(inputPath);
 response.data.pipe(writer);
 await new Promise((resolve, reject) => {
 writer.on('finish', resolve);
 writer.on('error', reject);
 });

 await new Promise((resolve, reject) => {
 exec(`ffmpeg -i ${inputPath} -c:v libx264 -c:a aac -pix_fmt yuv420p -movflags +faststart ${outputPath}`, (error, stdout, stderr) => {
 if (error) {
 console.error('FFmpeg Error:', stderr);
 return reject(new Error('Gagal mengkonversi video. Pastikan FFmpeg terpasang.'));
 }
 resolve(true);
 });
 });

 const videoBuffer = fs.readFileSync(outputPath);
 await sock.sendMessage(m.chat, { 
 video: videoBuffer, 
 caption: caption, 
 mimetype: 'video/mp4' 
 }, { quoted: m });

 } finally {
 if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
 if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
 }
 } else {
 m.reply("Maaf, gagal menemukan link video yang valid dari URL tersebut.");
 }
 } catch (e) {
 console.error(e);
 m.reply(`Terjadi kesalahan saat memproses permintaan: ${e.message}`);
 }
}
break;

case 'iqc': {
 try {
 if (!text) {
 m.reply('Format salah! Gunakan: .iqc jam|batre|pesan\nContoh: .iqc 18:00|40|hai hai');
 break;
 }
 const parts = text.split('|');
 if (parts.length < 3) {
 m.reply('Format salah! Gunakan:\n.iqc jam|batre|pesan\nContoh:\n.iqc 18:00|40|hai hai');
 break;
 }
 const [time, battery, ...messageParts] = parts;
 const message = messageParts.join('|').trim();
 if (!time || !battery || !message) {
 m.reply('Format tidak lengkap! Pastikan mengisi jam, batre, dan pesan');
 break;
 }
 const encodedTime = encodeURIComponent(time);
 const encodedMessage = encodeURIComponent(message);
 const url = `https://brat.siputzx.my.id/iphone-quoted?time=${encodedTime}&batteryPercentage=${battery}&carrierName=INDOSAT&messageText=${encodedMessage}&emojiStyle=apple`;
 const axios = require('axios');
 const response = await axios.get(url, { responseType: 'arraybuffer' });
 if (!response.data) throw new Error('Gagal mendapatkan gambar dari server');
 await sock.sendMessage(m.chat, { image: Buffer.from(response.data), caption: 'Pesan iPhone quote berhasil dibuat' }, { quoted: m });
 } catch (error) {
 console.error('Error di iqc:', error);
 m.reply(`Error: ${error.message || 'Terjadi kesalahan saat memproses'}`);
 }
}
break;

case "jpmch": {
 if (!isOwner) return m.reply(mess.owner)
 if (!text) return m.reply(`*Contoh:* ${cmd} pesannya\n\n📎 Bisa sambil kirim/balas foto atau video`)

 const jpmListPath = './data/list_channel.json'
 if (!fs.existsSync(jpmListPath)) {
   return m.reply(
     "❌ File *list_channel.json* belum ada.\n" +
     "Tambahkan ID channel dulu dengan perintah:\n" +
     "• *.setjpmch add ID@newsletter*\n" +
     "• *.pushch ID@newsletter*"
   )
 }

 const rawJpmList = JSON.parse(fs.readFileSync(jpmListPath, 'utf8'))
 const channelList = rawJpmList
   .map(i => typeof i === 'string' ? i : (i.id || null))
   .filter(id => id && id.endsWith('@newsletter'))

 if (channelList.length === 0) {
   return m.reply("❌ Tidak ada ID channel yang valid di database.\nGunakan *.setjpmch add ID@newsletter* untuk menambah.")
 }

 // Deteksi media (foto/video) dari pesan langsung atau reply
 let jpmMediaBuffer = null
 let jpmMediaType = null
 const qTarget = m.quoted ? m.quoted : m
 const qMime = qTarget?.msg?.mimetype || qTarget?.mimetype || ''

 if (/image/.test(qMime)) {
   console.log(chalk.cyan('📷 [JPMCH] Mendeteksi FOTO...'))
   try {
     jpmMediaBuffer = await qTarget.download()
     jpmMediaType = 'image'
   } catch (e) {
     console.log(chalk.red('❌ [JPMCH] Gagal download foto:', e.message))
   }
 } else if (/video/.test(qMime)) {
   console.log(chalk.cyan('🎬 [JPMCH] Mendeteksi VIDEO...'))
   try {
     jpmMediaBuffer = await qTarget.download()
     jpmMediaType = 'video'
   } catch (e) {
     console.log(chalk.red('❌ [JPMCH] Gagal download video:', e.message))
   }
 }

 const jpmTipeLabel = jpmMediaType ? (jpmMediaType === 'image' ? 'Teks & Foto' : 'Teks & Video') : 'Teks'

 // Bangun konten pesan
 let jpmContent
 if (jpmMediaBuffer && jpmMediaType === 'image') {
   jpmContent = { image: jpmMediaBuffer, caption: text }
 } else if (jpmMediaBuffer && jpmMediaType === 'video') {
   jpmContent = { video: jpmMediaBuffer, caption: text, mimetype: 'video/mp4' }
 } else {
   jpmContent = { text }
 }

 // Log awal
 console.log(
   chalk.bgMagenta.white.bold(' JPM CHANNEL MULAI ') + '\n' +
   chalk.magenta('├─ Total Channel : ') + chalk.white(channelList.length) + '\n' +
   chalk.magenta('├─ Tipe Konten   : ') + chalk.white(jpmTipeLabel) + '\n' +
   chalk.magenta('└─ Pesan Preview : ') + chalk.gray(text.substring(0, 60) + (text.length > 60 ? '...' : ''))
 )

 await m.reply(
   `📢 *Memproses JPM Channel*\n\n` +
   `📨 Tipe     : ${jpmTipeLabel}\n` +
   `📡 Total    : ${channelList.length} channel\n\n` +
   `⏳ Sedang mengirim...`
 )

 let successCount = 0
 let failCount = 0

 for (const chId of channelList) {
   try {
     await sock.sendMessage(chId, jpmContent)
     successCount++
     console.log(chalk.green(`  ✅ [JPMCH] Terkirim → ${chId}`))
   } catch (err) {
     failCount++
     console.log(chalk.red(`  ❌ [JPMCH] Gagal    → ${chId} | Error: ${err.message}`))
   }
   await sleep(4000)
 }

 console.log(
   chalk.bgMagenta.white.bold(' JPM CHANNEL SELESAI ') +
   chalk.white(` ✅ ${successCount} berhasil | ❌ ${failCount} gagal`)
 )

 await m.reply(
   `✅ *JPM Channel Selesai!*\n\n` +
   `📤 Berhasil : ${successCount} channel\n` +
   `❌ Gagal    : ${failCount} channel\n` +
   `📎 Tipe     : ${jpmTipeLabel}`
 )
}
break

case "pushch": {
 if (!isOwner) return m.reply(mess.owner)
 if (!text) return m.reply(`Masukkan ID Channel.\nContoh: ${cmd} 123456@newsletter`)
 
 const dbPath = './data/list_channel.json'
 let dbData = []
 
 // Cek file dan baca
 if (fs.existsSync(dbPath)) {
 dbData = JSON.parse(fs.readFileSync(dbPath))
 }
 
 // Cek duplikasi
 if (dbData.includes(text)) return m.reply("ID Channel sudah ada di database.")
 
 // Simpan
 dbData.push(text)
 fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2))
 m.reply(`Berhasil menyimpan ID Channel ke database.\nTotal Channel: ${dbData.length}`)
}
break

default:
if (m.text.toLowerCase().startsWith("xx")) {
    if (m.sender.split("@")[0] !== global.owner) return 

    try {
        const result = await eval(`(async () => { ${text} })()`);
        const output = typeof result !== "string" ? util.inspect(result) : result;
        return sock.sendMessage(m.chat, { text: util.format(output) }, { quoted: m });
    } catch (err) {
        return sock.sendMessage(m.chat, { text: util.format(err) }, { quoted: m });
    }
}

if (m.text.toLowerCase().startsWith("x")) {
    if (m.sender.split("@")[0] !== global.owner) return 

    try {
        let result = await eval(text);
        if (typeof result !== "string") result = util.inspect(result);
        return sock.sendMessage(m.chat, { text: util.format(result) }, { quoted: m });
    } catch (err) {
        return sock.sendMessage(m.chat, { text: util.format(err) }, { quoted: m });
    }
}

if (m.text.startsWith('$')) {
    if (!isOwner) return;
    
    exec(m.text.slice(2), (err, stdout) => {
        if (err) {
            return sock.sendMessage(m.chat, { text: err.toString() }, { quoted: m });
        }
        if (stdout) {
            return sock.sendMessage(m.chat, { text: util.format(stdout) }, { quoted: m });
        }
    });
}

}

} catch (err) {
    console.log(err)
    await sock.sendMessage(global.owner+"@s.whatsapp.net", {text: err.toString()}, {quoted: m ? m : null })
}
}; 


//=============================================//

process.on("uncaughtException", (err) => {
    console.error("Caught exception:", err);
});

let file = require.resolve(__filename);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    console.log(chalk.blue(">> Update File:"), chalk.black.bgWhite(__filename));
    delete require.cache[file];
    require(file);
});
// HAPUS tanda } yang ada di sini sebelumnya jika masih ada
