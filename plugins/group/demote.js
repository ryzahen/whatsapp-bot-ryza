const author = require("../owner/author")

function isOwner(sender) {
  const senderNumber = sender.split('@')[0]
  return author.owner.numbers.includes(senderNumber)
}

module.exports = {
  commands: ["demote", "dm"],
  
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

    let usersToDemote = []

    if (msg.message.extendedTextMessage?.contextInfo?.mentionedJid) {
      usersToDemote = msg.message.extendedTextMessage.contextInfo.mentionedJid
    } else if (msg.message.extendedTextMessage?.contextInfo?.participant) {
      usersToDemote = [msg.message.extendedTextMessage.contextInfo.participant]
    } else {
      await ryza.sendMessage(from, { 
        text: "Tag atau reply user yang ingin didemote.\nContoh: .demote @user" 
      }, { quoted: msg })
      return
    }

    const notAdmin = []
    const successDemote = []

    for (let user of usersToDemote) {
      const targetParticipant = groupMetadata.participants.find(p => p.id === user)
      
      if (!targetParticipant?.admin) {
        notAdmin.push(user)
      } else {
        await ryza.groupParticipantsUpdate(from, [user], "demote")
        successDemote.push(user)
      }
    }

    let responseText = ""
    
    if (successDemote.length > 0) {
      responseText += `Berhasil mendemote ${successDemote.length} admin menjadi member.\n`
    }
    
    if (notAdmin.length > 0) {
      const mentions = notAdmin.map(user => `@${user.split('@')[0]}`).join(", ")
      responseText += `${notAdmin.length} member bukan admin: ${mentions}`
    }

    if (responseText) {
      await ryza.sendMessage(from, { 
        text: responseText.trim(),
        mentions: notAdmin
      }, { quoted: msg })
    }
  }
}