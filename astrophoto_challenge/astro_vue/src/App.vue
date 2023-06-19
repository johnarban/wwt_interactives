<template>
  <v-app>
    <div class="wwt-container">
    <WorldWideTelescope class='wwt-class' wwt-namespace="wwt"></WorldWideTelescope>
    </div>

  </v-app>
</template>

<script lang="ts">
import { defineComponent } from 'vue'


import { WWTAwareComponent } from "@wwtelescope/engine-pinia";


import { Settings, WWTControl, RenderContext } from "@wwtelescope/engine";


export default defineComponent({
  extends: WWTAwareComponent,
  name: 'App',
  components: {
  },


  data() {
    return {
      imageURL: "",
      backupURL: "https://raw.githubusercontent.com/johnarban/wwt_interactives/main/images/m101/NGC5457M101230516055129.png",
      h: 0,
    }
  },

  created() { },

  mounted() {
    this.waitForReady().then(async () => {

      // set to use SDSS as background
      // this.wwtControl.setBackgroundImageByName("SDSS: Sloan Digital Sky Survey (Optical) [DR7]");
      this.wwtControl.setBackgroundImageByName("Digitized Sky Survey (Color)");
      this.wwtSettings.set_localHorizonMode(false);
      this.wwtSettings.set_showAltAzGrid(false);
      this.wwtSettings.set_showAltAzGridText(false);
      this.wwtSettings.set_showConstellationLabels(false);
      this.wwtSettings.set_showConstellationFigures(true);



    });
  },

  computed: {
    wwtControl(): WWTControl {
      return WWTControl.singleton;
    },

    wwtRenderContext(): RenderContext {
      return this.wwtControl.renderContext;
    },

    height(): number {
      return WWTControl.singleton.renderContext.height
    },

    wwtSettings(): Settings {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return Settings.get_active();
    },
  },

  methods: {
    update_Height() {
      this.h = WWTControl.singleton.renderContext.height;
    },
  },
})

</script>


<style lang="less">

#app {
  // height: 100dvh;
  padding: 0;
}

.g {
  background-color: black;
}
.wwt-container {
  display: block;
  margin: auto auto;
  height: calc(100% - 7px);
  width: calc(100%);
  background-color: red;
}

.wwt-class {
  // below 6 px expands, above 6 px shrinks to size
  height: 100%;
  width: 100%;
}

canvas {
  display: block;
  }

</style>
