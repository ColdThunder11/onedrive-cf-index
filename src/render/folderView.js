import { getClassNameForMimeType, getClassNameForFilename } from 'font-awesome-filetypes'

import { renderHTML } from './htmlWrapper'
import { renderPath } from './pathUtil'
import { renderMarkdown } from './mdRenderer'

/**
 * Convert bytes to human readable file size
 *
 * @param {Number} bytes File size in bytes
 * @param {Boolean} si 1000 - true; 1024 - false
 */
function readableFileSize(bytes, si) {
  bytes = parseInt(bytes, 10)
  var thresh = si ? 1000 : 1024
  if (Math.abs(bytes) < thresh) {
    return bytes + ' B'
  }
  var units = si
    ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']
  var u = -1
  do {
    bytes /= thresh
    ++u
  } while (Math.abs(bytes) >= thresh && u < units.length - 1)
  return bytes.toFixed(1) + ' ' + units[u]
}

/**
 * Render Folder Index
 *
 * @param {*} items
 * @param {*} isIndex don't show ".." on index page.
 */
export async function renderFolderView(items, isIndex, path) {
  const nav = '<nav><div class="brand">📁 Spencer\'s OneDrive Index</div></nav>'
  const el = (tag, attrs, content) => `<${tag} ${attrs.join(' ')}>${content}</${tag}>`
  const div = (className, content) => el('div', [`class=${className}`], content)
  const item = (icon, fileName, size) =>
    el(
      'a',
      [`href="${path}${fileName}/"`, 'class="item"', size ? `size="${size}"` : ''],
      el('i', [`class="${icon}"`], '') +
        fileName +
        el('div', ['style="flex-grow: 1;"'], '') +
        (fileName === '..' ? '' : el('span', ['class="size"'], readableFileSize(size)))
    )

  const intro = `<div class="intro markdown-body" style="text-align: left; margin-top: 2rem;">
                    <h2>Yoo, I'm Spencer Woo 👋</h2>
                    <p>This is Spencer's OneDrive public directory listing. Feel free to download any files that you find useful. Reach me at: spencer.woo [at] outlook [dot] com.</p>
                    <p><a href="https://spencerwoo.com">Portfolio</a> · <a href="https://blog.spencerwoo.com">Blog</a> · <a href="https://github.com/spencerwooo">GitHub</a></p>
                  </div>`

  // Check if current directory contains README.md, if true, then render spinner
  let readmeExists = false
  let readmeFetchUrl = ''

  const body =
    nav +
    div(
      'container',
      div('path', renderPath(path)) +
        div(
          'items',
          el(
            'div',
            ['style="min-width: 600px"'],
            (!isIndex ? item('far fa-folder', '..') : '') +
              items
                .map(i => {
                  if ('folder' in i) {
                    return item('far fa-folder', i.name, i.size)
                  } else if ('file' in i) {
                    // Check if README.md exists
                    if (!readmeExists) {
                      readmeExists = i.name.toLowerCase() === 'readme.md'
                      readmeFetchUrl = i['@microsoft.graph.downloadUrl']
                    }

                    // Render file icons
                    let fileIcon = getClassNameForMimeType(i.file.mimeType)
                    if (fileIcon === 'fa-file') {
                      if (i.name.split('.').pop() === 'md') {
                        fileIcon = 'fab fa-markdown'
                      } else {
                        fileIcon = `far ${getClassNameForFilename(i.name)}`
                      }
                    } else {
                      fileIcon = `far ${fileIcon}`
                    }
                    return item(fileIcon, i.name, i.size)
                  } else {
                    console.log(`unknown item type ${i}`)
                  }
                })
                .join('')
          )
        ) +
        (readmeExists && !isIndex ? await renderMarkdown(readmeFetchUrl, 'fade-in-fwd', '') : '') +
        (isIndex ? intro : '')
    )
  return renderHTML(body)
}
