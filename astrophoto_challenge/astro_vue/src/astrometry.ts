// make this file a module


interface UploadOptions {
  allow_commercial_use?: 'd' | 'n' | 'y',
  allow_modifications?: 'd' | 'n' | 'y' | 'sa',
  publicly_visible?: 'n' | 'y',
  album?: number | string,
}

interface TargetOptions {
  center_ra: number,
  center_dec: number,
  radius: number,
  crpix_center?: boolean,
  scale_lower?: number,
  scale_upper?: number,
  scale_units?: string,
  downsample_factor?: number,
  tweak_order?: number,
  parity?: 0 | 1 | 2,
}

export interface AllOptions extends UploadOptions, TargetOptions { }


export interface LoginJSON extends JSON {
  status: string,
  message?: string,
  session?: string,
  errormessage?: string,
}

// after uploading the json response is {"status": "success", "subid": 16714, "hash": "6024b45a16bfb5af7a73735cbabdf2b462c11214"}
// hash is sha-1 of the url
export interface UploadJSON extends JSON {
  status: string,
  subid: number,
  hash: string,
  errormessage?: string,
}

// the response to a submission info request
// {"processing_started": "2016-03-29 11:02:11.967627", "job_calibrations": [[1493115, 785516]],
// "jobs": [1493115], "processing_finished": "2016-03-29 11:02:13.010625",
// "user": 1, "user_images": [1051223]}
export interface SubmissionStatusJSON extends JSON {
  processing_started: string,
  processing_finished: string,
  job_calibrations: [number, number][],
  jobs: number[],
  user: number,
  user_images: number[],
  error_message?: string,
}

export interface JobStatusJSON extends JSON { status: string, errormessage?: string }

// calibration response is {"parity": 1.0, "orientation": 105.74942079091929,
// "pixscale": 1.0906710701159739, "radius": 0.8106715896625917,
// "ra": 169.96633791366915, "dec": 13.221011585315143}
export interface Calibration extends JSON {
  parity: number,
  orientation: number,
  pixscale: number,
  radius: number,
  ra: number,
  dec: number,
  height_arcsec: number,
  width_arcsec: number,
}

interface WwtUrlParams {
    name: string,
    imageurl: string,
    ra: number,
    dec: number,
    scale: number,
    rotation: number,
    reverseparity: boolean,
    x: number,
    y: number,
    thumb: string,
  }

async function fetchJSON(request: Request): Promise<JSON> {
  return fetch(request)
  
    .then((response) => {

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      if (response.status !== 200) {
        throw new Error("Status: " + response.status + response.statusText);
      }
      return response.json();
    })
    
    .catch((error) => { console.error(error); });
}


function loginValidation(key: string | null) {
  if (key == null) {
      throw new Error("Session key is null");
    }
    return key
}
    
export async function login(apiKey: string): Promise<string> {
  const url = "https://nova.astrometry.net/api/login";
  const theKey = {
    apikey: apiKey,
  };

  // make data object a json string (otherwise will just get "object Object")
  const requestJSON = { "request-json": JSON.stringify(theKey) };
  const requestOptions = {
    method: "POST",
    headers: {
      "User-Agent": "nasaastrophotochallengetestbot/0.0 (https://johnarban.gihub.io; test@test.com)"
    },
    body: new URLSearchParams(requestJSON),
  };

  const request = new Request(url, requestOptions);

  
  // fetch, check for errors, and return response
  return await (fetchJSON(request) as Promise<LoginJSON>)
    .then((data) => {
      if (data.status !== "success") {
        throw new Error(`JSON Status "${data.status}:  ${data.errormessage}"`);
      }
      loginValidation(data.session as string);
      return data.session;
    }) as string;

}

//////////////////////////////////////////////
// POST function for submitting jobs

function uploadValidation(responseJson: UploadJSON) {
  if (responseJson.status != "success") {
    throw new Error("Job submission failed with message: " + responseJson.errormessage);
  }

  const error_key = Object.keys(responseJson).find((key) => key.includes("error"));
  if (error_key != null) {
    throw new Error("Job submission failed with message: " + responseJson[error_key as keyof typeof responseJson]);
  }
}


export async function urlUpload(session: string, url: string, options: AllOptions): Promise<UploadJSON> {

  const defaultOptions = {
    session: session,
    url: url,
    ...{
      crpix_center: true,
      scale_lower: 0.1,
      scale_upper: 180,
      scale_units: 'degwidth',
      downsample_factor: 2,
      tweak_order: 2,
      parity: 2,
    } as TargetOptions,
    ...{
      allow_commercial_use: 'd',
      allow_modifications: 'd',
      publicly_visible: 'n',
      album: 'test'
    } as UploadOptions,
  }

  options = { ...defaultOptions, ...options };


  const uploadURL = "https://nova.astrometry.net/api/url_upload";

  const requestJSON = { "request-json": JSON.stringify(options) };

  const requestOptions = {
    method: "POST",
    headers: {
      "User-Agent": "nasaastrophotochallengetestbot/0.0 (https://johnarban.gihub.io; test@test.com)"
    },
    body: new URLSearchParams(requestJSON),
  };

  const request = new Request(uploadURL, requestOptions);

  // fetch, check for errors, and return response
  return fetchJSON(request).then((data) => {
    uploadValidation(data as UploadJSON);
    return data as UploadJSON;
  });
}

export function submitJob(session: string, url: string, options: AllOptions): Promise<UploadJSON> {
  // thin wrapper around urlUpload
  return urlUpload(session, url, options);
}

export function formatSubmissionURL(subid: number): string {
  return `https://nova.astrometry.net/status/${subid}/`;
}

//////////////////////////////////////////////
// GET function wrappers to return JSON
//////////////////////////////////////////////

function submissionStatusValidation(responseJson: SubmissionStatusJSON) {
  const error_key = Object.keys(responseJson).find((key) => key.includes("error"));
  if (error_key != null) {
    throw new Error("Job submission failed with message: " + responseJson[error_key as keyof typeof responseJson]);
  }
}

export async function getSubmissionStatus(subid: number): Promise<SubmissionStatusJSON> {
  const url = "https://nova.astrometry.net/api/submissions/" + subid;
  const request = new Request(url);
  return fetchJSON(request).then((data) => {
    submissionStatusValidation(data as SubmissionStatusJSON);
    return data as SubmissionStatusJSON;
  })
}

export async function getJobStatus(jobid: number): Promise<JobStatusJSON> {
  const url = "https://nova.astrometry.net/api/jobs/" + jobid;
  const request = new Request(url);
  return fetchJSON(request).then((data) => {
    return data as JobStatusJSON;
  })
}

export async function getCalibration(jobid: number): Promise<Calibration> {
  const url = "https://nova.astrometry.net/api/jobs/" + jobid + "/calibration";
  const request = new Request(url);
  return fetchJSON(request).then((data) => { return data as Calibration; })
}

function convertCalibrationToWtmlParams(calibration: Calibration): WwtUrlParams {
  const width = calibration.width_arcsec / calibration.pixscale;
  const height = calibration.height_arcsec / calibration.pixscale;

  const offsetX = (width + 1) / 2;
  const offsetY = (height + 1) / 2;

  const rot = calibration.orientation + 180;

  return {
    name: "astrophoto",
    imageurl: null as unknown as string,
    ra: calibration.ra,
    dec: calibration.dec,
    scale: calibration.pixscale,
    rotation: rot > 360 ? 360 - rot : rot,
    reverseparity: calibration.parity < 0,
    x: offsetX,
    y: offsetY,
    thumb: null as unknown as string,
  };
}

export function getWwtURL(url: string, calibration: Calibration, type = "wwt") {
  const baseURL = {
    wwt: "http://www.worldwidetelescope.org/wwtweb/ShowImage.aspx?",
    wtml: "http://wwtcoreapp-data-app.azurewebsites.net:80/wwtweb/ShowImage.aspx?",
  }[type];

  const params = convertCalibrationToWtmlParams(calibration);
  params.imageurl = url;
  params.thumb = url;

  const paramString = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    paramString.append(key, value as string);
  }
  return baseURL + paramString.toString() + "&wtml=true";
}


export function getWtmlURL(url: string, calibration: Calibration) {
  return getWwtURL(url, calibration, "wtml");
}
