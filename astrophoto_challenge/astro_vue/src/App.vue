<template>
  <v-app :wwt-namespace="wwtNamespace">

    <h1 class="align-center"> View your image in WorldWide Telescope </h1>
    <div class="my-grid">
      <div class="g1">
        <v-text-field 
          label="Image URL" 
          v-model="imageURL" 
          hint="Enter the URL of your image here"
          persistent-hint>
        </v-text-field>
      </div>
      <div class="g2">
        <v-btn 
          variant="flat" 
          color="primary" 
          @click="console.log('hello'), submitData(imageURL)"
          >
          Submit URL
        </v-btn>
      </div>

      <div class="g3">
        <div id="forLink"></div>
      </div>

      <div class="g4 wwt-div">
        <WorldWideTelescope :wwt-namespace="wwtNamespace"></WorldWideTelescope>
      </div>
    </div>


  </v-app>
</template>

<script lang="ts">
import { defineComponent } from 'vue'



import * as Astro from './astrometry' 

import { WWTAwareComponent } from "@wwtelescope/engine-pinia";


import { Place, Settings, WWTControl } from "@wwtelescope/engine";
import { applyImageSetLayerSetting } from "@wwtelescope/engine-helpers";

export default defineComponent({
  extends: WWTAwareComponent,
  name: 'App',
  components: {
  },


  data() {
    return {
      imageURL: "",
      backupURL: "https://raw.githubusercontent.com/johnarban/wwt_interactives/main/images/m101/NGC5457M101230516055129.png",
    }
  },
  
  created() {},

  computed: {
    wwtControl(): WWTControl {
      return WWTControl.singleton;
    },
    
    wwtSettings(): Settings {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return Settings.get_active();
    },
  },

  methods: {

    async loadWTML(url: string) {
      this.loadImageCollection({ url: url, loadChildFolders: false })
        .then((imagesetFolder) => { return imagesetFolder.get_children() ?? [] })
        .then((children) => {
          children.forEach((item) => {
            
            // if child is not a place, skip it
            if (!(item instanceof Place)) { return; }

            // get the imageset
            const imageset = item.get_backgroundImageset() ?? item.get_studyImageset();

            // if imageset is null, skip it
            if (imageset == null) { return; }

            // get the name of the imageset
            const name = imageset.get_name();
            
            this.addImageSetLayer({
              url: imageset.get_url(),
              mode: "autodetect",
              name: name,
              goto: true
            }).then((layer) => {
              console.log(layer, item);
              applyImageSetLayerSetting(layer, ["opacity", 1]);
            });
          });
        });
    },

    async addUrlToPage(url: string, calibration: Astro.Calibration) {
      const wwtURL = Astro.getWwtURL(url, calibration);
      const link = document.createElement('a');
      link.href = wwtURL;
      link.target = "_blank";
      link.innerText = "View in WorldWide Telescope";
      document.getElementById("forLink")?.appendChild(link);

      await this.loadWTML(Astro.getWtmlURL(url, calibration));
    },
      

    submitData(myURL = "", settings = {} as Astro.AllOptions) {

      if (myURL == "") {
        myURL = this.backupURL as string;
        console.log('Using backup URL: ' + myURL);
      }

      

      
    Astro.login("lfcrmdhvpwfvcpnf")
      .then((sessionKey) => {
        // submit job
        return Astro.submitJob(sessionKey, myURL, settings)
      })
      .then((response) => {
        const subid = response.subid;
        console.log(Astro.formatSubmissionURL(subid));
        return subid
      })
      .then((subid) => {
        // wait for job to start running
        // get the submission status json
        return this.waitForJobStart(subid)
      })
      .then((subinfo) => {
        console.log("Getting job results...");
        const jobid = subinfo.jobs[0];
        if (jobid == null) {
          throw new Error("Job info is null");
        }
        console.log("jobid: " + jobid);
        return jobid
      })
      .then((jobid) => {
        // wait for job to finish
        return this.waitForJobFinish(jobid)
      })
      .then((jobid) => {
        console.log("Getting calibration...");
        Astro.getCalibration(jobid).then((calibration) => {
          console.log(Astro.getWwtURL(myURL, calibration));
          this.addUrlToPage(myURL, calibration);
        });
      })
      
      .catch((error) => {
        console.error(error);
      });
    
    },

    waitForJobStart(subid: number) {
      // wait for job to start running
      return new Promise((resolve) => {
        
        function checkSubStatus(): Promise<Astro.SubmissionStatusJSON> {
          
          return Astro.getSubmissionStatus(subid)
          
            .then((subinfo) => {
              if (subinfo.jobs.length > 0 && subinfo.jobs[0] != null) {
                console.log("Job started!");
                resolve(subinfo);
              }
              
              else {
                console.log("Waiting for job to start...");
                setTimeout(checkSubStatus, 1000);
              }
              
            }) as Promise<Astro.SubmissionStatusJSON>;
        }
        checkSubStatus();
        
      }) as Promise<Astro.SubmissionStatusJSON>;
    },

    waitForJobFinish(jobid: number): Promise<number> {
      // wait for job to finish
      return new Promise((resolve) => {
        
        function checkJobStatus(): Promise<number> {
          
          return Astro.getJobStatus(jobid)
          
            .then((jobinfo) => {
              
              if (jobinfo.status == "success") {
                console.log("Job complete!");
                resolve(jobid);
              }
              
              else if (jobinfo.status == "failure") {
                throw new Error("Job failed with message: " + jobinfo.errormessage);
              }
              
              else {
                console.log("Waiting for job to complete...");
                setTimeout(checkJobStatus, 1000);
              }
              
            }) as Promise<number>;
          
        }
        checkJobStatus();
      });
    },

  },
})

</script>


<style lang="less">

#app {
  height: 100dvh;
}

// 4 row grid, centered
.my-grid {
  display: grid;
  grid-template-rows: .1fr .1fr .1fr .7fr;
  gap: 1rem;
  justify-items: center;
  align-items: center;
  margin: 2rem 2rem;
  // outline: 3px solid blue; 
  padding: 1rem;
  
  
  > div {
    // outline: 3px solid rgb(197, 78, 78);
    justify-content: center;
    width: 100%;
    text-align: center;
  }
  
.g1 {
  grid-row: 1;
}

.g2 {
  grid-row: 2;
}

.g3 {
  grid-row: 3;
}

.g4 {
  grid-row: 4;
}

}
.wwt-div {
  // height: 75vh;
  width: 100%;
  filter: drop-shadow(0 0 30px black);

  canvas {
    height: 70vh;
    width: 100%;
  }
}

#for-link {
  max-width: 75%;
  margin-top: 2rem;
  text-align: center;
}

#for-link a {
  text-decoration: none;
  color: black;
}

.align-center {
  margin-top: 2rem;
  text-align: center;
}

.justify-center {
  margin: 2rem auto;
  width: 75%;
  display: flex;
  justify-self: center;
  flex-direction: column;
  justify-content: center;
  gap: 2rem;
}

</style>
