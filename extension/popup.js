document.addEventListener('DOMContentLoaded', () => {
  const urlInput = document.getElementById('url')
  const status = document.getElementById('status')

  chrome.storage.local.get('gatewayUrl', (data) => {
    if (data.gatewayUrl) urlInput.value = data.gatewayUrl
  })

  document.getElementById('save').addEventListener('click', () => {
    const url = urlInput.value.trim().replace(/\/+$/, '')
    if (!url) {
      status.textContent = 'URL boş olamaz'
      status.className = 'status err'
      return
    }
    chrome.storage.local.set({ gatewayUrl: url }, () => {
      status.textContent = 'Kaydedildi!'
      status.className = 'status ok'
      setTimeout(() => { status.textContent = '' }, 2000)
    })
  })
})
