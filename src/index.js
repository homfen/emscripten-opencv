window.Module = {
  onRuntimeInitialized: () => {
    console.log('[onRuntimeInitialized]')
    init(Module)
  }
}

const getImageData = () => {
  console.log('[getImageData]')
  const img = document.getElementById('input-image')
  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, img.width, img.height)
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  return imageData
}

const imageDataFrom1Channel = (data, width, height) => {
  console.log('[imageDataFrom1Channel]')
  const cb = width * height * 4
  const array = new Uint8ClampedArray(cb)
  data.forEach((pixelValue, index) => {
    const base = index * 4
    array[base] = pixelValue // R
    array[base + 1] = pixelValue // G
    array[base + 2] = pixelValue // B
    array[base + 3] = 255 // A
  })
  const imageData = new ImageData(array, width, height)
  return imageData
}

const imageDataFrom4Channels = (data, width, height) => {
  console.log('[imageDataFrom4Channels]')
  const array = new Uint8ClampedArray(data)
  const imageData = new ImageData(array, width, height)
  return imageData
}

const drawOutputImage = imageData => {
  console.log('[drawOutputImage]')
  const canvas = document.getElementById('output-image')
  canvas.width = imageData.width
  canvas.height = imageData.height
  ctx = canvas.getContext('2d')
  ctx.putImageData(imageData, 0, 0)
}

const onProcessImage = (module, processImage) => () => {
  console.log('[onProcessImage]')
  const { data, width, height } = getImageData()
  const addr = processImage(data, width, height)
  const returnDataAddr = addr / module.HEAP32.BYTES_PER_ELEMENT
  returnData = module.HEAP32.slice(returnDataAddr, returnDataAddr + 8)
  const [bbx, bby, bbw, bbh, outImageWidth, outImageHeight, outImageChannels, outImageAddr] = returnData
  console.log(JSON.stringify([bbx, bby, bbw, bbh]))
  console.log(JSON.stringify([outImageWidth, outImageHeight, outImageChannels, outImageAddr]))
  const outImageDataSize = outImageWidth * outImageHeight * outImageChannels
  const outImageData = module.HEAPU8.slice(outImageAddr, outImageAddr + outImageDataSize)
  if (outImageChannels === 1) {
    const imageData = imageDataFrom1Channel(outImageData, outImageWidth, outImageHeight)
    drawOutputImage(imageData)
  }
  if (outImageChannels === 4) {
    const imageData = imageDataFrom4Channels(outImageData, outImageWidth, outImageHeight)
    drawOutputImage(imageData)
  }
  module._free(addr)
}

const wrapProcessImage = module => {
  console.log('[wrapProcessImage]')
  const ident = 'processImage'
  const returnType = 'number'
  const argTypes = ['array', 'number', 'number']
  const processImage = module.cwrap(ident, returnType, argTypes)
  return processImage
}

const init = module => {
  console.log('[init]')
  const processImage = wrapProcessImage(module)
  const processImageBtn = document.getElementById('process-image-btn')
  processImageBtn.addEventListener('click', onProcessImage(module, processImage))
}
