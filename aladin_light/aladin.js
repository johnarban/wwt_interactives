console.log('loading aladin.js');
var aladin = A.aladin('#aladin-lite-div', { survey: "P/DSS2/color", fov: 60 , cooFrame: 'ICRS'});

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
catalog = A.catalogFromVizieR(draper, '15:50:58.185 +32:02:50.365', 5, draper_options)
aladin.addCatalog(catalog);
// add gaia catalog
aladin.gotoRaDec("237.742", "32.047")
aladin.setFoV(6)
var url1 = 'https://raw.githubusercontent.com/johnarban/wwt_interactives/main/images/stsci.jpg'
var url3 = 'https://raw.githubusercontent.com/johnarban/wwt_interactives/main/images/img_tagged.jpg'
var url4 = 'https://raw.githubusercontent.com/johnarban/wwt_interactives/main/images/692_2022E3_02_01_23_tagged.jpg'

aladin.displayJPG(url4,);
// 