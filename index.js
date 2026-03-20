const {
  makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  jidNormalizedUser
} = require("baileys")

const pino = require("pino")
const chalk = require("chalk")
const readline = require("readline")
const { handler } = require("./lib/handler")
const { loadPlugins } = require("./lib/functions")
const { getGroupSetting, getAntilinkSetting } = require("./lib/database")
const { isOwner } = require("./lib/helper")
const config = require("./config")

const usePairingCode = config.bot.usePairingCode
const prefix = config.bot.prefix

async function question(text) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  return new Promise(resolve => rl.question(text, ans => {
    rl.close()
    resolve(ans)
  }))
}

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(`./${config.bot.sessionName}`)
  const { version } = await fetchLatestBaileysVersion()

  const ryza = makeWASocket({
    logger: pino({ level: "silent" }),
    printQRInTerminal: !usePairingCode,
    auth: state,
    browser: ["Ubuntu", "Chrome", "20.0.04"],
    version
  })

  const plugins = await loadPlugins()
  console.log(chalk.hex('#8B4513').bold(`Loaded ${plugins.size} plugins`))

  if (usePairingCode && !ryza.authState.creds.registered) {
    const phoneNumber = await question("Masukan Nomor Diawali 62:\n")
    const code = await ryza.requestPairingCode(phoneNumber.trim())
    console.log(chalk.green("Pairing Code :"), code)
  }

  ryza.ev.on("creds.update", saveCreds)

  ryza.ev.on("connection.update", ({ connection }) => {
    if (connection === "open") {
      console.log(chalk.green("Bot Berhasil Terhubung"))
    }
    if (connection === "close") {
      console.log(chalk.red("Koneksi Terputus, Reconnect..."))
      connectToWhatsApp()
    }
  })

  ryza.ev.on("group-participants.update", async (update) => {
    const { id, participants, action } = update
    
    try {
      const settings = await getGroupSetting(id)
      
      if (!settings.welcome && !settings.leave && !settings.notif) return
      
      const groupMetadata = await ryza.groupMetadata(id)
      
      for (const participant of participants) {
        try {
          let ppUrl
          try {
            ppUrl = await ryza.profilePictureUrl(participant, "image")
          } catch {
            ppUrl = "https://i.postimg.cc/L670x9TD/9d164e4e074d11ce4de0a508914537a8-(1).jpg"
          }

          if (action === "add" && settings.welcome) {
            const userName = participant.split("@")[0]
            const memberCount = groupMetadata.participants.length
            
            const caption = `Hai @${userName}\nSelamat datang di ${groupMetadata.subject}\n\nKamu adalah member ke-${memberCount}`

            await ryza.sendMessage(id, {
              image: { url: ppUrl },
              caption: caption,
              mentions: [participant]
            })
          }

          if (action === "remove" && settings.leave) {
            const userName = participant.split("@")[0]
            const memberCount = groupMetadata.participants.length
            
            const caption = `@${userName} telah keluar dari grup\n\nTotal member sekarang: ${memberCount}`

            await ryza.sendMessage(id, {
              image: { url: ppUrl },
              caption: caption,
              mentions: [participant]
            })
          }

          if (action === "promote" && settings.notif) {
            const promotedName = participant.split("@")[0]
            
            const caption = `@${promotedName} telah dipromosikan menjadi admin`

            await ryza.sendMessage(id, {
              image: { url: ppUrl },
              caption: caption,
              mentions: [participant]
            })
          }

          if (action === "demote" && settings.notif) {
            const demotedName = participant.split("@")[0]
            
            const caption = `@${demotedName} telah didemote dari admin`

            await ryza.sendMessage(id, {
              image: { url: ppUrl },
              caption: caption,
              mentions: [participant]
            })
          }
        } catch (error) {
          console.error("Error processing participant:", error)
        }
      }
    } catch (error) {
      console.error("Error in group participants update:", error)
    }
  })

  ryza.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0]
    if (!msg.message) return

    const from = jidNormalizedUser(msg.key.remoteJid)
    const isGroup = from.endsWith("@g.us")

    const type = Object.keys(msg.message)[0]
    const body =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      msg.message.imageMessage?.caption ||
      msg.message.videoMessage?.caption ||
      ""

    const sender = msg.key.participant || msg.key.remoteJid
    
    // FITUR ANTILINK
    if (isGroup && !msg.key.fromMe) {
      try {
        const antilinkSettings = await getAntilinkSetting(from)
        
        if (antilinkSettings.antilink || antilinkSettings.antilinkv2) {
          const groupMetadata = await ryza.groupMetadata(from)
          const senderJid = msg.key.participant || sender
          const isSenderAdmin = groupMetadata.participants.find(p => p.id === senderJid)?.admin
          
          if (!isSenderAdmin && !isOwner(senderJid)) {
            const messageText = body.toLowerCase()
            
            const forbiddenLinks = [
              "wa.me/",
              "chat.whatsapp.com",
              "t.me/",
              ".my.id",
              ".web.id",
              ".site"
            ]
            
            const hasForbiddenLink = forbiddenLinks.some(link => messageText.includes(link))
            
            if (hasForbiddenLink) {
              if (antilinkSettings.antilink) {
                await ryza.groupParticipantsUpdate(from, [senderJid], "remove")
                await ryza.sendMessage(from, {
                  text: `@${senderJid.split('@')[0]} telah dikeluarkan karena mengirim link.`,
                  mentions: [senderJid]
                })
                return
              } else if (antilinkSettings.antilinkv2) {
                await ryza.sendMessage(from, {
                  delete: {
                    remoteJid: from,
                    fromMe: false,
                    id: msg.key.id,
                    participant: senderJid
                  }
                })
                return
              }
            }
          }
        }
      } catch (error) {
        console.error("Error in antilink:", error)
      }
    }

    if (config.bot.autoread && msg.key && !msg.key.fromMe) {
      await ryza.readMessages([msg.key])
    }

    if (!body.startsWith(prefix)) return

    const args = body.slice(prefix.length).trim().split(/ +/)
    const command = args.shift().toLowerCase()
    const text = args.join(' ')
    const pushname = msg.pushName || "ryza"
    const senderNumber = sender.split('@')[0]

    console.log(
      chalk.yellow(getFormattedDate()),
      chalk.cyan(pushname),
      chalk.white(":"),
      chalk.white(body)
    )

    await handler(ryza, msg, command, args, text, from, sender, pushname, plugins)
  })
}

function getFormattedDate() {
  const date = new Date()
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `[ ${day}/${month}/${year} ]`
}

connectToWhatsApp()