console.log('loading aladin.js');
var aladin = A.aladin('#aladin-lite-div', { survey: "P/DSS2/color", fov: 60 , cooFrame: 'ICRSd'});

var draper = 'III/135A/catalog'
var brightstar = 'V/50/catalog'
var gaia = 'I/355/gaiadr3'
draper_options = {
    shape: 'square', sourceSize: 8,
    raField: "_RA.icrs", decField: "_DE.icrs",
    color: 'red', onClick: 'showPopup',
    displayLabel: true,
    labelColumn: "HD", labelColor: 'white',labelFont: '16px sans-serif',
}
catalog = A.catalogFromVizieR(draper, '19:50 +16:50', 5, draper_options)
// aladin.addCatalog(catalog);
// add gaia catalog
aladin.gotoRaDec("266.5", "-28.7")
aladin.setFoV(6)
// var url1 = 'https://raw.githubusercontent.com/johnarban/wwt_interactives/main/images/stsci.jpg'
// var url2 = 'https://www.esa.int/var/esa/storage/images/esa_multimedia/images/2023/03/wolf-rayet_124_nircam_and_miri_composite_image/24749635-1-eng-GB/Wolf-Rayet_124_NIRCam_and_MIRI_composite_image.jpg'
var url2 = 'https://johnarban.github.io/wwt_interactives/images/adam/BrickJWST_merged_longwave_narrowband_lighter_avm_tagged.png'

aladin.displayJPG(url2, {}, (ra, dec,fov) => {
    console.log('displayJPG callback', ra, dec, fov)
}
    );

// 