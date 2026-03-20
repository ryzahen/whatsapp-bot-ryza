const { getGroupSetting, setGroupSetting } = require("../../lib/database")
const author = require("../owner/author")

function isOwner(sender) {
  const senderNumber = sender.split('@')[0]
  return author.owner.numbers.includes(senderNumber)
}

module.exports = {
  commands: ["welcome"],
  
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
      const settings = await getGroupSetting(from)
      const status = settings.welcome ? "ON" : "OFF"
      await ryza.sendMessage(from, {
        text: `▧ *Welcome Settings*\n\nStatus: ${status}\n\nPenggunaan:\n.welcome on\n.welcome off`
      }, { quoted: msg })
      return
    }

    const newStatus = option === "on"
    const settings = await getGroupSetting(from)
    settings.welcome = newStatus
    settings.leave = newStatus
    settings.notif = newStatus
    await setGroupSetting(from, settings)

    await ryza.sendMessage(from, {
      text: `Welcome, leave, dan notif telah di ${newStatus ? "aktifkan" : "matikan"}.`
    }, { quoted: msg })
  }
}