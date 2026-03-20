const { isOwner } = require("../../lib/helper")

module.exports = {
  commands: ["setname", "setnama", "namagc"],
  
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
        text: "Masukkan nama grup yang baru.\nContoh: .setname Grup Baru" 
      }, { quoted: msg })
      return
    }

    await ryza.groupUpdateSubject(from, text)

    await ryza.sendMessage(from, { 
      text: `Berhasil mengubah nama grup menjadi: ${text}` 
    }, { quoted: msg })
  }
}