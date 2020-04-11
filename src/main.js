const ReadStream = require('filestream').read
const through2 = require('through2')
const dnd = require('drag-and-drop-files')
// const parseStream = require('csv-parse')

const drag = document.getElementById('drag')

function onDragOver () {
  const col = '#C9E4FF'
  if (drag.style.background !== col) drag.style.background = col
}

function onDragLeave () {
  drag.style.background = 'white'
}

drag.addEventListener('dragover', onDragOver, false)
drag.addEventListener('dragleave', onDragLeave, false)

// 1.a Init from drag and drop
dnd(drag, process)

// 1.b Init from the file input
document.getElementById('input').onchange = (e) => {
  process(e.target.files)
}

let stream
let loadAll

function process (files) {
  const file = files[0]
  const size = file.size
  const output = document.getElementById('output')
  output.innerHTML = ''
  const container = document.createElement('pre')
  output.appendChild(container)
  const overlay = document.getElementById('overlay')
  overlay.style.display = 'flex'

  console.log('[Preview] Selected file size:', size)

  // Clear body background (dnd)
  drag.style.display = 'none'

  // Initialize read stream
  loadAll = false
  stream = new ReadStream(file, {chunkSize: 30000})
  stream.setEncoding('utf8')

  const ext = file.name.split('.').pop().toLowerCase()
  console.log('[Preview] File extension:', ext)

  if (ext === 'csv' || ext === 'tsv') {
    console.log('[Preview] Dealing with a table')
  } else {
    console.log('[Preview] Dealing with text')
  }

  // Initialize progress bar
  let progressBytes = 0

  let progressBar = document.getElementById('progress')
  progressBar.style.display = 'initial'

  // Initialize through stream for stream monitoring
  const progress = through2(function (chunk, enc, callback) {
    progressBytes += chunk.length
    let progressPercents = ((progressBytes / size) * 100).toFixed(1)
    progressBar.style.width = progressPercents + '%'
    this.push(chunk)
    callback()
  })

  stream = stream.pipe(progress)
  stream.on('data', chunk => {
    container.innerText += chunk
    if (!loadAll) {
      stream.pause()
    }
  })

  stream.on('end', () => {
    console.log('[Preview] Stream ended')
    overlay.style.display = 'none'
    progressBar.style.display = 'none'
  })
}

function loadFunc () {
  console.log('[Preview] Load all file')
  loadAll = true
  stream.resume()
}

document.getElementById('load').onclick = loadFunc

// Add scroll event that preloads next data chunk
document.addEventListener('scroll', () => {
  if (((document.body.scrollHeight - window.innerHeight - window.scrollY) < 100) && (typeof stream !== 'undefined')) {
    console.log('[Scroll event] Load more data')
    stream.resume()
  }
}, false)
