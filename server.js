const express = require('express')
const cors = require('cors')
const preguntas = require('./preguntas.json')
const app = express()
const os = require('os')
app.use(cors())
app.use(express.json())
app.use(express.static(__dirname))

let rankingGlobal = []

app.get('/api/preguntas', (peticion, respuesta) => {
  const temaSolicitado = (peticion.query.tema || '').toLowerCase()
  const preguntasFiltradas = preguntas.filter((p) => p.tema === temaSolicitado)

  if (preguntasFiltradas.length === 0) {
    return respuesta
      .status(404)
      .json({ error: 'No se encuentran preguntas para este tema' })
  }

  const indiceAleatorio = Math.floor(Math.random() * preguntasFiltradas.length)
  const preguntaAleatoria = preguntasFiltradas[indiceAleatorio]

  respuesta.json(preguntaAleatoria)
})

app.get('/api/ranking', (peticion, respuesta) => {
  respuesta.json(rankingGlobal)
})

app.post('/api/registro', (peticion, respuesta) => {
  const { nombre, puntos, quesitos } = peticion.body

  if (!nombre || puntos === undefined) {
    return respuesta
      .status(400)
      .json({ error: 'Debes proporcionar un nombre y los puntos.' })
  }

  const jugadorExistente = rankingGlobal.find((p) => p.nombre === nombre)
  if (jugadorExistente) {
    jugadorExistente.puntos = puntos
    if (quesitos) jugadorExistente.quesitos = quesitos
  } else {
    rankingGlobal.push({
      nombre,
      puntos,
      quesitos: quesitos || {
        geografia: false,
        deportes: false,
        musica: false,
        videojuegos: false,
      },
    })
  }

  respuesta.json({
    mensaje: '¡Puntos guardados correctamente!',
    rankingGlobal: rankingGlobal,
  })
})
// Función para obtener la IP local de tu ordenador automáticamente
function obtenerIPLocal() {
  const interfaces = os.networkInterfaces()
  for (const nombre in interfaces) {
    for (const red of interfaces[nombre]) {
      // Filtramos para obtener la IPv4 que no sea interna (es decir, que no sea localhost)
      if (red.family === 'IPv4' && !red.internal) {
        return red.address
      }
    }
  }
  return 'localhost'
}

const PUERTO = 3000

// Al poner '0.0.0.0', permitimos conexiones desde otros dispositivos
app.listen(PUERTO, '0.0.0.0', () => {
  const ip = obtenerIPLocal()
  console.log(`\n✅ Servidor levantado correctamente.`)
  console.log(
    `💻 Para jugar en este ordenador, abre: http://localhost:${PUERTO}`,
  )
  console.log(
    `📱 Para que jueguen otros en tu WiFi, dales este enlace: http://${ip}:${PUERTO}\n`,
  )
})
