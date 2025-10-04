import { watchFile, unwatchFile } from 'fs'
import { fileURLToPath } from 'url'
import log from "#lib/logger.js"

// Nomor pairing (untuk scan QR/Pairing code)
global.PAIRING_NUMBER = 62882003353414

// Nomor owner utama + cadangan
global.ownerNumber = [
  '62882003353414',
  '62882005514880'
]

// Mode bot: 
// false  = self mode (hanya owner)
// true = public (semua user)
global.pubelik = true

// Pesan default untuk respon bot

// Default watermark untuk stiker
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

global.mess = {
  gagal: 'Gagal, harap lapor owner!',
  wait: 'Harap tunggu sebentar...',
  owner: 'Fitur ini hanya bisa digunakan oleh Owner.',
  group: 'Fitur ini hanya bisa digunakan dalam Group.',
  admin: 'Fitur ini hanya bisa digunakan oleh Admin Group.',
  botAdmin: 'Bot harus menjadi Admin terlebih dahulu.',
  private: 'Fitur ini hanya bisa digunakan di chat pribadi.'
}

const file = fileURLToPath(import.meta.url)
watchFile(file, () => {
  unwatchFile(file)
  log.info("berhasil relooad file config.")
  import(`${file}?update=${Date.now()}`)
})
