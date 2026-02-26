var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-KZMj85/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// .wrangler/tmp/bundle-KZMj85/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
__name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, [
      stripCfConnectingIPHeader.apply(null, argArray)
    ]);
  }
});

// node_modules/hono/dist/compose.js
var compose = /* @__PURE__ */ __name((middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context.req.routeIndex = i;
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (handler) {
        try {
          res = await handler(context, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
    __name(dispatch, "dispatch");
  };
}, "compose");

// node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();

// node_modules/hono/dist/utils/body.js
var parseBody = /* @__PURE__ */ __name(async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = request instanceof HonoRequest ? request.raw.headers : request.headers;
  const contentType = headers.get("Content-Type");
  if (contentType?.startsWith("multipart/form-data") || contentType?.startsWith("application/x-www-form-urlencoded")) {
    return parseFormData(request, { all, dot });
  }
  return {};
}, "parseBody");
async function parseFormData(request, options) {
  const formData = await request.formData();
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
__name(parseFormData, "parseFormData");
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value);
        delete form[key];
      }
    });
  }
  return form;
}
__name(convertFormDataToBodyData, "convertFormDataToBodyData");
var handleParsingAllValues = /* @__PURE__ */ __name((form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) {
      ;
      form[key].push(value);
    } else {
      form[key] = [form[key], value];
    }
  } else {
    if (!key.endsWith("[]")) {
      form[key] = value;
    } else {
      form[key] = [value];
    }
  }
}, "handleParsingAllValues");
var handleParsingNestedValues = /* @__PURE__ */ __name((form, key, value) => {
  let nestedForm = form;
  const keys = key.split(".");
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
}, "handleParsingNestedValues");

// node_modules/hono/dist/utils/url.js
var splitPath = /* @__PURE__ */ __name((path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
}, "splitPath");
var splitRoutingPath = /* @__PURE__ */ __name((routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
}, "splitRoutingPath");
var extractGroupsFromPath = /* @__PURE__ */ __name((path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match2, index) => {
    const mark = `@${index}`;
    groups.push([mark, match2]);
    return mark;
  });
  return { groups, path };
}, "extractGroupsFromPath");
var replaceGroupMarks = /* @__PURE__ */ __name((paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
}, "replaceGroupMarks");
var patternCache = {};
var getPattern = /* @__PURE__ */ __name((label, next) => {
  if (label === "*") {
    return "*";
  }
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match2[2]) {
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match2[1], new RegExp(`^${match2[2]}(?=/${next})`)] : [label, match2[1], new RegExp(`^${match2[2]}$`)];
      } else {
        patternCache[cacheKey] = [label, match2[1], true];
      }
    }
    return patternCache[cacheKey];
  }
  return null;
}, "getPattern");
var tryDecode = /* @__PURE__ */ __name((str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder(match2);
      } catch {
        return match2;
      }
    });
  }
}, "tryDecode");
var tryDecodeURI = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURI), "tryDecodeURI");
var getPath = /* @__PURE__ */ __name((request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const hashIndex = url.indexOf("#", i);
      const end = queryIndex === -1 ? hashIndex === -1 ? void 0 : hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex);
      const path = url.slice(start, end);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63 || charCode === 35) {
      break;
    }
  }
  return url.slice(start, i);
}, "getPath");
var getPathNoStrict = /* @__PURE__ */ __name((request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
}, "getPathNoStrict");
var mergePath = /* @__PURE__ */ __name((base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
}, "mergePath");
var checkOptionalParameter = /* @__PURE__ */ __name((path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (/\?/.test(segment)) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.replace("?", "");
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
}, "checkOptionalParameter");
var _decodeURI = /* @__PURE__ */ __name((value) => {
  if (!/[%+]/.test(value)) {
    return value;
  }
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return value.indexOf("%") !== -1 ? tryDecode(value, decodeURIComponent_) : value;
}, "_decodeURI");
var _getQueryParam = /* @__PURE__ */ __name((url, key, multiple) => {
  let encoded;
  if (!multiple && key && !/[%+]/.test(key)) {
    let keyIndex2 = url.indexOf("?", 8);
    if (keyIndex2 === -1) {
      return void 0;
    }
    if (!url.startsWith(key, keyIndex2 + 1)) {
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = {};
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
}, "_getQueryParam");
var getQueryParam = _getQueryParam;
var getQueryParams = /* @__PURE__ */ __name((url, key) => {
  return _getQueryParam(url, key, true);
}, "getQueryParams");
var decodeURIComponent_ = decodeURIComponent;

// node_modules/hono/dist/request.js
var tryDecodeURIComponent = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURIComponent_), "tryDecodeURIComponent");
var HonoRequest = /* @__PURE__ */ __name(class {
  /**
   * `.raw` can get the raw Request object.
   *
   * @see {@link https://hono.dev/docs/api/request#raw}
   *
   * @example
   * ```ts
   * // For Cloudflare Workers
   * app.post('/', async (c) => {
   *   const metadata = c.req.raw.cf?.hostMetadata?
   *   ...
   * })
   * ```
   */
  raw;
  #validatedData;
  // Short name of validatedData
  #matchResult;
  routeIndex = 0;
  /**
   * `.path` can get the pathname of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#path}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const pathname = c.req.path // `/about/me`
   * })
   * ```
   */
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
    this.#validatedData = {};
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex][1][key];
    const param = this.#getParamValue(paramKey);
    return param && /\%/.test(param) ? tryDecodeURIComponent(param) : param;
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex][1]);
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0) {
        decoded[key] = /\%/.test(value) ? tryDecodeURIComponent(value) : value;
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = {};
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return this.bodyCache.parsedBody ??= await parseBody(this, options);
  }
  #cachedBody = (key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    const anyCachedKey = Object.keys(bodyCache)[0];
    if (anyCachedKey) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        return new Response(body)[key]();
      });
    }
    return bodyCache[key] = raw2[key]();
  };
  /**
   * `.json()` can parse Request body of type `application/json`
   *
   * @see {@link https://hono.dev/docs/api/request#json}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.json()
   * })
   * ```
   */
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  /**
   * `.text()` can parse Request body of type `text/plain`
   *
   * @see {@link https://hono.dev/docs/api/request#text}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.text()
   * })
   * ```
   */
  text() {
    return this.#cachedBody("text");
  }
  /**
   * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
   *
   * @see {@link https://hono.dev/docs/api/request#arraybuffer}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.arrayBuffer()
   * })
   * ```
   */
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  /**
   * Parses the request body as a `Blob`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.blob();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#blob
   */
  blob() {
    return this.#cachedBody("blob");
  }
  /**
   * Parses the request body as `FormData`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.formData();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#formdata
   */
  formData() {
    return this.#cachedBody("formData");
  }
  /**
   * Adds validated data to the request.
   *
   * @param target - The target of the validation.
   * @param data - The validated data to add.
   */
  addValidatedData(target, data) {
    this.#validatedData[target] = data;
  }
  valid(target) {
    return this.#validatedData[target];
  }
  /**
   * `.url()` can get the request url strings.
   *
   * @see {@link https://hono.dev/docs/api/request#url}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const url = c.req.url // `http://localhost:8787/about/me`
   *   ...
   * })
   * ```
   */
  get url() {
    return this.raw.url;
  }
  /**
   * `.method()` can get the method name of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#method}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const method = c.req.method // `GET`
   * })
   * ```
   */
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  /**
   * `.matchedRoutes()` can return a matched route in the handler
   *
   * @deprecated
   *
   * Use matchedRoutes helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#matchedroutes}
   *
   * @example
   * ```ts
   * app.use('*', async function logger(c, next) {
   *   await next()
   *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
   *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
   *     console.log(
   *       method,
   *       ' ',
   *       path,
   *       ' '.repeat(Math.max(10 - path.length, 0)),
   *       name,
   *       i === c.req.routeIndex ? '<- respond from here' : ''
   *     )
   *   })
   * })
   * ```
   */
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  /**
   * `routePath()` can retrieve the path registered within the handler
   *
   * @deprecated
   *
   * Use routePath helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#routepath}
   *
   * @example
   * ```ts
   * app.get('/posts/:id', (c) => {
   *   return c.json({ path: c.req.routePath })
   * })
   * ```
   */
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
}, "HonoRequest");

// node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = /* @__PURE__ */ __name((value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
}, "raw");
var resolveCallback = /* @__PURE__ */ __name(async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
}, "resolveCallback");

// node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = /* @__PURE__ */ __name((contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
}, "setDefaultContentType");
var createResponseInstance = /* @__PURE__ */ __name((body, init) => new Response(body, init), "createResponseInstance");
var Context = /* @__PURE__ */ __name(class {
  #rawRequest;
  #req;
  /**
   * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
   *
   * @see {@link https://hono.dev/docs/api/context#env}
   *
   * @example
   * ```ts
   * // Environment object for Cloudflare Workers
   * app.get('*', async c => {
   *   const counter = c.env.COUNTER
   * })
   * ```
   */
  env = {};
  #var;
  finalized = false;
  /**
   * `.error` can get the error object from the middleware if the Handler throws an error.
   *
   * @see {@link https://hono.dev/docs/api/context#error}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   await next()
   *   if (c.error) {
   *     // do something...
   *   }
   * })
   * ```
   */
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  /**
   * Creates an instance of the Context class.
   *
   * @param req - The Request object.
   * @param options - Optional configuration options for the context.
   */
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  /**
   * `.req` is the instance of {@link HonoRequest}.
   */
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#event}
   * The FetchEvent associated with the current request.
   *
   * @throws Will throw an error if the context does not have a FetchEvent.
   */
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#executionctx}
   * The ExecutionContext associated with the current request.
   *
   * @throws Will throw an error if the context does not have an ExecutionContext.
   */
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#res}
   * The Response object for the current request.
   */
  get res() {
    return this.#res ||= createResponseInstance(null, {
      headers: this.#preparedHeaders ??= new Headers()
    });
  }
  /**
   * Sets the Response object for the current request.
   *
   * @param _res - The Response object to set.
   */
  set res(_res) {
    if (this.#res && _res) {
      _res = createResponseInstance(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") {
          continue;
        }
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res.headers.append("set-cookie", cookie);
          }
        } else {
          _res.headers.set(k, v);
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  /**
   * `.render()` can create a response within a layout.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   return c.render('Hello!')
   * })
   * ```
   */
  render = (...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  };
  /**
   * Sets the layout for the response.
   *
   * @param layout - The layout to set.
   * @returns The layout function.
   */
  setLayout = (layout) => this.#layout = layout;
  /**
   * Gets the current layout for the response.
   *
   * @returns The current layout function.
   */
  getLayout = () => this.#layout;
  /**
   * `.setRenderer()` can set the layout in the custom middleware.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```tsx
   * app.use('*', async (c, next) => {
   *   c.setRenderer((content) => {
   *     return c.html(
   *       <html>
   *         <body>
   *           <p>{content}</p>
   *         </body>
   *       </html>
   *     )
   *   })
   *   await next()
   * })
   * ```
   */
  setRenderer = (renderer) => {
    this.#renderer = renderer;
  };
  /**
   * `.header()` can set headers.
   *
   * @see {@link https://hono.dev/docs/api/context#header}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  header = (name, value, options) => {
    if (this.finalized) {
      this.#res = createResponseInstance(this.#res.body, this.#res);
    }
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) {
      headers.delete(name);
    } else if (options?.append) {
      headers.append(name, value);
    } else {
      headers.set(name, value);
    }
  };
  status = (status) => {
    this.#status = status;
  };
  /**
   * `.set()` can set the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   c.set('message', 'Hono is hot!!')
   *   await next()
   * })
   * ```
   */
  set = (key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  };
  /**
   * `.get()` can use the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   const message = c.get('message')
   *   return c.text(`The message is "${message}"`)
   * })
   * ```
   */
  get = (key) => {
    return this.#var ? this.#var.get(key) : void 0;
  };
  /**
   * `.var` can access the value of a variable.
   *
   * @see {@link https://hono.dev/docs/api/context#var}
   *
   * @example
   * ```ts
   * const result = c.var.client.oneMethod()
   * ```
   */
  // c.var.propName is a read-only
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    const responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders ?? new Headers();
    if (typeof arg === "object" && "headers" in arg) {
      const argHeaders = arg.headers instanceof Headers ? arg.headers : new Headers(arg.headers);
      for (const [key, value] of argHeaders) {
        if (key.toLowerCase() === "set-cookie") {
          responseHeaders.append(key, value);
        } else {
          responseHeaders.set(key, value);
        }
      }
    }
    if (headers) {
      for (const [k, v] of Object.entries(headers)) {
        if (typeof v === "string") {
          responseHeaders.set(k, v);
        } else {
          responseHeaders.delete(k);
          for (const v2 of v) {
            responseHeaders.append(k, v2);
          }
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return createResponseInstance(data, { status, headers: responseHeaders });
  }
  newResponse = (...args) => this.#newResponse(...args);
  /**
   * `.body()` can return the HTTP response.
   * You can set headers with `.header()` and set HTTP status code with `.status`.
   * This can also be set in `.text()`, `.json()` and so on.
   *
   * @see {@link https://hono.dev/docs/api/context#body}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *   // Set HTTP status code
   *   c.status(201)
   *
   *   // Return the response body
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  body = (data, arg, headers) => this.#newResponse(data, arg, headers);
  /**
   * `.text()` can render text as `Content-Type:text/plain`.
   *
   * @see {@link https://hono.dev/docs/api/context#text}
   *
   * @example
   * ```ts
   * app.get('/say', (c) => {
   *   return c.text('Hello!')
   * })
   * ```
   */
  text = (text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(
      text,
      arg,
      setDefaultContentType(TEXT_PLAIN, headers)
    );
  };
  /**
   * `.json()` can render JSON as `Content-Type:application/json`.
   *
   * @see {@link https://hono.dev/docs/api/context#json}
   *
   * @example
   * ```ts
   * app.get('/api', (c) => {
   *   return c.json({ message: 'Hello!' })
   * })
   * ```
   */
  json = (object, arg, headers) => {
    return this.#newResponse(
      JSON.stringify(object),
      arg,
      setDefaultContentType("application/json", headers)
    );
  };
  html = (html, arg, headers) => {
    const res = /* @__PURE__ */ __name((html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers)), "res");
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  };
  /**
   * `.redirect()` can Redirect, default status code is 302.
   *
   * @see {@link https://hono.dev/docs/api/context#redirect}
   *
   * @example
   * ```ts
   * app.get('/redirect', (c) => {
   *   return c.redirect('/')
   * })
   * app.get('/redirect-permanently', (c) => {
   *   return c.redirect('/', 301)
   * })
   * ```
   */
  redirect = (location, status) => {
    const locationString = String(location);
    this.header(
      "Location",
      // Multibyes should be encoded
      // eslint-disable-next-line no-control-regex
      !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
    );
    return this.newResponse(null, status ?? 302);
  };
  /**
   * `.notFound()` can return the Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/context#notfound}
   *
   * @example
   * ```ts
   * app.get('/notfound', (c) => {
   *   return c.notFound()
   * })
   * ```
   */
  notFound = () => {
    this.#notFoundHandler ??= () => createResponseInstance();
    return this.#notFoundHandler(this);
  };
}, "Context");

// node_modules/hono/dist/router.js
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = /* @__PURE__ */ __name(class extends Error {
}, "UnsupportedPathError");

// node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// node_modules/hono/dist/hono-base.js
var notFoundHandler = /* @__PURE__ */ __name((c) => {
  return c.text("404 Not Found", 404);
}, "notFoundHandler");
var errorHandler = /* @__PURE__ */ __name((err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
}, "errorHandler");
var Hono = /* @__PURE__ */ __name(class _Hono {
  get;
  post;
  put;
  delete;
  options;
  patch;
  all;
  on;
  use;
  /*
    This class is like an abstract class and does not have a router.
    To use it, inherit the class and implement router in the constructor.
  */
  router;
  getPath;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(method, this.#path, args1);
        }
        args.forEach((handler) => {
          this.#addRoute(method, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          handlers.map((handler) => {
            this.#addRoute(m.toUpperCase(), this.#path, handler);
          });
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new _Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  errorHandler = errorHandler;
  /**
   * `.route()` allows grouping other Hono instance in routes.
   *
   * @see {@link https://hono.dev/docs/api/routing#grouping}
   *
   * @param {string} path - base Path
   * @param {Hono} app - other Hono instance
   * @returns {Hono} routed Hono instance
   *
   * @example
   * ```ts
   * const app = new Hono()
   * const app2 = new Hono()
   *
   * app2.get("/user", (c) => c.text("user"))
   * app.route("/api", app2) // GET /api/user
   * ```
   */
  route(path, app22) {
    const subApp = this.basePath(path);
    app22.routes.map((r) => {
      let handler;
      if (app22.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = /* @__PURE__ */ __name(async (c, next) => (await compose([], app22.errorHandler)(c, () => r.handler(c, next))).res, "handler");
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler);
    });
    return this;
  }
  /**
   * `.basePath()` allows base paths to be specified.
   *
   * @see {@link https://hono.dev/docs/api/routing#base-path}
   *
   * @param {string} path - base Path
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * const api = new Hono().basePath('/api')
   * ```
   */
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  /**
   * `.onError()` handles an error and returns a customized Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#error-handling}
   *
   * @param {ErrorHandler} handler - request Handler for error
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.onError((err, c) => {
   *   console.error(`${err}`)
   *   return c.text('Custom Error Message', 500)
   * })
   * ```
   */
  onError = (handler) => {
    this.errorHandler = handler;
    return this;
  };
  /**
   * `.notFound()` allows you to customize a Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#not-found}
   *
   * @param {NotFoundHandler} handler - request handler for not-found
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.notFound((c) => {
   *   return c.text('Custom 404 Message', 404)
   * })
   * ```
   */
  notFound = (handler) => {
    this.#notFoundHandler = handler;
    return this;
  };
  /**
   * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
   *
   * @see {@link https://hono.dev/docs/api/hono#mount}
   *
   * @param {string} path - base Path
   * @param {Function} applicationHandler - other Request Handler
   * @param {MountOptions} [options] - options of `.mount()`
   * @returns {Hono} mounted Hono instance
   *
   * @example
   * ```ts
   * import { Router as IttyRouter } from 'itty-router'
   * import { Hono } from 'hono'
   * // Create itty-router application
   * const ittyRouter = IttyRouter()
   * // GET /itty-router/hello
   * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
   *
   * const app = new Hono()
   * app.mount('/itty-router', ittyRouter.handle)
   * ```
   *
   * @example
   * ```ts
   * const app = new Hono()
   * // Send the request to another application without modification.
   * app.mount('/app', anotherApp, {
   *   replaceRequest: (req) => req,
   * })
   * ```
   */
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = /* @__PURE__ */ __name((request) => request, "replaceRequest");
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = url.pathname.slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = /* @__PURE__ */ __name(async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    }, "handler");
    this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler) {
    method = method.toUpperCase();
    path = mergePath(this._basePath, path);
    const r = { basePath: this._basePath, path, method, handler };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    }
    const path = this.getPath(request, { env });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
      ).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  /**
   * `.fetch()` will be entry point of your app.
   *
   * @see {@link https://hono.dev/docs/api/hono#fetch}
   *
   * @param {Request} request - request Object of request
   * @param {Env} Env - env Object
   * @param {ExecutionContext} - context of execution
   * @returns {Response | Promise<Response>} response of request
   *
   */
  fetch = (request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  };
  /**
   * `.request()` is a useful method for testing.
   * You can pass a URL or pathname to send a GET request.
   * app will return a Response object.
   * ```ts
   * test('GET /hello is ok', async () => {
   *   const res = await app.request('/hello')
   *   expect(res.status).toBe(200)
   * })
   * ```
   * @see https://hono.dev/docs/api/hono#request
   */
  request = (input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) {
      return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    }
    input = input.toString();
    return this.fetch(
      new Request(
        /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`,
        requestInit
      ),
      Env,
      executionCtx
    );
  };
  /**
   * `.fire()` automatically adds a global fetch event listener.
   * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
   * @deprecated
   * Use `fire` from `hono/service-worker` instead.
   * ```ts
   * import { Hono } from 'hono'
   * import { fire } from 'hono/service-worker'
   *
   * const app = new Hono()
   * // ...
   * fire(app)
   * ```
   * @see https://hono.dev/docs/api/hono#fire
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
   * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
   */
  fire = () => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  };
}, "_Hono");

// node_modules/hono/dist/router/reg-exp-router/matcher.js
var emptyParam = [];
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match2 = /* @__PURE__ */ __name((method2, path2) => {
    const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
    const staticMatch = matcher[2][path2];
    if (staticMatch) {
      return staticMatch;
    }
    const match3 = path2.match(matcher[0]);
    if (!match3) {
      return [[], emptyParam];
    }
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  }, "match2");
  this.match = match2;
  return match2(method, path);
}
__name(match, "match");

// node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = /* @__PURE__ */ Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
__name(compareKey, "compareKey");
var Node = /* @__PURE__ */ __name(class _Node {
  #index;
  #varIndex;
  #children = /* @__PURE__ */ Object.create(null);
  insert(tokens, index, paramMap, context, pathErrorCheckOnly) {
    if (tokens.length === 0) {
      if (this.#index !== void 0) {
        throw PATH_ERROR;
      }
      if (pathErrorCheckOnly) {
        return;
      }
      this.#index = index;
      return;
    }
    const [token, ...restTokens] = tokens;
    const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let node;
    if (pattern) {
      const name = pattern[1];
      let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
      if (name && pattern[2]) {
        if (regexpStr === ".*") {
          throw PATH_ERROR;
        }
        regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
        if (/\((?!\?:)/.test(regexpStr)) {
          throw PATH_ERROR;
        }
      }
      node = this.#children[regexpStr];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[regexpStr] = new _Node();
        if (name !== "") {
          node.#varIndex = context.varIndex++;
        }
      }
      if (!pathErrorCheckOnly && name !== "") {
        paramMap.push([name, node.#varIndex]);
      }
    } else {
      node = this.#children[token];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[token] = new _Node();
      }
    }
    node.insert(restTokens, index, paramMap, context, pathErrorCheckOnly);
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.#children[k];
      return (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + c.buildRegExpStr();
    });
    if (typeof this.#index === "number") {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
}, "_Node");

// node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = /* @__PURE__ */ __name(class {
  #context = { varIndex: 0 };
  #root = new Node();
  insert(path, index, pathErrorCheckOnly) {
    const paramAssoc = [];
    const groups = [];
    for (let i = 0; ; ) {
      let replaced = false;
      path = path.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, index, paramAssoc, this.#context, pathErrorCheckOnly);
    return paramAssoc;
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
}, "Trie");

// node_modules/hono/dist/router/reg-exp-router/router.js
var nullMatcher = [/^$/, [], /* @__PURE__ */ Object.create(null)];
var wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(
    path === "*" ? "" : `^${path.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (_, metaChar) => metaChar ? `\\${metaChar}` : "(?:|/.*)"
    )}$`
  );
}
__name(buildWildcardRegExp, "buildWildcardRegExp");
function clearWildcardRegExpCache() {
  wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
__name(clearWildcardRegExpCache, "clearWildcardRegExpCache");
function buildMatcherFromPreprocessedRoutes(routes) {
  const trie = new Trie();
  const handlerData = [];
  if (routes.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes.map(
    (route) => [!/\*|\/:/.test(route[0]), ...route]
  ).sort(
    ([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length
  );
  const staticMap = /* @__PURE__ */ Object.create(null);
  for (let i = 0, j = -1, len = routesWithStaticPathFlag.length; i < len; i++) {
    const [pathErrorCheckOnly, path, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path] = [handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]), emptyParam];
    } else {
      j++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path, j, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j] = handlers.map(([h, paramCount]) => {
      const paramIndexMap = /* @__PURE__ */ Object.create(null);
      paramCount -= 1;
      for (; paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i = 0, len = handlerData.length; i < len; i++) {
    for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
      const map = handlerData[i][j]?.[1];
      if (!map) {
        continue;
      }
      const keys = Object.keys(map);
      for (let k = 0, len3 = keys.length; k < len3; k++) {
        map[keys[k]] = paramReplacementMap[map[keys[k]]];
      }
    }
  }
  const handlerMap = [];
  for (const i in indexReplacementMap) {
    handlerMap[i] = handlerData[indexReplacementMap[i]];
  }
  return [regexp, handlerMap, staticMap];
}
__name(buildMatcherFromPreprocessedRoutes, "buildMatcherFromPreprocessedRoutes");
function findMiddleware(middleware, path) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
__name(findMiddleware, "findMiddleware");
var RegExpRouter = /* @__PURE__ */ __name(class {
  name = "RegExpRouter";
  #middleware;
  #routes;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
    this.#routes = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware || !routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      ;
      [middleware, routes].forEach((handlerMap) => {
        handlerMap[method] = /* @__PURE__ */ Object.create(null);
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
        });
      });
    }
    if (path === "/*") {
      path = "*";
    }
    const paramCount = (path.match(/\/:/g) || []).length;
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      if (method === METHOD_NAME_ALL) {
        Object.keys(middleware).forEach((m) => {
          middleware[m][path] ||= findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
        });
      } else {
        middleware[method][path] ||= findMiddleware(middleware[method], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
      }
      Object.keys(middleware).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(middleware[m]).forEach((p) => {
            re.test(p) && middleware[m][p].push([handler, paramCount]);
          });
        }
      });
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(routes[m]).forEach(
            (p) => re.test(p) && routes[m][p].push([handler, paramCount])
          );
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (let i = 0, len = paths.length; i < len; i++) {
      const path2 = paths[i];
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          routes[m][path2] ||= [
            ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
          ];
          routes[m][path2].push([handler, paramCount - len + i + 1]);
        }
      });
    }
  }
  match = match;
  buildAllMatchers() {
    const matchers = /* @__PURE__ */ Object.create(null);
    Object.keys(this.#routes).concat(Object.keys(this.#middleware)).forEach((method) => {
      matchers[method] ||= this.#buildMatcher(method);
    });
    this.#middleware = this.#routes = void 0;
    clearWildcardRegExpCache();
    return matchers;
  }
  #buildMatcher(method) {
    const routes = [];
    let hasOwnRoute = method === METHOD_NAME_ALL;
    [this.#middleware, this.#routes].forEach((r) => {
      const ownRoute = r[method] ? Object.keys(r[method]).map((path) => [path, r[method][path]]) : [];
      if (ownRoute.length !== 0) {
        hasOwnRoute ||= true;
        routes.push(...ownRoute);
      } else if (method !== METHOD_NAME_ALL) {
        routes.push(
          ...Object.keys(r[METHOD_NAME_ALL]).map((path) => [path, r[METHOD_NAME_ALL][path]])
        );
      }
    });
    if (!hasOwnRoute) {
      return null;
    } else {
      return buildMatcherFromPreprocessedRoutes(routes);
    }
  }
}, "RegExpRouter");

// node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = /* @__PURE__ */ __name(class {
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path, handler]);
  }
  match(method, path) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
          router.add(...routes[i2]);
        }
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
}, "SmartRouter");

// node_modules/hono/dist/router/trie-router/node.js
var emptyParams = /* @__PURE__ */ Object.create(null);
var hasChildren = /* @__PURE__ */ __name((children) => {
  for (const _ in children) {
    return true;
  }
  return false;
}, "hasChildren");
var Node2 = /* @__PURE__ */ __name(class _Node2 {
  #methods;
  #children;
  #patterns;
  #order = 0;
  #params = emptyParams;
  constructor(method, handler, children) {
    this.#children = children || /* @__PURE__ */ Object.create(null);
    this.#methods = [];
    if (method && handler) {
      const m = /* @__PURE__ */ Object.create(null);
      m[method] = { handler, possibleKeys: [], score: 0 };
      this.#methods = [m];
    }
    this.#patterns = [];
  }
  insert(method, path, handler) {
    this.#order = ++this.#order;
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const p = parts[i];
      const nextP = parts[i + 1];
      const pattern = getPattern(p, nextP);
      const key = Array.isArray(pattern) ? pattern[0] : p;
      if (key in curNode.#children) {
        curNode = curNode.#children[key];
        if (pattern) {
          possibleKeys.push(pattern[1]);
        }
        continue;
      }
      curNode.#children[key] = new _Node2();
      if (pattern) {
        curNode.#patterns.push(pattern);
        possibleKeys.push(pattern[1]);
      }
      curNode = curNode.#children[key];
    }
    curNode.#methods.push({
      [method]: {
        handler,
        possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
        score: this.#order
      }
    });
    return curNode;
  }
  #pushHandlerSets(handlerSets, node, method, nodeParams, params) {
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      const processedSet = {};
      if (handlerSet !== void 0) {
        handlerSet.params = /* @__PURE__ */ Object.create(null);
        handlerSets.push(handlerSet);
        if (nodeParams !== emptyParams || params && params !== emptyParams) {
          for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
            const key = handlerSet.possibleKeys[i2];
            const processed = processedSet[handlerSet.score];
            handlerSet.params[key] = params?.[key] && !processed ? params[key] : nodeParams[key] ?? params?.[key];
            processedSet[handlerSet.score] = true;
          }
        }
      }
    }
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    const curNodesQueue = [];
    const len = parts.length;
    let partOffsets = null;
    for (let i = 0; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              this.#pushHandlerSets(handlerSets, nextNode.#children["*"], method, node.#params);
            }
            this.#pushHandlerSets(handlerSets, nextNode, method, node.#params);
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k = 0, len3 = node.#patterns.length; k < len3; k++) {
          const pattern = node.#patterns[k];
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (pattern === "*") {
            const astNode = node.#children["*"];
            if (astNode) {
              this.#pushHandlerSets(handlerSets, astNode, method, node.#params);
              astNode.#params = params;
              tempNodes.push(astNode);
            }
            continue;
          }
          const [key, name, matcher] = pattern;
          if (!part && !(matcher instanceof RegExp)) {
            continue;
          }
          const child = node.#children[key];
          if (matcher instanceof RegExp) {
            if (partOffsets === null) {
              partOffsets = new Array(len);
              let offset = path[0] === "/" ? 1 : 0;
              for (let p = 0; p < len; p++) {
                partOffsets[p] = offset;
                offset += parts[p].length + 1;
              }
            }
            const restPathString = path.substring(partOffsets[i]);
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              this.#pushHandlerSets(handlerSets, child, method, node.#params, params);
              if (hasChildren(child.#children)) {
                child.#params = params;
                const componentCount = m[0].match(/\//)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                targetCurNodes.push(child);
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              this.#pushHandlerSets(handlerSets, child, method, params, node.#params);
              if (child.#children["*"]) {
                this.#pushHandlerSets(
                  handlerSets,
                  child.#children["*"],
                  method,
                  params,
                  node.#params
                );
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      const shifted = curNodesQueue.shift();
      curNodes = shifted ? tempNodes.concat(shifted) : tempNodes;
    }
    if (handlerSets.length > 1) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
}, "_Node");

// node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = /* @__PURE__ */ __name(class {
  name = "TrieRouter";
  #node;
  constructor() {
    this.#node = new Node2();
  }
  add(method, path, handler) {
    const results = checkOptionalParameter(path);
    if (results) {
      for (let i = 0, len = results.length; i < len; i++) {
        this.#node.insert(method, results[i], handler);
      }
      return;
    }
    this.#node.insert(method, path, handler);
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
}, "TrieRouter");

// node_modules/hono/dist/hono.js
var Hono2 = /* @__PURE__ */ __name(class extends Hono {
  /**
   * Creates an instance of the Hono class.
   *
   * @param options - Optional configuration options for the Hono instance.
   */
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
}, "Hono");

// node_modules/hono/dist/middleware/cors/index.js
var cors = /* @__PURE__ */ __name((options) => {
  const defaults = {
    origin: "*",
    allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
    allowHeaders: [],
    exposeHeaders: []
  };
  const opts = {
    ...defaults,
    ...options
  };
  const findAllowOrigin = ((optsOrigin) => {
    if (typeof optsOrigin === "string") {
      if (optsOrigin === "*") {
        return () => optsOrigin;
      } else {
        return (origin) => optsOrigin === origin ? origin : null;
      }
    } else if (typeof optsOrigin === "function") {
      return optsOrigin;
    } else {
      return (origin) => optsOrigin.includes(origin) ? origin : null;
    }
  })(opts.origin);
  const findAllowMethods = ((optsAllowMethods) => {
    if (typeof optsAllowMethods === "function") {
      return optsAllowMethods;
    } else if (Array.isArray(optsAllowMethods)) {
      return () => optsAllowMethods;
    } else {
      return () => [];
    }
  })(opts.allowMethods);
  return /* @__PURE__ */ __name(async function cors2(c, next) {
    function set(key, value) {
      c.res.headers.set(key, value);
    }
    __name(set, "set");
    const allowOrigin = await findAllowOrigin(c.req.header("origin") || "", c);
    if (allowOrigin) {
      set("Access-Control-Allow-Origin", allowOrigin);
    }
    if (opts.credentials) {
      set("Access-Control-Allow-Credentials", "true");
    }
    if (opts.exposeHeaders?.length) {
      set("Access-Control-Expose-Headers", opts.exposeHeaders.join(","));
    }
    if (c.req.method === "OPTIONS") {
      if (opts.origin !== "*") {
        set("Vary", "Origin");
      }
      if (opts.maxAge != null) {
        set("Access-Control-Max-Age", opts.maxAge.toString());
      }
      const allowMethods = await findAllowMethods(c.req.header("origin") || "", c);
      if (allowMethods.length) {
        set("Access-Control-Allow-Methods", allowMethods.join(","));
      }
      let headers = opts.allowHeaders;
      if (!headers?.length) {
        const requestHeaders = c.req.header("Access-Control-Request-Headers");
        if (requestHeaders) {
          headers = requestHeaders.split(/\s*,\s*/);
        }
      }
      if (headers?.length) {
        set("Access-Control-Allow-Headers", headers.join(","));
        c.res.headers.append("Vary", "Access-Control-Request-Headers");
      }
      c.res.headers.delete("Content-Length");
      c.res.headers.delete("Content-Type");
      return new Response(null, {
        headers: c.res.headers,
        status: 204,
        statusText: "No Content"
      });
    }
    await next();
    if (opts.origin !== "*") {
      c.header("Vary", "Origin", { append: true });
    }
  }, "cors2");
}, "cors");

// src/middleware/auth.ts
function getOrgId(c) {
  return c.req.header("X-Org-Id") || c.req.query("org_id") || "";
}
__name(getOrgId, "getOrgId");
function getUserId(c) {
  return c.req.header("X-User-Id") || "";
}
__name(getUserId, "getUserId");
function uuid() {
  return crypto.randomUUID();
}
__name(uuid, "uuid");
function now() {
  return (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").split(".")[0];
}
__name(now, "now");
function dynamicUpdate(body, id, ts) {
  const fields = [];
  const values = [];
  for (const [key, val] of Object.entries(body)) {
    if (key === "id" || key === "org_id")
      continue;
    fields.push(`${key} = ?`);
    values.push(val);
  }
  fields.push("updated_at = ?");
  values.push(ts);
  values.push(id);
  return { sql: fields.join(", "), values };
}
__name(dynamicUpdate, "dynamicUpdate");

// src/routes/auth.ts
var app = new Hono2();
app.post("/login", async (c) => {
  const body = await c.req.json();
  const { email, name, orgId, provider, id_token, avatar } = body;
  const db = c.env.DB;
  const domain = email?.split("@")[1]?.toLowerCase();
  if (!domain)
    return c.json({ error: "Invalid email" }, 400);
  const orgDomain = await db.prepare("SELECT * FROM org_domains WHERE domain = ? AND verified = 1").bind(domain).first();
  let resolvedOrgId = orgId;
  if (orgDomain) {
    resolvedOrgId = orgDomain.org_id;
  } else if (!orgId) {
    return c.json({ error: "org_not_found", message: "Organization not found for this email domain" }, 403);
  }
  let user = await db.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
  const ts = now();
  if (!user) {
    const id = uuid();
    await db.prepare(
      `INSERT INTO users (id, org_id, email, name, role, is_admin, avatar_url, provider, last_login, is_active)
       VALUES (?, ?, ?, ?, 'admin', 1, ?, ?, ?, 1)`
    ).bind(id, resolvedOrgId, email, name, avatar || null, provider || null, ts).run();
    user = await db.prepare("SELECT * FROM users WHERE id = ?").bind(id).first();
  } else {
    await db.prepare("UPDATE users SET last_login = ?, avatar_url = COALESCE(?, avatar_url) WHERE id = ?").bind(ts, avatar || null, user.id).run();
    user = await db.prepare("SELECT * FROM users WHERE id = ?").bind(user.id).first();
  }
  const org = await db.prepare("SELECT * FROM organizations WHERE id = ?").bind(user.org_id).first();
  return c.json({ user, org });
});
app.get("/me", async (c) => {
  const userId = getUserId(c);
  if (!userId)
    return c.json({ error: "Not authenticated" }, 401);
  const user = await c.env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(userId).first();
  if (!user)
    return c.json({ error: "User not found" }, 404);
  const org = await c.env.DB.prepare("SELECT * FROM organizations WHERE id = ?").bind(user.org_id).first();
  return c.json({ user, org });
});
app.post("/google/exchange", async (c) => {
  const { code, redirect_uri } = await c.req.json();
  const GOOGLE_CLIENT_ID = "416218053988-rdvn9os69iid871l62dcvreqbt6ss550.apps.googleusercontent.com";
  const GOOGLE_CLIENT_SECRET = c.env.GOOGLE_CLIENT_SECRET;
  if (!GOOGLE_CLIENT_SECRET) {
    return c.json({ error: "Google OAuth not configured on server" }, 500);
  }
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri,
      grant_type: "authorization_code"
    })
  });
  const tokenData = await tokenRes.json();
  if (tokenData.error) {
    return c.json({ error: tokenData.error, description: tokenData.error_description }, 400);
  }
  const idToken = tokenData.id_token;
  const payload = JSON.parse(atob(idToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
  return c.json({
    email: payload.email,
    name: payload.name || payload.email?.split("@")[0],
    avatar: payload.picture || null,
    provider: "google",
    id_token: idToken
  });
});
var auth_default = app;

// src/routes/contacts.ts
var app2 = new Hono2();
app2.get("/", async (c) => {
  const orgId = getOrgId(c);
  const result = await c.env.DB.prepare("SELECT * FROM contacts WHERE org_id = ? ORDER BY created_at DESC").bind(orgId).all();
  return c.json(result.results);
});
app2.get("/:id", async (c) => {
  const result = await c.env.DB.prepare("SELECT * FROM contacts WHERE id = ?").bind(c.req.param("id")).first();
  if (!result)
    return c.json({ error: "Not found" }, 404);
  return c.json(result);
});
app2.post("/", async (c) => {
  const body = await c.req.json();
  const id = uuid();
  const ts = now();
  await c.env.DB.prepare(
    `INSERT INTO contacts (id, org_id, first_name, last_name, email, phone, mobile, title, department, account_id, account_name, owner_id, owner_name, description, mailing_address, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, body.org_id, body.first_name, body.last_name, body.email || null, body.phone || null, body.mobile || null, body.title || null, body.department || null, body.account_id || null, body.account_name || null, body.owner_id || null, body.owner_name || null, body.description || null, body.mailing_address || null, ts, ts).run();
  const record = await c.env.DB.prepare("SELECT * FROM contacts WHERE id = ?").bind(id).first();
  return c.json(record, 201);
});
app2.put("/:id", async (c) => {
  const body = await c.req.json();
  const id = c.req.param("id");
  const ts = now();
  const { sql, values } = dynamicUpdate(body, id, ts);
  await c.env.DB.prepare(`UPDATE contacts SET ${sql} WHERE id = ?`).bind(...values).run();
  const record = await c.env.DB.prepare("SELECT * FROM contacts WHERE id = ?").bind(id).first();
  return c.json(record);
});
app2.delete("/:id", async (c) => {
  await c.env.DB.prepare("DELETE FROM contacts WHERE id = ?").bind(c.req.param("id")).run();
  return c.json({ success: true });
});
var contacts_default = app2;

// src/routes/accounts.ts
var app3 = new Hono2();
app3.get("/", async (c) => {
  const orgId = getOrgId(c);
  const result = await c.env.DB.prepare("SELECT * FROM accounts WHERE org_id = ? ORDER BY created_at DESC").bind(orgId).all();
  return c.json(result.results);
});
app3.get("/:id", async (c) => {
  const result = await c.env.DB.prepare("SELECT * FROM accounts WHERE id = ?").bind(c.req.param("id")).first();
  if (!result)
    return c.json({ error: "Not found" }, 404);
  return c.json(result);
});
app3.post("/", async (c) => {
  const body = await c.req.json();
  const id = uuid();
  const ts = now();
  await c.env.DB.prepare(
    `INSERT INTO accounts (id, org_id, name, industry, type, phone, website, billing_address, description, employees, annual_revenue, owner_id, owner_name, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, body.org_id, body.name, body.industry || null, body.type || null, body.phone || null, body.website || null, body.billing_address || null, body.description || null, body.employees || null, body.annual_revenue || null, body.owner_id || null, body.owner_name || null, ts, ts).run();
  const record = await c.env.DB.prepare("SELECT * FROM accounts WHERE id = ?").bind(id).first();
  return c.json(record, 201);
});
app3.put("/:id", async (c) => {
  const body = await c.req.json();
  const id = c.req.param("id");
  const ts = now();
  const { sql, values } = dynamicUpdate(body, id, ts);
  await c.env.DB.prepare(`UPDATE accounts SET ${sql} WHERE id = ?`).bind(...values).run();
  const record = await c.env.DB.prepare("SELECT * FROM accounts WHERE id = ?").bind(id).first();
  return c.json(record);
});
app3.delete("/:id", async (c) => {
  await c.env.DB.prepare("DELETE FROM accounts WHERE id = ?").bind(c.req.param("id")).run();
  return c.json({ success: true });
});
var accounts_default = app3;

// src/routes/deals.ts
var app4 = new Hono2();
app4.get("/", async (c) => {
  const orgId = getOrgId(c);
  const result = await c.env.DB.prepare("SELECT * FROM deals WHERE org_id = ? ORDER BY created_at DESC").bind(orgId).all();
  return c.json(result.results);
});
app4.get("/:id", async (c) => {
  const result = await c.env.DB.prepare("SELECT * FROM deals WHERE id = ?").bind(c.req.param("id")).first();
  if (!result)
    return c.json({ error: "Not found" }, 404);
  return c.json(result);
});
app4.post("/", async (c) => {
  const body = await c.req.json();
  const id = uuid();
  const ts = now();
  await c.env.DB.prepare(
    `INSERT INTO deals (id, org_id, name, amount, stage, close_date, account_id, account_name, contact_id, contact_name, owner_id, owner_name, probability, description, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, body.org_id, body.name, body.amount || 0, body.stage || "Prospecting", body.close_date || null, body.account_id || null, body.account_name || null, body.contact_id || null, body.contact_name || null, body.owner_id || null, body.owner_name || null, body.probability || 0, body.description || null, ts, ts).run();
  const record = await c.env.DB.prepare("SELECT * FROM deals WHERE id = ?").bind(id).first();
  return c.json(record, 201);
});
app4.put("/:id", async (c) => {
  const body = await c.req.json();
  const id = c.req.param("id");
  const ts = now();
  const { sql, values } = dynamicUpdate(body, id, ts);
  await c.env.DB.prepare(`UPDATE deals SET ${sql} WHERE id = ?`).bind(...values).run();
  const record = await c.env.DB.prepare("SELECT * FROM deals WHERE id = ?").bind(id).first();
  return c.json(record);
});
app4.delete("/:id", async (c) => {
  await c.env.DB.prepare("DELETE FROM deals WHERE id = ?").bind(c.req.param("id")).run();
  return c.json({ success: true });
});
var deals_default = app4;

// src/routes/activities.ts
var app5 = new Hono2();
app5.get("/", async (c) => {
  const orgId = getOrgId(c);
  const contactId = c.req.query("contact_id");
  const accountId = c.req.query("account_id");
  const dealId = c.req.query("deal_id");
  let sql = "SELECT * FROM activities WHERE org_id = ?";
  const params = [orgId];
  if (contactId) {
    sql += " AND contact_id = ?";
    params.push(contactId);
  }
  if (accountId) {
    sql += " AND account_id = ?";
    params.push(accountId);
  }
  if (dealId) {
    sql += " AND deal_id = ?";
    params.push(dealId);
  }
  sql += " ORDER BY due_date ASC";
  const result = await c.env.DB.prepare(sql).bind(...params).all();
  return c.json(result.results);
});
app5.get("/:id", async (c) => {
  const result = await c.env.DB.prepare("SELECT * FROM activities WHERE id = ?").bind(c.req.param("id")).first();
  if (!result)
    return c.json({ error: "Not found" }, 404);
  return c.json(result);
});
app5.post("/", async (c) => {
  const body = await c.req.json();
  const id = uuid();
  const ts = now();
  await c.env.DB.prepare(
    `INSERT INTO activities (id, org_id, type, subject, description, status, due_date, contact_id, contact_name, account_id, account_name, deal_id, owner_id, owner_name, duration_minutes, completed_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, body.org_id, body.type, body.subject, body.description || null, body.status || "To Do", body.due_date || null, body.contact_id || null, body.contact_name || null, body.account_id || null, body.account_name || null, body.deal_id || null, body.owner_id || null, body.owner_name || null, body.duration_minutes || null, body.completed_at || null, ts, ts).run();
  const record = await c.env.DB.prepare("SELECT * FROM activities WHERE id = ?").bind(id).first();
  return c.json(record, 201);
});
app5.put("/:id", async (c) => {
  const body = await c.req.json();
  const id = c.req.param("id");
  const ts = now();
  const { sql, values } = dynamicUpdate(body, id, ts);
  await c.env.DB.prepare(`UPDATE activities SET ${sql} WHERE id = ?`).bind(...values).run();
  const record = await c.env.DB.prepare("SELECT * FROM activities WHERE id = ?").bind(id).first();
  return c.json(record);
});
app5.delete("/:id", async (c) => {
  await c.env.DB.prepare("DELETE FROM activities WHERE id = ?").bind(c.req.param("id")).run();
  return c.json({ success: true });
});
var activities_default = app5;

// src/routes/leads.ts
var app6 = new Hono2();
app6.get("/", async (c) => {
  const orgId = getOrgId(c);
  const userId = getUserId(c);
  const db = c.env.DB;
  const ownerId = c.req.query("owner_id");
  const shared = c.req.query("shared");
  const user = await db.prepare("SELECT * FROM users WHERE id = ? AND org_id = ?").bind(userId, orgId).first();
  const isAdmin = user?.role === "admin" || user?.is_admin === 1;
  let sql = "";
  const params = [];
  if (ownerId) {
    sql = "SELECT * FROM leads WHERE org_id = ? AND owner_id = ? ORDER BY created_at DESC";
    params.push(orgId, ownerId);
  } else if (isAdmin) {
    sql = "SELECT * FROM leads WHERE org_id = ? ORDER BY created_at DESC";
    params.push(orgId);
  } else if (userId) {
    sql = `SELECT DISTINCT l.* FROM leads l
           LEFT JOIN record_shares rs ON rs.record_type = 'lead' AND rs.record_id = l.id AND rs.shared_with_user_id = ?
           WHERE l.org_id = ? AND (l.owner_id = ? OR rs.id IS NOT NULL)
           ORDER BY l.created_at DESC`;
    params.push(userId, orgId, userId);
  } else {
    sql = "SELECT * FROM leads WHERE org_id = ? ORDER BY created_at DESC";
    params.push(orgId);
  }
  const result = await db.prepare(sql).bind(...params).all();
  return c.json(result.results);
});
app6.get("/:id", async (c) => {
  const result = await c.env.DB.prepare("SELECT * FROM leads WHERE id = ?").bind(c.req.param("id")).first();
  if (!result)
    return c.json({ error: "Not found" }, 404);
  return c.json(result);
});
app6.post("/", async (c) => {
  const body = await c.req.json();
  const id = uuid();
  const ts = now();
  await c.env.DB.prepare(
    `INSERT INTO leads (id, org_id, first_name, last_name, email, phone, company, title, status, source, rating, industry, description, owner_id, owner_name, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, body.org_id, body.first_name, body.last_name, body.email || null, body.phone || null, body.company || null, body.title || null, body.status || "New", body.source || null, body.rating || null, body.industry || null, body.description || null, body.owner_id || null, body.owner_name || null, ts, ts).run();
  const record = await c.env.DB.prepare("SELECT * FROM leads WHERE id = ?").bind(id).first();
  return c.json(record, 201);
});
app6.put("/:id", async (c) => {
  const body = await c.req.json();
  const id = c.req.param("id");
  const ts = now();
  const { sql, values } = dynamicUpdate(body, id, ts);
  await c.env.DB.prepare(`UPDATE leads SET ${sql} WHERE id = ?`).bind(...values).run();
  const record = await c.env.DB.prepare("SELECT * FROM leads WHERE id = ?").bind(id).first();
  return c.json(record);
});
app6.delete("/:id", async (c) => {
  const id = c.req.param("id");
  await c.env.DB.prepare("DELETE FROM record_shares WHERE record_type = 'lead' AND record_id = ?").bind(id).run();
  await c.env.DB.prepare("DELETE FROM leads WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});
app6.post("/:id/convert", async (c) => {
  const leadId = c.req.param("id");
  const lead = await c.env.DB.prepare("SELECT * FROM leads WHERE id = ?").bind(leadId).first();
  if (!lead)
    return c.json({ error: "Lead not found" }, 404);
  const contactId = uuid();
  const ts = now();
  await c.env.DB.prepare(
    `INSERT INTO contacts (id, org_id, first_name, last_name, email, phone, title, account_name, owner_id, owner_name, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(contactId, lead.org_id, lead.first_name, lead.last_name, lead.email, lead.phone, lead.title, lead.company, lead.owner_id, lead.owner_name, ts, ts).run();
  await c.env.DB.prepare("DELETE FROM leads WHERE id = ?").bind(leadId).run();
  const contact = await c.env.DB.prepare("SELECT * FROM contacts WHERE id = ?").bind(contactId).first();
  return c.json(contact, 201);
});
var leads_default = app6;

// src/routes/cases.ts
var app7 = new Hono2();
app7.get("/", async (c) => {
  const orgId = getOrgId(c);
  const result = await c.env.DB.prepare("SELECT * FROM cases WHERE org_id = ? ORDER BY created_at DESC").bind(orgId).all();
  return c.json(result.results);
});
app7.get("/:id", async (c) => {
  const result = await c.env.DB.prepare("SELECT * FROM cases WHERE id = ?").bind(c.req.param("id")).first();
  if (!result)
    return c.json({ error: "Not found" }, 404);
  return c.json(result);
});
app7.post("/", async (c) => {
  const body = await c.req.json();
  const id = uuid();
  const ts = now();
  await c.env.DB.prepare(
    `INSERT INTO cases (id, org_id, subject, description, status, priority, contact_id, contact_name, account_id, account_name, owner_id, owner_name, resolution, closed_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, body.org_id, body.subject, body.description || null, body.status || "New", body.priority || "Medium", body.contact_id || null, body.contact_name || null, body.account_id || null, body.account_name || null, body.owner_id || null, body.owner_name || null, body.resolution || null, body.closed_at || null, ts, ts).run();
  const record = await c.env.DB.prepare("SELECT * FROM cases WHERE id = ?").bind(id).first();
  return c.json(record, 201);
});
app7.put("/:id", async (c) => {
  const body = await c.req.json();
  const id = c.req.param("id");
  const ts = now();
  const { sql, values } = dynamicUpdate(body, id, ts);
  await c.env.DB.prepare(`UPDATE cases SET ${sql} WHERE id = ?`).bind(...values).run();
  const record = await c.env.DB.prepare("SELECT * FROM cases WHERE id = ?").bind(id).first();
  return c.json(record);
});
app7.delete("/:id", async (c) => {
  await c.env.DB.prepare("DELETE FROM cases WHERE id = ?").bind(c.req.param("id")).run();
  return c.json({ success: true });
});
var cases_default = app7;

// src/routes/vendors.ts
var app8 = new Hono2();
app8.get("/", async (c) => {
  const orgId = getOrgId(c);
  const userId = getUserId(c);
  const db = c.env.DB;
  const ownerId = c.req.query("owner_id");
  const user = await db.prepare("SELECT * FROM users WHERE id = ? AND org_id = ?").bind(userId, orgId).first();
  const isAdmin = user?.role === "admin" || user?.is_admin === 1;
  let sql = "";
  const params = [];
  if (ownerId) {
    sql = "SELECT * FROM vendors WHERE org_id = ? AND owner_id = ? ORDER BY created_at DESC";
    params.push(orgId, ownerId);
  } else if (isAdmin) {
    sql = "SELECT * FROM vendors WHERE org_id = ? ORDER BY created_at DESC";
    params.push(orgId);
  } else if (userId) {
    sql = `SELECT DISTINCT v.* FROM vendors v
           LEFT JOIN record_shares rs ON rs.record_type = 'vendor' AND rs.record_id = v.id AND rs.shared_with_user_id = ?
           WHERE v.org_id = ? AND (v.owner_id = ? OR rs.id IS NOT NULL)
           ORDER BY v.created_at DESC`;
    params.push(userId, orgId, userId);
  } else {
    sql = "SELECT * FROM vendors WHERE org_id = ? ORDER BY created_at DESC";
    params.push(orgId);
  }
  const result = await db.prepare(sql).bind(...params).all();
  return c.json(result.results);
});
app8.get("/:id", async (c) => {
  const result = await c.env.DB.prepare("SELECT * FROM vendors WHERE id = ?").bind(c.req.param("id")).first();
  if (!result)
    return c.json({ error: "Not found" }, 404);
  return c.json(result);
});
app8.post("/", async (c) => {
  const body = await c.req.json();
  const id = uuid();
  const ts = now();
  await c.env.DB.prepare(
    `INSERT INTO vendors (id, org_id, name, contact, email, phone, category, status, owner_id, owner_name, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, body.org_id, body.name, body.contact || null, body.email || null, body.phone || null, body.category || null, body.status || "Pending", body.owner_id || null, body.owner_name || null, ts).run();
  const record = await c.env.DB.prepare("SELECT * FROM vendors WHERE id = ?").bind(id).first();
  return c.json(record, 201);
});
app8.put("/:id", async (c) => {
  const body = await c.req.json();
  const id = c.req.param("id");
  const fields = [];
  const values = [];
  for (const [key, val] of Object.entries(body)) {
    if (key === "id" || key === "org_id")
      continue;
    fields.push(`${key} = ?`);
    values.push(val);
  }
  values.push(id);
  await c.env.DB.prepare(`UPDATE vendors SET ${fields.join(", ")} WHERE id = ?`).bind(...values).run();
  const record = await c.env.DB.prepare("SELECT * FROM vendors WHERE id = ?").bind(id).first();
  return c.json(record);
});
app8.delete("/:id", async (c) => {
  const id = c.req.param("id");
  await c.env.DB.prepare("DELETE FROM record_shares WHERE record_type = 'vendor' AND record_id = ?").bind(id).run();
  await c.env.DB.prepare("DELETE FROM vendors WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});
var vendors_default = app8;

// src/routes/clients.ts
var app9 = new Hono2();
app9.get("/", async (c) => {
  const orgId = getOrgId(c);
  const userId = getUserId(c);
  const db = c.env.DB;
  const ownerId = c.req.query("owner_id");
  const user = await db.prepare("SELECT * FROM users WHERE id = ? AND org_id = ?").bind(userId, orgId).first();
  const isAdmin = user?.role === "admin" || user?.is_admin === 1;
  let sql = "";
  const params = [];
  if (ownerId) {
    sql = "SELECT * FROM clients WHERE org_id = ? AND owner_id = ? ORDER BY created_at DESC";
    params.push(orgId, ownerId);
  } else if (isAdmin) {
    sql = "SELECT * FROM clients WHERE org_id = ? ORDER BY created_at DESC";
    params.push(orgId);
  } else if (userId) {
    sql = `SELECT DISTINCT cl.* FROM clients cl
           LEFT JOIN record_shares rs ON rs.record_type = 'client' AND rs.record_id = cl.id AND rs.shared_with_user_id = ?
           WHERE cl.org_id = ? AND (cl.owner_id = ? OR rs.id IS NOT NULL)
           ORDER BY cl.created_at DESC`;
    params.push(userId, orgId, userId);
  } else {
    sql = "SELECT * FROM clients WHERE org_id = ? ORDER BY created_at DESC";
    params.push(orgId);
  }
  const result = await db.prepare(sql).bind(...params).all();
  return c.json(result.results);
});
app9.get("/:id", async (c) => {
  const result = await c.env.DB.prepare("SELECT * FROM clients WHERE id = ?").bind(c.req.param("id")).first();
  if (!result)
    return c.json({ error: "Not found" }, 404);
  return c.json(result);
});
app9.post("/", async (c) => {
  const body = await c.req.json();
  const id = uuid();
  const ts = now();
  await c.env.DB.prepare(
    `INSERT INTO clients (id, org_id, name, industry, contact, contract_value, start_date, status, owner_id, owner_name, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, body.org_id, body.name, body.industry || null, body.contact || null, body.contract_value || 0, body.start_date || null, body.status || "Active", body.owner_id || null, body.owner_name || null, ts).run();
  const record = await c.env.DB.prepare("SELECT * FROM clients WHERE id = ?").bind(id).first();
  return c.json(record, 201);
});
app9.put("/:id", async (c) => {
  const body = await c.req.json();
  const id = c.req.param("id");
  const fields = [];
  const values = [];
  for (const [key, val] of Object.entries(body)) {
    if (key === "id" || key === "org_id")
      continue;
    fields.push(`${key} = ?`);
    values.push(val);
  }
  values.push(id);
  await c.env.DB.prepare(`UPDATE clients SET ${fields.join(", ")} WHERE id = ?`).bind(...values).run();
  const record = await c.env.DB.prepare("SELECT * FROM clients WHERE id = ?").bind(id).first();
  return c.json(record);
});
app9.delete("/:id", async (c) => {
  const id = c.req.param("id");
  await c.env.DB.prepare("DELETE FROM record_shares WHERE record_type = 'client' AND record_id = ?").bind(id).run();
  await c.env.DB.prepare("DELETE FROM clients WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});
var clients_default = app9;

// src/routes/products.ts
var app10 = new Hono2();
app10.get("/", async (c) => {
  const orgId = getOrgId(c);
  const result = await c.env.DB.prepare("SELECT * FROM products WHERE org_id = ? ORDER BY created_at DESC").bind(orgId).all();
  return c.json(result.results.map((r) => ({
    ...r,
    pricing_tiers: r.pricing_tiers ? JSON.parse(r.pricing_tiers) : null,
    is_active: r.is_active === 1
  })));
});
app10.get("/:id", async (c) => {
  const result = await c.env.DB.prepare("SELECT * FROM products WHERE id = ?").bind(c.req.param("id")).first();
  if (!result)
    return c.json({ error: "Not found" }, 404);
  return c.json({
    ...result,
    pricing_tiers: result.pricing_tiers ? JSON.parse(result.pricing_tiers) : null,
    is_active: result.is_active === 1
  });
});
app10.post("/", async (c) => {
  const body = await c.req.json();
  const id = uuid();
  const ts = now();
  await c.env.DB.prepare(
    `INSERT INTO products (id, org_id, name, code, description, price, family, is_active, pricing_tiers, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, body.org_id, body.name, body.code || null, body.description || null, body.price || 0, body.family || null, body.is_active !== void 0 ? body.is_active ? 1 : 0 : 1, body.pricing_tiers ? JSON.stringify(body.pricing_tiers) : null, ts).run();
  const record = await c.env.DB.prepare("SELECT * FROM products WHERE id = ?").bind(id).first();
  return c.json({ ...record, pricing_tiers: record.pricing_tiers ? JSON.parse(record.pricing_tiers) : null, is_active: record.is_active === 1 }, 201);
});
app10.put("/:id", async (c) => {
  const body = await c.req.json();
  const id = c.req.param("id");
  const fields = [];
  const values = [];
  for (const [key, val] of Object.entries(body)) {
    if (key === "id" || key === "org_id")
      continue;
    if (key === "pricing_tiers") {
      fields.push("pricing_tiers = ?");
      values.push(JSON.stringify(val));
    } else if (key === "is_active") {
      fields.push("is_active = ?");
      values.push(val ? 1 : 0);
    } else {
      fields.push(`${key} = ?`);
      values.push(val);
    }
  }
  values.push(id);
  await c.env.DB.prepare(`UPDATE products SET ${fields.join(", ")} WHERE id = ?`).bind(...values).run();
  const record = await c.env.DB.prepare("SELECT * FROM products WHERE id = ?").bind(id).first();
  return c.json({ ...record, pricing_tiers: record.pricing_tiers ? JSON.parse(record.pricing_tiers) : null, is_active: record.is_active === 1 });
});
app10.delete("/:id", async (c) => {
  await c.env.DB.prepare("DELETE FROM products WHERE id = ?").bind(c.req.param("id")).run();
  return c.json({ success: true });
});
var products_default = app10;

// src/routes/marketing.ts
var app11 = new Hono2();
app11.get("/posts", async (c) => {
  const orgId = getOrgId(c);
  const result = await c.env.DB.prepare("SELECT * FROM marketing_posts WHERE org_id = ? ORDER BY scheduled_at ASC").bind(orgId).all();
  return c.json(result.results);
});
app11.get("/posts/:id", async (c) => {
  const result = await c.env.DB.prepare("SELECT * FROM marketing_posts WHERE id = ?").bind(c.req.param("id")).first();
  if (!result)
    return c.json({ error: "Not found" }, 404);
  return c.json(result);
});
app11.post("/posts", async (c) => {
  const body = await c.req.json();
  const id = uuid();
  const ts = now();
  await c.env.DB.prepare(
    `INSERT INTO marketing_posts (id, org_id, platform, text, scheduled_at, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, body.org_id, body.platform, body.text, body.scheduled_at || null, body.status || "Draft", ts).run();
  const record = await c.env.DB.prepare("SELECT * FROM marketing_posts WHERE id = ?").bind(id).first();
  return c.json(record, 201);
});
app11.put("/posts/:id", async (c) => {
  const body = await c.req.json();
  const id = c.req.param("id");
  const fields = [];
  const values = [];
  for (const [key, val] of Object.entries(body)) {
    if (key === "id" || key === "org_id")
      continue;
    fields.push(`${key} = ?`);
    values.push(val);
  }
  values.push(id);
  await c.env.DB.prepare(`UPDATE marketing_posts SET ${fields.join(", ")} WHERE id = ?`).bind(...values).run();
  const record = await c.env.DB.prepare("SELECT * FROM marketing_posts WHERE id = ?").bind(id).first();
  return c.json(record);
});
app11.delete("/posts/:id", async (c) => {
  await c.env.DB.prepare("DELETE FROM marketing_posts WHERE id = ?").bind(c.req.param("id")).run();
  return c.json({ success: true });
});
app11.get("/campaigns", async (c) => {
  const orgId = getOrgId(c);
  const result = await c.env.DB.prepare("SELECT * FROM campaigns WHERE org_id = ? ORDER BY created_at DESC").bind(orgId).all();
  return c.json(result.results);
});
app11.get("/campaigns/:id", async (c) => {
  const result = await c.env.DB.prepare("SELECT * FROM campaigns WHERE id = ?").bind(c.req.param("id")).first();
  if (!result)
    return c.json({ error: "Not found" }, 404);
  return c.json(result);
});
app11.post("/campaigns", async (c) => {
  const body = await c.req.json();
  const id = uuid();
  const ts = now();
  await c.env.DB.prepare(
    `INSERT INTO campaigns (id, org_id, name, status, type, start_date, end_date, budget, actual_cost, responses, description, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, body.org_id, body.name, body.status || "Planned", body.type || null, body.start_date || null, body.end_date || null, body.budget || 0, body.actual_cost || null, body.responses || 0, body.description || null, ts).run();
  const record = await c.env.DB.prepare("SELECT * FROM campaigns WHERE id = ?").bind(id).first();
  return c.json(record, 201);
});
app11.put("/campaigns/:id", async (c) => {
  const body = await c.req.json();
  const id = c.req.param("id");
  const fields = [];
  const values = [];
  for (const [key, val] of Object.entries(body)) {
    if (key === "id" || key === "org_id")
      continue;
    fields.push(`${key} = ?`);
    values.push(val);
  }
  values.push(id);
  await c.env.DB.prepare(`UPDATE campaigns SET ${fields.join(", ")} WHERE id = ?`).bind(...values).run();
  const record = await c.env.DB.prepare("SELECT * FROM campaigns WHERE id = ?").bind(id).first();
  return c.json(record);
});
app11.delete("/campaigns/:id", async (c) => {
  await c.env.DB.prepare("DELETE FROM campaigns WHERE id = ?").bind(c.req.param("id")).run();
  return c.json({ success: true });
});
var marketing_default = app11;

// src/routes/tags.ts
var app12 = new Hono2();
app12.get("/", async (c) => {
  const orgId = getOrgId(c);
  const result = await c.env.DB.prepare("SELECT * FROM tags WHERE org_id = ? ORDER BY name ASC").bind(orgId).all();
  return c.json(result.results);
});
app12.get("/:id", async (c) => {
  const result = await c.env.DB.prepare("SELECT * FROM tags WHERE id = ?").bind(c.req.param("id")).first();
  if (!result)
    return c.json({ error: "Not found" }, 404);
  return c.json(result);
});
app12.post("/", async (c) => {
  const body = await c.req.json();
  const id = uuid();
  await c.env.DB.prepare(
    "INSERT INTO tags (id, org_id, name, color) VALUES (?, ?, ?, ?)"
  ).bind(id, body.org_id, body.name, body.color || "#2D7FF9").run();
  const record = await c.env.DB.prepare("SELECT * FROM tags WHERE id = ?").bind(id).first();
  return c.json(record, 201);
});
app12.put("/:id", async (c) => {
  const body = await c.req.json();
  const id = c.req.param("id");
  const fields = [];
  const values = [];
  for (const [key, val] of Object.entries(body)) {
    if (key === "id" || key === "org_id")
      continue;
    fields.push(`${key} = ?`);
    values.push(val);
  }
  values.push(id);
  await c.env.DB.prepare(`UPDATE tags SET ${fields.join(", ")} WHERE id = ?`).bind(...values).run();
  const record = await c.env.DB.prepare("SELECT * FROM tags WHERE id = ?").bind(id).first();
  return c.json(record);
});
app12.delete("/:id", async (c) => {
  await c.env.DB.prepare("DELETE FROM record_tags WHERE tag_id = ?").bind(c.req.param("id")).run();
  await c.env.DB.prepare("DELETE FROM tags WHERE id = ?").bind(c.req.param("id")).run();
  return c.json({ success: true });
});
app12.get("/records/:recordType/:recordId", async (c) => {
  const { recordType, recordId } = c.req.param();
  const result = await c.env.DB.prepare(
    "SELECT t.* FROM tags t INNER JOIN record_tags rt ON t.id = rt.tag_id WHERE rt.record_type = ? AND rt.record_id = ?"
  ).bind(recordType, recordId).all();
  return c.json(result.results);
});
app12.post("/records/:recordType/:recordId/:tagId", async (c) => {
  const { recordType, recordId, tagId } = c.req.param();
  await c.env.DB.prepare(
    "INSERT OR IGNORE INTO record_tags (tag_id, record_type, record_id) VALUES (?, ?, ?)"
  ).bind(tagId, recordType, recordId).run();
  return c.json({ success: true }, 201);
});
app12.delete("/records/:recordType/:recordId/:tagId", async (c) => {
  const { recordType, recordId, tagId } = c.req.param();
  await c.env.DB.prepare(
    "DELETE FROM record_tags WHERE tag_id = ? AND record_type = ? AND record_id = ?"
  ).bind(tagId, recordType, recordId).run();
  return c.json({ success: true });
});
var tags_default = app12;

// src/routes/dialer.ts
var app13 = new Hono2();
app13.get("/scripts", async (c) => {
  const orgId = getOrgId(c);
  const result = await c.env.DB.prepare("SELECT * FROM call_scripts WHERE org_id = ? ORDER BY created_at DESC").bind(orgId).all();
  return c.json(result.results.map((r) => ({ ...r, blocks: JSON.parse(r.blocks || "[]") })));
});
app13.get("/scripts/:id", async (c) => {
  const result = await c.env.DB.prepare("SELECT * FROM call_scripts WHERE id = ?").bind(c.req.param("id")).first();
  if (!result)
    return c.json({ error: "Not found" }, 404);
  return c.json({ ...result, blocks: JSON.parse(result.blocks || "[]") });
});
app13.post("/scripts", async (c) => {
  const body = await c.req.json();
  const id = uuid();
  const ts = now();
  await c.env.DB.prepare(
    "INSERT INTO call_scripts (id, org_id, name, description, blocks, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).bind(id, body.org_id, body.name, body.description || null, JSON.stringify(body.blocks || []), ts, ts).run();
  const record = await c.env.DB.prepare("SELECT * FROM call_scripts WHERE id = ?").bind(id).first();
  return c.json({ ...record, blocks: JSON.parse(record.blocks || "[]") }, 201);
});
app13.put("/scripts/:id", async (c) => {
  const body = await c.req.json();
  const id = c.req.param("id");
  const ts = now();
  const fields = [];
  const values = [];
  for (const [key, val] of Object.entries(body)) {
    if (key === "id" || key === "org_id")
      continue;
    if (key === "blocks") {
      fields.push("blocks = ?");
      values.push(JSON.stringify(val));
    } else {
      fields.push(`${key} = ?`);
      values.push(val);
    }
  }
  fields.push("updated_at = ?");
  values.push(ts);
  values.push(id);
  await c.env.DB.prepare(`UPDATE call_scripts SET ${fields.join(", ")} WHERE id = ?`).bind(...values).run();
  const record = await c.env.DB.prepare("SELECT * FROM call_scripts WHERE id = ?").bind(id).first();
  return c.json({ ...record, blocks: JSON.parse(record.blocks || "[]") });
});
app13.delete("/scripts/:id", async (c) => {
  await c.env.DB.prepare("DELETE FROM call_scripts WHERE id = ?").bind(c.req.param("id")).run();
  return c.json({ success: true });
});
app13.get("/records", async (c) => {
  const orgId = getOrgId(c);
  const result = await c.env.DB.prepare("SELECT * FROM call_records WHERE org_id = ? ORDER BY created_at DESC").bind(orgId).all();
  return c.json(result.results);
});
app13.post("/records", async (c) => {
  const body = await c.req.json();
  const id = uuid();
  const ts = now();
  await c.env.DB.prepare(
    "INSERT INTO call_records (id, org_id, contact_id, contact_name, disposition, duration, notes, script_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(id, body.org_id, body.contact_id || null, body.contact_name || null, body.disposition || null, body.duration || 0, body.notes || null, body.script_id || null, ts).run();
  const record = await c.env.DB.prepare("SELECT * FROM call_records WHERE id = ?").bind(id).first();
  return c.json(record, 201);
});
var dialer_default = app13;

// src/routes/reports.ts
var app14 = new Hono2();
app14.get("/dashboard", async (c) => {
  const orgId = getOrgId(c);
  const db = c.env.DB;
  const deals = (await db.prepare("SELECT * FROM deals WHERE org_id = ?").bind(orgId).all()).results;
  const leads = (await db.prepare("SELECT * FROM leads WHERE org_id = ?").bind(orgId).all()).results;
  const activities = (await db.prepare("SELECT * FROM activities WHERE org_id = ?").bind(orgId).all()).results;
  const stages = ["Prospecting", "Qualification", "Proposal", "Negotiation", "Closed Won", "Closed Lost"];
  const pipelineByStage = stages.map((stage) => ({
    stage,
    value: deals.filter((d) => d.stage === stage).reduce((sum, d) => sum + (d.amount || 0), 0),
    count: deals.filter((d) => d.stage === stage).length
  }));
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const revenueOverTime = months.map((month, i) => {
    const won = deals.filter((d) => {
      if (d.stage !== "Closed Won" || !d.close_date)
        return false;
      return new Date(d.close_date).getMonth() === i;
    });
    return { month, revenue: won.reduce((sum, d) => sum + (d.amount || 0), 0) };
  });
  const sourceMap = {};
  leads.forEach((l) => {
    if (l.source)
      sourceMap[l.source] = (sourceMap[l.source] || 0) + 1;
  });
  const leadSources = Object.entries(sourceMap).map(([name, value]) => ({ name, value }));
  const closedDeals = deals.filter((d) => d.stage === "Closed Won" || d.stage === "Closed Lost");
  const wonDeals = closedDeals.filter((d) => d.stage === "Closed Won");
  const winRate = closedDeals.length > 0 ? Math.round(wonDeals.length / closedDeals.length * 100) : 0;
  const totalPipeline = deals.filter((d) => !d.stage.startsWith("Closed")).reduce((s, d) => s + (d.amount || 0), 0);
  const owners = [...new Set(deals.map((d) => d.owner_name).filter(Boolean))];
  const openDeals = deals.filter((d) => !d.stage.startsWith("Closed")).length;
  const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const tasksDue = activities.filter((a) => a.status !== "Done" && a.due_date && a.due_date <= todayStr).length;
  const meetingsToday = activities.filter((a) => a.type === "meeting" && a.due_date === todayStr).length;
  return c.json({
    pipelineByStage,
    revenueOverTime,
    leadSources,
    winRate,
    totalPipeline,
    owners,
    openDeals,
    tasksDue,
    meetingsToday
  });
});
var reports_default = app14;

// src/routes/settings.ts
var app15 = new Hono2();
app15.get("/integrations", async (c) => {
  const orgId = getOrgId(c);
  const result = await c.env.DB.prepare("SELECT * FROM integrations WHERE org_id = ?").bind(orgId).all();
  return c.json(result.results.map((r) => ({ ...r, enabled: r.enabled === 1 })));
});
app15.put("/integrations/:id", async (c) => {
  const body = await c.req.json();
  const id = c.req.param("id");
  await c.env.DB.prepare("UPDATE integrations SET enabled = ? WHERE id = ?").bind(body.enabled ? 1 : 0, id).run();
  const record = await c.env.DB.prepare("SELECT * FROM integrations WHERE id = ?").bind(id).first();
  return c.json({ ...record, enabled: record.enabled === 1 });
});
app15.get("/org", async (c) => {
  const orgId = getOrgId(c);
  const result = await c.env.DB.prepare("SELECT * FROM organizations WHERE id = ?").bind(orgId).first();
  if (!result)
    return c.json({ error: "Not found" }, 404);
  return c.json(result);
});
app15.put("/org", async (c) => {
  const orgId = getOrgId(c);
  const body = await c.req.json();
  const fields = [];
  const values = [];
  for (const [key, val] of Object.entries(body)) {
    if (key === "id")
      continue;
    fields.push(`${key} = ?`);
    values.push(val);
  }
  values.push(orgId);
  await c.env.DB.prepare(`UPDATE organizations SET ${fields.join(", ")} WHERE id = ?`).bind(...values).run();
  const record = await c.env.DB.prepare("SELECT * FROM organizations WHERE id = ?").bind(orgId).first();
  return c.json(record);
});
app15.get("/users", async (c) => {
  const orgId = getOrgId(c);
  const result = await c.env.DB.prepare("SELECT * FROM users WHERE org_id = ? ORDER BY name ASC").bind(orgId).all();
  return c.json(result.results);
});
var settings_default = app15;

// src/routes/calendar.ts
var app16 = new Hono2();
app16.get("/events", async (c) => {
  const orgId = getOrgId(c);
  const start = c.req.query("start");
  const end = c.req.query("end");
  let sql = "SELECT * FROM activities WHERE org_id = ? AND due_date IS NOT NULL";
  const params = [orgId];
  if (start) {
    sql += " AND due_date >= ?";
    params.push(start);
  }
  if (end) {
    sql += " AND due_date <= ?";
    params.push(end);
  }
  sql += " ORDER BY due_date ASC";
  const result = await c.env.DB.prepare(sql).bind(...params).all();
  return c.json(result.results);
});
var calendar_default = app16;

// src/routes/seed.ts
var app17 = new Hono2();
app17.post("/", async (c) => {
  const db = c.env.DB;
  const schemaStatements = [
    `CREATE TABLE IF NOT EXISTS organizations (id TEXT PRIMARY KEY, name TEXT NOT NULL, logo_url TEXT, timezone TEXT DEFAULT 'America/New_York', created_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, org_id TEXT NOT NULL, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL, role TEXT DEFAULT 'rep', avatar_url TEXT, provider TEXT, provider_id TEXT, is_admin INTEGER DEFAULT 0, manager_id TEXT, title TEXT, department TEXT, is_active INTEGER DEFAULT 1, last_login TEXT, created_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS contacts (id TEXT PRIMARY KEY, org_id TEXT NOT NULL, first_name TEXT NOT NULL, last_name TEXT NOT NULL, email TEXT, phone TEXT, mobile TEXT, title TEXT, department TEXT, account_id TEXT, account_name TEXT, owner_id TEXT, owner_name TEXT, description TEXT, mailing_address TEXT, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS accounts (id TEXT PRIMARY KEY, org_id TEXT NOT NULL, name TEXT NOT NULL, industry TEXT, type TEXT, phone TEXT, website TEXT, billing_address TEXT, description TEXT, employees INTEGER, annual_revenue REAL, owner_id TEXT, owner_name TEXT, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS deals (id TEXT PRIMARY KEY, org_id TEXT NOT NULL, name TEXT NOT NULL, amount REAL DEFAULT 0, stage TEXT DEFAULT 'Prospecting', close_date TEXT, account_id TEXT, account_name TEXT, contact_id TEXT, contact_name TEXT, owner_id TEXT, owner_name TEXT, probability INTEGER DEFAULT 0, description TEXT, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS activities (id TEXT PRIMARY KEY, org_id TEXT NOT NULL, type TEXT NOT NULL, subject TEXT NOT NULL, description TEXT, status TEXT DEFAULT 'To Do', due_date TEXT, contact_id TEXT, contact_name TEXT, account_id TEXT, account_name TEXT, deal_id TEXT, owner_id TEXT, owner_name TEXT, duration_minutes INTEGER, completed_at TEXT, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS leads (id TEXT PRIMARY KEY, org_id TEXT NOT NULL, first_name TEXT NOT NULL, last_name TEXT NOT NULL, email TEXT, phone TEXT, company TEXT, title TEXT, status TEXT DEFAULT 'New', source TEXT, rating TEXT, industry TEXT, description TEXT, owner_id TEXT, owner_name TEXT, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS cases (id TEXT PRIMARY KEY, org_id TEXT NOT NULL, subject TEXT NOT NULL, description TEXT, status TEXT DEFAULT 'New', priority TEXT DEFAULT 'Medium', contact_id TEXT, contact_name TEXT, account_id TEXT, account_name TEXT, owner_id TEXT, owner_name TEXT, resolution TEXT, closed_at TEXT, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS call_scripts (id TEXT PRIMARY KEY, org_id TEXT NOT NULL, name TEXT NOT NULL, description TEXT, blocks TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS call_records (id TEXT PRIMARY KEY, org_id TEXT NOT NULL, contact_id TEXT, contact_name TEXT, disposition TEXT, duration INTEGER DEFAULT 0, notes TEXT, script_id TEXT, created_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS campaigns (id TEXT PRIMARY KEY, org_id TEXT NOT NULL, name TEXT NOT NULL, status TEXT DEFAULT 'Planned', type TEXT, start_date TEXT, end_date TEXT, budget REAL DEFAULT 0, actual_cost REAL, responses INTEGER DEFAULT 0, description TEXT, created_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, org_id TEXT NOT NULL, name TEXT NOT NULL, code TEXT, description TEXT, price REAL DEFAULT 0, family TEXT, is_active INTEGER DEFAULT 1, pricing_tiers TEXT, created_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS integrations (id TEXT PRIMARY KEY, org_id TEXT NOT NULL, name TEXT NOT NULL, type TEXT, enabled INTEGER DEFAULT 0)`,
    `CREATE TABLE IF NOT EXISTS marketing_posts (id TEXT PRIMARY KEY, org_id TEXT NOT NULL, platform TEXT NOT NULL, text TEXT NOT NULL, scheduled_at TEXT, status TEXT DEFAULT 'Draft', created_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS vendors (id TEXT PRIMARY KEY, org_id TEXT NOT NULL, name TEXT NOT NULL, contact TEXT, email TEXT, phone TEXT, category TEXT, status TEXT DEFAULT 'Pending', owner_id TEXT, owner_name TEXT, created_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS clients (id TEXT PRIMARY KEY, org_id TEXT NOT NULL, name TEXT NOT NULL, industry TEXT, contact TEXT, contract_value REAL DEFAULT 0, start_date TEXT, status TEXT DEFAULT 'Active', owner_id TEXT, owner_name TEXT, created_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS tags (id TEXT PRIMARY KEY, name TEXT NOT NULL, color TEXT DEFAULT '#2D7FF9', org_id TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS record_tags (tag_id TEXT NOT NULL, record_type TEXT NOT NULL, record_id TEXT NOT NULL, PRIMARY KEY (tag_id, record_type, record_id))`,
    // V2 tables
    `CREATE TABLE IF NOT EXISTS org_domains (domain TEXT PRIMARY KEY, org_id TEXT NOT NULL, verified INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS record_transfers (id TEXT PRIMARY KEY, record_type TEXT NOT NULL, record_id TEXT NOT NULL, from_user_id TEXT, to_user_id TEXT NOT NULL, transferred_by TEXT NOT NULL, reason TEXT, org_id TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS record_shares (id TEXT PRIMARY KEY, record_type TEXT NOT NULL, record_id TEXT NOT NULL, shared_with_user_id TEXT NOT NULL, permission TEXT DEFAULT 'view', shared_by TEXT NOT NULL, org_id TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now')), UNIQUE(record_type, record_id, shared_with_user_id))`
  ];
  for (const sql of schemaStatements) {
    await db.prepare(sql).run();
  }
  const orgs = [
    { id: "org-1", name: "Acme Corp", timezone: "America/New_York" },
    { id: "org-2", name: "TechStart Inc", timezone: "America/Los_Angeles" },
    { id: "org-3", name: "Global Finance", timezone: "Europe/London" }
  ];
  for (const o of orgs) {
    await db.prepare("INSERT OR IGNORE INTO organizations (id, name, timezone) VALUES (?, ?, ?)").bind(o.id, o.name, o.timezone).run();
  }
  const users = [
    { id: "1", name: "Maxwell Seefeld", email: "seefeldmaxwell1@gmail.com", role: "admin", orgId: "org-1", title: "CEO", department: "Executive", managerId: null },
    { id: "2", name: "Sarah Chen", email: "sarah@y12.ai", role: "admin", orgId: "org-1", title: "VP Sales", department: "Sales", managerId: "1" },
    { id: "3", name: "Mike Johnson", email: "mike@y12.ai", role: "member", orgId: "org-1", title: "Sales Rep", department: "Sales", managerId: "2" },
    { id: "4", name: "Emily Davis", email: "emily@y12.ai", role: "member", orgId: "org-1", title: "Marketing Lead", department: "Marketing", managerId: "1" },
    { id: "5", name: "Alex Kim", email: "alex@axia.crm", role: "admin", orgId: "org-2", title: "CEO", department: "Executive", managerId: null },
    { id: "6", name: "Lisa Park", email: "lisa@axia.crm", role: "member", orgId: "org-2", title: "Sales Rep", department: "Sales", managerId: "5" },
    { id: "7", name: "James Wilson", email: "james@axia.crm", role: "admin", orgId: "org-3", title: "Managing Director", department: "Executive", managerId: null },
    { id: "8", name: "Rachel Brown", email: "rachel@axia.crm", role: "member", orgId: "org-3", title: "Analyst", department: "Investments", managerId: "7" }
  ];
  for (const u of users) {
    await db.prepare("INSERT OR IGNORE INTO users (id, org_id, email, name, role, is_admin, title, department, manager_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(u.id, u.orgId, u.email, u.name, u.role, u.role === "admin" ? 1 : 0, u.title, u.department, u.managerId).run();
  }
  const domains = [
    { domain: "axia.crm", orgId: "org-1", verified: 1 },
    { domain: "y12.ai", orgId: "org-1", verified: 1 },
    { domain: "gmail.com", orgId: "org-1", verified: 1 }
  ];
  for (const d of domains) {
    await db.prepare("INSERT OR IGNORE INTO org_domains (domain, org_id, verified) VALUES (?, ?, ?)").bind(d.domain, d.orgId, d.verified).run();
  }
  const accounts = [
    { id: "a1", name: "Globex Corporation", industry: "Technology", type: "Customer", phone: "(555) 100-1000", website: "globex.com", billingAddress: "123 Main St, Springfield, IL 62701", description: "Major tech enterprise, 5000+ employees", employees: 5200, annualRevenue: 85e7, ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1" },
    { id: "a2", name: "Initech", industry: "Software", type: "Customer", phone: "(555) 200-2000", website: "initech.com", billingAddress: "456 Oak Ave, Austin, TX 73301", description: "Mid-market software company", employees: 1200, annualRevenue: 28e7, ownerId: "2", ownerName: "Sarah Chen", orgId: "org-1" },
    { id: "a3", name: "Umbrella Corp", industry: "Pharmaceutical", type: "Prospect", phone: "(555) 300-3000", website: "umbrella.com", billingAddress: "789 Pine Rd, Raccoon City, OH 44101", description: "Large pharmaceutical conglomerate", employees: 12e3, annualRevenue: 32e8, ownerId: "3", ownerName: "Mike Johnson", orgId: "org-1" },
    { id: "a4", name: "Stark Industries", industry: "Manufacturing", type: "Customer", phone: "(555) 400-4000", website: "starkindustries.com", billingAddress: "1 Stark Tower, New York, NY 10001", description: "Leading manufacturer", employees: 45e3, annualRevenue: 12e9, ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1" },
    { id: "a5", name: "Wayne Enterprises", industry: "Conglomerate", type: "Customer", phone: "(555) 500-5000", website: "wayneenterprises.com", billingAddress: "1007 Mountain Dr, Gotham, NJ 07001", description: "Multi-industry conglomerate", employees: 32e3, annualRevenue: 75e8, ownerId: "2", ownerName: "Sarah Chen", orgId: "org-1" },
    { id: "a6", name: "Acme Solutions", industry: "Consulting", type: "Partner", phone: "(555) 600-6000", website: "acmesolutions.com", billingAddress: "321 Elm St, San Francisco, CA 94102", description: "Boutique consulting firm", employees: 450, annualRevenue: 85e6, ownerId: "3", ownerName: "Mike Johnson", orgId: "org-1" },
    { id: "a7", name: "Cyberdyne Systems", industry: "Technology", type: "Prospect", phone: "(555) 700-7000", website: "cyberdyne.com", billingAddress: "18144 El Camino Real, Sunnyvale, CA 94087", description: "AI and robotics research", employees: 800, annualRevenue: 12e7, ownerId: "4", ownerName: "Emily Davis", orgId: "org-1" },
    { id: "a8", name: "Soylent Corp", industry: "Food & Beverage", type: "Customer", phone: "(555) 800-8000", website: "soylentcorp.com", billingAddress: "500 Broadway, New York, NY 10012", description: "Innovative food technology", employees: 2100, annualRevenue: 45e7, ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1" },
    { id: "a9", name: "Weyland-Yutani", industry: "Aerospace", type: "Prospect", phone: "(555) 900-9000", website: "weyland-yutani.com", billingAddress: "900 Industrial Pkwy, Houston, TX 77001", description: "Aerospace corporation", employees: 18e3, annualRevenue: 56e8, ownerId: "2", ownerName: "Sarah Chen", orgId: "org-1" },
    { id: "a10", name: "Oscorp Industries", industry: "Biotech", type: "Customer", phone: "(555) 000-1000", website: "oscorp.com", billingAddress: "200 Park Ave, New York, NY 10166", description: "Biotech leader", employees: 6500, annualRevenue: 18e8, ownerId: "3", ownerName: "Mike Johnson", orgId: "org-1" },
    { id: "a11", name: "CloudFirst", industry: "Cloud Computing", type: "Customer", phone: "(555) 100-2001", website: "cloudfirst.io", billingAddress: "100 Cloud Way, Seattle, WA 98101", description: "Cloud infrastructure provider", employees: 300, annualRevenue: 45e6, ownerId: "5", ownerName: "Alex Kim", orgId: "org-2" },
    { id: "a12", name: "DataDriven Co", industry: "Analytics", type: "Prospect", phone: "(555) 200-3001", website: "datadriven.co", billingAddress: "200 Data Blvd, San Jose, CA 95101", description: "Data analytics platform", employees: 150, annualRevenue: 22e6, ownerId: "6", ownerName: "Lisa Park", orgId: "org-2" },
    { id: "a13", name: "FinServ Partners", industry: "Financial Services", type: "Customer", phone: "+44 20 7100 1000", website: "finservpartners.co.uk", billingAddress: "10 Downing St, London, UK", description: "UK financial services advisory", employees: 800, annualRevenue: 12e7, ownerId: "7", ownerName: "James Wilson", orgId: "org-3" },
    { id: "a14", name: "Capital Group", industry: "Investment", type: "Customer", phone: "+44 20 7200 2000", website: "capitalgroup.co.uk", billingAddress: "1 Canary Wharf, London, UK", description: "Investment management firm", employees: 2500, annualRevenue: 35e8, ownerId: "8", ownerName: "Rachel Brown", orgId: "org-3" }
  ];
  for (const a of accounts) {
    await db.prepare("INSERT OR IGNORE INTO accounts (id, org_id, name, industry, type, phone, website, billing_address, description, employees, annual_revenue, owner_id, owner_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(a.id, a.orgId, a.name, a.industry, a.type, a.phone, a.website, a.billingAddress, a.description, a.employees, a.annualRevenue, a.ownerId, a.ownerName).run();
  }
  const contacts = [
    { id: "c1", firstName: "John", lastName: "Smith", title: "VP of Sales", accountId: "a1", accountName: "Globex Corporation", phone: "(555) 123-4567", mobile: "(555) 987-6543", email: "john.smith@globex.com", mailingAddress: "123 Main St, Springfield, IL 62701", department: "Sales", description: "Key decision maker", ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1", createdAt: "2025-09-15", updatedAt: "2025-12-01" },
    { id: "c2", firstName: "Jane", lastName: "Doe", title: "CTO", accountId: "a2", accountName: "Initech", phone: "(555) 234-5678", email: "jane.doe@initech.com", mailingAddress: "456 Oak Ave, Austin, TX 73301", department: "Engineering", description: "Technical buyer", ownerId: "2", ownerName: "Sarah Chen", orgId: "org-1", createdAt: "2025-08-20", updatedAt: "2025-11-15" },
    { id: "c3", firstName: "Robert", lastName: "Brown", title: "Director of Marketing", accountId: "a3", accountName: "Umbrella Corp", phone: "(555) 345-6789", email: "rbrown@umbrella.com", mailingAddress: "789 Pine Rd, Raccoon City, OH 44101", department: "Marketing", ownerId: "3", ownerName: "Mike Johnson", orgId: "org-1", createdAt: "2025-07-10", updatedAt: "2025-10-22" },
    { id: "c4", firstName: "Maria", lastName: "Garcia", title: "CEO", accountId: "a4", accountName: "Stark Industries", phone: "(555) 456-7890", mobile: "(555) 111-2222", email: "mgarcia@stark.com", mailingAddress: "1 Stark Tower, New York, NY 10001", department: "Executive", description: "Final approver for deals over $100K", ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1", createdAt: "2025-06-05", updatedAt: "2025-12-10" },
    { id: "c5", firstName: "David", lastName: "Lee", title: "Head of Procurement", accountId: "a5", accountName: "Wayne Enterprises", phone: "(555) 567-8901", email: "dlee@wayne.com", mailingAddress: "1007 Mountain Dr, Gotham, NJ 07001", department: "Procurement", ownerId: "2", ownerName: "Sarah Chen", orgId: "org-1", createdAt: "2025-05-18", updatedAt: "2025-11-30" },
    { id: "c6", firstName: "Lisa", lastName: "Wang", title: "VP Engineering", accountId: "a1", accountName: "Globex Corporation", phone: "(555) 678-9012", email: "lwang@globex.com", mailingAddress: "123 Main St, Springfield, IL 62701", department: "Engineering", ownerId: "3", ownerName: "Mike Johnson", orgId: "org-1", createdAt: "2025-10-01", updatedAt: "2025-12-05" },
    { id: "c7", firstName: "James", lastName: "Taylor", title: "Sales Manager", accountId: "a2", accountName: "Initech", phone: "(555) 789-0123", email: "jtaylor@initech.com", mailingAddress: "456 Oak Ave, Austin, TX 73301", department: "Sales", ownerId: "4", ownerName: "Emily Davis", orgId: "org-1", createdAt: "2025-09-22", updatedAt: "2025-11-28" },
    { id: "c8", firstName: "Emma", lastName: "Wilson", title: "CFO", accountId: "a3", accountName: "Umbrella Corp", phone: "(555) 890-1234", email: "ewilson@umbrella.com", mailingAddress: "789 Pine Rd, Raccoon City, OH 44101", department: "Finance", ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1", createdAt: "2025-08-11", updatedAt: "2025-12-02" },
    { id: "c9", firstName: "Michael", lastName: "Chen", title: "Product Manager", accountId: "a6", accountName: "Acme Solutions", phone: "(555) 901-2345", email: "mchen@acmesol.com", mailingAddress: "321 Elm St, San Francisco, CA 94102", department: "Product", ownerId: "2", ownerName: "Sarah Chen", orgId: "org-1", createdAt: "2025-07-15", updatedAt: "2025-11-20" },
    { id: "c10", firstName: "Sarah", lastName: "Johnson", title: "Director of IT", accountId: "a7", accountName: "Cyberdyne Systems", phone: "(555) 012-3456", email: "sjohnson@cyberdyne.com", mailingAddress: "18144 El Camino Real, Sunnyvale, CA 94087", department: "IT", ownerId: "3", ownerName: "Mike Johnson", orgId: "org-1", createdAt: "2025-06-28", updatedAt: "2025-10-15" },
    { id: "c11", firstName: "Tom", lastName: "Anderson", title: "VP Sales", accountId: "a8", accountName: "Soylent Corp", phone: "(555) 111-3333", email: "tanderson@soylent.com", mailingAddress: "500 Broadway, New York, NY 10012", department: "Sales", ownerId: "4", ownerName: "Emily Davis", orgId: "org-1", createdAt: "2025-10-05", updatedAt: "2025-12-08" },
    { id: "c12", firstName: "Amy", lastName: "Rodriguez", title: "Marketing Director", accountId: "a4", accountName: "Stark Industries", phone: "(555) 222-4444", email: "arodriguez@stark.com", mailingAddress: "1 Stark Tower, New York, NY 10001", department: "Marketing", ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1", createdAt: "2025-09-12", updatedAt: "2025-11-25" },
    { id: "c13", firstName: "Kevin", lastName: "Patel", title: "CIO", accountId: "a5", accountName: "Wayne Enterprises", phone: "(555) 333-5555", email: "kpatel@wayne.com", mailingAddress: "1007 Mountain Dr, Gotham, NJ 07001", department: "IT", ownerId: "2", ownerName: "Sarah Chen", orgId: "org-1", createdAt: "2025-08-30", updatedAt: "2025-12-12" },
    { id: "c14", firstName: "Nicole", lastName: "Kim", title: "Account Executive", accountId: "a6", accountName: "Acme Solutions", phone: "(555) 444-6666", email: "nkim@acmesol.com", mailingAddress: "321 Elm St, San Francisco, CA 94102", department: "Sales", ownerId: "3", ownerName: "Mike Johnson", orgId: "org-1", createdAt: "2025-07-22", updatedAt: "2025-10-30" },
    { id: "c15", firstName: "Brian", lastName: "Murphy", title: "Head of Sales", accountId: "a7", accountName: "Cyberdyne Systems", phone: "(555) 555-7777", email: "bmurphy@cyberdyne.com", mailingAddress: "18144 El Camino Real, Sunnyvale, CA 94087", department: "Sales", ownerId: "4", ownerName: "Emily Davis", orgId: "org-1", createdAt: "2025-06-15", updatedAt: "2025-11-10" },
    { id: "c16", firstName: "Rachel", lastName: "Foster", title: "Operations Manager", accountId: "a8", accountName: "Soylent Corp", phone: "(555) 666-8888", email: "rfoster@soylent.com", mailingAddress: "500 Broadway, New York, NY 10012", department: "Operations", ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1", createdAt: "2025-10-18", updatedAt: "2025-12-15" },
    { id: "c17", firstName: "Daniel", lastName: "Wright", title: "VP Product", accountId: "a9", accountName: "Weyland-Yutani", phone: "(555) 777-9999", email: "dwright@weyland.com", mailingAddress: "900 Industrial Pkwy, Houston, TX 77001", department: "Product", ownerId: "2", ownerName: "Sarah Chen", orgId: "org-1", createdAt: "2025-09-05", updatedAt: "2025-11-22" },
    { id: "c18", firstName: "Laura", lastName: "Martinez", title: "Director of HR", accountId: "a10", accountName: "Oscorp Industries", phone: "(555) 888-0000", email: "lmartinez@oscorp.com", mailingAddress: "200 Park Ave, New York, NY 10166", department: "HR", ownerId: "3", ownerName: "Mike Johnson", orgId: "org-1", createdAt: "2025-08-02", updatedAt: "2025-10-28" },
    { id: "c19", firstName: "Chris", lastName: "Evans", title: "Sales Director", accountId: "a9", accountName: "Weyland-Yutani", phone: "(555) 999-1111", email: "cevans@weyland.com", mailingAddress: "900 Industrial Pkwy, Houston, TX 77001", department: "Sales", ownerId: "4", ownerName: "Emily Davis", orgId: "org-1", createdAt: "2025-07-28", updatedAt: "2025-12-01" },
    { id: "c20", firstName: "Sophie", lastName: "Turner", title: "Chief Revenue Officer", accountId: "a10", accountName: "Oscorp Industries", phone: "(555) 000-2222", email: "sturner@oscorp.com", mailingAddress: "200 Park Ave, New York, NY 10166", department: "Revenue", ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1", createdAt: "2025-06-20", updatedAt: "2025-11-18" },
    { id: "c21", firstName: "Alex", lastName: "Kim", title: "Sales Rep", accountId: "a11", accountName: "CloudFirst", phone: "(555) 100-2000", email: "akim@cloudfirst.com", mailingAddress: "100 Cloud Way, Seattle, WA 98101", department: "Sales", ownerId: "5", ownerName: "Alex Kim", orgId: "org-2", createdAt: "2025-09-01", updatedAt: "2025-12-01" },
    { id: "c22", firstName: "Priya", lastName: "Sharma", title: "CTO", accountId: "a12", accountName: "DataDriven Co", phone: "(555) 200-3000", email: "psharma@datadriven.com", mailingAddress: "200 Data Blvd, San Jose, CA 95101", department: "Engineering", ownerId: "6", ownerName: "Lisa Park", orgId: "org-2", createdAt: "2025-08-15", updatedAt: "2025-11-15" },
    { id: "c23", firstName: "William", lastName: "Clarke", title: "Managing Director", accountId: "a13", accountName: "FinServ Partners", phone: "+44 20 7123 4567", email: "wclarke@finserv.co.uk", mailingAddress: "10 Downing St, London, UK", department: "Management", ownerId: "7", ownerName: "James Wilson", orgId: "org-3", createdAt: "2025-07-01", updatedAt: "2025-12-01" },
    { id: "c24", firstName: "Charlotte", lastName: "Reed", title: "Investment Analyst", accountId: "a14", accountName: "Capital Group", phone: "+44 20 7234 5678", email: "creed@capitalgroup.co.uk", mailingAddress: "1 Canary Wharf, London, UK", department: "Investments", ownerId: "8", ownerName: "Rachel Brown", orgId: "org-3", createdAt: "2025-06-15", updatedAt: "2025-11-15" }
  ];
  for (const ct of contacts) {
    await db.prepare("INSERT OR IGNORE INTO contacts (id, org_id, first_name, last_name, email, phone, mobile, title, department, account_id, account_name, owner_id, owner_name, description, mailing_address, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(ct.id, ct.orgId, ct.firstName, ct.lastName, ct.email || null, ct.phone || null, ct.mobile || null, ct.title || null, ct.department || null, ct.accountId || null, ct.accountName || null, ct.ownerId || null, ct.ownerName || null, ct.description || null, ct.mailingAddress || null, ct.createdAt, ct.updatedAt).run();
  }
  const deals = [
    { id: "d1", name: "Globex Enterprise License", amount: 45e4, stage: "Negotiation", closeDate: "2026-03-15", accountId: "a1", accountName: "Globex Corporation", contactId: "c1", contactName: "John Smith", probability: 75, ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1", createdAt: "2025-09-01", updatedAt: "2025-12-10" },
    { id: "d2", name: "Initech ERP Integration", amount: 28e4, stage: "Proposal", closeDate: "2026-04-01", accountId: "a2", accountName: "Initech", contactId: "c2", contactName: "Jane Doe", probability: 50, ownerId: "2", ownerName: "Sarah Chen", orgId: "org-1", createdAt: "2025-08-15", updatedAt: "2025-11-28" },
    { id: "d3", name: "Umbrella Security Suite", amount: 18e4, stage: "Qualification", closeDate: "2026-05-15", accountId: "a3", accountName: "Umbrella Corp", contactId: "c3", contactName: "Robert Brown", probability: 30, ownerId: "3", ownerName: "Mike Johnson", orgId: "org-1", createdAt: "2025-10-01", updatedAt: "2025-12-05" },
    { id: "d4", name: "Stark Analytics Platform", amount: 52e4, stage: "Closed Won", closeDate: "2025-11-30", accountId: "a4", accountName: "Stark Industries", contactId: "c4", contactName: "Maria Garcia", probability: 100, ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1", createdAt: "2025-06-01", updatedAt: "2025-11-30" },
    { id: "d5", name: "Wayne Digital Transformation", amount: 38e4, stage: "Negotiation", closeDate: "2026-02-28", accountId: "a5", accountName: "Wayne Enterprises", contactId: "c5", contactName: "David Lee", probability: 80, ownerId: "2", ownerName: "Sarah Chen", orgId: "org-1", createdAt: "2025-07-20", updatedAt: "2025-12-12" },
    { id: "d6", name: "Acme Consulting Package", amount: 95e3, stage: "Prospecting", closeDate: "2026-06-01", accountId: "a6", accountName: "Acme Solutions", contactId: "c9", contactName: "Michael Chen", probability: 15, ownerId: "3", ownerName: "Mike Johnson", orgId: "org-1", createdAt: "2025-11-01", updatedAt: "2025-12-01" },
    { id: "d7", name: "Cyberdyne AI Module", amount: 21e4, stage: "Qualification", closeDate: "2026-04-15", accountId: "a7", accountName: "Cyberdyne Systems", contactId: "c10", contactName: "Sarah Johnson", probability: 25, ownerId: "4", ownerName: "Emily Davis", orgId: "org-1", createdAt: "2025-10-15", updatedAt: "2025-11-20" },
    { id: "d8", name: "Soylent Supply Chain", amount: 155e3, stage: "Proposal", closeDate: "2026-03-30", accountId: "a8", accountName: "Soylent Corp", contactId: "c11", contactName: "Tom Anderson", probability: 45, ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1", createdAt: "2025-09-20", updatedAt: "2025-12-08" },
    { id: "d9", name: "Weyland Space Systems", amount: 49e4, stage: "Prospecting", closeDate: "2026-07-01", accountId: "a9", accountName: "Weyland-Yutani", contactId: "c17", contactName: "Daniel Wright", probability: 10, ownerId: "2", ownerName: "Sarah Chen", orgId: "org-1", createdAt: "2025-11-10", updatedAt: "2025-12-01" },
    { id: "d10", name: "Oscorp Lab Management", amount: 32e4, stage: "Closed Won", closeDate: "2025-10-15", accountId: "a10", accountName: "Oscorp Industries", contactId: "c20", contactName: "Sophie Turner", probability: 100, ownerId: "3", ownerName: "Mike Johnson", orgId: "org-1", createdAt: "2025-05-01", updatedAt: "2025-10-15" },
    { id: "d11", name: "Globex Cloud Migration", amount: 175e3, stage: "Closed Lost", closeDate: "2025-09-30", accountId: "a1", accountName: "Globex Corporation", contactId: "c6", contactName: "Lisa Wang", probability: 0, ownerId: "4", ownerName: "Emily Davis", orgId: "org-1", createdAt: "2025-04-15", updatedAt: "2025-09-30" },
    { id: "d12", name: "Initech Mobile App", amount: 12e4, stage: "Prospecting", closeDate: "2026-05-30", accountId: "a2", accountName: "Initech", contactId: "c7", contactName: "James Taylor", probability: 10, ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1", createdAt: "2025-12-01", updatedAt: "2025-12-10" },
    { id: "d13", name: "Stark Security Audit", amount: 85e3, stage: "Closed Won", closeDate: "2025-08-20", accountId: "a4", accountName: "Stark Industries", contactId: "c12", contactName: "Amy Rodriguez", probability: 100, ownerId: "2", ownerName: "Sarah Chen", orgId: "org-1", createdAt: "2025-03-10", updatedAt: "2025-08-20" },
    { id: "d14", name: "Wayne CRM Implementation", amount: 26e4, stage: "Proposal", closeDate: "2026-03-01", accountId: "a5", accountName: "Wayne Enterprises", contactId: "c13", contactName: "Kevin Patel", probability: 55, ownerId: "3", ownerName: "Mike Johnson", orgId: "org-1", createdAt: "2025-10-20", updatedAt: "2025-12-01" },
    { id: "d15", name: "Cyberdyne Robotics Platform", amount: 34e4, stage: "Closed Lost", closeDate: "2025-11-15", accountId: "a7", accountName: "Cyberdyne Systems", contactId: "c15", contactName: "Brian Murphy", probability: 0, ownerId: "4", ownerName: "Emily Davis", orgId: "org-1", createdAt: "2025-06-15", updatedAt: "2025-11-15" },
    { id: "d16", name: "CloudFirst Infrastructure Deal", amount: 125e3, stage: "Negotiation", closeDate: "2026-03-01", accountId: "a11", accountName: "CloudFirst", contactId: "c21", contactName: "Alex Kim", probability: 70, ownerId: "5", ownerName: "Alex Kim", orgId: "org-2", createdAt: "2025-09-15", updatedAt: "2025-12-01" },
    { id: "d17", name: "DataDriven Analytics Suite", amount: 88e3, stage: "Qualification", closeDate: "2026-04-15", accountId: "a12", accountName: "DataDriven Co", contactId: "c22", contactName: "Priya Sharma", probability: 35, ownerId: "6", ownerName: "Lisa Park", orgId: "org-2", createdAt: "2025-10-01", updatedAt: "2025-11-20" },
    { id: "d18", name: "FinServ Compliance Platform", amount: 31e4, stage: "Proposal", closeDate: "2026-02-15", accountId: "a13", accountName: "FinServ Partners", contactId: "c23", contactName: "William Clarke", probability: 60, ownerId: "7", ownerName: "James Wilson", orgId: "org-3", createdAt: "2025-08-01", updatedAt: "2025-12-01" }
  ];
  for (const d of deals) {
    await db.prepare("INSERT OR IGNORE INTO deals (id, org_id, name, amount, stage, close_date, account_id, account_name, contact_id, contact_name, owner_id, owner_name, probability, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(d.id, d.orgId, d.name, d.amount, d.stage, d.closeDate, d.accountId, d.accountName, d.contactId, d.contactName, d.ownerId, d.ownerName, d.probability, d.createdAt, d.updatedAt).run();
  }
  const acts = [
    { id: "act1", type: "call", subject: "Discovery call with John Smith", description: "Discuss enterprise needs", status: "Done", dueDate: "2025-12-10", contactId: "c1", contactName: "John Smith", accountId: "a1", accountName: "Globex Corporation", ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1", completedAt: "2025-12-10", createdAt: "2025-12-08" },
    { id: "act2", type: "email", subject: "Send proposal to Jane Doe", status: "Done", dueDate: "2025-12-09", contactId: "c2", contactName: "Jane Doe", accountId: "a2", accountName: "Initech", ownerId: "2", ownerName: "Sarah Chen", orgId: "org-1", completedAt: "2025-12-09", createdAt: "2025-12-07" },
    { id: "act3", type: "meeting", subject: "Quarterly review with Stark Industries", status: "To Do", dueDate: "2026-02-25", contactId: "c4", contactName: "Maria Garcia", accountId: "a4", accountName: "Stark Industries", ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1", createdAt: "2025-12-01" },
    { id: "act4", type: "task", subject: "Update Globex contract terms", status: "In Progress", dueDate: "2026-02-26", contactId: "c1", contactName: "John Smith", accountId: "a1", accountName: "Globex Corporation", ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1", createdAt: "2025-12-05" },
    { id: "act5", type: "call", subject: "Follow up with Robert Brown", status: "To Do", dueDate: "2026-02-25", contactId: "c3", contactName: "Robert Brown", accountId: "a3", accountName: "Umbrella Corp", ownerId: "3", ownerName: "Mike Johnson", orgId: "org-1", createdAt: "2025-12-10" },
    { id: "act6", type: "email", subject: "Send pricing update to Wayne", status: "Waiting", dueDate: "2026-02-24", contactId: "c5", contactName: "David Lee", accountId: "a5", accountName: "Wayne Enterprises", ownerId: "2", ownerName: "Sarah Chen", orgId: "org-1", createdAt: "2025-12-08" },
    { id: "act7", type: "meeting", subject: "Product demo for Cyberdyne", status: "To Do", dueDate: "2026-02-27", contactId: "c10", contactName: "Sarah Johnson", accountId: "a7", accountName: "Cyberdyne Systems", ownerId: "4", ownerName: "Emily Davis", orgId: "org-1", createdAt: "2025-12-12" },
    { id: "act8", type: "task", subject: "Prepare Soylent presentation", status: "In Progress", dueDate: "2026-02-25", contactId: "c11", contactName: "Tom Anderson", accountId: "a8", accountName: "Soylent Corp", ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1", createdAt: "2025-12-09" },
    { id: "act9", type: "call", subject: "Cold call to Weyland-Yutani", status: "To Do", dueDate: "2026-02-26", contactId: "c17", contactName: "Daniel Wright", accountId: "a9", accountName: "Weyland-Yutani", ownerId: "2", ownerName: "Sarah Chen", orgId: "org-1", createdAt: "2025-12-11" },
    { id: "act10", type: "email", subject: "Contract renewal notice - Oscorp", status: "Done", dueDate: "2025-12-08", contactId: "c20", contactName: "Sophie Turner", accountId: "a10", accountName: "Oscorp Industries", ownerId: "3", ownerName: "Mike Johnson", orgId: "org-1", completedAt: "2025-12-08", createdAt: "2025-12-06" },
    { id: "act11", type: "meeting", subject: "Team sync - Pipeline review", status: "Done", dueDate: "2025-12-12", ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1", completedAt: "2025-12-12", createdAt: "2025-12-10" },
    { id: "act12", type: "task", subject: "Create case study for Stark deal", status: "To Do", dueDate: "2026-02-28", contactId: "c4", contactName: "Maria Garcia", accountId: "a4", accountName: "Stark Industries", ownerId: "4", ownerName: "Emily Davis", orgId: "org-1", createdAt: "2025-12-01" },
    { id: "act13", type: "call", subject: "Check in with Lisa Wang", status: "Waiting", dueDate: "2026-02-27", contactId: "c6", contactName: "Lisa Wang", accountId: "a1", accountName: "Globex Corporation", ownerId: "3", ownerName: "Mike Johnson", orgId: "org-1", createdAt: "2025-12-05" },
    { id: "act14", type: "email", subject: "Send onboarding docs to Acme", status: "To Do", dueDate: "2026-02-25", contactId: "c9", contactName: "Michael Chen", accountId: "a6", accountName: "Acme Solutions", ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1", createdAt: "2025-12-10" },
    { id: "act15", type: "meeting", subject: "Negotiation call with Globex", status: "To Do", dueDate: "2026-02-26", contactId: "c1", contactName: "John Smith", accountId: "a1", accountName: "Globex Corporation", dealId: "d1", ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1", createdAt: "2025-12-12" },
    { id: "act16", type: "task", subject: "Update CRM records for Q4", status: "In Progress", dueDate: "2026-02-25", ownerId: "2", ownerName: "Sarah Chen", orgId: "org-1", createdAt: "2025-12-01" },
    { id: "act17", type: "call", subject: "Reference check - Kevin Patel", status: "Done", dueDate: "2025-12-11", contactId: "c13", contactName: "Kevin Patel", accountId: "a5", accountName: "Wayne Enterprises", ownerId: "3", ownerName: "Mike Johnson", orgId: "org-1", completedAt: "2025-12-11", createdAt: "2025-12-09" },
    { id: "act18", type: "email", subject: "Follow up on demo feedback", status: "Done", dueDate: "2025-12-07", contactId: "c15", contactName: "Brian Murphy", accountId: "a7", accountName: "Cyberdyne Systems", ownerId: "4", ownerName: "Emily Davis", orgId: "org-1", completedAt: "2025-12-07", createdAt: "2025-12-05" },
    { id: "act19", type: "meeting", subject: "Strategy session with marketing", status: "To Do", dueDate: "2026-02-28", ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1", createdAt: "2025-12-12" },
    { id: "act20", type: "task", subject: "Competitive analysis report", status: "Waiting", dueDate: "2026-02-27", ownerId: "2", ownerName: "Sarah Chen", orgId: "org-1", createdAt: "2025-12-08" },
    { id: "act21", type: "call", subject: "Intro call with Nicole Kim", status: "To Do", dueDate: "2026-02-25", contactId: "c14", contactName: "Nicole Kim", accountId: "a6", accountName: "Acme Solutions", ownerId: "3", ownerName: "Mike Johnson", orgId: "org-1", createdAt: "2025-12-11" },
    { id: "act22", type: "email", subject: "Thank you note to Maria Garcia", status: "Done", dueDate: "2025-12-01", contactId: "c4", contactName: "Maria Garcia", accountId: "a4", accountName: "Stark Industries", ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1", completedAt: "2025-12-01", createdAt: "2025-11-30" },
    { id: "act23", type: "meeting", subject: "Budget planning for Q1", status: "In Progress", dueDate: "2026-02-26", ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1", createdAt: "2025-12-10" },
    { id: "act24", type: "task", subject: "Prepare Weyland proposal", status: "To Do", dueDate: "2026-03-01", contactId: "c17", contactName: "Daniel Wright", accountId: "a9", accountName: "Weyland-Yutani", dealId: "d9", ownerId: "2", ownerName: "Sarah Chen", orgId: "org-1", createdAt: "2025-12-12" },
    { id: "act25", type: "call", subject: "Check in with Rachel Foster", status: "To Do", dueDate: "2026-02-26", contactId: "c16", contactName: "Rachel Foster", accountId: "a8", accountName: "Soylent Corp", ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1", createdAt: "2025-12-11" },
    { id: "act26", type: "email", subject: "Send meeting recap to Laura", status: "Waiting", dueDate: "2026-02-25", contactId: "c18", contactName: "Laura Martinez", accountId: "a10", accountName: "Oscorp Industries", ownerId: "3", ownerName: "Mike Johnson", orgId: "org-1", createdAt: "2025-12-09" },
    { id: "act27", type: "meeting", subject: "Contract review with legal", status: "To Do", dueDate: "2026-02-27", dealId: "d1", ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1", createdAt: "2025-12-12" },
    { id: "act28", type: "task", subject: "Submit expense report", status: "To Do", dueDate: "2026-02-28", ownerId: "4", ownerName: "Emily Davis", orgId: "org-1", createdAt: "2025-12-10" },
    { id: "act29", type: "call", subject: "Close negotiation with David Lee", status: "In Progress", dueDate: "2026-02-25", contactId: "c5", contactName: "David Lee", accountId: "a5", accountName: "Wayne Enterprises", dealId: "d5", ownerId: "2", ownerName: "Sarah Chen", orgId: "org-1", createdAt: "2025-12-12" },
    { id: "act30", type: "email", subject: "Invoice follow-up - Stark", status: "To Do", dueDate: "2026-02-25", contactId: "c4", contactName: "Maria Garcia", accountId: "a4", accountName: "Stark Industries", ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1", createdAt: "2025-12-11" },
    { id: "act31", type: "call", subject: "CloudFirst infrastructure review", status: "To Do", dueDate: "2026-02-25", contactId: "c21", contactName: "Alex Kim", accountId: "a11", accountName: "CloudFirst", ownerId: "5", ownerName: "Alex Kim", orgId: "org-2", createdAt: "2025-12-10" },
    { id: "act32", type: "email", subject: "DataDriven proposal follow-up", status: "In Progress", dueDate: "2026-02-26", contactId: "c22", contactName: "Priya Sharma", accountId: "a12", accountName: "DataDriven Co", ownerId: "6", ownerName: "Lisa Park", orgId: "org-2", createdAt: "2025-12-08" },
    { id: "act33", type: "meeting", subject: "FinServ compliance review", status: "To Do", dueDate: "2026-02-27", contactId: "c23", contactName: "William Clarke", accountId: "a13", accountName: "FinServ Partners", ownerId: "7", ownerName: "James Wilson", orgId: "org-3", createdAt: "2025-12-05" },
    { id: "act34", type: "task", subject: "Capital Group investment report", status: "In Progress", dueDate: "2026-02-28", contactId: "c24", contactName: "Charlotte Reed", accountId: "a14", accountName: "Capital Group", ownerId: "8", ownerName: "Rachel Brown", orgId: "org-3", createdAt: "2025-12-01" }
  ];
  for (const a of acts) {
    await db.prepare("INSERT OR IGNORE INTO activities (id, org_id, type, subject, description, status, due_date, contact_id, contact_name, account_id, account_name, deal_id, owner_id, owner_name, completed_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(a.id, a.orgId, a.type, a.subject, a.description || null, a.status, a.dueDate, a.contactId || null, a.contactName || null, a.accountId || null, a.accountName || null, a.dealId || null, a.ownerId, a.ownerName, a.completedAt || null, a.createdAt).run();
  }
  const seedLeads = [
    { id: "l1", firstName: "Tyler", lastName: "Brooks", company: "NextGen Software", title: "VP Sales", email: "tbrooks@nextgen.com", phone: "(555) 111-0001", status: "New", source: "Website", rating: "Hot", industry: "Technology", description: "Demo request", ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1", createdAt: "2025-12-10" },
    { id: "l2", firstName: "Amanda", lastName: "Stone", company: "PeakView Analytics", title: "Director of Ops", email: "astone@peakview.com", phone: "(555) 111-0002", status: "Contacted", source: "Trade Show", rating: "Warm", industry: "Analytics", ownerId: "2", ownerName: "Sarah Chen", orgId: "org-1", createdAt: "2025-12-08" },
    { id: "l3", firstName: "Ryan", lastName: "Cooper", company: "Zenith Media", title: "CMO", email: "rcooper@zenith.com", phone: "(555) 111-0003", status: "Qualified", source: "Referral", rating: "Hot", industry: "Media", ownerId: "3", ownerName: "Mike Johnson", orgId: "org-1", createdAt: "2025-12-05" },
    { id: "l4", firstName: "Jessica", lastName: "Hall", company: "Vertex Engineering", title: "CTO", email: "jhall@vertex.com", phone: "(555) 111-0004", status: "New", source: "LinkedIn", rating: "Cold", industry: "Engineering", ownerId: "4", ownerName: "Emily Davis", orgId: "org-1", createdAt: "2025-12-12" },
    { id: "l5", firstName: "Marcus", lastName: "Williams", company: "Horizon Health", title: "COO", email: "mwilliams@horizon.com", phone: "(555) 111-0005", status: "Contacted", source: "Cold Call", rating: "Warm", industry: "Healthcare", ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1", createdAt: "2025-12-01" },
    { id: "l6", firstName: "Samantha", lastName: "Park", company: "Elite Logistics", title: "Supply Chain Director", email: "spark@elite.com", phone: "(555) 111-0006", status: "Unqualified", source: "Website", rating: "Cold", industry: "Logistics", ownerId: "2", ownerName: "Sarah Chen", orgId: "org-1", createdAt: "2025-11-28" },
    { id: "l7", firstName: "Derek", lastName: "Fox", company: "Apex Financial", title: "Head of IT", email: "dfox@apexfin.com", phone: "(555) 111-0007", status: "New", source: "Webinar", rating: "Warm", industry: "Finance", ownerId: "3", ownerName: "Mike Johnson", orgId: "org-1", createdAt: "2025-12-11" },
    { id: "l8", firstName: "Victoria", lastName: "Chen", company: "BlueSky Ventures", title: "Partner", email: "vchen@bluesky.com", phone: "(555) 111-0008", status: "Qualified", source: "Referral", rating: "Hot", industry: "Venture Capital", ownerId: "4", ownerName: "Emily Davis", orgId: "org-1", createdAt: "2025-12-03" },
    { id: "l9", firstName: "Patrick", lastName: "O'Brien", company: "Emerald Tech", title: "CEO", email: "pobrien@emerald.com", phone: "(555) 111-0009", status: "Contacted", source: "Email Campaign", rating: "Warm", industry: "Technology", ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1", createdAt: "2025-12-07" },
    { id: "l10", firstName: "Natalie", lastName: "Ross", company: "Summit Group", title: "VP Business Dev", email: "nross@summit.com", phone: "(555) 111-0010", status: "New", source: "Partner Referral", rating: "Hot", industry: "Consulting", ownerId: "2", ownerName: "Sarah Chen", orgId: "org-1", createdAt: "2025-12-12" },
    { id: "l11", firstName: "Jason", lastName: "Lee", company: "Nimbus Cloud", title: "CTO", email: "jlee@nimbus.io", phone: "(555) 222-0001", status: "New", source: "Website", rating: "Warm", industry: "Cloud Computing", ownerId: "5", ownerName: "Alex Kim", orgId: "org-2", createdAt: "2025-12-10" },
    { id: "l12", firstName: "Oliver", lastName: "Thompson", company: "Sterling Bank", title: "MD", email: "othompson@sterling.co.uk", phone: "+44 20 7300 3000", status: "Qualified", source: "Referral", rating: "Hot", industry: "Banking", ownerId: "7", ownerName: "James Wilson", orgId: "org-3", createdAt: "2025-12-05" }
  ];
  for (const l of seedLeads) {
    await db.prepare("INSERT OR IGNORE INTO leads (id, org_id, first_name, last_name, email, phone, company, title, status, source, rating, industry, description, owner_id, owner_name, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(l.id, l.orgId, l.firstName, l.lastName, l.email, l.phone, l.company, l.title, l.status, l.source, l.rating, l.industry, l.description || null, l.ownerId, l.ownerName, l.createdAt).run();
  }
  const seedCases = [
    { id: "cs1", subject: "Login issues with SSO integration", status: "Working", priority: "High", description: "Customer unable to log in via SSO after recent update.", contactId: "c1", contactName: "John Smith", accountId: "a1", accountName: "Globex Corporation", ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1", createdAt: "2025-12-10" },
    { id: "cs2", subject: "Data export formatting error", status: "New", priority: "Medium", description: "CSV exports have incorrect date formatting.", contactId: "c2", contactName: "Jane Doe", accountId: "a2", accountName: "Initech", ownerId: "2", ownerName: "Sarah Chen", orgId: "org-1", createdAt: "2025-12-11" },
    { id: "cs3", subject: "API rate limiting too aggressive", status: "Escalated", priority: "High", description: "Customer hitting API rate limits during normal operations.", contactId: "c4", contactName: "Maria Garcia", accountId: "a4", accountName: "Stark Industries", ownerId: "3", ownerName: "Mike Johnson", orgId: "org-1", createdAt: "2025-12-09" },
    { id: "cs4", subject: "Dashboard loading slowly", status: "Working", priority: "Low", description: "Analytics dashboard takes 15+ seconds to load.", contactId: "c5", contactName: "David Lee", accountId: "a5", accountName: "Wayne Enterprises", ownerId: "4", ownerName: "Emily Davis", orgId: "org-1", createdAt: "2025-12-08" },
    { id: "cs5", subject: "Missing email notifications", status: "Closed", priority: "Medium", description: "Customer not receiving automated email notifications.", resolution: "Fixed email service configuration.", contactId: "c11", contactName: "Tom Anderson", accountId: "a8", accountName: "Soylent Corp", ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1", createdAt: "2025-12-05", closedAt: "2025-12-08" },
    { id: "cs6", subject: "Custom field validation broken", status: "New", priority: "Low", description: "Custom picklist fields not validating correctly.", contactId: "c9", contactName: "Michael Chen", accountId: "a6", accountName: "Acme Solutions", ownerId: "2", ownerName: "Sarah Chen", orgId: "org-1", createdAt: "2025-12-12" },
    { id: "cs7", subject: "Report generation timeout", status: "Working", priority: "High", description: "Large report generation times out after 60 seconds.", contactId: "c20", contactName: "Sophie Turner", accountId: "a10", accountName: "Oscorp Industries", ownerId: "3", ownerName: "Mike Johnson", orgId: "org-1", createdAt: "2025-12-07" },
    { id: "cs8", subject: "Integration sync failure", status: "New", priority: "Medium", description: "Google Calendar integration failing to sync events.", contactId: "c21", contactName: "Alex Kim", accountId: "a11", accountName: "CloudFirst", ownerId: "5", ownerName: "Alex Kim", orgId: "org-2", createdAt: "2025-12-10" }
  ];
  for (const cs of seedCases) {
    await db.prepare("INSERT OR IGNORE INTO cases (id, org_id, subject, description, status, priority, contact_id, contact_name, account_id, account_name, owner_id, owner_name, resolution, closed_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(cs.id, cs.orgId, cs.subject, cs.description, cs.status, cs.priority, cs.contactId || null, cs.contactName || null, cs.accountId || null, cs.accountName || null, cs.ownerId, cs.ownerName, cs.resolution || null, cs.closedAt || null, cs.createdAt).run();
  }
  const scripts = [
    { id: "scr1", name: "Cold Call - Enterprise", description: "Standard cold call script for enterprise prospects", blocks: JSON.stringify([
      { id: "sb1", title: "Intro", content: "Hi [Name], this is [Your Name] from Axia. I'm reaching out because we help companies like [Company] streamline their sales operations. Do you have 2 minutes?" },
      { id: "sb2", title: "Discovery", content: "What CRM are you currently using? What are the biggest challenges your sales team faces?" },
      { id: "sb3", title: "Pitch", content: "Axia helps teams like yours increase win rates by 35% with AI-powered insights and automated follow-ups." },
      { id: "sb4", title: "Objection Handling", content: "I understand the concern about switching costs. Our migration team handles everything, and most customers are onboarded within 2 weeks." },
      { id: "sb5", title: "Close", content: "Would you be open to a 15-minute demo this week? I have availability on [Day] at [Time]." }
    ]), orgId: "org-1" },
    { id: "scr2", name: "Follow-Up - Demo Attended", description: "Follow-up for prospects who attended a demo", blocks: JSON.stringify([
      { id: "sb6", title: "Intro", content: "Hi [Name], thanks again for attending the demo. I wanted to follow up and see if you had any questions." },
      { id: "sb7", title: "Discovery", content: "Which features resonated most with your team?" },
      { id: "sb8", title: "Pitch", content: "I've put together a custom proposal that focuses on [their priorities]." },
      { id: "sb9", title: "Close", content: "Can we schedule a call with your team to review the proposal?" }
    ]), orgId: "org-1" },
    { id: "scr3", name: "Renewal Call", description: "Script for customer renewal conversations", blocks: JSON.stringify([
      { id: "sb10", title: "Intro", content: "Hi [Name], I'm calling about your upcoming renewal. How has your experience been?" },
      { id: "sb11", title: "Discovery", content: "What features has your team found most valuable?" },
      { id: "sb12", title: "Pitch", content: "We've added several new features since your last renewal." },
      { id: "sb13", title: "Close", content: "I'll send over the renewal proposal. Can I count on getting this wrapped up by [date]?" }
    ]), orgId: "org-1" }
  ];
  for (const s of scripts) {
    await db.prepare("INSERT OR IGNORE INTO call_scripts (id, org_id, name, description, blocks) VALUES (?, ?, ?, ?, ?)").bind(s.id, s.orgId, s.name, s.description, s.blocks).run();
  }
  const seedCampaigns = [
    { id: "camp1", name: "Q1 Product Launch", status: "Planned", type: "Email", startDate: "2026-01-15", endDate: "2026-02-28", budget: 25e3, responses: 0, orgId: "org-1" },
    { id: "camp2", name: "SaaStr Conference 2025", status: "Completed", type: "Event", startDate: "2025-09-10", endDate: "2025-09-12", budget: 5e4, actualCost: 47500, responses: 342, orgId: "org-1" },
    { id: "camp3", name: "Winter Webinar Series", status: "Active", type: "Webinar", startDate: "2025-11-01", endDate: "2026-01-31", budget: 8e3, actualCost: 3200, responses: 156, orgId: "org-1" },
    { id: "camp4", name: "LinkedIn Ads - Enterprise", status: "Active", type: "Digital Ads", startDate: "2025-10-01", endDate: "2026-03-31", budget: 35e3, actualCost: 18500, responses: 89, orgId: "org-1" },
    { id: "camp5", name: "Customer Referral Program", status: "Active", type: "Referral", startDate: "2025-07-01", endDate: "2026-06-30", budget: 15e3, actualCost: 8200, responses: 28, orgId: "org-1" }
  ];
  for (const camp of seedCampaigns) {
    await db.prepare("INSERT OR IGNORE INTO campaigns (id, org_id, name, status, type, start_date, end_date, budget, actual_cost, responses) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(camp.id, camp.orgId, camp.name, camp.status, camp.type, camp.startDate, camp.endDate, camp.budget, camp.actualCost || null, camp.responses).run();
  }
  const seedProducts = [
    { id: "p1", name: "Axia CRM Starter", code: "AX-START", description: "Basic CRM for small teams.", price: 29, family: "CRM", isActive: 1, pricingTiers: JSON.stringify([{ minQty: 1, price: 29 }, { minQty: 10, price: 25 }, { minQty: 50, price: 20 }]), orgId: "org-1" },
    { id: "p2", name: "Axia CRM Professional", code: "AX-PRO", description: "Advanced CRM with automation.", price: 79, family: "CRM", isActive: 1, pricingTiers: JSON.stringify([{ minQty: 1, price: 79 }, { minQty: 10, price: 69 }, { minQty: 50, price: 55 }]), orgId: "org-1" },
    { id: "p3", name: "Axia CRM Enterprise", code: "AX-ENT", description: "Full-featured CRM with unlimited customization.", price: 149, family: "CRM", isActive: 1, pricingTiers: JSON.stringify([{ minQty: 1, price: 149 }, { minQty: 10, price: 129 }, { minQty: 50, price: 99 }]), orgId: "org-1" },
    { id: "p4", name: "Power Dialer Add-On", code: "AX-DIAL", description: "Add power dialer functionality.", price: 35, family: "Add-Ons", isActive: 1, pricingTiers: JSON.stringify([{ minQty: 1, price: 35 }, { minQty: 10, price: 30 }]), orgId: "org-1" },
    { id: "p5", name: "Marketing Suite", code: "AX-MKT", description: "Email campaigns and lead scoring.", price: 49, family: "Marketing", isActive: 1, pricingTiers: JSON.stringify([{ minQty: 1, price: 49 }, { minQty: 10, price: 42 }]), orgId: "org-1" },
    { id: "p6", name: "Analytics Pro", code: "AX-ANALYTICS", description: "Advanced reporting and analytics.", price: 25, family: "Add-Ons", isActive: 1, orgId: "org-1" },
    { id: "p7", name: "Service Cloud", code: "AX-SVC", description: "Case management and knowledge base.", price: 59, family: "Service", isActive: 1, pricingTiers: JSON.stringify([{ minQty: 1, price: 59 }, { minQty: 10, price: 49 }]), orgId: "org-1" },
    { id: "p8", name: "Legacy Basic (Deprecated)", code: "AX-LEGACY", description: "Previous generation CRM.", price: 19, family: "CRM", isActive: 0, orgId: "org-1" }
  ];
  for (const p of seedProducts) {
    await db.prepare("INSERT OR IGNORE INTO products (id, org_id, name, code, description, price, family, is_active, pricing_tiers) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(p.id, p.orgId, p.name, p.code, p.description, p.price, p.family, p.isActive, p.pricingTiers || null).run();
  }
  const seedIntegrations = [
    { id: "int1", name: "Google Workspace", type: "google", enabled: 1, orgId: "org-1" },
    { id: "int2", name: "Microsoft 365", type: "microsoft", enabled: 0, orgId: "org-1" },
    { id: "int3", name: "Slack", type: "slack", enabled: 1, orgId: "org-1" }
  ];
  for (const i of seedIntegrations) {
    await db.prepare("INSERT OR IGNORE INTO integrations (id, org_id, name, type, enabled) VALUES (?, ?, ?, ?, ?)").bind(i.id, i.orgId, i.name, i.type, i.enabled).run();
  }
  const seedPosts = [
    { id: "mp1", platform: "LinkedIn", text: "Just launched our new Q1 report...", scheduledAt: "2026-02-26 09:00:00", status: "Scheduled", orgId: "org-1" },
    { id: "mp2", platform: "X", text: "5 tips for better team productivity...", scheduledAt: "2026-02-26 14:00:00", status: "Draft", orgId: "org-1" },
    { id: "mp3", platform: "Instagram", text: "Behind the scenes of our product...", scheduledAt: "2026-02-27 10:00:00", status: "Scheduled", orgId: "org-1" },
    { id: "mp4", platform: "LinkedIn", text: "Customer spotlight: How Acme Corp...", scheduledAt: "2026-02-28 11:00:00", status: "Scheduled", orgId: "org-1" },
    { id: "mp5", platform: "X", text: "New feature alert! Introducing...", scheduledAt: "2026-03-01 09:00:00", status: "Draft", orgId: "org-1" },
    { id: "mp6", platform: "LinkedIn", text: "Weekly team update: What we shipped...", scheduledAt: "2026-03-03 09:00:00", status: "Scheduled", orgId: "org-1" }
  ];
  for (const p of seedPosts) {
    await db.prepare("INSERT OR IGNORE INTO marketing_posts (id, org_id, platform, text, scheduled_at, status) VALUES (?, ?, ?, ?, ?, ?)").bind(p.id, p.orgId, p.platform, p.text, p.scheduledAt, p.status).run();
  }
  const seedVendors = [
    { id: "v1", name: "TechSupply Co", contact: "Mark Stevens", email: "mark@techsupply.com", phone: "(555) 400-1001", category: "Hardware", status: "Active", ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1" },
    { id: "v2", name: "CloudServices Inc", contact: "Anna Lee", email: "anna@cloudservices.com", phone: "(555) 400-1002", category: "Cloud", status: "Active", ownerId: "2", ownerName: "Sarah Chen", orgId: "org-1" },
    { id: "v3", name: "OfficeMax Pro", contact: "Jake Torres", email: "jake@officemax.com", phone: "(555) 400-1003", category: "Office Supplies", status: "Pending", ownerId: "3", ownerName: "Mike Johnson", orgId: "org-1" }
  ];
  for (const v of seedVendors) {
    await db.prepare("INSERT OR IGNORE INTO vendors (id, org_id, name, contact, email, phone, category, status, owner_id, owner_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(v.id, v.orgId, v.name, v.contact, v.email, v.phone, v.category, v.status, v.ownerId, v.ownerName).run();
  }
  const seedClients = [
    { id: "cl1", name: "Globex Corporation", industry: "Technology", contact: "John Smith", contractValue: 45e4, startDate: "2025-01-15", status: "Active", ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1" },
    { id: "cl2", name: "Stark Industries", industry: "Manufacturing", contact: "Maria Garcia", contractValue: 52e4, startDate: "2025-06-01", status: "Active", ownerId: "2", ownerName: "Sarah Chen", orgId: "org-1" },
    { id: "cl3", name: "Oscorp Industries", industry: "Biotech", contact: "Sophie Turner", contractValue: 32e4, startDate: "2025-05-01", status: "Active", ownerId: "3", ownerName: "Mike Johnson", orgId: "org-1" },
    { id: "cl4", name: "Soylent Corp", industry: "Food & Beverage", contact: "Tom Anderson", contractValue: 155e3, startDate: "2025-09-20", status: "At Risk", ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1" }
  ];
  for (const cl of seedClients) {
    await db.prepare("INSERT OR IGNORE INTO clients (id, org_id, name, industry, contact, contract_value, start_date, status, owner_id, owner_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(cl.id, cl.orgId, cl.name, cl.industry, cl.contact, cl.contractValue, cl.startDate, cl.status, cl.ownerId, cl.ownerName).run();
  }
  const seedTags = [
    { id: "tag1", name: "VIP", color: "#FF4444", orgId: "org-1" },
    { id: "tag2", name: "Enterprise", color: "#2D7FF9", orgId: "org-1" },
    { id: "tag3", name: "Follow Up", color: "#FFB800", orgId: "org-1" },
    { id: "tag4", name: "Priority", color: "#FF6B00", orgId: "org-1" }
  ];
  for (const t of seedTags) {
    await db.prepare("INSERT OR IGNORE INTO tags (id, org_id, name, color) VALUES (?, ?, ?, ?)").bind(t.id, t.orgId, t.name, t.color).run();
  }
  return c.json({ success: true, message: "Seed data inserted" });
});
var seed_default = app17;

// src/routes/records.ts
var app18 = new Hono2();
app18.put("/transfer", async (c) => {
  const db = c.env.DB;
  const orgId = getOrgId(c);
  const userId = getUserId(c);
  const body = await c.req.json();
  const { record_type, record_id, to_user_id, reason } = body;
  if (!record_type || !record_id || !to_user_id) {
    return c.json({ error: "record_type, record_id, and to_user_id are required" }, 400);
  }
  const user = await db.prepare("SELECT * FROM users WHERE id = ? AND org_id = ?").bind(userId, orgId).first();
  if (!user)
    return c.json({ error: "User not found" }, 404);
  const toUser = await db.prepare("SELECT * FROM users WHERE id = ? AND org_id = ?").bind(to_user_id, orgId).first();
  if (!toUser)
    return c.json({ error: "Target user not found" }, 404);
  const tableMap = {
    lead: "leads",
    vendor: "vendors",
    client: "clients",
    contact: "contacts",
    deal: "deals",
    account: "accounts",
    activity: "activities",
    case: "cases"
  };
  const table = tableMap[record_type];
  if (!table)
    return c.json({ error: "Invalid record_type" }, 400);
  const record = await db.prepare(`SELECT * FROM ${table} WHERE id = ? AND org_id = ?`).bind(record_id, orgId).first();
  if (!record)
    return c.json({ error: "Record not found" }, 404);
  const isAdmin = user.role === "admin" || user.is_admin === 1;
  if (!isAdmin && record.owner_id !== userId) {
    return c.json({ error: "Only record owner or admin can transfer" }, 403);
  }
  const fromUserId = record.owner_id || null;
  const ts = now();
  await db.prepare(`UPDATE ${table} SET owner_id = ?, owner_name = ?, updated_at = ? WHERE id = ?`).bind(to_user_id, toUser.name, ts, record_id).run();
  const transferId = uuid();
  await db.prepare(
    "INSERT INTO record_transfers (id, record_type, record_id, from_user_id, to_user_id, transferred_by, reason, org_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(transferId, record_type, record_id, fromUserId, to_user_id, userId, reason || null, orgId).run();
  return c.json({ success: true, transfer_id: transferId });
});
app18.post("/share", async (c) => {
  const db = c.env.DB;
  const orgId = getOrgId(c);
  const userId = getUserId(c);
  const body = await c.req.json();
  const { record_type, record_id, user_id, permission } = body;
  if (!record_type || !record_id || !user_id) {
    return c.json({ error: "record_type, record_id, and user_id are required" }, 400);
  }
  const user = await db.prepare("SELECT * FROM users WHERE id = ? AND org_id = ?").bind(userId, orgId).first();
  if (!user)
    return c.json({ error: "User not found" }, 404);
  const tableMap = {
    lead: "leads",
    vendor: "vendors",
    client: "clients",
    contact: "contacts",
    deal: "deals",
    account: "accounts",
    activity: "activities",
    case: "cases"
  };
  const table = tableMap[record_type];
  if (!table)
    return c.json({ error: "Invalid record_type" }, 400);
  const record = await db.prepare(`SELECT * FROM ${table} WHERE id = ? AND org_id = ?`).bind(record_id, orgId).first();
  if (!record)
    return c.json({ error: "Record not found" }, 404);
  const isAdmin = user.role === "admin" || user.is_admin === 1;
  if (!isAdmin && record.owner_id !== userId) {
    return c.json({ error: "Only record owner or admin can share" }, 403);
  }
  const targetUser = await db.prepare("SELECT * FROM users WHERE id = ? AND org_id = ?").bind(user_id, orgId).first();
  if (!targetUser)
    return c.json({ error: "Target user not found in org" }, 404);
  const shareId = uuid();
  try {
    await db.prepare(
      "INSERT INTO record_shares (id, record_type, record_id, shared_with_user_id, permission, shared_by, org_id) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).bind(shareId, record_type, record_id, user_id, permission || "view", userId, orgId).run();
  } catch (e) {
    if (e.message?.includes("UNIQUE")) {
      await db.prepare(
        "UPDATE record_shares SET permission = ? WHERE record_type = ? AND record_id = ? AND shared_with_user_id = ?"
      ).bind(permission || "view", record_type, record_id, user_id).run();
      return c.json({ success: true, updated: true });
    }
    throw e;
  }
  return c.json({ success: true, share_id: shareId }, 201);
});
app18.delete("/share/:id", async (c) => {
  const db = c.env.DB;
  const orgId = getOrgId(c);
  const userId = getUserId(c);
  const shareId = c.req.param("id");
  const share = await db.prepare("SELECT * FROM record_shares WHERE id = ? AND org_id = ?").bind(shareId, orgId).first();
  if (!share)
    return c.json({ error: "Share not found" }, 404);
  const user = await db.prepare("SELECT * FROM users WHERE id = ? AND org_id = ?").bind(userId, orgId).first();
  const isAdmin = user?.role === "admin" || user?.is_admin === 1;
  if (!isAdmin && share.shared_by !== userId) {
    return c.json({ error: "Only admin or share creator can revoke" }, 403);
  }
  await db.prepare("DELETE FROM record_shares WHERE id = ?").bind(shareId).run();
  return c.json({ success: true });
});
app18.get("/shares/:recordType/:recordId", async (c) => {
  const db = c.env.DB;
  const orgId = getOrgId(c);
  const recordType = c.req.param("recordType");
  const recordId = c.req.param("recordId");
  const result = await db.prepare(
    `SELECT rs.*, u.name as shared_with_name, u.email as shared_with_email
     FROM record_shares rs
     JOIN users u ON rs.shared_with_user_id = u.id
     WHERE rs.record_type = ? AND rs.record_id = ? AND rs.org_id = ?`
  ).bind(recordType, recordId, orgId).all();
  return c.json(result.results);
});
app18.get("/shared-with-me", async (c) => {
  const db = c.env.DB;
  const orgId = getOrgId(c);
  const userId = getUserId(c);
  const result = await db.prepare(
    `SELECT rs.*, u.name as shared_by_name
     FROM record_shares rs
     JOIN users u ON rs.shared_by = u.id
     WHERE rs.shared_with_user_id = ? AND rs.org_id = ?
     ORDER BY rs.created_at DESC`
  ).bind(userId, orgId).all();
  return c.json(result.results);
});
var records_default = app18;

// src/routes/team.ts
var app19 = new Hono2();
app19.get("/hierarchy", async (c) => {
  const db = c.env.DB;
  const orgId = getOrgId(c);
  const result = await db.prepare(
    `SELECT u.id, u.name, u.email, u.role, u.title, u.department, u.manager_id, u.is_active, u.avatar_url,
            m.name as manager_name
     FROM users u
     LEFT JOIN users m ON u.manager_id = m.id
     WHERE u.org_id = ?
     ORDER BY u.name`
  ).bind(orgId).all();
  return c.json(result.results);
});
var team_default = app19;

// src/routes/users.ts
var app20 = new Hono2();
app20.get("/", async (c) => {
  const orgId = getOrgId(c);
  const result = await c.env.DB.prepare(
    `SELECT u.id, u.name, u.email, u.role, u.title, u.department, u.manager_id, u.is_active, u.avatar_url, u.is_admin,
            m.name as manager_name
     FROM users u
     LEFT JOIN users m ON u.manager_id = m.id
     WHERE u.org_id = ?
     ORDER BY u.name ASC`
  ).bind(orgId).all();
  return c.json(result.results);
});
app20.post("/invite", async (c) => {
  const db = c.env.DB;
  const orgId = getOrgId(c);
  const userId = getUserId(c);
  const body = await c.req.json();
  const { email } = body;
  if (!email)
    return c.json({ error: "Email is required" }, 400);
  const requester = await db.prepare("SELECT * FROM users WHERE id = ? AND org_id = ?").bind(userId, orgId).first();
  if (!requester || requester.role !== "admin" && requester.is_admin !== 1) {
    return c.json({ error: "Only admins can invite users" }, 403);
  }
  const domain = email.split("@")[1]?.toLowerCase();
  const orgDomain = await db.prepare("SELECT * FROM org_domains WHERE domain = ? AND org_id = ?").bind(domain, orgId).first();
  if (!orgDomain) {
    return c.json({ error: "Email domain does not match organization" }, 400);
  }
  const existing = await db.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
  if (existing) {
    return c.json({ error: "User already exists" }, 409);
  }
  const id = uuid();
  const name = email.split("@")[0];
  await db.prepare(
    "INSERT INTO users (id, org_id, email, name, role, is_admin, is_active) VALUES (?, ?, ?, ?, ?, 0, 0)"
  ).bind(id, orgId, email, name, "member").run();
  const user = await db.prepare("SELECT * FROM users WHERE id = ?").bind(id).first();
  return c.json(user, 201);
});
var users_default = app20;

// src/index.ts
var app21 = new Hono2();
app21.use("/*", cors({
  origin: "*",
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "X-User-Id", "X-Org-Id"]
}));
app21.get("/api/health", (c) => c.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() }));
app21.route("/api/auth", auth_default);
app21.route("/api/contacts", contacts_default);
app21.route("/api/accounts", accounts_default);
app21.route("/api/deals", deals_default);
app21.route("/api/activities", activities_default);
app21.route("/api/leads", leads_default);
app21.route("/api/cases", cases_default);
app21.route("/api/vendors", vendors_default);
app21.route("/api/clients", clients_default);
app21.route("/api/products", products_default);
app21.route("/api/marketing", marketing_default);
app21.route("/api/tags", tags_default);
app21.route("/api/dialer", dialer_default);
app21.route("/api/reports", reports_default);
app21.route("/api/settings", settings_default);
app21.route("/api/calendar", calendar_default);
app21.route("/api/seed", seed_default);
app21.route("/api/records", records_default);
app21.route("/api/team", team_default);
app21.route("/api/users", users_default);
var src_default = app21;

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-KZMj85/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-KZMj85/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
