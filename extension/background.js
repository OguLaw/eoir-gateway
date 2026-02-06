chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'GET_CREDENTIALS') {
    chrome.storage.local.get('gatewayUrl', async (data) => {
      const url = data.gatewayUrl
      if (!url) {
        sendResponse({ error: 'Gateway URL ayarlanmamış. Extension ikonuna tıklayıp URL girin.' })
        return
      }
      try {
        const res = await fetch(`${url}/api/check-ip`)
        const json = await res.json()
        sendResponse(json)
      } catch (e) {
        sendResponse({ error: 'Gateway bağlantı hatası: ' + e.message })
      }
    })
    return true // async response
  }
})
