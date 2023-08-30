// #region TypeDefinitions
declare type SupportedReqTypes = HoppRESTRequest;
export declare type HoppCollection<T extends SupportedReqTypes> = {
  v: number;
  name: string;
  folders: HoppCollection<T>[];
  requests: T[];
  id?: string;
};
export declare type HoppRESTParam = {
  key: string;
  value: string;
  active: boolean;
};

export declare type HoppRESTReqBodyFormData = {
  contentType: "multipart/form-data";
  body: FormDataKeyValue[];
};

export declare type HoppRESTHeader = {
  key: string;
  value: string;
  active: boolean;
};

export declare type FormDataKeyValue = {
  key: string;
  active: boolean;
} & ({
  isFile: true;
  value: Blob[];
} | {
  isFile: false;
  value: string;
});

export declare const knownContentTypes: {
  "application/json": string;
  "application/ld+json": string;
  "application/hal+json": string;
  "application/vnd.api+json": string;
  "application/xml": string;
  "application/x-www-form-urlencoded": string;
  "multipart/form-data": string;
  "text/html": string;
  "text/plain": string;
};
export declare type ValidContentTypes = keyof typeof knownContentTypes;

export declare type HoppRESTReqBody = {
  contentType: Exclude<ValidContentTypes, "multipart/form-data">;
  body: string;
} | HoppRESTReqBodyFormData | {
  contentType: null;
  body: null;
};

export declare type HoppRESTAuthNone = {
  authType: "none";
};
export declare type HoppRESTAuthBasic = {
  authType: "basic";
  username: string;
  password: string;
};
export declare type HoppRESTAuthBearer = {
  authType: "bearer";
  token: string;
};
export declare type HoppRESTAuthOAuth2 = {
  authType: "oauth-2";
  token: string;
  oidcDiscoveryURL: string;
  authURL: string;
  accessTokenURL: string;
  clientID: string;
  scope: string;
};
export declare type HoppRESTAuthAPIKey = {
  authType: "api-key";
  key: string;
  value: string;
  addTo: string;
};
export declare type HoppRESTAuth = {
  authActive: boolean;
} & (HoppRESTAuthNone | HoppRESTAuthBasic | HoppRESTAuthBearer | HoppRESTAuthOAuth2 | HoppRESTAuthAPIKey);


export interface HoppRESTRequest {
  v: string;
  id?: string;
  name: string;
  method: string;
  endpoint: string;
  params: HoppRESTParam[];
  headers: HoppRESTHeader[];
  preRequestScript: string;
  testScript: string;
  auth: HoppRESTAuth;
  body: HoppRESTReqBody;
}

//#endregion



/**
 * https://schema.postman.com/json/collection/v2.1.0/collection.json
 *
 */
function convertHopDataToPostmanFormat(hopData: HoppCollection<HoppRESTRequest>): string {
  // Convert the data to postman format
  let postmanData = {
      "info": {
          "name": hopData.name,
          "description": hopData.name,
          "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
      },
      "item": [] as any[]
  }

  // Define a recursive function to convert hopp folders and requests to postman format
  const convertHoppFolderToPostmanFormat = (hoppFolder: HoppCollection<HoppRESTRequest>) => {
      // Define the postman folder
      let postmanFolder = {
          "name": hoppFolder.name,
          "item": [] as any[]
      }

      // Iterate through each hopp request
      for (let hoppRequest of hoppFolder.requests) {
          // Convert the request to postman format
          let postmanRequest = convertHoppRequestToPostmanFormat(hoppRequest)

          // Push the converted request to the postman folder
          postmanFolder.item.push(postmanRequest)
      }

      // Iterate through each hopp subfolder
      for (let hoppSubfolder of hoppFolder.folders) {
          // Convert the subfolder to postman format
          let postmanSubfolder = convertHoppFolderToPostmanFormat(hoppSubfolder)

          // Push the converted subfolder to the postman folder
          postmanFolder.item.push(postmanSubfolder)
      }

      // Return the postman folder
      return postmanFolder;
  }

  // Iterate through each hopp folder
  for (let hoppFolder of hopData.folders) {
      // Convert the folder to postman format
      let postmanFolder = convertHoppFolderToPostmanFormat(hoppFolder)

      // Push the converted folder to the postmanData
      postmanData.item.push(postmanFolder)
  }

  // Return the postmanData
  return JSON.stringify(postmanData)
}

function convertHoppRequestToPostmanFormat(hoppRequest: HoppRESTRequest): any {
  // Define the postmanRequest
  let postmanRequest = {
      "name": hoppRequest.name,
      "request": {
          "method": hoppRequest.method,
          "header": [] as any[],
          "body": {
              "mode": "raw",
              "raw": ""
          } as Record<string, any>,
          "url": convertEndpointToCorrectPostmanUrlFormat(hoppRequest.endpoint)
      },
      "response": []
  }

  // Iterate through each hopp header
  for (let hoppHeader of hoppRequest.headers) {
      if (hoppHeader.active) {
          // Push the header to the postmanRequest
          postmanRequest.request.header.push({
              "key": hoppHeader.key,
              "value": convertHoppscotchVariablesToPostmanFormat(hoppHeader.value)
          })
      }
  }

  // Iterate through each hopp param
  for (let hoppParam of hoppRequest.params) {
      if (hoppParam.active) {
          // Push the param to the postmanRequest
          postmanRequest.request.url.query.push({
              "key": hoppParam.key,
              "value": convertHoppscotchVariablesToPostmanFormat(hoppParam.value)
          })
      }
  }

  // Push the body to the postmanRequest
  if (hoppRequest.body.contentType === 'application/json') {
      postmanRequest.request.body.mode = 'raw';
      postmanRequest.request.body.raw = convertHoppscotchVariablesToPostmanFormat(hoppRequest.body.body);
  } else if (hoppRequest.body.contentType === 'application/x-www-form-urlencoded') {
      postmanRequest.request.body.mode = 'urlencoded';
      const urlencoded: any[] = [];
      const params = new URLSearchParams(hoppRequest.body.body);
      params.forEach((value, key) => urlencoded.push({ key, value: convertHoppscotchVariablesToPostmanFormat(value) }));
      postmanRequest.request.body.urlencoded = urlencoded;
  } else if (hoppRequest.body.contentType === 'multipart/form-data') {
      postmanRequest.request.body.mode = 'formdata';
      const formdata: any[] = [];
      for (const item of hoppRequest.body.body) {
          formdata.push({
              key: item.key,
              value: item.isFile ? item.value[0] : convertHoppscotchVariablesToPostmanFormat(item.value as any),
              type: item.isFile ? 'file' : 'text'
          });
      }
      postmanRequest.request.body.formdata = formdata;
  }

  // Return the postmanRequest
  return postmanRequest;
}

function convertEndpointToCorrectPostmanUrlFormat(endpoint: string): {raw: string, host: string[], path: string[], query: {key: string, value: string}[]} {
  let usedExampleCom = false;
  // Parse the endpoint URL
  let url = new URL('https://example.com');
  try {
    url = new URL(endpoint);
  } catch (error) {
    // If the URL is not valid (in case a variable is used as baseURL), it will throw error
    url = new URL(endpoint, 'https://example.com');
    usedExampleCom = true;
  }


  // Convert the host to an array of strings
  const host = usedExampleCom? [endpoint.split('/')[0]] : url.hostname.split('.');


  // Convert the pathname to an array of strings
  const path = endpoint.split('/').filter(Boolean);
  usedExampleCom? path.shift(): undefined;

  // Convert the searchParams to an array of objects
  const query: {key: string, value: string}[] = [];
  url.searchParams.forEach((value, key) => query.push({key, value}));

  // Return the result
  return {
      raw: endpoint,
      host,
      path,
      query
  };
}


function convertHoppscotchVariablesToPostmanFormat(text: string): string {
  return text.replace(/<<([^>]+)>>/g, `{{$1}}`);
}


/**
 * Convert using this function
 * @param hopData Hoppscotch JSON file
 * @returns 
 */
export function converter(hopData: any): string{
  const result = convertHoppscotchVariablesToPostmanFormat(convertHopDataToPostmanFormat(hopData));
  return result;
}