const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { v4: uuidv4 } = require('uuid')

const app = express()
const PORT = 3100
const UPLOAD_DIR = '/var/www/uploads'

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR)
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${uuidv4()}${ext}`)
  },
})

// File filter: only images and PDFs
const fileFilter = (_req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp',
    'application/pdf',
  ]
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Unsupported file type. Only images and PDF are allowed.'), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
    files: 5,
  },
})

// Health check
app.get('/api/uploads/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// Upload endpoint
app.post('/api/uploads', upload.array('files', 5), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      code: 400,
      message: 'No files uploaded',
      data: null,
    })
  }

  const uploaded = req.files.map((f) => ({
    originalName: f.originalname,
    savedName: f.filename,
    size: f.size,
    mimetype: f.mimetype,
    url: `/api/uploads/${f.filename}`,
  }))

  res.json({
    code: 200,
    message: 'Upload successful',
    data: uploaded,
  })
})

// Serve uploaded files
app.get('/api/uploads/:filename', (req, res) => {
  const filename = path.basename(req.params.filename)
  const filePath = path.join(UPLOAD_DIR, filename)

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ code: 404, message: 'File not found' })
  }

  res.sendFile(filePath)
})

// Multer error handler
app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ code: 413, message: 'File too large. Maximum 10MB.' })
    }
    return res.status(400).json({ code: 400, message: err.message })
  }
  if (err) {
    return res.status(400).json({ code: 400, message: err.message })
  }
})

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Upload server running on http://127.0.0.1:${PORT}`)
})
