console.log('****** content script   ********');

import * as $ from 'jquery';
import * as JSZip from 'jszip';
(() => {
  if (!window.location.href.includes('item.taobao') && !window.location.href.includes('detail.tmall')) {
    return;
  }

  const pageUrl = new URL(window.location.href);

  const itemId = pageUrl.searchParams.get('id');

  const isTmall = pageUrl.hostname.includes('tmall');

  function getBlob(url: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', url);
      xhr.responseType = 'blob';
      xhr.send();
      xhr.onreadystatechange = () => {
        if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
          resolve(xhr.response);
        }
      };
      xhr.onerror = reject;
    });
  }

  function download(url: string, name: string) {
    const a = $('<a>')
      .attr('href', url)
      .attr('download', name)
      .attr('target', '_blank')
      .appendTo(document.body);
    a[0].click();
    a.remove();
  }

  window.onload = () => {
    const container = isTmall ? $('dl.tb-prop.tm-sale-prop') : $('dl.J_Prop.tb-prop.J_Prop_Color');
    if (container.length > 0) {
      const button = document.createElement('button');
      button.innerText = '下载图片';
      button.style.backgroundColor = 'yellow';
      button.style.width = '60px';
      button.style.height = '20px';
      button.onclick = evt => {
        const zip = new JSZip();
        const dd = container.children('dd');
        const aElements = dd.find('a').get();

        const promises = [];
        for (const a of aElements) {
          const colorStr = a.getElementsByTagName('span')[0].innerText;
          if (a.style.backgroundImage) {
            let url = 'https:' + a.style.backgroundImage.slice(5, a.style.backgroundImage.length - 2);
            const tmp = url.split('_');
            url = tmp.slice(0, tmp.length - 1).join('_');
            const ext = url.split('.')[url.split('.').length - 1];
            promises.push(
              getBlob(url).then(blob => {
                zip.file(colorStr + '.' + ext, blob, { binary: true });
              })
            );
          }
        }
        Promise.all(promises)
          .then(() => zip.generateAsync({ type: 'blob' }))
          .then(blob => URL.createObjectURL(blob))
          .then(blobUrl => download(blobUrl, itemId + '.zip'));
      };
      container.prepend(button);
    }
  };
})();
