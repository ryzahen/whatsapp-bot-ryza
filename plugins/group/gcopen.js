const { react } = require("../../lib/functions")
const { isOwner } = require("../../lib/helper")

module.exports = {
  commands: ["gcopen", "groupopen", "bukagc"],
  
  async execute(ryza, msg, { command, args, text, from, sender, pushname }) {
    if (!from.endsWith("@g.us")) {
      await react(ryza, from, msg, "❌")
      await ryza.sendMessage(from, { 
        text: "Perintah ini hanya bisa digunakan di dalam grup." 
      }, { quoted: msg })
      return
    }

    const groupMetadata = await ryza.groupMetadata(from)
    const participant = msg.key.participant || sender
    const isAdmin = groupMetadata.participants.find(p => p.id === participant)?.admin
    
    if (!isAdmin && !isOwner(sender)) {
      await react(ryza, from, msg, "❌")
      await ryza.sendMessage(from, { 
        text: "Maaf, hanya admin grup dan owner yang bisa menggunakan perintah ini." 
      }, { quoted: msg })
      return
    }

    await react(ryza, from, msg, "🔓")
    
    await ryza.groupSettingUpdate(from, 'not_announcement')
    
    await ryza.sendMessage(from, {
      text: `🔓 *GROUP DIBUKA*

Grup telah dibuka oleh admin.
Semua member dapat mengirim pesan sekarang.

> Dibuka oleh: @${participant.split('@')[0]}`,
      mentions: [participant]
    }, { quoted: msg })
  }
}