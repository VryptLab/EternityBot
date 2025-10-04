# EternityBot

![Banner](https://raw.githubusercontent.com/VryptLab/.github/refs/heads/main/banner.png)

![Node.js](https://img.shields.io/badge/Node.js-v20%2B-brightgreen?logo=nodedotjs)
![License](https://img.shields.io/github/license/VryptLab/EternityBot)
![Stars](https://img.shields.io/github/stars/VryptLab/EternityBot?style=social)

A lightweight and efficient WhatsApp bot built with Node.js and Baileys.

---

## Requirements

- Node.js v20 or higher
- npm or yarn

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
- [Agos ygy](https://github.com/AgusXzz) - Code base
- [Dika Ardnt](https://github.com/DikaArdnt) - Original work
- [WhiskeySockets/Baileys](https://github.com/WhiskeySockets/Baileys) - WhatsApp Web API

---

© 2025 VryptLabs
