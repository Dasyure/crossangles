import axios from 'axios'
import _colors from '../components/mixins/colors'
let colors = _colors.data()

const dataURL = '/static/tt.json'
const storage = window.localStorage

function parseStreams (streams, course) {
  let result = []

  for (let stream of streams) {
    let nextStream = {
      course: course,
      component: stream.component,
      status: stream.status,
      enrols: stream.enrols,
      sessions: null
    }
    nextStream.sessions = parseSessions(stream.times, course, nextStream)
    result.push(nextStream)
  }

  return result
}

function parseSessions (times, course, stream) {
  let timetable = []

  for (let i = 0; i < times.length; i++) {
    let time = times[i]
    timetable.push({
      course: course,
      stream: stream,
      location: time[1],
      time: parseTimeString(time[0]),
      weeks: time[2],
      index: i,
      snapToggle: false
    })
  }

  return timetable
}

function parseTimeString (time) {
  let day = time.substr(0, 1)
  let canClash = /#$/.test(time)
  let hours = time.substr(1).replace('#', '').split('-').map(x => parseInt(x))
  if (hours.length === 1) {
    hours.push(hours[0] + 1)
  }
  let [ start, end ] = hours

  return {
    day,
    start,
    end,
    canClash
  }
}

export default {
  state: {
    courses: {},
    meta: {},
    chosen: [],
    events: [],
    options: {},
    timetable: [],
    alert: null,
    loading: true
  },
  mutations: {
    courses (state, data) {
      let courses = Object.assign({}, state.courses)

      for (let course of data) {
        let code = course.code
        courses[code] = {
          code: code,
          title: course.name,
          color: code !== 'CBS' ? null : colors.CBScolor,
          streams: null
        }
        courses[code].streams = parseStreams(course.streams, courses[code])
      }

      state.courses = courses
    },
    meta (state, data) {
      state.meta = data
    },
    chosen (state, data) {
      state.chosen = data

      storage.setItem('chosen', JSON.stringify(data.map(c => {
        return {
          code: c.code,
          color: c.color
        }
      })))
    },
    events (state, data) {
      state.events = data

      storage.setItem('events', JSON.stringify(data))
    },
    options (state, data) {
      state.options = data

      storage.setItem('options', JSON.stringify(data))
    },
    timetable (state, data) {
      state.timetable = data

      storage.setItem('timetable', JSON.stringify(data.map(session => {
        return {
          code: session.course.code,
          component: session.stream.component,
          time: session.time,
          index: session.index
        }
      })))
    },
    alert (state, data) {
      state.alert = data
    },
    loading (state, data) {
      state.loading = data
    }
  },
  actions: {
    loadData (context) {
      let chosen = storage.getItem('chosen')
      let events = storage.getItem('events')
      let options = storage.getItem('options')
      let timetable = storage.getItem('timetable')

      axios.get(dataURL).then((r) => {
        context.commit('courses', r.data.courses)
        context.commit('meta', r.data.meta)

        if (chosen) {
          // Restore previously chosen courses
          chosen = JSON.parse(chosen)
          let restored = []
          for (let course of chosen) {
            context.state.courses[course.code].color = course.color
            restored.push(context.state.courses[course.code])
          }

          context.commit('chosen', restored)
        } else {
          // Default to just CBS chosen
          context.commit('chosen', [context.state.courses.CBS])
        }

        if (events) {
          // Restore previously selected events
          events = JSON.parse(events)
          context.commit('events', events)
        } else {
          // Default to all CBS events
          let components = context.state.courses.CBS.streams.map(s => s.component)
          let events = components.filter((c, i) => components.indexOf(c) === i)
          context.commit('events', events)
        }

        if (options) {
          // Restore previously selected options
          options = JSON.parse(options)
          context.commit('options', options)
        } else {
          // Default to none selected
          context.commit('options', [])
        }

        if (timetable) {
          timetable = JSON.parse(timetable)

          let restored = []
          for (let item of timetable) {
            let course = context.state.courses[item.code]
            let stream = course.streams.filter(s => {
              if (s.component !== item.component) {
                return false
              }

              if (s.sessions[item.index].time.day !== item.time.day) {
                return false
              }
              if (s.sessions[item.index].time.start !== item.time.start) {
                return false
              }
              if (s.sessions[item.index].time.end !== item.time.end) {
                return false
              }

              return true
            })[0]
            restored.push(stream.sessions[item.index])
          }

          context.commit('timetable', restored)
        } else {
          // Default to empty timetable
          context.commit('timetable', [])
        }

        // Disable the loading block on auto timetable updating
        // NB: this block exists to prevent restored timetable being overwritten
        window.setTimeout(() => context.commit('loading', false), 100)
      })
    },
    reset (context) {
      const CBS = context.state.courses.CBS
      let components = CBS.streams.map(s => s.component)
      let events = components.filter((c, i) => components.indexOf(c) === i)
      context.commit('chosen', [CBS])
      context.commit('events', events)
      context.commit('options', [])
      context.commit('timetable', [])
    }
  }
}
