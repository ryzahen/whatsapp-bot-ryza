const config = require("../config")

function isOwner(sender) {
  const senderNumber = sender.split('@')[0]
  return config.owner.numbers.includes(senderNumber)
}

function getOwnerNumbers() {
  return config.owner.numbers.map(num => `${num}@s.whatsapp.net`)
}

module.exports = {
  isOwner,
  getOwnerNumbers
}