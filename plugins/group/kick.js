const author = require("../owner/author")

function isOwner(sender) {
  const senderNumber = sender.split('@')[0]
  return author.owner.numbers.includes(senderNumber)
}

module.exports = {
  commands: ["kick", "tendang"],
  
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

    let usersToKick = []

    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo
    
    if (quotedMsg?.participant) {
      usersToKick = [quotedMsg.participant]
    } else if (quotedMsg?.mentionedJid && quotedMsg.mentionedJid.length > 0) {
      usersToKick = quotedMsg.mentionedJid
    } else if (args[0]) {
      const number = args[0].replace(/[^0-9]/g, '')
      if (number.length >= 10) {
        usersToKick = [`${number}@s.whatsapp.net`]
      } else {
        await ryza.sendMessage(from, { 
          text: "Nomor tidak valid. Contoh: .kick 6281234567890" 
        }, { quoted: msg })
        return
      }
    } else {
      await ryza.sendMessage(from, { 
        text: "Reply pesan target, tag user, atau masukkan nomor yang ingin dikick." 
      }, { quoted: msg })
      return
    }

    if (usersToKick.length === 0) {
      await ryza.sendMessage(from, { 
        text: "Tidak ada target yang valid untuk dikick." 
      }, { quoted: msg })
      return
    }

    const successKick = []
    const failedKick = []

    for (let user of usersToKick) {
      try {
        await ryza.groupParticipantsUpdate(from, [user], "remove")
        successKick.push(user)
      } catch (error) {
        failedKick.push(user)
      }
    }

    let responseText = ""
    
    if (successKick.length > 0) {
      responseText += `Berhasil mengeluarkan ${successKick.length} member.\n`
    }
    
    if (failedKick.length > 0) {
      const failedMentions = failedKick.map(user => `@${user.split('@')[0]}`).join(", ")
      responseText += `Gagal mengeluarkan ${failedKick.length} member: ${failedMentions}`
    }

    await ryza.sendMessage(from, { 
      text: responseText.trim(),
      mentions: failedKick
    }, { quoted: msg })
  }
}