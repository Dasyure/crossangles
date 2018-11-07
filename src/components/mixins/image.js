import axios from 'axios'
const download = require('downloadjs')

export default {
  methods: {
    saveTimetable () {
      let timetable = document.getElementById('timetable')
      let clone = timetable.cloneNode(true)

      // Find any blank hours at the start/end of timetable
      let display = { start: 24, end: 0 }
      let actual = { start: 24, end: 0 }
      for (let course of this.$store.state.chosen) {
        for (let stream of course.streams) {
          if (stream.web === false) {
            for (let session of stream.sessions) {
              display.start = Math.min(display.start, session.time.start)
              display.end = Math.max(display.end, session.time.end)
            }
          }
        }
      }
      for (let session of this.$store.state.timetable) {
        actual.start = Math.min(actual.start, session.time.start)
        actual.end = Math.max(actual.end, session.time.end)
      }

      // Remove empty rows from the start and the end
      let rows = clone.querySelectorAll('.row')
      for (let i = 1; i < rows.length; i++) {
        if (i <= actual.start - display.start || i >= 1 + (actual.end - actual.start)) {
          clone.removeChild(rows[i])
        }
      }

      // Get the height of this cut-down timetable
      // NB: must temporarily add it to DOM to do so
      clone.style.position = 'absolute'
      clone.style.visibility = 'hidden'
      document.body.appendChild(clone)
      let height = clone.scrollHeight
      document.body.removeChild(clone)
      clone.style.removeProperty('position')
      clone.style.removeProperty('visibility')

      // Get HTML string for timetable
      let timetableHTML = clone.outerHTML
      // Remove unused classes
      timetableHTML = timetableHTML.replace(/ ?elevation-[0-9]+ ?/g, ' ')
      // Remove comments
      timetableHTML = timetableHTML.replace(/<!--.*?-->/g, '')
      // Remove data attributes
      timetableHTML = timetableHTML.replace(/ data-[^=]*=""/g, '')
      // Remove multiple spaces
      timetableHTML = timetableHTML.replace(/\s+/g, ' ')
      // Remove pointless spaces next to tags
      timetableHTML = timetableHTML.replace(/ ?> ?/g, '>')
      // Remove empty classes
      timetableHTML = timetableHTML.replace(/(class|style)="\s*"/g, '')

      axios.post('https://' + process.env.DOMAIN + '/timetable/', {
        width: timetable.scrollWidth,
        height: height,
        timetable: timetableHTML
      }).then(r => {
        download('data:image/png;base64,' + r.data, 'timetable.png', 'image/png')
      }).catch((e) => {
        console.error(e)
      })
    }
  }
}
