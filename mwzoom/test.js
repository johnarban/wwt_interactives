// uses wwtsdk.js

// Global variables for RA and DEC


// Global variables for imagesets




// WWT scritpInterface and WWTControl
let wwt_si = null
let wwt_cl = null

// load in background_images.json // organized list of imagesets
let wwt_images = null;

// Define how many wtml files we want to load
let N_wtml = 2
let N_wtml_loaded = 0

// let far = new wwtlib.Place();
// far.set_RA(0);
// far.set_dec(0);
// far.set_distance(5e14);


let far2 = new wwtlib.Place();
far2.set_RA(180);
far2.set_dec(45);
far2.set_distance(8e16);
// far2.set_camParams(camParams);

let bandpass = {
    0: 'Gamma',
    1: 'X-ray',
    2: 'Ultraviolet',
    3: 'Visible',
    4: 'IR / H&alpha;',
    5: 'Microwave',
    6: 'Radio'
}


async function load_wwt_images() {
    log("loading wwt_images")
    const response = await fetch("background_images.json");
    const data = await response.json();
    wwt_images = data;
    console.log("wwt_images loaded")
}

async function init_wwt() {
    // function to initialize WorldWide Telescope
    log("initializing wwt");

    // Initialize WWT to be on the div with id="wwtcanvas"
    // await load_wwt_images();
    // wwtlib.WWTControl.initControl("wwtcanvas", true);
    wwtlib.WWTControl.initControl6(
      "wwtcanvas",
      true,
      30,
      30,
      240,
      "SolarSystem"
    );
    
    // Run initial setup after WWT is ready
    wwtlib.WWTControl.scriptInterface.add_ready(wwt_load_after_ready);
}


window.addEventListener("load", () => { init_wwt() });


async function wwt_load_after_ready() {
    // function to run after WWT is ready
    // this is your setup code


    wwt_si = wwtlib.WWTControl.scriptInterface;

    wwt_cl = wwtlib.WWTControl.singleton;

    // Set our initial settings //

    // Get rid of constellations
    wwt_stc = wwtlib.SpaceTimeController;

    // apply initial WWT settings
    wwt_si.setBackgroundImageByName("3D Solar System View");
    wwt_si.settings.set_solarSystemScale(100);
    wwt_si.settings.set_solarSystemMilkyWay(true);
    wwt_si.settings.set_solarSystemCosmos(true);
    wwt_si.settings.set_solarSystemStars(true);
    wwt_si.settings.set_showConstellationBoundries(false);
    wwt_si.settings.set_showConstellationFigures(false);
    wwt_si.settings.set_showConstellationSelection(false);
    wwt_si.settings.set_showCrosshairs(false);
    wwt_si.settings.set_solarSystemLighting(false)

    // grid
    // wwt_si.settings._showGrid = true;

    wwt_cl.gotoTarget(far2, true, false, true);
    // wwt_cl.gotoTarget(near, false, true, true);


    set_ra_dec_display()

}

function set_ra_dec_display() {
    radec_div = document.getElementById("radec");
    radec_div.style.display = "flex";
    let RA = wwt_si.getRA();
    let DEC = wwt_si.getDec();
    let FOV = wwt_si.get_fov();
    document.getElementById("ra_val").innerHTML = parseFloat(RA*15).toFixed(2);
    document.getElementById("dec_val").innerHTML = parseFloat(DEC).toFixed(2);
    document.getElementById("fov_val").innerHTML = parseFloat(FOV).toFixed(2);
}

window.addEventListener("click", set_ra_dec_display)

// repeat set_ra_dec_display every 1000 ms
setInterval(set_ra_dec_display, 10);


// ******  handy functions ******
// print all imagesets
function print_imagesets() {
    imagesets = wwtlib.WWTControl.getImageSets()
    imagesets.forEach(item => log(item['_name']))
    return imagesets
}

function fov_to_zoom(fov) {
    current_fov = wwt_si.get_fov();
    fov = Math.min(fov, 60)
    zoom = fov / current_fov;
    log(`fov: ${fov}, current_fov: ${current_fov}, zoom: ${zoom}`, 'info', 1);
    return zoom
}


function add_opacity_slider(layer) {
    // create a slider for the layer
    log("creating slider for layer: " + layer.get_name(), 'important')
    div = document.getElementById("slidercontainer");
    containing_div = document.createElement("div");
    containing_div.className = "slider_with_name";
    containing_div.id = `${layer.get_name()}_slider_with_name`;
    let input = document.createElement("input");
    input.classList.add("overlay")
    input.classList.add("slider");
    input.type = "range";
    input.min = 0;
    input.max = 100;
    input.value = layer.get_opacity() * 100;
    input.className = "slider";
    input.id = `${layer.get_name()}_slider`;
    input.oninput = adjust_layer_opacity;
    let span = document.createElement("span");
    span.classList.add("overlay")
    span.classList.add("slider_label");
    span.innerHTML = layer.get_name();
    span.onclick = () => {
        image = exact_getImagesetByName(layer.get_name())
        let x = image._centerX/15
        let y = image._centerY
        console.log(x*15, y)
        wwt_cl.gotoRADecZoom(ra_hours = x, dec_deg = y, zoom = 7, instant = true)
        if (layer.opacity < .5) {
            input.value = 50;
            layer.set_opacity(.5);
        } else {
            input.value = 100;
            layer.set_opacity(1);
        }
    };
    containing_div.appendChild(span)
    containing_div.appendChild(input)


    div.appendChild(containing_div)
}


function adjust_layer_opacity() {
    // adjust the opacity of a layer
    var layer = getImageSetLayerByName(this.id.replace('_slider', ''));
    layer.set_opacity(this.value / 100);
}

function crossfade_layers(slider_element, layerName1, layerName2) {
    // adjust the opacity of a layer
    var layer1 = getImageSetLayerByName(layerName1);
    var layer2 = getImageSetLayerByName(layerName2);

    // higher opacity layer should go on top
    var opacity = slider_element.value / 100;
    layer1.set_opacity(opacity);
    layer2.set_opacity(1 - opacity);
}