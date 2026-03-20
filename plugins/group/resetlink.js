const { isOwner } = require("../../lib/helper")

module.exports = {
  commands: ["resetlink", "resetlinkgc"],
  
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

    const newCode = await ryza.groupRevokeInvite(from)
    const newLink = `https://chat.whatsapp.com/${newCode}`

    await ryza.sendMessage(from, { 
      text: `Link grup berhasil direset.\n\nLink baru: ${newLink}` 
    }, { quoted: msg })
  }
}