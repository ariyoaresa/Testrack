# Testrack
Testrack is a web app built for Web3 testers and builders to organize, track, and manage their testnet activities across multiple blockchains.
# Figma file link
https://www.figma.com/design/h2PSub8Eou5lRd5rczds6A/Testrack?node-id=0-1&t=3cSGUaAd94w77PUz-1

# 🌐 Testrack — Manage Every Testnet

Testrack is an open-source web app built for **Web3 testers and builders** to help them manage, organize, and track all their **testnet participation** in one place — while also providing access to a **global faucet library** for every major blockchain network.

Testrack brings structure, automation, and visibility to the testnet experience — so testers never miss a deadline, lose track of their wallets, or struggle to find faucet tokens again.

---

## 🎯 Project Goal
Testrack’s goal is to **make testnet participation easy, organized, and rewarding**.  
The platform lets users:
- Save every testnet they’re participating in  
- Track progress, deadlines, and participation intervals  
- Get **notifications and reminders** when it’s time to act again  
- Explore and use a **multi-chain faucet library** (ETH, MATIC, SOL, AVAX, etc.)  
- Manage wallet connections securely  
- View a live **dashboard of participation stats**  

---

## 🧩 MVP Scope (Current Development Focus)

Testrack is currently in its **MVP (Minimum Viable Product)** phase.  
Contributors should focus on the following core features:

### **1. Testnet Management**
- Add, edit, and delete saved testnets manually.  
- Store details such as name, description, website link, logo, wallet used, wallet address, and participation interval.  
- Display the wallet address in shortened form (`0x123...abc`) on cards, but copy the full address when clicked.  

### **2. Countdown and Deadline System**
- Two countdown types:  
  - **Daily Deadline:** Resets automatically at midnight. If incomplete by then, the status changes to `Missed`.  
  - **24-hour Countdown Deadline:** Starts counting when a user completes a testnet; users can only redo after 24 hours.  
- After 24 hours, users receive a notification that participation is open again.  

### **3. Notifications**
- Email or in-app notifications when a testnet is near its deadline:  
  - When the remaining time is ≤ 12 hours  
  - When the remaining time is ≤ 1 hour  
- Notifications are linked directly to each testnet card.  

### **4. Faucet Library**
- Complete, searchable collection of active testnet faucets across 20+ blockchains.  
- Filters by chain, network, token type, category, daily limit, and requirements.  
- Sorting options (A–Z, chain, daily limit, or ease of use).  

### **5. Cloud Storage**
- All user data (testnets, notifications, wallet info) stored securely in the cloud.  
- User accounts tied to email authentication.  

---

## 🎨 Design & Branding

Testrack follows a **clean, modern, minimal UI** with structured grids, subtle shadows, and rounded corners — built to align with professional Web3 product design standards.  
Developers should refer to the Figma file for layout guidance, component spacing, and style system.

**Design Tokens:**
| Property | Value |
|-----------|--------|
| **Primary Color** | `#464BD9` |
| **Secondary Color** | `#DEDCFF` |
| **Background Color** | `#F8F9FC` |
| **Text Color** | `#050315` |
| **Accent Color** | `#301994` |

**Typography:**
- **Headers:** Geist  
- **Body:** Inter  
- **Code / Technical Elements:** Geist Mono  

**Design Reference:**  
🔗 [View Testrack Design in Figma](https://www.figma.com/design/h2PSub8Eou5lRd5rczds6A/Testrack?node-id=0-1&t=3cSGUaAd94w77PUz-1)

---

## ⚙️ Tech Stack

Contributors are free to use the most stable and efficient setup possible for the MVP build.  
Recommended structure:

| Layer | Suggested Stack |
|--------|------------------|
| **Frontend** | React + Tailwind CSS |
| **Backend** | Firebase / Supabase / Node.js (open to contributor suggestions) |
| **Database** | Firestore / Supabase SQL |
| **Authentication** | Email/Password (Firebase Auth) |
| **Notifications** | EmailJS, Firebase Cloud Messaging, or NodeMailer |
| **Hosting** | Vercel / Netlify / Firebase Hosting |

---

## 🧭 Feature Overview

| Module | Description |
|---------|--------------|
| **Dashboard** | Displays all saved testnets with progress cards and countdown timers. |
| **Notifications** | Alerts users about incomplete, missed, or ready-to-participate testnets. |
| **Faucet Library** | Comprehensive database of testnet faucets with filters and sort tools. |
| **Settings** | Allows password change, wallet updates, and preference settings. |
| **Admin Dashboard (Planned)** | Will later handle feedback management and faucet submissions. |

---

## 🚀 How to Contribute

Testrack is an **open-source project** — contributions of all kinds are welcome!

### 🧠 Ways to Contribute
- Improve UI components or fix layout issues  
- Connect frontend to backend (Firebase or custom API)  
- Enhance faucet library or add live faucet status  
- Build email notification logic  
- Improve authentication or dashboard features  

### 🔧 Setup Instructions
1. **Fork** this repository  
2. **Clone** your fork  
   ```bash
   git clone https://github.com/Game-Light/Testrack.git
   cd testrack
