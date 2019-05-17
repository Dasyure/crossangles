import { CBScolor } from './colors'

function parseCourses (data) {
  let courses = {}

  for (let i = 0, l = data.length; i < l; i++) {
    let _course = data[i]
    let code = _course.c
    let term = _course.t || ''
    let course = {
      code,
      term,
      key: code + term,
      title: _course.n,
      custom: false,
      color: code !== 'CBS' ? null : CBScolor,
      streams: null
    }
    course.streams = parseStreams(_course.s, course)

    const key = code + term
    courses[key] = course
  }

  return courses
}

function parseStreams (streams, course) {
  if (streams === null || streams === undefined) {
    return []
  }

  let result = []

  for (let i = 0, l = streams.length; i < l; i++) {
    let stream = streams[i]
    let newStream = {
      course: course,
      component: stream.c,
      web: !!stream.w,
      status: stream.s,
      enrols: stream.e,
      sessions: null
    }

    // Process sessions (excluding WEB streams, which have none)
    if (stream.w !== 1) {
      newStream.sessions = parseSessions(stream.t, course, newStream)
    }
    result[i] = newStream
  }

  return result
}

function parseSessions (times, course, stream) {
  if (times === null || times === undefined) {
    return []
  }

  let timetable = []

  for (let i = 0, l = times.length; i < l; i++) {
    let time = times[i][0]
    let day = time.charAt(0)
    let canClash = time.charAt(time.length - 1) === '#'
    let hours = time.substr(1, time.length - 1 - canClash).split('-')
    hours = hours.map(x => parseFloat(x))

    timetable[i] = {
      course: course,
      stream: stream,
      time: {
        day: day,
        start: hours[0],
        end: hours[1] || (hours[0] + 1),
        canClash: canClash
      },
      location: times[i][1],
      weeks: times[i][2],
      index: i,
      snapToggle: false
    }
  }

  return timetable
}

export default parseCourses
