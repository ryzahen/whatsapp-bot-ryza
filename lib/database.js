const fs = require("fs").promises
const path = require("path")

const dataDir = path.join(__dirname, "../data")
const welcomeFile = path.join(dataDir, "welcome.json")
const antilinkFile = path.join(dataDir, "antilink.json")

async function ensureDataDir() {
  try {
    await fs.access(dataDir)
  } catch {
    await fs.mkdir(dataDir, { recursive: true })
  }
}

async function loadWelcomeData() {
  await ensureDataDir()
  try {
    const data = await fs.readFile(welcomeFile, "utf8")
    return JSON.parse(data)
  } catch {
    const defaultData = {}
    await fs.writeFile(welcomeFile, JSON.stringify(defaultData, null, 2))
    return defaultData
  }
}

async function saveWelcomeData(data) {
  await ensureDataDir()
  await fs.writeFile(welcomeFile, JSON.stringify(data, null, 2))
}

async function getGroupSetting(groupId) {
  const data = await loadWelcomeData()
  return data[groupId] || { welcome: false, leave: false, notif: false }
}

async function setGroupSetting(groupId, settings) {
  const data = await loadWelcomeData()
  data[groupId] = { ...data[groupId], ...settings }
  await saveWelcomeData(data)
}

// Fungsi untuk antilink
async function loadAntilinkData() {
  await ensureDataDir()
  try {
    const data = await fs.readFile(antilinkFile, "utf8")
    return JSON.parse(data)
  } catch {
    const defaultData = {}
    await fs.writeFile(antilinkFile, JSON.stringify(defaultData, null, 2))
    return defaultData
  }
}

async function saveAntilinkData(data) {
  await ensureDataDir()
  await fs.writeFile(antilinkFile, JSON.stringify(data, null, 2))
}

async function getAntilinkSetting(groupId) {
  const data = await loadAntilinkData()
  return data[groupId] || { antilink: false, antilinkv2: false }
}

async function setAntilinkSetting(groupId, settings) {
  const data = await loadAntilinkData()
  data[groupId] = { ...data[groupId], ...settings }
  await saveAntilinkData(data)
}

module.exports = {
  getGroupSetting,
  setGroupSetting,
  getAntilinkSetting,
  setAntilinkSetting
}