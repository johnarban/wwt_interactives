// Global variables for RA and DEC


// Global variables for imagesets
let jwst_imageset = null
let hubble_imageset = null
let jwst_layer = null
let hubble_layer = null

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
    await load_wwt_images();
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
    wwt_si.settings._showConstellationBoundries = false;
    wwt_si.settings._showConstellationFigures = false;
    wwt_si.settings._showConstellationSelection = false;
    wwt_si.settings._showISSModel = false;

    // grid
    // wwt_si.settings._showGrid = true;


    // Switch to galactic mode (this is just objectively better)
    wwt_si.settings._galacticMode = false;

    // add Default ImageSets to the menu
    make_wwt_image_list();


    // Load external wtml files and register them with WWT
    log("loading WTML", 'info', 1, true)
    loadWTML('./jwst_carina.wtml', 'JWST Carina NIRCam')
        .then((imageset) => {
            log(`${imageset._name} is loaded`, 'success')
            jwst_imageset = imageset;
            jwst_layer = wwt_si.addImageSetLayer(jwst_imageset.url);
            jwst_layer.set_name(jwst_imageset._name);
            jwst_layer.set_enabled(true);
            add_layer_to_thumbnail_div(jwst_layer);
            add_opacity_slider(jwst_layer);
            wwt_si.setImageSetLayerOrder(jwst_layer.id,1)
        });
    
    loadWTML('./carina_nebula.wtml', 'Carina Nebula')
        .then((imageset) => {
            log(`${imageset._name} is loaded`,'success')
            hubble_imageset = imageset;
            hubble_layer = wwt_si.addImageSetLayer(hubble_imageset.url);
            hubble_layer.set_name(hubble_imageset._name);
            hubble_layer.set_enabled(true);
            add_layer_to_thumbnail_div(hubble_layer);
            add_opacity_slider(hubble_layer);
            wwt_si.setImageSetLayerOrder(hubble_layer.id, 0)
        });


    loadWTML('./unwise.wtml', 'unWISE')
        .then(
            (imageset) => {
                log(`${imageset._name} is loaded`, 'success')
                add_image_option(imageset._name, 'Infrared');
                set_background_image(imageset._name);
            });

    // use list of imagesets to add to the menu
    // folder = wwtlib.Wtml.getWtmlFile('https://worldwidetelescope.github.io/pywwt/surveys.xml', () => { add_all_allsky_datasets() }, true)


    // roll_deg is in radians :/ 1.8 radians = 103.5 degrees 
    // intial fov is 60deg, need move there first so we can zoom in in a time independent manner
    wwt_cl.gotoRADecZoom(ra_hours = 10.61, dec_deg = -58.64, instant = true, roll_deg = 1.8)
    wwt_cl.gotoRADecZoom(ra_hours = 10.61, dec_deg = -58.64, zoom = fov_to_zoom(.25), instant = true, roll_deg = 1.8)
    set_ra_dec_display()

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



function add_image_option(image, groupname = null, id = "wwt_image_list") {
    // check if option already exists
    if (image instanceof wwtlib.Imageset) {
        image = image._name
    }
    if (document.getElementById(`${image}_option`) != null) {
        log(`option (${image}) already exists`, 'error', 0, false);
        return
    } else {
        // log(`adding option (${image})`, 0, false);
    }

    option = document.createElement("option");
    option.value = image;
    option.innerHTML = image;
    option.id = `${image}_option`;
    selectTag = document.getElementById(id);
    if (groupname == null) {

        selectTag.appendChild(option);
    } else {
        // create option group with groupname
        // if element doesn't exist create it
        group = document.getElementById(`option_group_${groupname}`);
        if (group == null) {
            group = document.createElement("optgroup");
            group.id = `option_group_${groupname}`;
            group.label = groupname;
        }
        group.appendChild(option);
        selectTag.appendChild(group);
    }
}

function add_image_options(list_of_images, groupname = null, id = "wwt_image_list") {
    log(`adding ${list_of_images.length} images to menu`, 'info', 1, false)
    list_of_images.forEach(item => {
        var name = (item instanceof wwtlib.Imageset) ? item._name : item;
        // don't add if already exists
        if (document.getElementById(`${name}_option`) == null) {
            add_image_option(name, groupname, id);
        };
    });
}

function make_wwt_image_list() {
    log("making wwt_image_list");
    // add optical images
    add_image_options(wwt_images['AllSky']['Optical'], 'Optical');
    // add infrared images
    add_image_options(wwt_images['AllSky']['Infrared'], 'Infrared');
    // add catalog images
    add_image_options(wwt_images['AllSky']['Catalogs'], 'Catalogs');
    // add no data images
    add_image_options(wwt_images['AllSky']['NoData'], 'No Data');

    // set id="Digitized Sky Survey (Color)" as selected/defautlt
    selectTag = document.getElementById("wwt_image_list");
    // default_id = "Digitized Sky Survey (Color)";
    // document.getElementById(`${default_id}_option`).selected = 'selected';
}


function set_image_from_menu(el) {
    var wwt_image_list = el //document.getElementById("wwt_image_list");
    log("setting image to: " + wwt_image_list.value.replace('_option', '') + "", '', 1);
    wwt_cl.setBackgroundImageByName(wwt_image_list.value);
    // imageset = wwt_cl.getImagesetByName(wwt_image_list.value)
    // wwt_cl.gotoRADecZoom(ra_hours = imageset._centerX, dec_deg = imageset._centerY, zoom = fov_to_zoom(30), instant = true, roll_deg = 1.8)

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
    document.getElementById("ra_val").innerHTML = parseFloat(RA).toFixed(2);
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

function add_layer_to_thumbnail_div(layer) {
    // add a thumbnail to the thumbnail div using layer.url
    log("adding layer to image list: " + layer.get_name(), 'info')

    image_list = document.getElementById("image_list")

    div = document.createElement("div");
    div.className = "image_list_item";

    img = document.createElement("img");
    img.src = layer.get_imageSet()._thumbnailUrl;
    img.className = "thumbnail";
    img.id = `${layer.get_name()}_thumbnail`;
    img.onclick = toggle_layer;
    if (layer.get_enabled()) {
        img.classList.add("thumbnail_selected");
    }
    div.appendChild(img);


    image_list.appendChild(div);
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
        if (layer.opacity > 0) {
            input.value = 0;
            layer.set_opacity(0);
        } else {
            input.value = 100;
            layer.set_opacity(1);
        }
    };
    containing_div.appendChild(span)
    containing_div.appendChild(input)


    div.appendChild(containing_div)
}

function toggle_layer() {
    layer_name = this.id.replace('_thumbnail', '');
    log(`${layer_name} clicked`)
    layer = getImageSetLayerByName(layer_name);
    layer.set_enabled(!layer.get_enabled());
    img = document.querySelector(`img[id="${layer_name}_thumbnail"]`);
    slider_div = document.querySelector(`div[id="${layer_name}_slider_with_name"]`);

    if (layer.get_enabled()) {
        img.classList.add("thumbnail_selected");
        slider_div.style.display = 'flex';
    } else {
        img.classList.remove("thumbnail_selected");
        slider_div.style.display = 'none';

    }
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