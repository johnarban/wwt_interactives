// Global variables for RA and DEC


// Global variables for imagesets
let myimageset = null

let myimageset_layer = null

// WWT scritpInterface and WWTControl
let wwt_si = null
let wwt_cl = null

// load in background_images.json // organized list of imagesets
let wwt_images = null;

// Define how many wtml files we want to load
let N_wtml = 2
let N_wtml_loaded = 0

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
    wwtlib.WWTControl.initControl("wwtcanvas", true);

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
    wwt_si.settings._showConstellationBoundries = true;
    wwt_si.settings._showConstellationFigures = true;
    wwt_si.settings._showConstellationSelection = false;
    wwt_si.settings._showISSModel = false;

    // grid
    // wwt_si.settings._showGrid = true;


    // Switch to galactic mode (this is just objectively better)
    wwt_si.settings._galacticMode = false;



    // Load external wtml files and register them with WWT

    loadWTML('../images/test_scale.wtml', 'test')
        .then((imageset) => {
            myimageset = imageset;
            // wwt_cl.setBackgroundImageByName(imageset._name);
            log(`${myimageset._name} is loaded: ${imagesetExists(name)}`, 'success')
            
            myimageset_layer = wwt_si.addImageSetLayer(myimageset.url);
            myimageset_layer.set_name("uses inversion header");
            myimageset_layer.opacity = 1;
            myimageset_layer.set_enabled(true);
            add_opacity_slider(myimageset_layer);
            wwt_si.setImageSetLayerOrder(myimageset_layer.id, 0)
            
        });
    
        // loadWTML('../images/tile/index_rel.wtml', 'test_no_inv')
        // .then((imageset) => {
        //     myimageset = imageset;
        //     // wwt_cl.setBackgroundImageByName(imageset._name);
        //     console.log(myimageset)
        //     log(`${myimageset._name} is loaded`, 'success')
        //     myimageset_layer = wwt_si.addImageSetLayer(myimageset.url);
        //     myimageset_layer.set_name('uses scale/rot');
        //     myimageset_layer.opacity = 0.5;
        //     myimageset_layer.set_enabled(true);
        //     add_opacity_slider(myimageset_layer);
        //     wwt_si.setImageSetLayerOrder(myimageset_layer.id, 1)
            
        // });
        
    
    wwtlib.Wtml.getWtmlFile('../images/james_tile/index_rel.wtml', () => {
        let name = 'james';
        console.log('index_rel.wtml loaded', imagesetExists(name));
        wwt_cl.setBackgroundImageByName(name)
        let imageset = wwt_cl.getImagesetByName(name);
        // console.log(imageset)
        let layer = wwt_si.addImageSetLayer(imageset.url);
        layer.set_name("james");
        layer.opacity = 1;
        add_opacity_slider(layer);
        wwt_si.setImageSetLayerOrder(layer.id, 1);
    }, true) 
    // loadWTML('./blank.wtml', 'Carina Nebula')
    //     .then((imageset) => {
    //         // wwt_cl.setBackgroundImageByName(imageset._name);
    //         log(`${imageset._name} is loaded`, 'success')
    //         layer = wwt_si.addImageSetLayer(imageset.url);
    //         layer.set_name(imageset._name);
    //         layer.set_enabled(true);
    //         add_opacity_slider(layer);
    //         wwt_si.setImageSetLayerOrder(layer.id, 1)
    //     });

    // roll_deg is in radians :/ 1.8 radians = 103.5 degrees 
    // intial fov is 60deg, need move there first so we can zoom in in a time independent manner
    wwt_cl.gotoRADecZoom(ra_hours = 237.742 / 15, dec_deg = 32.047, instant = true)
    wwt_cl.gotoRADecZoom(ra_hours = 237.742 / 15, dec_deg = 32.047, zoom=10, instant = true)
    
    
    
    // set_ra_dec_display()

}

// These two function makes sure the imageset is fully loaded
// adapted from stackoverflow.com/questions/30505960/use-promise-to-wait-until-polled-condition-is-satisfied
function ensureImagesetReady(name) {
    // Create a promise that will be resolved when the imageset is ready
    return new Promise(function (resolve, reject) {
        (function waitForImagesetReady() {
            log('ensuring ' + name + ' ImageSet is ready', 'info')
            if (imagesetExists(name)) return resolve(wwt_cl.getImagesetByName(name));
            setTimeout(waitForImagesetReady, 1);
        })();
    });
}

async function loadWTML(filename, name, callback = () => { }, loadChildFolders = false) {
    // function to load wtml files
    wwtlib.Wtml.getWtmlFile(filename, callback, loadChildFolders) // JWST Carina NIRCam
    return ensureImagesetReady(name)
}

function getImageSetLayerByName(name) {
    layers = wwt_si.getLayers() // object

    for (layer in layers) {
        if (layers[layer].get_name() == name) {
            return layers[layer]
        }
    }

}

function add_all_allsky_datasets() {
    imagesetFolder = wwtlib.WWTControl.getImageSets().filter((imageset) => imageset._dataSetType == 2) // 2 is sky data
    log(`adding ${imagesetFolder.length} all allsky datasets`, 'info', 1, false)
    imagesetFolder.forEach((imageset) => {
        add_image_option(imageset, `${bandpass[imageset._bandPass]} (Full list)`, 'wwt_image_list_allsky')
    })
    log('added all allsky datasets', 'info', 1, false)
}

function imagesetExists(name) {
    // check if imageset is is registered with WWT
    return !(wwt_cl.getImagesetByName(name) == null);
}


// check if name is loaded as imageset
function log_imageset_exists(name) {
    if (!imagesetExists(name)) {
        log('pre' + name + ' is not loaded' + pre, 'error', 0, false);
    } else {
        log(name + ' is loaded', 'success', 0, true);
    }
}


function set_background_image(image) {
    // set image as background image
    // image can be string or wwtlib.Imageset
    if (image instanceof wwtlib.Imageset) {
        image = image._name
    }
    wwt_cl.setBackgroundImageByName(image);
    // make sure selected option is correct
    document.getElementById(`${image}_option`).selected = 'selected';
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
    log("creating slider for layer: " + layer.get_name(), 'info')
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
        image = wwt_cl.getImagesetByName(layer.get_name())
        let x = image._centerX/15
        let y = image._centerY
        wwt_cl.gotoRADecZoom(ra_hours = x, dec_deg = y, instant = true)
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