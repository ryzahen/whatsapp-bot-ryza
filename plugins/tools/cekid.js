const { react } = require("../../lib/functions")
const { isOwner } = require("../../lib/helper")

module.exports = {
  commands: ["cekid", "id", "checkid"],
  
  async execute(ryza, msg, { command, args, text, from, sender, pushname }) {
    await react(ryza, from, msg, "🔍")
    
    let target = text.trim()
    let targetJid = ""
    let targetNumber = ""
    let isRegistered = false
    
    if (!target) {
      targetJid = sender
      targetNumber = sender.split('@')[0]
      target = targetNumber
      isRegistered = true
    } else {
      target = target.replace(/[^0-9]/g, '')
      if (target.startsWith('0')) {
        target = '62' + target.slice(1)
      }
      
      await react(ryza, from, msg, "⏳")
      
      try {
        targetJid = target + "@s.whatsapp.net"
        const exists = await ryza.onWhatsApp(target)
        isRegistered = exists && exists.length > 0 && exists[0].exists
      } catch (err) {
        isRegistered = false
      }
      
      targetNumber = target
    }

    const statusWA = isRegistered ? "✅ Terdaftar" : "❌ Tidak Terdaftar"
    const ownerStatus = isOwner(targetJid) ? "Owner" : "User"

    const info = `*CEK ID WHATSAPP*

*Nomor* : ${targetNumber}
*JID* : ${targetJid}
*Status WA* : ${statusWA}
*Role* : ${ownerStatus}
*Link* : https://wa.me/${targetNumber}`

    await react(ryza, from, msg, "✅")
    await ryza.sendMessage(from, {
      text: info
    }, { quoted: msg })
  }
}