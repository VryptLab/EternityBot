![Banner](https://raw.githubusercontent.com/VryptLab/.github/refs/heads/main/banner.png)

![Node.js](https://img.shields.io/badge/Node.js-v20%2B-brightgreen?logo=nodedotjs)
![NPM](https://img.shields.io/badge/npm-v10%2B-CB3837?logo=npm)
![License](https://img.shields.io/github/license/VryptLab/EternityBot)
![Stars](https://img.shields.io/github/stars/VryptLab/EternityBot?style=social)
![Forks](https://img.shields.io/github/forks/VryptLab/EternityBot?style=social)
![Issues](https://img.shields.io/github/issues/VryptLab/EternityBot)
![Last Commit](https://img.shields.io/github/last-commit/VryptLab/EternityBot?logo=github)
![Platform](https://img.shields.io/badge/Platform-Node.js%20%7C%20Baileys-blue)
![Status](https://img.shields.io/badge/Status-Stable-success)
![Made with Love](https://img.shields.io/badge/Made%20By-Vrypt-success)

---

# EternityBot

lightweight and efficient WhatsApp bot built with **Node.js** and **Baileys**.  
Focused on performance, modularity, and simplicity — perfect for developers who want power without bloat.

---

## Sponsor

🚀 **Need Affordable Hosting?**  
Deploy your bot with reliable and budget-friendly hosting services:

[![Athars Tech](https://img.shields.io/badge/Hosting-Athars.tech-blue?style=for-the-badge&logo=server)](https://athars.tech)

💬 **Contact Customer Service:**  
[WhatsApp CS](https://wa.me/message/LMBASWSPPRJNI1) for instant support and inquiries.

---

## Requirements

- Node.js v20 or higher
- npm or yarn
- Operating System: Windows 10/11, macOS 12+, or Linux (Ubuntu 20.04+ recommended)
- RAM: Minimum 2GB (4GB+ recommended)
- Disk Space: Minimum 500MB free
- Internet connection for package installation and updates

---

## Installation

```bash
git clone https://github.com/VryptLab/EternityBot.git
cd EternityBot
npm install
npm start
```

After running the bot, scan the QR code with your WhatsApp mobile app to connect.

---

## Configuration

Edit `config.js` file in the root directory:

```javascript
// Pairing number (for QR scan/Pairing code)
global.PAIRING_NUMBER = 62882003353414

// Main owner number + backup
global.ownerNumber = [
  '62882005514880',
  '62882003353414'
]

// Bot mode: 
// false = self mode (only owner)
// true  = public mode (all users)
global.pubelik = true

// Default messages for bot responses
global.mess = {
  wait: 'Please wait a moment...',
  owner: 'This feature can only be used by the Owner.',
  group: 'This feature can only be used in Groups.',
  admin: 'This feature can only be used by Group Admins.',
  botAdmin: 'Bot must be an Admin first.',
  private: 'This feature can only be used in private chat.'
}

// Default watermark for stickers
global.stickpack = 'Created By'
global.stickauth = 'EternityBot'

global.copyright = "© 2025 - VryptLabs"

global.title = "EternityBot"
global.body = "A lightweight and efficient WhatsApp bot built with Node.js and Baileys."
global.source = "https://github.com/VryptLab/EternityBot"
global.newsletter = "120363404886887749@newsletter"
global.thumbnail = "https://raw.githubusercontent.com/VryptLab/.github/refs/heads/main/banner.png"
global.logo = "https://raw.githubusercontent.com/VryptLab/.github/refs/heads/main/logo.png"
global.icon = "https://raw.githubusercontent.com/VryptLab/.github/refs/heads/main/black-logo.png"
```

## Contributing

Contributions are welcome. Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/name`)
3. Commit your changes (`git commit -m 'Add feature'`)
4. Push to the branch (`git push origin feature/name`)
5. Open a Pull Request

For major changes, please open an issue first to discuss what you would like to change.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Acknowledgments
- [*Vrypt Dev*](https://github.com/Vryptt) - maintainer
- [Agos ygy](https://github.com/AgusXzz) - Code base
- [Dika Ardnt](https://github.com/DikaArdnt) - Original work
- [WhiskeySockets/Baileys](https://github.com/WhiskeySockets/Baileys) - WhatsApp Web API

---

_© 2025 VryptLabs_
