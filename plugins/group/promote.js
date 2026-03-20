const author = require("../owner/author")

function isOwner(sender) {
  const senderNumber = sender.split('@')[0]
  return author.owner.numbers.includes(senderNumber)
}

module.exports = {
  commands: ["promote", "pm"],
  
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

    let usersToPromote = []

    if (msg.message.extendedTextMessage?.contextInfo?.mentionedJid) {
      usersToPromote = msg.message.extendedTextMessage.contextInfo.mentionedJid
    } else if (msg.message.extendedTextMessage?.contextInfo?.participant) {
      usersToPromote = [msg.message.extendedTextMessage.contextInfo.participant]
    } else {
      await ryza.sendMessage(from, { 
        text: "Tag atau reply user yang ingin dipromosikan.\nContoh: .promote @user" 
      }, { quoted: msg })
      return
    }

    const alreadyAdmin = []
    const successPromote = []

    for (let user of usersToPromote) {
      const targetParticipant = groupMetadata.participants.find(p => p.id === user)
      
      if (targetParticipant?.admin) {
        alreadyAdmin.push(user)
      } else {
        await ryza.groupParticipantsUpdate(from, [user], "promote")
        successPromote.push(user)
      }
    }

    let responseText = ""
    
    if (successPromote.length > 0) {
      responseText += `Berhasil mempromosikan ${successPromote.length} member menjadi admin.\n`
    }
    
    if (alreadyAdmin.length > 0) {
      const mentions = alreadyAdmin.map(user => `@${user.split('@')[0]}`).join(", ")
      responseText += `${alreadyAdmin.length} member sudah menjadi admin: ${mentions}`
    }

    if (responseText) {
      await ryza.sendMessage(from, { 
        text: responseText.trim(),
        mentions: alreadyAdmin
      }, { quoted: msg })
    }
  }
}