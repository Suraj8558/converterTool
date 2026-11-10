/**
 * Runs inside the web page. Android's WebView can't save the blob: links the site makes
 * for its results, so this catches clicks on them and sends the file to the app in chunks.
 * The chunk size is a multiple of 3 bytes, so every chunk is valid base64 on its own and
 * the app can append them one after another.
 */
export const CHUNK_BYTES = 3 * 256 * 1024;

export const DOWNLOAD_BRIDGE_SCRIPT = `
(function () {
  if (window.__converterToolBridge) return;
  window.__converterToolBridge = true;
  var CHUNK = ${CHUNK_BYTES};

  function post(message) {
    window.ReactNativeWebView.postMessage(JSON.stringify(message));
  }

  function toBase64(blob) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        var text = String(reader.result);
        resolve(text.slice(text.indexOf(',') + 1));
      };
      reader.onerror = function () { reject(reader.error || new Error('The file could not be read.')); };
      reader.readAsDataURL(blob);
    });
  }

  async function send(href, name) {
    var id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    try {
      var blob = await (await fetch(href)).blob();
      post({ type: 'download-start', id: id, name: name, mime: blob.type });
      for (var offset = 0; offset < blob.size; offset += CHUNK) {
        post({ type: 'download-chunk', id: id, data: await toBase64(blob.slice(offset, offset + CHUNK)) });
      }
      post({ type: 'download-end', id: id });
    } catch (error) {
      post({ type: 'download-error', id: id, message: String((error && error.message) || error) });
    }
  }

  document.addEventListener('click', function (event) {
    var link = event.target && event.target.closest && event.target.closest('a[download]');
    if (!link || String(link.href).indexOf('blob:') !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    send(link.href, link.getAttribute('download') || 'download');
  }, true);
})();
true;
`;
