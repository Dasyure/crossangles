<template>
  <v-list v-if="chosen.length > 0" class="py-0">
    <template v-for="course in chosen">
      <v-divider />
      <v-list-tile :key="course.code">
        <v-list-tile-content>
          <v-list-tile-title>
            {{ (course.code !== 'CBS') ? course.code : course.title }}

            <span class="faded" v-if="course.code !== 'CBS'">
              — {{ course.title }}
            </span>
          </v-list-tile-title>
        </v-list-tile-content>

        <div class="no-spacing pl-2">
          <swatches
            v-model="course.color"
            :colors="colors"
            :row-length="4"
            popover-to="left"
            shapes="circles"
            :swatch-size="32"
            :trigger-style="{ width: '32px', height: '32px' }"
          />
        </div>

        <v-list-tile-action>
          <v-btn
            icon
            v-if="course.code !== 'CBS'"
            @click="removeCourse(course)"
          >
            <v-icon>close</v-icon>
          </v-btn>
        </v-list-tile-action>
      </v-list-tile>

      <v-list-tile
        v-if="course.streams.filter(s => s.web).length > 0"
        class="flexible-height"
      >
        <v-checkbox
          v-model="course.useWeb"
          label="Enrol in online-only lecture stream"
          color="secondary"
          class="pt-0 pb-2"
        />
      </v-list-tile>
    </template>

    <v-list-tile class="flexible-height">
      <cbs-events />
    </v-list-tile>

    <v-divider />
  </v-list>
</template>

<script>
  import Swatches from 'vue-swatches'
  import 'vue-swatches/dist/vue-swatches.min.css'

  import cbsEvents from './CBSEvents'
  import colors from '../mixins/colors'

  export default {
    data () {
      return {
        color: ''
      }
    },
    computed: {
      chosen () {
        return this.$store.state.chosen
      },
      chosenColors () {
        return this.chosen.map(c => c.color)
      }
    },
    methods: {
      removeCourse (course) {
        // Reset this course's color
        course.color = null

        // Reset WEB stream involvement for this course
        course.useWeb = false

        // Remove this course
        let chosen = this.chosen.slice()
        chosen.splice(chosen.indexOf(course), 1)
        this.$store.commit('chosen', chosen)
      }
    },
    watch: {
      chosenColors () {
        // Re-commit chosen courses when colour changes
        this.$store.commit('chosen', this.chosen)
      }
    },
    components: {
      Swatches,
      cbsEvents
    },
    mixins: [ colors ]
  }
</script>

<style scoped>
  .faded {
    opacity: 0.7;
  }
  .no-spacing {
    line-height: 0.1;
    font-size: 1px;
  }
</style>

<style>
  .flexible-height > .v-list__tile {
    height: auto;
  }
</style>