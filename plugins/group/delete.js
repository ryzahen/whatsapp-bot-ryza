const author = require("../owner/author")

function isOwner(sender) {
  const senderNumber = sender.split('@')[0]
  return author.owner.numbers.includes(senderNumber)
}

module.exports = {
  commands: ["delete", "del", "hapus"],
  
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

    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo
    if (!quotedMsg?.stanzaId) {
      await ryza.sendMessage(from, { 
        text: "Reply pesan yang ingin dihapus." 
      }, { quoted: msg })
      return
    }

    try {
      await ryza.sendMessage(from, {
        delete: {
          remoteJid: from,
          fromMe: false,
          id: quotedMsg.stanzaId,
          participant: quotedMsg.participant || quotedMsg.participantJid
        }
      })
    } catch (error) {
      console.error("Error deleting message:", error)
      await ryza.sendMessage(from, { 
        text: "Gagal menghapus pesan." 
      }, { quoted: msg })
    }
  }
}