import axios, { AxiosError, AxiosRequestConfig, Method, AxiosResponse } from 'axios';
import { IDictionaryCollection } from '../../models/internal/Idictionary-collection';
import { DictionaryCollection } from '../../models/internal/dictionary-collection';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** After sleep / tab resume the first hop often fails with no response — safe to retry idempotent reads once. */
function isTransientNetworkFailure(err: unknown): boolean {
  if (!axios.isAxiosError(err)) {
    const msg = err instanceof Error ? err.message : String(err);
    return msg === 'Network Error';
  }
  const ax = err as AxiosError;
  if (ax.response) return false;
  const code = ax.code;
  if (code === 'ERR_NETWORK' || code === 'ECONNABORTED' || code === 'ETIMEDOUT' || code === 'ECONNRESET') {
    return true;
  }
  return ax.message === 'Network Error';
}

export abstract class BaseAjaxClient {
  constructor() {}

  protected GetHttpDataAsync = async <Req>(
    fullReqUrl: string,
    method: Method,
    reqBody: Req | null,
    headers: IDictionaryCollection<string, string>,
    contentType: string
  ): Promise<AxiosResponse> => {
    if (headers == null) {
      headers = new DictionaryCollection<string, string>();
    }

    let dataToSend: any = null;

    if (reqBody instanceof FormData) {
      // ✅ FormData: don’t stringify, let axios handle
      dataToSend = reqBody;
    } else if (reqBody != null) {
      // ✅ JSON: stringify
      if (contentType === '' || contentType === 'application/json') {
        headers.Add('Content-Type', 'application/json');
        dataToSend = JSON.stringify(reqBody);
      } else {
        throw new Error('Unsupported content type: ' + contentType);
      }
    }

    let response = await this.FetchAsync(fullReqUrl, method, headers, dataToSend);
    if (response == null) {
      throw new Error('Response null after api call. please report the event to administrator.');
    }
    return response;
  };

  private FetchAsync = async (
    fullReqUrl: string,
    reqMethod: Method,
    headersToAdd: IDictionaryCollection<string, string>,
    reqBody: any
  ): Promise<AxiosResponse<any, any> | null> => {
    let hdrs: any = {};
    if (headersToAdd != null && headersToAdd.Count() > 0) {
      headersToAdd.Keys().forEach((key) => {
        hdrs[key] = headersToAdd.Item(key);
      });

      let config: AxiosRequestConfig<any> = this.GetAxiosConfig();
      config.url = fullReqUrl;
      config.method = reqMethod;
      config.headers = hdrs;
      config.data = reqBody;

      const methodUpper = String(reqMethod).toUpperCase();
      const allowRetry = methodUpper === 'GET' || methodUpper === 'HEAD';
      // SSR must not retry slow APIs — Vite aborts the whole page at 30s.
      const isServer = typeof window === 'undefined';
      const maxAttempts = allowRetry && !isServer ? 2 : 1;
      let lastErr: unknown;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          return await axios.request(config);
        } catch (e) {
          lastErr = e;
          if (attempt >= maxAttempts || !isTransientNetworkFailure(e)) {
            throw e;
          }
          await sleep(450);
        }
      }
      throw lastErr;
    }
    return null;
  };

  private GetAxiosConfig = (): AxiosRequestConfig => {
    // timeout: 0 hangs forever and trips Angular Vite SSR (30s AbortSignal).
    const isServer = typeof window === 'undefined';
    return {
      url: '',
      method: 'get',
      apiBaseUrl: '',
      // Keep SSR short; browser needs more headroom for cold/remote APIs.
      timeout: isServer ? 6_000 : 20_000,
      withCredentials: false,
      responseType: 'json',
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      validateStatus(status) {
        return true; // handle errors globally
      },
      maxRedirects: 5,
    } as AxiosRequestConfig;
  };

  protected IsSuccessCode = (respStatusCode: number): boolean => {
    return respStatusCode >= 200 && respStatusCode < 300;
  };
}
