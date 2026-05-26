// --- CONFIGURACIÓN Y CONSTANTES ---
const CATEGORIAS = {
  geografia: { nombre: 'Geografía', emoji: '🌍' },
  deportes: { nombre: 'Deportes', emoji: '⚽' },
  musica: { nombre: 'Música', emoji: '🎵' },
  videojuegos: { nombre: 'Videojuegos', emoji: '🎮' },
}

const ipActual = window.location.hostname
const URL_BASE_API =
  window.location.port === '5500' ? `http://${ipActual}:3000` : ''

// --- CLASE JUGADOR---
class Jugador {
  constructor(nombre) {
    this.nombre = nombre
    this.puntosTotales = 0
    this.aciertosCategoria = {}
    this.quesitos = {}

    // Inicialización dinámica según categorías configuradas
    Object.keys(CATEGORIAS).forEach((cat) => {
      this.aciertosCategoria[cat] = 0
      this.quesitos[cat] = false
    })
  }

  registrarAcierto(categoria) {
    this.puntosTotales++

    if (!this.quesitos[categoria]) {
      this.aciertosCategoria[categoria]++

      if (this.aciertosCategoria[categoria] >= 2) {
        const ganasteQuesito = Math.random() < 0.75 // 75% probabilidad de ganar quesito
        if (ganasteQuesito) {
          this.quesitos[categoria] = true
          return {
            ganado: true,
            mensaje: ` 🎉 ¡ENHORABUENA! ¡Has ganado el quesito de ${CATEGORIAS[categoria].nombre}! 🧀`,
          }
        } else {
          this.aciertosCategoria[categoria] = 1 // Penalización para volver a intentar
          return {
            ganado: false,
            mensaje: ` 🎲 Fallaste la tirada del quesito. ¡Acierta otra para volver a intentarlo!`,
          }
        }
      } else {
        return {
          ganado: false,
          mensaje: ` (Llevas ${this.aciertosCategoria[categoria]}/2 para intentar ganar el quesito)`,
        }
      }
    } else {
      return {
        ganado: false,
        mensaje: ` (Ya tienes el quesito de ${CATEGORIAS[categoria].nombre} 🧀)`,
      }
    }
  }

  haGanado() {
    return Object.keys(CATEGORIAS).every((cat) => this.quesitos[cat])
  }
}

// --- ESTADO DEL JUEGO ---
let jugadores = []
let indiceJugadorActual = 0
let respuestaCorrectaActual = ''
let temporizadorId
let estaGirando = false
let rotacionRuleta = 0
let categoriaActual = ''
let preguntaRespondida = false

// --- CACHÉ DE ELEMENTOS DEL DOM ---
const DOM = {
  setupScreen: document.getElementById('setup-screen'),
  gameScreen: document.getElementById('game-screen'),
  playerNameInput: document.getElementById('player-name-input'),
  addPlayerBtn: document.getElementById('add-player-btn'),
  playersList: document.getElementById('players-list'),
  startGameBtn: document.getElementById('start-game-btn'),
  spinBtn: document.getElementById('spin-btn'),
  currentPlayerName: document.getElementById('current-player-name'),
  currentPlayerScore: document.getElementById('current-player-score'),
  sidebar: document.getElementById('sidebar'),
  sidebarPlayersList: document.getElementById('sidebar-players-list'),
  questionText: document.getElementById('question-text'),
  timerDisplay: document.getElementById('timer-display'),
  timerBar: document.getElementById('timer-bar'),
  optionsContainer: document.getElementById('options-container'),
  feedbackMessage: document.getElementById('feedback-message'),
  showRankingBtn: document.getElementById('show-ranking-btn'),
  rankingDisplay: document.getElementById('ranking-display'),
  rankingList: document.getElementById('ranking-list'),
  wheel: document.getElementById('wheel'),
  mainContent: document.getElementById('main-content'),
}

// --- MANEJADORES DE EVENTOS ---
DOM.addPlayerBtn.addEventListener('click', () => {
  const nombre = DOM.playerNameInput.value.trim()
  if (nombre && !jugadores.some((j) => j.nombre === nombre)) {
    jugadores.push(new Jugador(nombre))

    const li = document.createElement('li')
    li.textContent = nombre
    li.className = 'jugador-item-config'
    DOM.playersList.appendChild(li)

    DOM.playerNameInput.value = ''
    if (jugadores.length > 0) DOM.startGameBtn.classList.remove('oculto')
  }
})

DOM.startGameBtn.addEventListener('click', () => {
  DOM.setupScreen.classList.add('oculto')
  DOM.gameScreen.classList.remove('oculto')
  if (DOM.sidebar) DOM.sidebar.classList.remove('oculto')
  actualizarTurnoUI()
})

DOM.showRankingBtn.addEventListener('click', () => {
  if (DOM.rankingDisplay.classList.contains('oculto')) {
    DOM.rankingDisplay.classList.remove('oculto')
    actualizarRanking()
  } else {
    DOM.rankingDisplay.classList.add('oculto')
  }
})

DOM.spinBtn.addEventListener('click', girarRuleta)

// --- FUNCIONES DE INTERFAZ DE USUARIO ---
function actualizarTurnoUI() {
  if (jugadores.length === 0) return
  const jugador = jugadores[indiceJugadorActual]

  DOM.currentPlayerName.textContent = jugador.nombre
  DOM.currentPlayerScore.textContent = jugador.puntosTotales

  // Actualizar los quesitos en la parte inferior dinámicamente
  Object.keys(CATEGORIAS).forEach((cat) => {
    const el = document.getElementById(`quesito-${cat}`)
    if (el) {
      el.className = `quesito-icono ${
        jugador.quesitos[cat] ? 'quesito-obtenido' : 'quesito-opaco'
      }`
    }
  })

  actualizarBarraLateral()
}

function actualizarBarraLateral() {
  if (!DOM.sidebarPlayersList) return
  DOM.sidebarPlayersList.innerHTML = ''

  jugadores.forEach((jugador, indice) => {
    const esTurnoActual = indice === indiceJugadorActual
    const li = document.createElement('li')
    li.className = `jugador-item-sidebar ${esTurnoActual ? 'es-turno' : ''}`

    const htmlQuesitos = Object.keys(CATEGORIAS)
      .map(
        (cat) => `
        <span class="quesito-icono ${
          jugador.quesitos[cat] ? 'quesito-obtenido' : 'quesito-opaco'
        }" title="${CATEGORIAS[cat].nombre}">
          ${CATEGORIAS[cat].emoji}
        </span>
      `,
      )
      .join('')

    li.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 5px; color: ${
        esTurnoActual ? '#1e3a8a' : '#333'
      };">
        ${jugador.nombre}
      </div>
      <div style="font-size: 0.9em; color: #555;">
        Puntos: <span style="font-weight: bold; color: #3b82f6;">${
          jugador.puntosTotales
        }</span>
      </div>
      <div style="margin-top: 5px; font-size: 1.1em;">${htmlQuesitos}</div>
    `
    DOM.sidebarPlayersList.appendChild(li)
  })
}

function limpiarPanelPregunta() {
  DOM.feedbackMessage.textContent = ''
  DOM.feedbackMessage.className = ''
  if (DOM.optionsContainer) DOM.optionsContainer.innerHTML = ''

  clearInterval(temporizadorId)
  DOM.timerDisplay.textContent = ''
  DOM.timerBar.style.width = '100%'
}

// --- LÓGICA DE TURNOS Y PREGUNTAS ---
function siguienteTurno() {
  indiceJugadorActual = (indiceJugadorActual + 1) % jugadores.length
  actualizarTurnoUI()
}

function finalizarTurno() {
  guardarPuntuacionesAutomaticamente()

  const jugador = jugadores[indiceJugadorActual]
  if (jugador.haGanado()) {
    gestionarVictoria(jugador)
    return
  }

  siguienteTurno()
  DOM.questionText.textContent =
    'Esperando al siguiente jugador... Gira la ruleta!'
  limpiarPanelPregunta()
}

function iniciarTemporizador() {
  let tiempoRestante = 30
  DOM.timerDisplay.textContent = tiempoRestante + 's'
  DOM.timerBar.style.width = '100%'
  DOM.timerBar.style.transition = 'none'
  DOM.timerBar.style.background = '#4caf50' // Asegurar color verde al inicio

  // Forzar reflow
  DOM.timerBar.getBoundingClientRect()
  DOM.timerBar.style.transition = 'width 1s linear'

  temporizadorId = setInterval(() => {
    tiempoRestante--
    DOM.timerDisplay.textContent = tiempoRestante + 's'
    DOM.timerBar.style.width = (tiempoRestante / 30) * 100 + '%'

    if (tiempoRestante <= 10) DOM.timerBar.style.background = '#f44336'

    if (tiempoRestante <= 0) {
      clearInterval(temporizadorId)
      DOM.feedbackMessage.className = 'incorrect'
      DOM.feedbackMessage.textContent = `⏱️ ¡Tiempo agotado! La respuesta era: ${respuestaCorrectaActual}`

      document
        .querySelectorAll('.option-btn')
        .forEach((btn) => (btn.disabled = true))
      preguntaRespondida = true

      setTimeout(finalizarTurno, 4000)
    }
  }, 1000)
}

async function obtenerPregunta(tema) {
  limpiarPanelPregunta()

  try {
    const respuesta = await fetch(`${URL_BASE_API}/api/preguntas?tema=${tema}`)
    if (!respuesta.ok) {
      DOM.questionText.textContent = '⚠️ No hay preguntas para este tema.'
      return
    }

    const datos = await respuesta.json()
    DOM.questionText.textContent = datos.pregunta
    respuestaCorrectaActual = datos.respuesta
    categoriaActual = tema

    if (datos.opciones && DOM.optionsContainer) {
      datos.opciones.forEach((opcion) => {
        const boton = document.createElement('button')
        boton.className = 'option-btn'
        boton.textContent = opcion
        boton.onclick = () => comprobarRespuesta(opcion)
        DOM.optionsContainer.appendChild(boton)
      })
    }

    iniciarTemporizador()
  } catch (error) {
    DOM.questionText.textContent = '❌ Error de conexión con el servidor.'
  }
}

function comprobarRespuesta(respuestaUsuario) {
  if (preguntaRespondida || !respuestaUsuario) return
  preguntaRespondida = true

  document
    .querySelectorAll('.option-btn')
    .forEach((btn) => (btn.disabled = true))
  clearInterval(temporizadorId)
  DOM.timerBar.style.transition = 'none'

  const jugador = jugadores[indiceJugadorActual]

  if (
    respuestaUsuario.toLowerCase() === respuestaCorrectaActual.toLowerCase()
  ) {
    DOM.feedbackMessage.className = 'correct'
    DOM.feedbackMessage.textContent = '✅ ¡Respuesta correcta!'
    const resultado = jugador.registrarAcierto(categoriaActual)
    DOM.feedbackMessage.textContent += resultado.mensaje
  } else {
    DOM.feedbackMessage.className = 'incorrect'
    DOM.feedbackMessage.textContent = `❌ Incorrecto. La respuesta era: ${respuestaCorrectaActual}`
  }

  actualizarTurnoUI()
  setTimeout(finalizarTurno, 4000)
}

// --- LÓGICA DE LA RULETA ---
function girarRuleta() {
  if (estaGirando) return
  estaGirando = true
  preguntaRespondida = false
  DOM.spinBtn.disabled = true

  limpiarPanelPregunta()
  DOM.questionText.textContent = 'Girando la ruleta...'

  const vueltas = 5 + Math.random() * 3
  const gradosExtra = Math.random() * 360
  rotacionRuleta += vueltas * 360 + gradosExtra

  DOM.wheel.style.setProperty('--spin-degrees', `${rotacionRuleta}deg`)
  DOM.wheel.style.setProperty('--spin-duration', '4s')
  DOM.wheel.classList.add('wheel-spinning')

  setTimeout(() => {
    DOM.wheel.classList.remove('wheel-spinning')
    DOM.wheel.style.transform = `rotate(${rotacionRuleta}deg)`

    const rotacionNormalizada = rotacionRuleta % 360
    const posicionPuntero = (360 - rotacionNormalizada + 360) % 360

    // Selección dinámica de la categoría según la división matemática de 90°
    const categoriasKeys = Object.keys(CATEGORIAS)
    const indexSector = Math.floor(posicionPuntero / 90)
    const temaElegido = categoriasKeys[indexSector]

    estaGirando = false
    DOM.spinBtn.disabled = false

    obtenerPregunta(temaElegido)
  }, 4000)
}

// --- LÓGICA DE RANKING Y PUNTUACIONES ---
async function guardarPuntuacionesAutomaticamente() {
  if (jugadores.length === 0) return

  let guardados = 0

  for (const jugador of jugadores) {
    if (jugador.puntosTotales === 0) continue

    try {
      const respuesta = await fetch(`${URL_BASE_API}/api/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: jugador.nombre,
          puntos: jugador.puntosTotales,
          quesitos: jugador.quesitos,
        }),
      })

      if (respuesta.ok) guardados++
    } catch (error) {
      console.error('Error al guardar automáticamente:', error)
    }
  }

  if (guardados > 0) actualizarRanking()
}

async function actualizarRanking() {
  try {
    const respuesta = await fetch(`${URL_BASE_API}/api/ranking`)
    if (!respuesta.ok) throw new Error('Error al obtener ranking')

    const rankingGlobal = await respuesta.json()
    if (!DOM.rankingList) return
    DOM.rankingList.innerHTML = ''

    if (rankingGlobal.length === 0) {
      DOM.rankingList.innerHTML =
        '<li style="text-align: center; padding: 10px;">Todavía no hay puntuaciones guardadas.</li>'
      return
    }

    rankingGlobal.sort((a, b) => b.puntos - a.puntos)

    rankingGlobal.forEach((entrada, indice) => {
      const li = document.createElement('li')
      li.className = 'ranking-item'

      let medalla = `<b>${indice + 1}.</b> `
      if (indice === 0) medalla = '🥇 '
      else if (indice === 1) medalla = '🥈 '
      else if (indice === 2) medalla = '🥉 '

      // Renderizado dinámico de emojis de quesitos ganados
      let htmlQuesitos = ''
      if (entrada.quesitos) {
        htmlQuesitos = Object.keys(CATEGORIAS)
          .filter((cat) => entrada.quesitos[cat])
          .map((cat) => CATEGORIAS[cat].emoji)
          .join('')
      }

      li.innerHTML = `<span>${medalla} ${entrada.nombre} <span style="font-size: 0.9em; margin-left: 8px;">${htmlQuesitos}</span></span> <span style="font-weight: bold; color: #3b82f6;">${entrada.puntos} pts</span>`
      DOM.rankingList.appendChild(li)
    })
  } catch (error) {
    console.error('Error al actualizar el ranking:', error)
  }
}

// Actualizar ranking cada 5 segundos
setInterval(actualizarRanking, 5000)

// --- GESTIÓN DE VICTORIA ---
function gestionarVictoria(jugador) {
  DOM.gameScreen.classList.add('oculto')

  const pantallaVictoria = document.createElement('div')
  pantallaVictoria.id = 'win-screen'
  pantallaVictoria.className = 'pantalla-victoria'

  const emojisVictoria = Object.values(CATEGORIAS)
    .map((c) => c.emoji)
    .join(' ')

  pantallaVictoria.innerHTML = `
    <h1 style="font-size: 3rem; color: #d97706; margin-bottom: 10px;">🏆 ¡TENEMOS UN GANADOR! 🏆</h1>
    <h2 style="font-size: 2rem; color: #1f2937;">¡Enhorabuena, <b>${
      jugador.nombre
    }</b>!</h2>
    <p style="font-size: 1.2rem; color: #4b5563;">Has conseguido los ${
      Object.keys(CATEGORIAS).length
    } quesitos con un total de <b>${jugador.puntosTotales}</b> puntos.</p>
    <div style="font-size: 3rem; margin: 20px 0;">${emojisVictoria}</div>
    <button id="restart-btn" class="btn-exito" style="box-shadow: 0 4px 6px rgba(0,0,0,0.1);">Jugar Otra Vez</button>
  `

  DOM.mainContent.appendChild(pantallaVictoria)

  document.getElementById('restart-btn').addEventListener('click', () => {
    location.reload()
  })
}
