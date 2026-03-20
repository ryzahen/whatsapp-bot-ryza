const { isOwner } = require("../../lib/helper")
const { getAntilinkSetting, setAntilinkSetting } = require("../../lib/database")

module.exports = {
  commands: ["antilinkv2"],
  
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

    const option = args[0]?.toLowerCase()
    
    if (!option || (option !== "on" && option !== "off")) {
      const settings = await getAntilinkSetting(from)
      const status = settings.antilinkv2 ? "ON" : "OFF"
      await ryza.sendMessage(from, {
        text: `▧ *Antilink V2 Settings*\n\nMode Hapus: ${status}\n\nPenggunaan:\n.antilinkv2 on\n.antilinkv2 off`
      }, { quoted: msg })
      return
    }

    const newStatus = option === "on"
    const settings = await getAntilinkSetting(from)
    settings.antilinkv2 = newStatus
    await setAntilinkSetting(from, settings)

    await ryza.sendMessage(from, {
      text: `Antilink mode hapus telah di ${newStatus ? "aktifkan" : "matikan"}.`
    }, { quoted: msg })
  }
}