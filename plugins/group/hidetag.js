const author = require("../owner/author")

function isOwner(sender) {
  const senderNumber = sender.split('@')[0]
  return author.owner.numbers.includes(senderNumber)
}

module.exports = {
  commands: ["hidetag", "htag"],
  
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

    if (!text) {
      await ryza.sendMessage(from, { 
        text: "Masukkan pesan yang ingin dikirim.\nContoh: .hidetag Selamat pagi semua" 
      }, { quoted: msg })
      return
    }

    const groupMembers = groupMetadata.participants.map(p => p.id)

    await ryza.sendMessage(from, {
      text: text,
      mentions: groupMembers
    }, { quoted: msg })
  }
}