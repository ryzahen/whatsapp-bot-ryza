const author = require("../owner/author")

function isOwner(sender) {
  const senderNumber = sender.split('@')[0]
  return author.owner.numbers.includes(senderNumber)
}

module.exports = {
  commands: ["add", "invite"],
  
  async execute(ryza, msg, { command, args, text, from, sender, pushname }) {
    if (!from.endsWith("@g.us")) {
      await ryza.sendMessage(from, { 
        text: "Perintah ini hanya bisa digunakan di dalam grup." 
      }, { quoted: msg })
      return
    }

    const groupMetadata = await ryza.groupMetadata(from)
    const participant = msg.key.participant || sender
    const isAdmin = groupMetadata.participants.find(p => p.id === participant)?.admin

    if (!isAdmin && !isOwner(sender)) {
      await ryza.sendMessage(from, { 
        text: "Maaf, hanya admin grup dan owner yang bisa menggunakan perintah ini." 
      }, { quoted: msg })
      return
    }

    if (!args[0]) {
      await ryza.sendMessage(from, { 
        text: "Masukkan nomor yang ingin ditambahkan.\nContoh: .add 628xx" 
      }, { quoted: msg })
      return
    }

    const number = args[0].replace(/[^0-9]/g, '')
    
    if (number.length < 10) {
      await ryza.sendMessage(from, { 
        text: "Nomor tidak valid. Pastikan nomor terdiri dari 10-15 digit angka." 
      }, { quoted: msg })
      return
    }

    const userJid = `${number}@s.whatsapp.net`

    try {
      await ryza.groupParticipantsUpdate(from, [userJid], "add")
      await ryza.sendMessage(from, { 
        text: `Berhasil menambahkan @${number} ke dalam grup.`,
        mentions: [userJid]
      }, { quoted: msg })
    } catch (error) {
      console.error("Error adding user:", error)
      await ryza.sendMessage(from, { 
        text: `Gagal menambahkan @${number}. Pastikan nomor terdaftar di WhatsApp dan memiliki izin untuk ditambahkan.`,
        mentions: [userJid]
      }, { quoted: msg })
    }
  }
}