// This file was compiled from typescript to javascript,
// and then run through browserify in order to package it for the browser.
// Includes base64 decoding, RLP decoding, and ENR decoding.

(function (f) { if (typeof exports === "object" && typeof module !== "undefined") { module.exports = f() } else if (typeof define === "function" && define.amd) { define([], f) } else { var g; if (typeof window !== "undefined") { g = window } else if (typeof global !== "undefined") { g = global } else if (typeof self !== "undefined") { g = self } else { g = this } g.ENR = f() } })(function () {
    var define, module, exports; return (function () { function r(e, n, t) { function o(i, f) { if (!n[i]) { if (!e[i]) { var c = "function" == typeof require && require; if (!f && c) return c(i, !0); if (u) return u(i, !0); var a = new Error("Cannot find module '" + i + "'"); throw a.code = "MODULE_NOT_FOUND", a } var p = n[i] = { exports: {} }; e[i][0].call(p.exports, function (r) { var n = e[i][1][r]; return o(n || r) }, p, p.exports, r, e, n, t) } return n[i].exports } for (var u = "function" == typeof require && require, i = 0; i < t.length; i++)o(t[i]); return o } return r })()({
        1: [function (require, module, exports) {
            (function (Buffer) {
                (function () {
                    "use strict";
                    var __createBinding = (this && this.__createBinding) || (Object.create ? (function (o, m, k, k2) {
                        if (k2 === undefined) k2 = k;
                        var desc = Object.getOwnPropertyDescriptor(m, k);
                        if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
                            desc = { enumerable: true, get: function () { return m[k]; } };
                        }
                        Object.defineProperty(o, k2, desc);
                    }) : (function (o, m, k, k2) {
                        if (k2 === undefined) k2 = k;
                        o[k2] = m[k];
                    }));
                    var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function (o, v) {
                        Object.defineProperty(o, "default", { enumerable: true, value: v });
                    }) : function (o, v) {
                        o["default"] = v;
                    });
                    var __importStar = (this && this.__importStar) || function (mod) {
                        if (mod && mod.__esModule) return mod;
                        var result = {};
                        if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
                        __setModuleDefault(result, mod);
                        return result;
                    };
                    var __importDefault = (this && this.__importDefault) || function (mod) {
                        return (mod && mod.__esModule) ? mod : { "default": mod };
                    };
                    Object.defineProperty(exports, "__esModule", { value: true });
                    exports.ENR = void 0;
                    const RLP = __importStar(require("rlp"));
                    const base64url_1 = __importDefault(require("base64url"));
                    class ENR extends Map {
                        _nodeId;
                        constructor(kvs = {}) {
                            super(Object.entries(kvs));
                        }

                        static decodeFromValues(decoded) {
                            if (!Array.isArray(decoded)) {
                                throw new Error("Decoded ENR must be an array");
                            }
                            if (decoded.length % 2 !== 0) {
                                throw new Error("Decoded ENR must have an even number of elements");
                            }
                            const [signature, seq] = decoded;
                            if (!signature || Array.isArray(signature)) {
                                throw new Error("Decoded ENR invalid signature: must be a byte array");
                            }
                            if (!seq || Array.isArray(seq)) {
                                throw new Error("Decoded ENR invalid sequence number: must be a byte array");
                            }
                            const obj = {};
                            const signed = [seq];
                            for (let i = 2; i < decoded.length; i += 2) {
                                const k = decoded[i];
                                const v = decoded[i + 1];
                                obj[k.toString()] = Buffer.from(v);
                                signed.push(k, v);
                            }

                            const enr = new ENR(obj);
                            const seq_buffer = Buffer.from(seq);
                            return {enr, seq: seq_buffer.readIntBE(0, seq_buffer.length), signature};
                        }

                        static decode(encoded) {
                            const decoded = RLP.decode(encoded);
                            return ENR.decodeFromValues(decoded);
                        }
                        static decodeTxt(encoded) {
                            if (!encoded.startsWith("enr:")) {
                                throw new Error("string encoded ENR must start with 'enr:'");
                            }
                            return ENR.decode(base64url_1.default.toBuffer(encoded.slice(4)));
                        }
                        get ip() {
                            const raw = this.get("ip");
                            if (raw) {
                                return toNewUint8Array(raw).reduce((acc, n) => {acc.push(n); return acc;}, []).join(".")
                            }
                            else {
                                return undefined;
                            }
                        }
                        get udp() {
                            const raw = this.get("udp");
                            if (raw) {
                                return (new DataView(toNewUint8Array(raw).buffer)).getInt16();
                            }
                            else {
                                return undefined;
                            }
                        }
                    }
                    exports.ENR = ENR;
                    function toNewUint8Array(buf) {
                        const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
                        return new Uint8Array(arrayBuffer);
                    }

                }).call(this)
            }).call(this, require("buffer").Buffer)
        }, { "base64url": 5, "buffer": 6, "rlp": 8 }], 2: [function (require, module, exports) {
            'use strict'

            exports.byteLength = byteLength
            exports.toByteArray = toByteArray
            exports.fromByteArray = fromByteArray

            var lookup = []
            var revLookup = []
            var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

            var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
            for (var i = 0, len = code.length; i < len; ++i) {
                lookup[i] = code[i]
                revLookup[code.charCodeAt(i)] = i
            }

            // Support decoding URL-safe base64 strings, as Node.js does.
            // See: https://en.wikipedia.org/wiki/Base64#URL_applications
            revLookup['-'.charCodeAt(0)] = 62
            revLookup['_'.charCodeAt(0)] = 63

            function getLens(b64) {
                var len = b64.length

                if (len % 4 > 0) {
                    throw new Error('Invalid string. Length must be a multiple of 4')
                }

                // Trim off extra bytes after placeholder bytes are found
                // See: https://github.com/beatgammit/base64-js/issues/42
                var validLen = b64.indexOf('=')
                if (validLen === -1) validLen = len

                var placeHoldersLen = validLen === len
                    ? 0
                    : 4 - (validLen % 4)

                return [validLen, placeHoldersLen]
            }

            // base64 is 4/3 + up to two characters of the original data
            function byteLength(b64) {
                var lens = getLens(b64)
                var validLen = lens[0]
                var placeHoldersLen = lens[1]
                return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
            }

            function _byteLength(b64, validLen, placeHoldersLen) {
                return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
            }

            function toByteArray(b64) {
                var tmp
                var lens = getLens(b64)
                var validLen = lens[0]
                var placeHoldersLen = lens[1]

                var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

                var curByte = 0

                // if there are placeholders, only get up to the last complete 4 chars
                var len = placeHoldersLen > 0
                    ? validLen - 4
                    : validLen

                var i
                for (i = 0; i < len; i += 4) {
                    tmp =
                        (revLookup[b64.charCodeAt(i)] << 18) |
                        (revLookup[b64.charCodeAt(i + 1)] << 12) |
                        (revLookup[b64.charCodeAt(i + 2)] << 6) |
                        revLookup[b64.charCodeAt(i + 3)]
                    arr[curByte++] = (tmp >> 16) & 0xFF
                    arr[curByte++] = (tmp >> 8) & 0xFF
                    arr[curByte++] = tmp & 0xFF
                }

                if (placeHoldersLen === 2) {
                    tmp =
                        (revLookup[b64.charCodeAt(i)] << 2) |
                        (revLookup[b64.charCodeAt(i + 1)] >> 4)
                    arr[curByte++] = tmp & 0xFF
                }

                if (placeHoldersLen === 1) {
                    tmp =
                        (revLookup[b64.charCodeAt(i)] << 10) |
                        (revLookup[b64.charCodeAt(i + 1)] << 4) |
                        (revLookup[b64.charCodeAt(i + 2)] >> 2)
                    arr[curByte++] = (tmp >> 8) & 0xFF
                    arr[curByte++] = tmp & 0xFF
                }

                return arr
            }

            function tripletToBase64(num) {
                return lookup[num >> 18 & 0x3F] +
                    lookup[num >> 12 & 0x3F] +
                    lookup[num >> 6 & 0x3F] +
                    lookup[num & 0x3F]
            }

            function encodeChunk(uint8, start, end) {
                var tmp
                var output = []
                for (var i = start; i < end; i += 3) {
                    tmp =
                        ((uint8[i] << 16) & 0xFF0000) +
                        ((uint8[i + 1] << 8) & 0xFF00) +
                        (uint8[i + 2] & 0xFF)
                    output.push(tripletToBase64(tmp))
                }
                return output.join('')
            }

            function fromByteArray(uint8) {
                var tmp
                var len = uint8.length
                var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
                var parts = []
                var maxChunkLength = 16383 // must be multiple of 3

                // go through the array every three bytes, we'll deal with trailing stuff later
                for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
                    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
                }

                // pad the end with zeros, but make sure to not forget the extra bytes
                if (extraBytes === 1) {
                    tmp = uint8[len - 1]
                    parts.push(
                        lookup[tmp >> 2] +
                        lookup[(tmp << 4) & 0x3F] +
                        '=='
                    )
                } else if (extraBytes === 2) {
                    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
                    parts.push(
                        lookup[tmp >> 10] +
                        lookup[(tmp >> 4) & 0x3F] +
                        lookup[(tmp << 2) & 0x3F] +
                        '='
                    )
                }

                return parts.join('')
            }

        }, {}], 3: [function (require, module, exports) {
            (function (Buffer) {
                (function () {
                    "use strict";
                    Object.defineProperty(exports, "__esModule", { value: true });
                    var pad_string_1 = require("./pad-string");
                    function encode(input, encoding) {
                        if (encoding === void 0) { encoding = "utf8"; }
                        if (Buffer.isBuffer(input)) {
                            return fromBase64(input.toString("base64"));
                        }
                        return fromBase64(Buffer.from(input, encoding).toString("base64"));
                    }
                    ;
                    function decode(base64url, encoding) {
                        if (encoding === void 0) { encoding = "utf8"; }
                        return Buffer.from(toBase64(base64url), "base64").toString(encoding);
                    }
                    function toBase64(base64url) {
                        base64url = base64url.toString();
                        return pad_string_1.default(base64url)
                            .replace(/\-/g, "+")
                            .replace(/_/g, "/");
                    }
                    function fromBase64(base64) {
                        return base64
                            .replace(/=/g, "")
                            .replace(/\+/g, "-")
                            .replace(/\//g, "_");
                    }
                    function toBuffer(base64url) {
                        return Buffer.from(toBase64(base64url), "base64");
                    }
                    var base64url = encode;
                    base64url.encode = encode;
                    base64url.decode = decode;
                    base64url.toBase64 = toBase64;
                    base64url.fromBase64 = fromBase64;
                    base64url.toBuffer = toBuffer;
                    exports.default = base64url;

                }).call(this)
            }).call(this, require("buffer").Buffer)
        }, { "./pad-string": 4, "buffer": 6 }], 4: [function (require, module, exports) {
            (function (Buffer) {
                (function () {
                    "use strict";
                    Object.defineProperty(exports, "__esModule", { value: true });
                    function padString(input) {
                        var segmentLength = 4;
                        var stringLength = input.length;
                        var diff = stringLength % segmentLength;
                        if (!diff) {
                            return input;
                        }
                        var position = stringLength;
                        var padLength = segmentLength - diff;
                        var paddedStringLength = stringLength + padLength;
                        var buffer = Buffer.alloc(paddedStringLength);
                        buffer.write(input);
                        while (padLength--) {
                            buffer.write("=", position++);
                        }
                        return buffer.toString();
                    }
                    exports.default = padString;

                }).call(this)
            }).call(this, require("buffer").Buffer)
        }, { "buffer": 6 }], 5: [function (require, module, exports) {
            module.exports = require('./dist/base64url').default;
            module.exports.default = module.exports;

        }, { "./dist/base64url": 3 }], 6: [function (require, module, exports) {
            (function (Buffer) {
                (function () {
                    /*!
                     * The buffer module from node.js, for the browser.
                     *
                     * @author   Feross Aboukhadijeh <https://feross.org>
                     * @license  MIT
                     */
                    /* eslint-disable no-proto */

                    'use strict'

                    var base64 = require('base64-js')
                    var ieee754 = require('ieee754')

                    exports.Buffer = Buffer
                    exports.SlowBuffer = SlowBuffer
                    exports.INSPECT_MAX_BYTES = 50

                    var K_MAX_LENGTH = 0x7fffffff
                    exports.kMaxLength = K_MAX_LENGTH

                    /**
                     * If `Buffer.TYPED_ARRAY_SUPPORT`:
                     *   === true    Use Uint8Array implementation (fastest)
                     *   === false   Print warning and recommend using `buffer` v4.x which has an Object
                     *               implementation (most compatible, even IE6)
                     *
                     * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
                     * Opera 11.6+, iOS 4.2+.
                     *
                     * We report that the browser does not support typed arrays if the are not subclassable
                     * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
                     * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
                     * for __proto__ and has a buggy typed array implementation.
                     */
                    Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

                    if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
                        typeof console.error === 'function') {
                        console.error(
                            'This browser lacks typed array (Uint8Array) support which is required by ' +
                            '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
                        )
                    }

                    function typedArraySupport() {
                        // Can typed array instances can be augmented?
                        try {
                            var arr = new Uint8Array(1)
                            arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
                            return arr.foo() === 42
                        } catch (e) {
                            return false
                        }
                    }

                    Object.defineProperty(Buffer.prototype, 'parent', {
                        enumerable: true,
                        get: function () {
                            if (!Buffer.isBuffer(this)) return undefined
                            return this.buffer
                        }
                    })

                    Object.defineProperty(Buffer.prototype, 'offset', {
                        enumerable: true,
                        get: function () {
                            if (!Buffer.isBuffer(this)) return undefined
                            return this.byteOffset
                        }
                    })

                    function createBuffer(length) {
                        if (length > K_MAX_LENGTH) {
                            throw new RangeError('The value "' + length + '" is invalid for option "size"')
                        }
                        // Return an augmented `Uint8Array` instance
                        var buf = new Uint8Array(length)
                        buf.__proto__ = Buffer.prototype
                        return buf
                    }

                    /**
                     * The Buffer constructor returns instances of `Uint8Array` that have their
                     * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
                     * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
                     * and the `Uint8Array` methods. Square bracket notation works as expected -- it
                     * returns a single octet.
                     *
                     * The `Uint8Array` prototype remains unmodified.
                     */

                    function Buffer(arg, encodingOrOffset, length) {
                        // Common case.
                        if (typeof arg === 'number') {
                            if (typeof encodingOrOffset === 'string') {
                                throw new TypeError(
                                    'The "string" argument must be of type string. Received type number'
                                )
                            }
                            return allocUnsafe(arg)
                        }
                        return from(arg, encodingOrOffset, length)
                    }

                    // Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
                    if (typeof Symbol !== 'undefined' && Symbol.species != null &&
                        Buffer[Symbol.species] === Buffer) {
                        Object.defineProperty(Buffer, Symbol.species, {
                            value: null,
                            configurable: true,
                            enumerable: false,
                            writable: false
                        })
                    }

                    Buffer.poolSize = 8192 // not used by this implementation

                    function from(value, encodingOrOffset, length) {
                        if (typeof value === 'string') {
                            return fromString(value, encodingOrOffset)
                        }

                        if (ArrayBuffer.isView(value)) {
                            return fromArrayLike(value)
                        }

                        if (value == null) {
                            throw TypeError(
                                'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
                                'or Array-like Object. Received type ' + (typeof value)
                            )
                        }

                        if (isInstance(value, ArrayBuffer) ||
                            (value && isInstance(value.buffer, ArrayBuffer))) {
                            return fromArrayBuffer(value, encodingOrOffset, length)
                        }

                        if (typeof value === 'number') {
                            throw new TypeError(
                                'The "value" argument must not be of type number. Received type number'
                            )
                        }

                        var valueOf = value.valueOf && value.valueOf()
                        if (valueOf != null && valueOf !== value) {
                            return Buffer.from(valueOf, encodingOrOffset, length)
                        }

                        var b = fromObject(value)
                        if (b) return b

                        if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
                            typeof value[Symbol.toPrimitive] === 'function') {
                            return Buffer.from(
                                value[Symbol.toPrimitive]('string'), encodingOrOffset, length
                            )
                        }

                        throw new TypeError(
                            'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
                            'or Array-like Object. Received type ' + (typeof value)
                        )
                    }

                    /**
                     * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
                     * if value is a number.
                     * Buffer.from(str[, encoding])
                     * Buffer.from(array)
                     * Buffer.from(buffer)
                     * Buffer.from(arrayBuffer[, byteOffset[, length]])
                     **/
                    Buffer.from = function (value, encodingOrOffset, length) {
                        return from(value, encodingOrOffset, length)
                    }

                    // Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
                    // https://github.com/feross/buffer/pull/148
                    Buffer.prototype.__proto__ = Uint8Array.prototype
                    Buffer.__proto__ = Uint8Array

                    function assertSize(size) {
                        if (typeof size !== 'number') {
                            throw new TypeError('"size" argument must be of type number')
                        } else if (size < 0) {
                            throw new RangeError('The value "' + size + '" is invalid for option "size"')
                        }
                    }

                    function alloc(size, fill, encoding) {
                        assertSize(size)
                        if (size <= 0) {
                            return createBuffer(size)
                        }
                        if (fill !== undefined) {
                            // Only pay attention to encoding if it's a string. This
                            // prevents accidentally sending in a number that would
                            // be interpreted as a start offset.
                            return typeof encoding === 'string'
                                ? createBuffer(size).fill(fill, encoding)
                                : createBuffer(size).fill(fill)
                        }
                        return createBuffer(size)
                    }

                    /**
                     * Creates a new filled Buffer instance.
                     * alloc(size[, fill[, encoding]])
                     **/
                    Buffer.alloc = function (size, fill, encoding) {
                        return alloc(size, fill, encoding)
                    }

                    function allocUnsafe(size) {
                        assertSize(size)
                        return createBuffer(size < 0 ? 0 : checked(size) | 0)
                    }

                    /**
                     * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
                     * */
                    Buffer.allocUnsafe = function (size) {
                        return allocUnsafe(size)
                    }
                    /**
                     * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
                     */
                    Buffer.allocUnsafeSlow = function (size) {
                        return allocUnsafe(size)
                    }

                    function fromString(string, encoding) {
                        if (typeof encoding !== 'string' || encoding === '') {
                            encoding = 'utf8'
                        }

                        if (!Buffer.isEncoding(encoding)) {
                            throw new TypeError('Unknown encoding: ' + encoding)
                        }

                        var length = byteLength(string, encoding) | 0
                        var buf = createBuffer(length)

                        var actual = buf.write(string, encoding)

                        if (actual !== length) {
                            // Writing a hex string, for example, that contains invalid characters will
                            // cause everything after the first invalid character to be ignored. (e.g.
                            // 'abxxcd' will be treated as 'ab')
                            buf = buf.slice(0, actual)
                        }

                        return buf
                    }

                    function fromArrayLike(array) {
                        var length = array.length < 0 ? 0 : checked(array.length) | 0
                        var buf = createBuffer(length)
                        for (var i = 0; i < length; i += 1) {
                            buf[i] = array[i] & 255
                        }
                        return buf
                    }

                    function fromArrayBuffer(array, byteOffset, length) {
                        if (byteOffset < 0 || array.byteLength < byteOffset) {
                            throw new RangeError('"offset" is outside of buffer bounds')
                        }

                        if (array.byteLength < byteOffset + (length || 0)) {
                            throw new RangeError('"length" is outside of buffer bounds')
                        }

                        var buf
                        if (byteOffset === undefined && length === undefined) {
                            buf = new Uint8Array(array)
                        } else if (length === undefined) {
                            buf = new Uint8Array(array, byteOffset)
                        } else {
                            buf = new Uint8Array(array, byteOffset, length)
                        }

                        // Return an augmented `Uint8Array` instance
                        buf.__proto__ = Buffer.prototype
                        return buf
                    }

                    function fromObject(obj) {
                        if (Buffer.isBuffer(obj)) {
                            var len = checked(obj.length) | 0
                            var buf = createBuffer(len)

                            if (buf.length === 0) {
                                return buf
                            }

                            obj.copy(buf, 0, 0, len)
                            return buf
                        }

                        if (obj.length !== undefined) {
                            if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
                                return createBuffer(0)
                            }
                            return fromArrayLike(obj)
                        }

                        if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
                            return fromArrayLike(obj.data)
                        }
                    }

                    function checked(length) {
                        // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
                        // length is NaN (which is otherwise coerced to zero.)
                        if (length >= K_MAX_LENGTH) {
                            throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                                'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
                        }
                        return length | 0
                    }

                    function SlowBuffer(length) {
                        if (+length != length) { // eslint-disable-line eqeqeq
                            length = 0
                        }
                        return Buffer.alloc(+length)
                    }

                    Buffer.isBuffer = function isBuffer(b) {
                        return b != null && b._isBuffer === true &&
                            b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
                    }

                    Buffer.compare = function compare(a, b) {
                        if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
                        if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
                        if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
                            throw new TypeError(
                                'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
                            )
                        }

                        if (a === b) return 0

                        var x = a.length
                        var y = b.length

                        for (var i = 0, len = Math.min(x, y); i < len; ++i) {
                            if (a[i] !== b[i]) {
                                x = a[i]
                                y = b[i]
                                break
                            }
                        }

                        if (x < y) return -1
                        if (y < x) return 1
                        return 0
                    }

                    Buffer.isEncoding = function isEncoding(encoding) {
                        switch (String(encoding).toLowerCase()) {
                            case 'hex':
                            case 'utf8':
                            case 'utf-8':
                            case 'ascii':
                            case 'latin1':
                            case 'binary':
                            case 'base64':
                            case 'ucs2':
                            case 'ucs-2':
                            case 'utf16le':
                            case 'utf-16le':
                                return true
                            default:
                                return false
                        }
                    }

                    Buffer.concat = function concat(list, length) {
                        if (!Array.isArray(list)) {
                            throw new TypeError('"list" argument must be an Array of Buffers')
                        }

                        if (list.length === 0) {
                            return Buffer.alloc(0)
                        }

                        var i
                        if (length === undefined) {
                            length = 0
                            for (i = 0; i < list.length; ++i) {
                                length += list[i].length
                            }
                        }

                        var buffer = Buffer.allocUnsafe(length)
                        var pos = 0
                        for (i = 0; i < list.length; ++i) {
                            var buf = list[i]
                            if (isInstance(buf, Uint8Array)) {
                                buf = Buffer.from(buf)
                            }
                            if (!Buffer.isBuffer(buf)) {
                                throw new TypeError('"list" argument must be an Array of Buffers')
                            }
                            buf.copy(buffer, pos)
                            pos += buf.length
                        }
                        return buffer
                    }

                    function byteLength(string, encoding) {
                        if (Buffer.isBuffer(string)) {
                            return string.length
                        }
                        if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
                            return string.byteLength
                        }
                        if (typeof string !== 'string') {
                            throw new TypeError(
                                'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
                                'Received type ' + typeof string
                            )
                        }

                        var len = string.length
                        var mustMatch = (arguments.length > 2 && arguments[2] === true)
                        if (!mustMatch && len === 0) return 0

                        // Use a for loop to avoid recursion
                        var loweredCase = false
                        for (; ;) {
                            switch (encoding) {
                                case 'ascii':
                                case 'latin1':
                                case 'binary':
                                    return len
                                case 'utf8':
                                case 'utf-8':
                                    return utf8ToBytes(string).length
                                case 'ucs2':
                                case 'ucs-2':
                                case 'utf16le':
                                case 'utf-16le':
                                    return len * 2
                                case 'hex':
                                    return len >>> 1
                                case 'base64':
                                    return base64ToBytes(string).length
                                default:
                                    if (loweredCase) {
                                        return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
                                    }
                                    encoding = ('' + encoding).toLowerCase()
                                    loweredCase = true
                            }
                        }
                    }
                    Buffer.byteLength = byteLength

                    function slowToString(encoding, start, end) {
                        var loweredCase = false

                        // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
                        // property of a typed array.

                        // This behaves neither like String nor Uint8Array in that we set start/end
                        // to their upper/lower bounds if the value passed is out of range.
                        // undefined is handled specially as per ECMA-262 6th Edition,
                        // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
                        if (start === undefined || start < 0) {
                            start = 0
                        }
                        // Return early if start > this.length. Done here to prevent potential uint32
                        // coercion fail below.
                        if (start > this.length) {
                            return ''
                        }

                        if (end === undefined || end > this.length) {
                            end = this.length
                        }

                        if (end <= 0) {
                            return ''
                        }

                        // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
                        end >>>= 0
                        start >>>= 0

                        if (end <= start) {
                            return ''
                        }

                        if (!encoding) encoding = 'utf8'

                        while (true) {
                            switch (encoding) {
                                case 'hex':
                                    return hexSlice(this, start, end)

                                case 'utf8':
                                case 'utf-8':
                                    return utf8Slice(this, start, end)

                                case 'ascii':
                                    return asciiSlice(this, start, end)

                                case 'latin1':
                                case 'binary':
                                    return latin1Slice(this, start, end)

                                case 'base64':
                                    return base64Slice(this, start, end)

                                case 'ucs2':
                                case 'ucs-2':
                                case 'utf16le':
                                case 'utf-16le':
                                    return utf16leSlice(this, start, end)

                                default:
                                    if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
                                    encoding = (encoding + '').toLowerCase()
                                    loweredCase = true
                            }
                        }
                    }

                    // This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
                    // to detect a Buffer instance. It's not possible to use `instanceof Buffer`
                    // reliably in a browserify context because there could be multiple different
                    // copies of the 'buffer' package in use. This method works even for Buffer
                    // instances that were created from another copy of the `buffer` package.
                    // See: https://github.com/feross/buffer/issues/154
                    Buffer.prototype._isBuffer = true

                    function swap(b, n, m) {
                        var i = b[n]
                        b[n] = b[m]
                        b[m] = i
                    }

                    Buffer.prototype.swap16 = function swap16() {
                        var len = this.length
                        if (len % 2 !== 0) {
                            throw new RangeError('Buffer size must be a multiple of 16-bits')
                        }
                        for (var i = 0; i < len; i += 2) {
                            swap(this, i, i + 1)
                        }
                        return this
                    }

                    Buffer.prototype.swap32 = function swap32() {
                        var len = this.length
                        if (len % 4 !== 0) {
                            throw new RangeError('Buffer size must be a multiple of 32-bits')
                        }
                        for (var i = 0; i < len; i += 4) {
                            swap(this, i, i + 3)
                            swap(this, i + 1, i + 2)
                        }
                        return this
                    }

                    Buffer.prototype.swap64 = function swap64() {
                        var len = this.length
                        if (len % 8 !== 0) {
                            throw new RangeError('Buffer size must be a multiple of 64-bits')
                        }
                        for (var i = 0; i < len; i += 8) {
                            swap(this, i, i + 7)
                            swap(this, i + 1, i + 6)
                            swap(this, i + 2, i + 5)
                            swap(this, i + 3, i + 4)
                        }
                        return this
                    }

                    Buffer.prototype.toString = function toString() {
                        var length = this.length
                        if (length === 0) return ''
                        if (arguments.length === 0) return utf8Slice(this, 0, length)
                        return slowToString.apply(this, arguments)
                    }

                    Buffer.prototype.toLocaleString = Buffer.prototype.toString

                    Buffer.prototype.equals = function equals(b) {
                        if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
                        if (this === b) return true
                        return Buffer.compare(this, b) === 0
                    }

                    Buffer.prototype.inspect = function inspect() {
                        var str = ''
                        var max = exports.INSPECT_MAX_BYTES
                        str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
                        if (this.length > max) str += ' ... '
                        return '<Buffer ' + str + '>'
                    }

                    Buffer.prototype.compare = function compare(target, start, end, thisStart, thisEnd) {
                        if (isInstance(target, Uint8Array)) {
                            target = Buffer.from(target, target.offset, target.byteLength)
                        }
                        if (!Buffer.isBuffer(target)) {
                            throw new TypeError(
                                'The "target" argument must be one of type Buffer or Uint8Array. ' +
                                'Received type ' + (typeof target)
                            )
                        }

                        if (start === undefined) {
                            start = 0
                        }
                        if (end === undefined) {
                            end = target ? target.length : 0
                        }
                        if (thisStart === undefined) {
                            thisStart = 0
                        }
                        if (thisEnd === undefined) {
                            thisEnd = this.length
                        }

                        if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
                            throw new RangeError('out of range index')
                        }

                        if (thisStart >= thisEnd && start >= end) {
                            return 0
                        }
                        if (thisStart >= thisEnd) {
                            return -1
                        }
                        if (start >= end) {
                            return 1
                        }

                        start >>>= 0
                        end >>>= 0
                        thisStart >>>= 0
                        thisEnd >>>= 0

                        if (this === target) return 0

                        var x = thisEnd - thisStart
                        var y = end - start
                        var len = Math.min(x, y)

                        var thisCopy = this.slice(thisStart, thisEnd)
                        var targetCopy = target.slice(start, end)

                        for (var i = 0; i < len; ++i) {
                            if (thisCopy[i] !== targetCopy[i]) {
                                x = thisCopy[i]
                                y = targetCopy[i]
                                break
                            }
                        }

                        if (x < y) return -1
                        if (y < x) return 1
                        return 0
                    }

                    // Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
                    // OR the last index of `val` in `buffer` at offset <= `byteOffset`.
                    //
                    // Arguments:
                    // - buffer - a Buffer to search
                    // - val - a string, Buffer, or number
                    // - byteOffset - an index into `buffer`; will be clamped to an int32
                    // - encoding - an optional encoding, relevant is val is a string
                    // - dir - true for indexOf, false for lastIndexOf
                    function bidirectionalIndexOf(buffer, val, byteOffset, encoding, dir) {
                        // Empty buffer means no match
                        if (buffer.length === 0) return -1

                        // Normalize byteOffset
                        if (typeof byteOffset === 'string') {
                            encoding = byteOffset
                            byteOffset = 0
                        } else if (byteOffset > 0x7fffffff) {
                            byteOffset = 0x7fffffff
                        } else if (byteOffset < -0x80000000) {
                            byteOffset = -0x80000000
                        }
                        byteOffset = +byteOffset // Coerce to Number.
                        if (numberIsNaN(byteOffset)) {
                            // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
                            byteOffset = dir ? 0 : (buffer.length - 1)
                        }

                        // Normalize byteOffset: negative offsets start from the end of the buffer
                        if (byteOffset < 0) byteOffset = buffer.length + byteOffset
                        if (byteOffset >= buffer.length) {
                            if (dir) return -1
                            else byteOffset = buffer.length - 1
                        } else if (byteOffset < 0) {
                            if (dir) byteOffset = 0
                            else return -1
                        }

                        // Normalize val
                        if (typeof val === 'string') {
                            val = Buffer.from(val, encoding)
                        }

                        // Finally, search either indexOf (if dir is true) or lastIndexOf
                        if (Buffer.isBuffer(val)) {
                            // Special case: looking for empty string/buffer always fails
                            if (val.length === 0) {
                                return -1
                            }
                            return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
                        } else if (typeof val === 'number') {
                            val = val & 0xFF // Search for a byte value [0-255]
                            if (typeof Uint8Array.prototype.indexOf === 'function') {
                                if (dir) {
                                    return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
                                } else {
                                    return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
                                }
                            }
                            return arrayIndexOf(buffer, [val], byteOffset, encoding, dir)
                        }

                        throw new TypeError('val must be string, number or Buffer')
                    }

                    function arrayIndexOf(arr, val, byteOffset, encoding, dir) {
                        var indexSize = 1
                        var arrLength = arr.length
                        var valLength = val.length

                        if (encoding !== undefined) {
                            encoding = String(encoding).toLowerCase()
                            if (encoding === 'ucs2' || encoding === 'ucs-2' ||
                                encoding === 'utf16le' || encoding === 'utf-16le') {
                                if (arr.length < 2 || val.length < 2) {
                                    return -1
                                }
                                indexSize = 2
                                arrLength /= 2
                                valLength /= 2
                                byteOffset /= 2
                            }
                        }

                        function read(buf, i) {
                            if (indexSize === 1) {
                                return buf[i]
                            } else {
                                return buf.readUInt16BE(i * indexSize)
                            }
                        }

                        var i
                        if (dir) {
                            var foundIndex = -1
                            for (i = byteOffset; i < arrLength; i++) {
                                if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
                                    if (foundIndex === -1) foundIndex = i
                                    if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
                                } else {
                                    if (foundIndex !== -1) i -= i - foundIndex
                                    foundIndex = -1
                                }
                            }
                        } else {
                            if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
                            for (i = byteOffset; i >= 0; i--) {
                                var found = true
                                for (var j = 0; j < valLength; j++) {
                                    if (read(arr, i + j) !== read(val, j)) {
                                        found = false
                                        break
                                    }
                                }
                                if (found) return i
                            }
                        }

                        return -1
                    }

                    Buffer.prototype.includes = function includes(val, byteOffset, encoding) {
                        return this.indexOf(val, byteOffset, encoding) !== -1
                    }

                    Buffer.prototype.indexOf = function indexOf(val, byteOffset, encoding) {
                        return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
                    }

                    Buffer.prototype.lastIndexOf = function lastIndexOf(val, byteOffset, encoding) {
                        return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
                    }

                    function hexWrite(buf, string, offset, length) {
                        offset = Number(offset) || 0
                        var remaining = buf.length - offset
                        if (!length) {
                            length = remaining
                        } else {
                            length = Number(length)
                            if (length > remaining) {
                                length = remaining
                            }
                        }

                        var strLen = string.length

                        if (length > strLen / 2) {
                            length = strLen / 2
                        }
                        for (var i = 0; i < length; ++i) {
                            var parsed = parseInt(string.substr(i * 2, 2), 16)
                            if (numberIsNaN(parsed)) return i
                            buf[offset + i] = parsed
                        }
                        return i
                    }

                    function utf8Write(buf, string, offset, length) {
                        return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
                    }

                    function asciiWrite(buf, string, offset, length) {
                        return blitBuffer(asciiToBytes(string), buf, offset, length)
                    }

                    function latin1Write(buf, string, offset, length) {
                        return asciiWrite(buf, string, offset, length)
                    }

                    function base64Write(buf, string, offset, length) {
                        return blitBuffer(base64ToBytes(string), buf, offset, length)
                    }

                    function ucs2Write(buf, string, offset, length) {
                        return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
                    }

                    Buffer.prototype.write = function write(string, offset, length, encoding) {
                        // Buffer#write(string)
                        if (offset === undefined) {
                            encoding = 'utf8'
                            length = this.length
                            offset = 0
                            // Buffer#write(string, encoding)
                        } else if (length === undefined && typeof offset === 'string') {
                            encoding = offset
                            length = this.length
                            offset = 0
                            // Buffer#write(string, offset[, length][, encoding])
                        } else if (isFinite(offset)) {
                            offset = offset >>> 0
                            if (isFinite(length)) {
                                length = length >>> 0
                                if (encoding === undefined) encoding = 'utf8'
                            } else {
                                encoding = length
                                length = undefined
                            }
                        } else {
                            throw new Error(
                                'Buffer.write(string, encoding, offset[, length]) is no longer supported'
                            )
                        }

                        var remaining = this.length - offset
                        if (length === undefined || length > remaining) length = remaining

                        if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
                            throw new RangeError('Attempt to write outside buffer bounds')
                        }

                        if (!encoding) encoding = 'utf8'

                        var loweredCase = false
                        for (; ;) {
                            switch (encoding) {
                                case 'hex':
                                    return hexWrite(this, string, offset, length)

                                case 'utf8':
                                case 'utf-8':
                                    return utf8Write(this, string, offset, length)

                                case 'ascii':
                                    return asciiWrite(this, string, offset, length)

                                case 'latin1':
                                case 'binary':
                                    return latin1Write(this, string, offset, length)

                                case 'base64':
                                    // Warning: maxLength not taken into account in base64Write
                                    return base64Write(this, string, offset, length)

                                case 'ucs2':
                                case 'ucs-2':
                                case 'utf16le':
                                case 'utf-16le':
                                    return ucs2Write(this, string, offset, length)

                                default:
                                    if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
                                    encoding = ('' + encoding).toLowerCase()
                                    loweredCase = true
                            }
                        }
                    }

                    Buffer.prototype.toJSON = function toJSON() {
                        return {
                            type: 'Buffer',
                            data: Array.prototype.slice.call(this._arr || this, 0)
                        }
                    }

                    function base64Slice(buf, start, end) {
                        if (start === 0 && end === buf.length) {
                            return base64.fromByteArray(buf)
                        } else {
                            return base64.fromByteArray(buf.slice(start, end))
                        }
                    }

                    function utf8Slice(buf, start, end) {
                        end = Math.min(buf.length, end)
                        var res = []

                        var i = start
                        while (i < end) {
                            var firstByte = buf[i]
                            var codePoint = null
                            var bytesPerSequence = (firstByte > 0xEF) ? 4
                                : (firstByte > 0xDF) ? 3
                                    : (firstByte > 0xBF) ? 2
                                        : 1

                            if (i + bytesPerSequence <= end) {
                                var secondByte, thirdByte, fourthByte, tempCodePoint

                                switch (bytesPerSequence) {
                                    case 1:
                                        if (firstByte < 0x80) {
                                            codePoint = firstByte
                                        }
                                        break
                                    case 2:
                                        secondByte = buf[i + 1]
                                        if ((secondByte & 0xC0) === 0x80) {
                                            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
                                            if (tempCodePoint > 0x7F) {
                                                codePoint = tempCodePoint
                                            }
                                        }
                                        break
                                    case 3:
                                        secondByte = buf[i + 1]
                                        thirdByte = buf[i + 2]
                                        if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
                                            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
                                            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
                                                codePoint = tempCodePoint
                                            }
                                        }
                                        break
                                    case 4:
                                        secondByte = buf[i + 1]
                                        thirdByte = buf[i + 2]
                                        fourthByte = buf[i + 3]
                                        if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
                                            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
                                            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
                                                codePoint = tempCodePoint
                                            }
                                        }
                                }
                            }

                            if (codePoint === null) {
                                // we did not generate a valid codePoint so insert a
                                // replacement char (U+FFFD) and advance only 1 byte
                                codePoint = 0xFFFD
                                bytesPerSequence = 1
                            } else if (codePoint > 0xFFFF) {
                                // encode to utf16 (surrogate pair dance)
                                codePoint -= 0x10000
                                res.push(codePoint >>> 10 & 0x3FF | 0xD800)
                                codePoint = 0xDC00 | codePoint & 0x3FF
                            }

                            res.push(codePoint)
                            i += bytesPerSequence
                        }

                        return decodeCodePointsArray(res)
                    }

                    // Based on http://stackoverflow.com/a/22747272/680742, the browser with
                    // the lowest limit is Chrome, with 0x10000 args.
                    // We go 1 magnitude less, for safety
                    var MAX_ARGUMENTS_LENGTH = 0x1000

                    function decodeCodePointsArray(codePoints) {
                        var len = codePoints.length
                        if (len <= MAX_ARGUMENTS_LENGTH) {
                            return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
                        }

                        // Decode in chunks to avoid "call stack size exceeded".
                        var res = ''
                        var i = 0
                        while (i < len) {
                            res += String.fromCharCode.apply(
                                String,
                                codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
                            )
                        }
                        return res
                    }

                    function asciiSlice(buf, start, end) {
                        var ret = ''
                        end = Math.min(buf.length, end)

                        for (var i = start; i < end; ++i) {
                            ret += String.fromCharCode(buf[i] & 0x7F)
                        }
                        return ret
                    }

                    function latin1Slice(buf, start, end) {
                        var ret = ''
                        end = Math.min(buf.length, end)

                        for (var i = start; i < end; ++i) {
                            ret += String.fromCharCode(buf[i])
                        }
                        return ret
                    }

                    function hexSlice(buf, start, end) {
                        var len = buf.length

                        if (!start || start < 0) start = 0
                        if (!end || end < 0 || end > len) end = len

                        var out = ''
                        for (var i = start; i < end; ++i) {
                            out += toHex(buf[i])
                        }
                        return out
                    }

                    function utf16leSlice(buf, start, end) {
                        var bytes = buf.slice(start, end)
                        var res = ''
                        for (var i = 0; i < bytes.length; i += 2) {
                            res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
                        }
                        return res
                    }

                    Buffer.prototype.slice = function slice(start, end) {
                        var len = this.length
                        start = ~~start
                        end = end === undefined ? len : ~~end

                        if (start < 0) {
                            start += len
                            if (start < 0) start = 0
                        } else if (start > len) {
                            start = len
                        }

                        if (end < 0) {
                            end += len
                            if (end < 0) end = 0
                        } else if (end > len) {
                            end = len
                        }

                        if (end < start) end = start

                        var newBuf = this.subarray(start, end)
                        // Return an augmented `Uint8Array` instance
                        newBuf.__proto__ = Buffer.prototype
                        return newBuf
                    }

                    /*
                     * Need to make sure that buffer isn't trying to write out of bounds.
                     */
                    function checkOffset(offset, ext, length) {
                        if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
                        if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
                    }

                    Buffer.prototype.readUIntLE = function readUIntLE(offset, byteLength, noAssert) {
                        offset = offset >>> 0
                        byteLength = byteLength >>> 0
                        if (!noAssert) checkOffset(offset, byteLength, this.length)

                        var val = this[offset]
                        var mul = 1
                        var i = 0
                        while (++i < byteLength && (mul *= 0x100)) {
                            val += this[offset + i] * mul
                        }

                        return val
                    }

                    Buffer.prototype.readUIntBE = function readUIntBE(offset, byteLength, noAssert) {
                        offset = offset >>> 0
                        byteLength = byteLength >>> 0
                        if (!noAssert) {
                            checkOffset(offset, byteLength, this.length)
                        }

                        var val = this[offset + --byteLength]
                        var mul = 1
                        while (byteLength > 0 && (mul *= 0x100)) {
                            val += this[offset + --byteLength] * mul
                        }

                        return val
                    }

                    Buffer.prototype.readUInt8 = function readUInt8(offset, noAssert) {
                        offset = offset >>> 0
                        if (!noAssert) checkOffset(offset, 1, this.length)
                        return this[offset]
                    }

                    Buffer.prototype.readUInt16LE = function readUInt16LE(offset, noAssert) {
                        offset = offset >>> 0
                        if (!noAssert) checkOffset(offset, 2, this.length)
                        return this[offset] | (this[offset + 1] << 8)
                    }

                    Buffer.prototype.readUInt16BE = function readUInt16BE(offset, noAssert) {
                        offset = offset >>> 0
                        if (!noAssert) checkOffset(offset, 2, this.length)
                        return (this[offset] << 8) | this[offset + 1]
                    }

                    Buffer.prototype.readUInt32LE = function readUInt32LE(offset, noAssert) {
                        offset = offset >>> 0
                        if (!noAssert) checkOffset(offset, 4, this.length)

                        return ((this[offset]) |
                            (this[offset + 1] << 8) |
                            (this[offset + 2] << 16)) +
                            (this[offset + 3] * 0x1000000)
                    }

                    Buffer.prototype.readUInt32BE = function readUInt32BE(offset, noAssert) {
                        offset = offset >>> 0
                        if (!noAssert) checkOffset(offset, 4, this.length)

                        return (this[offset] * 0x1000000) +
                            ((this[offset + 1] << 16) |
                                (this[offset + 2] << 8) |
                                this[offset + 3])
                    }

                    Buffer.prototype.readIntLE = function readIntLE(offset, byteLength, noAssert) {
                        offset = offset >>> 0
                        byteLength = byteLength >>> 0
                        if (!noAssert) checkOffset(offset, byteLength, this.length)

                        var val = this[offset]
                        var mul = 1
                        var i = 0
                        while (++i < byteLength && (mul *= 0x100)) {
                            val += this[offset + i] * mul
                        }
                        mul *= 0x80

                        if (val >= mul) val -= Math.pow(2, 8 * byteLength)

                        return val
                    }

                    Buffer.prototype.readIntBE = function readIntBE(offset, byteLength, noAssert) {
                        offset = offset >>> 0
                        byteLength = byteLength >>> 0
                        if (!noAssert) checkOffset(offset, byteLength, this.length)

                        var i = byteLength
                        var mul = 1
                        var val = this[offset + --i]
                        while (i > 0 && (mul *= 0x100)) {
                            val += this[offset + --i] * mul
                        }
                        mul *= 0x80

                        if (val >= mul) val -= Math.pow(2, 8 * byteLength)

                        return val
                    }

                    Buffer.prototype.readInt8 = function readInt8(offset, noAssert) {
                        offset = offset >>> 0
                        if (!noAssert) checkOffset(offset, 1, this.length)
                        if (!(this[offset] & 0x80)) return (this[offset])
                        return ((0xff - this[offset] + 1) * -1)
                    }

                    Buffer.prototype.readInt16LE = function readInt16LE(offset, noAssert) {
                        offset = offset >>> 0
                        if (!noAssert) checkOffset(offset, 2, this.length)
                        var val = this[offset] | (this[offset + 1] << 8)
                        return (val & 0x8000) ? val | 0xFFFF0000 : val
                    }

                    Buffer.prototype.readInt16BE = function readInt16BE(offset, noAssert) {
                        offset = offset >>> 0
                        if (!noAssert) checkOffset(offset, 2, this.length)
                        var val = this[offset + 1] | (this[offset] << 8)
                        return (val & 0x8000) ? val | 0xFFFF0000 : val
                    }

                    Buffer.prototype.readInt32LE = function readInt32LE(offset, noAssert) {
                        offset = offset >>> 0
                        if (!noAssert) checkOffset(offset, 4, this.length)

                        return (this[offset]) |
                            (this[offset + 1] << 8) |
                            (this[offset + 2] << 16) |
                            (this[offset + 3] << 24)
                    }

                    Buffer.prototype.readInt32BE = function readInt32BE(offset, noAssert) {
                        offset = offset >>> 0
                        if (!noAssert) checkOffset(offset, 4, this.length)

                        return (this[offset] << 24) |
                            (this[offset + 1] << 16) |
                            (this[offset + 2] << 8) |
                            (this[offset + 3])
                    }

                    Buffer.prototype.readFloatLE = function readFloatLE(offset, noAssert) {
                        offset = offset >>> 0
                        if (!noAssert) checkOffset(offset, 4, this.length)
                        return ieee754.read(this, offset, true, 23, 4)
                    }

                    Buffer.prototype.readFloatBE = function readFloatBE(offset, noAssert) {
                        offset = offset >>> 0
                        if (!noAssert) checkOffset(offset, 4, this.length)
                        return ieee754.read(this, offset, false, 23, 4)
                    }

                    Buffer.prototype.readDoubleLE = function readDoubleLE(offset, noAssert) {
                        offset = offset >>> 0
                        if (!noAssert) checkOffset(offset, 8, this.length)
                        return ieee754.read(this, offset, true, 52, 8)
                    }

                    Buffer.prototype.readDoubleBE = function readDoubleBE(offset, noAssert) {
                        offset = offset >>> 0
                        if (!noAssert) checkOffset(offset, 8, this.length)
                        return ieee754.read(this, offset, false, 52, 8)
                    }

                    function checkInt(buf, value, offset, ext, max, min) {
                        if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
                        if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
                        if (offset + ext > buf.length) throw new RangeError('Index out of range')
                    }

                    Buffer.prototype.writeUIntLE = function writeUIntLE(value, offset, byteLength, noAssert) {
                        value = +value
                        offset = offset >>> 0
                        byteLength = byteLength >>> 0
                        if (!noAssert) {
                            var maxBytes = Math.pow(2, 8 * byteLength) - 1
                            checkInt(this, value, offset, byteLength, maxBytes, 0)
                        }

                        var mul = 1
                        var i = 0
                        this[offset] = value & 0xFF
                        while (++i < byteLength && (mul *= 0x100)) {
                            this[offset + i] = (value / mul) & 0xFF
                        }

                        return offset + byteLength
                    }

                    Buffer.prototype.writeUIntBE = function writeUIntBE(value, offset, byteLength, noAssert) {
                        value = +value
                        offset = offset >>> 0
                        byteLength = byteLength >>> 0
                        if (!noAssert) {
                            var maxBytes = Math.pow(2, 8 * byteLength) - 1
                            checkInt(this, value, offset, byteLength, maxBytes, 0)
                        }

                        var i = byteLength - 1
                        var mul = 1
                        this[offset + i] = value & 0xFF
                        while (--i >= 0 && (mul *= 0x100)) {
                            this[offset + i] = (value / mul) & 0xFF
                        }

                        return offset + byteLength
                    }

                    Buffer.prototype.writeUInt8 = function writeUInt8(value, offset, noAssert) {
                        value = +value
                        offset = offset >>> 0
                        if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
                        this[offset] = (value & 0xff)
                        return offset + 1
                    }

                    Buffer.prototype.writeUInt16LE = function writeUInt16LE(value, offset, noAssert) {
                        value = +value
                        offset = offset >>> 0
                        if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
                        this[offset] = (value & 0xff)
                        this[offset + 1] = (value >>> 8)
                        return offset + 2
                    }

                    Buffer.prototype.writeUInt16BE = function writeUInt16BE(value, offset, noAssert) {
                        value = +value
                        offset = offset >>> 0
                        if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
                        this[offset] = (value >>> 8)
                        this[offset + 1] = (value & 0xff)
                        return offset + 2
                    }

                    Buffer.prototype.writeUInt32LE = function writeUInt32LE(value, offset, noAssert) {
                        value = +value
                        offset = offset >>> 0
                        if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
                        this[offset + 3] = (value >>> 24)
                        this[offset + 2] = (value >>> 16)
                        this[offset + 1] = (value >>> 8)
                        this[offset] = (value & 0xff)
                        return offset + 4
                    }

                    Buffer.prototype.writeUInt32BE = function writeUInt32BE(value, offset, noAssert) {
                        value = +value
                        offset = offset >>> 0
                        if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
                        this[offset] = (value >>> 24)
                        this[offset + 1] = (value >>> 16)
                        this[offset + 2] = (value >>> 8)
                        this[offset + 3] = (value & 0xff)
                        return offset + 4
                    }

                    Buffer.prototype.writeIntLE = function writeIntLE(value, offset, byteLength, noAssert) {
                        value = +value
                        offset = offset >>> 0
                        if (!noAssert) {
                            var limit = Math.pow(2, (8 * byteLength) - 1)

                            checkInt(this, value, offset, byteLength, limit - 1, -limit)
                        }

                        var i = 0
                        var mul = 1
                        var sub = 0
                        this[offset] = value & 0xFF
                        while (++i < byteLength && (mul *= 0x100)) {
                            if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
                                sub = 1
                            }
                            this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
                        }

                        return offset + byteLength
                    }

                    Buffer.prototype.writeIntBE = function writeIntBE(value, offset, byteLength, noAssert) {
                        value = +value
                        offset = offset >>> 0
                        if (!noAssert) {
                            var limit = Math.pow(2, (8 * byteLength) - 1)

                            checkInt(this, value, offset, byteLength, limit - 1, -limit)
                        }

                        var i = byteLength - 1
                        var mul = 1
                        var sub = 0
                        this[offset + i] = value & 0xFF
                        while (--i >= 0 && (mul *= 0x100)) {
                            if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
                                sub = 1
                            }
                            this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
                        }

                        return offset + byteLength
                    }

                    Buffer.prototype.writeInt8 = function writeInt8(value, offset, noAssert) {
                        value = +value
                        offset = offset >>> 0
                        if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
                        if (value < 0) value = 0xff + value + 1
                        this[offset] = (value & 0xff)
                        return offset + 1
                    }

                    Buffer.prototype.writeInt16LE = function writeInt16LE(value, offset, noAssert) {
                        value = +value
                        offset = offset >>> 0
                        if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
                        this[offset] = (value & 0xff)
                        this[offset + 1] = (value >>> 8)
                        return offset + 2
                    }

                    Buffer.prototype.writeInt16BE = function writeInt16BE(value, offset, noAssert) {
                        value = +value
                        offset = offset >>> 0
                        if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
                        this[offset] = (value >>> 8)
                        this[offset + 1] = (value & 0xff)
                        return offset + 2
                    }

                    Buffer.prototype.writeInt32LE = function writeInt32LE(value, offset, noAssert) {
                        value = +value
                        offset = offset >>> 0
                        if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
                        this[offset] = (value & 0xff)
                        this[offset + 1] = (value >>> 8)
                        this[offset + 2] = (value >>> 16)
                        this[offset + 3] = (value >>> 24)
                        return offset + 4
                    }

                    Buffer.prototype.writeInt32BE = function writeInt32BE(value, offset, noAssert) {
                        value = +value
                        offset = offset >>> 0
                        if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
                        if (value < 0) value = 0xffffffff + value + 1
                        this[offset] = (value >>> 24)
                        this[offset + 1] = (value >>> 16)
                        this[offset + 2] = (value >>> 8)
                        this[offset + 3] = (value & 0xff)
                        return offset + 4
                    }

                    function checkIEEE754(buf, value, offset, ext, max, min) {
                        if (offset + ext > buf.length) throw new RangeError('Index out of range')
                        if (offset < 0) throw new RangeError('Index out of range')
                    }

                    function writeFloat(buf, value, offset, littleEndian, noAssert) {
                        value = +value
                        offset = offset >>> 0
                        if (!noAssert) {
                            checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
                        }
                        ieee754.write(buf, value, offset, littleEndian, 23, 4)
                        return offset + 4
                    }

                    Buffer.prototype.writeFloatLE = function writeFloatLE(value, offset, noAssert) {
                        return writeFloat(this, value, offset, true, noAssert)
                    }

                    Buffer.prototype.writeFloatBE = function writeFloatBE(value, offset, noAssert) {
                        return writeFloat(this, value, offset, false, noAssert)
                    }

                    function writeDouble(buf, value, offset, littleEndian, noAssert) {
                        value = +value
                        offset = offset >>> 0
                        if (!noAssert) {
                            checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
                        }
                        ieee754.write(buf, value, offset, littleEndian, 52, 8)
                        return offset + 8
                    }

                    Buffer.prototype.writeDoubleLE = function writeDoubleLE(value, offset, noAssert) {
                        return writeDouble(this, value, offset, true, noAssert)
                    }

                    Buffer.prototype.writeDoubleBE = function writeDoubleBE(value, offset, noAssert) {
                        return writeDouble(this, value, offset, false, noAssert)
                    }

                    // copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
                    Buffer.prototype.copy = function copy(target, targetStart, start, end) {
                        if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
                        if (!start) start = 0
                        if (!end && end !== 0) end = this.length
                        if (targetStart >= target.length) targetStart = target.length
                        if (!targetStart) targetStart = 0
                        if (end > 0 && end < start) end = start

                        // Copy 0 bytes; we're done
                        if (end === start) return 0
                        if (target.length === 0 || this.length === 0) return 0

                        // Fatal error conditions
                        if (targetStart < 0) {
                            throw new RangeError('targetStart out of bounds')
                        }
                        if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
                        if (end < 0) throw new RangeError('sourceEnd out of bounds')

                        // Are we oob?
                        if (end > this.length) end = this.length
                        if (target.length - targetStart < end - start) {
                            end = target.length - targetStart + start
                        }

                        var len = end - start

                        if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
                            // Use built-in when available, missing from IE11
                            this.copyWithin(targetStart, start, end)
                        } else if (this === target && start < targetStart && targetStart < end) {
                            // descending copy from end
                            for (var i = len - 1; i >= 0; --i) {
                                target[i + targetStart] = this[i + start]
                            }
                        } else {
                            Uint8Array.prototype.set.call(
                                target,
                                this.subarray(start, end),
                                targetStart
                            )
                        }

                        return len
                    }

                    // Usage:
                    //    buffer.fill(number[, offset[, end]])
                    //    buffer.fill(buffer[, offset[, end]])
                    //    buffer.fill(string[, offset[, end]][, encoding])
                    Buffer.prototype.fill = function fill(val, start, end, encoding) {
                        // Handle string cases:
                        if (typeof val === 'string') {
                            if (typeof start === 'string') {
                                encoding = start
                                start = 0
                                end = this.length
                            } else if (typeof end === 'string') {
                                encoding = end
                                end = this.length
                            }
                            if (encoding !== undefined && typeof encoding !== 'string') {
                                throw new TypeError('encoding must be a string')
                            }
                            if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
                                throw new TypeError('Unknown encoding: ' + encoding)
                            }
                            if (val.length === 1) {
                                var code = val.charCodeAt(0)
                                if ((encoding === 'utf8' && code < 128) ||
                                    encoding === 'latin1') {
                                    // Fast path: If `val` fits into a single byte, use that numeric value.
                                    val = code
                                }
                            }
                        } else if (typeof val === 'number') {
                            val = val & 255
                        }

                        // Invalid ranges are not set to a default, so can range check early.
                        if (start < 0 || this.length < start || this.length < end) {
                            throw new RangeError('Out of range index')
                        }

                        if (end <= start) {
                            return this
                        }

                        start = start >>> 0
                        end = end === undefined ? this.length : end >>> 0

                        if (!val) val = 0

                        var i
                        if (typeof val === 'number') {
                            for (i = start; i < end; ++i) {
                                this[i] = val
                            }
                        } else {
                            var bytes = Buffer.isBuffer(val)
                                ? val
                                : Buffer.from(val, encoding)
                            var len = bytes.length
                            if (len === 0) {
                                throw new TypeError('The value "' + val +
                                    '" is invalid for argument "value"')
                            }
                            for (i = 0; i < end - start; ++i) {
                                this[i + start] = bytes[i % len]
                            }
                        }

                        return this
                    }

                    // HELPER FUNCTIONS
                    // ================

                    var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

                    function base64clean(str) {
                        // Node takes equal signs as end of the Base64 encoding
                        str = str.split('=')[0]
                        // Node strips out invalid characters like \n and \t from the string, base64-js does not
                        str = str.trim().replace(INVALID_BASE64_RE, '')
                        // Node converts strings with length < 2 to ''
                        if (str.length < 2) return ''
                        // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
                        while (str.length % 4 !== 0) {
                            str = str + '='
                        }
                        return str
                    }

                    function toHex(n) {
                        if (n < 16) return '0' + n.toString(16)
                        return n.toString(16)
                    }

                    function utf8ToBytes(string, units) {
                        units = units || Infinity
                        var codePoint
                        var length = string.length
                        var leadSurrogate = null
                        var bytes = []

                        for (var i = 0; i < length; ++i) {
                            codePoint = string.charCodeAt(i)

                            // is surrogate component
                            if (codePoint > 0xD7FF && codePoint < 0xE000) {
                                // last char was a lead
                                if (!leadSurrogate) {
                                    // no lead yet
                                    if (codePoint > 0xDBFF) {
                                        // unexpected trail
                                        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
                                        continue
                                    } else if (i + 1 === length) {
                                        // unpaired lead
                                        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
                                        continue
                                    }

                                    // valid lead
                                    leadSurrogate = codePoint

                                    continue
                                }

                                // 2 leads in a row
                                if (codePoint < 0xDC00) {
                                    if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
                                    leadSurrogate = codePoint
                                    continue
                                }

                                // valid surrogate pair
                                codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
                            } else if (leadSurrogate) {
                                // valid bmp char, but last char was a lead
                                if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
                            }

                            leadSurrogate = null

                            // encode utf8
                            if (codePoint < 0x80) {
                                if ((units -= 1) < 0) break
                                bytes.push(codePoint)
                            } else if (codePoint < 0x800) {
                                if ((units -= 2) < 0) break
                                bytes.push(
                                    codePoint >> 0x6 | 0xC0,
                                    codePoint & 0x3F | 0x80
                                )
                            } else if (codePoint < 0x10000) {
                                if ((units -= 3) < 0) break
                                bytes.push(
                                    codePoint >> 0xC | 0xE0,
                                    codePoint >> 0x6 & 0x3F | 0x80,
                                    codePoint & 0x3F | 0x80
                                )
                            } else if (codePoint < 0x110000) {
                                if ((units -= 4) < 0) break
                                bytes.push(
                                    codePoint >> 0x12 | 0xF0,
                                    codePoint >> 0xC & 0x3F | 0x80,
                                    codePoint >> 0x6 & 0x3F | 0x80,
                                    codePoint & 0x3F | 0x80
                                )
                            } else {
                                throw new Error('Invalid code point')
                            }
                        }

                        return bytes
                    }

                    function asciiToBytes(str) {
                        var byteArray = []
                        for (var i = 0; i < str.length; ++i) {
                            // Node's code seems to be doing this and not & 0x7F..
                            byteArray.push(str.charCodeAt(i) & 0xFF)
                        }
                        return byteArray
                    }

                    function utf16leToBytes(str, units) {
                        var c, hi, lo
                        var byteArray = []
                        for (var i = 0; i < str.length; ++i) {
                            if ((units -= 2) < 0) break

                            c = str.charCodeAt(i)
                            hi = c >> 8
                            lo = c % 256
                            byteArray.push(lo)
                            byteArray.push(hi)
                        }

                        return byteArray
                    }

                    function base64ToBytes(str) {
                        return base64.toByteArray(base64clean(str))
                    }

                    function blitBuffer(src, dst, offset, length) {
                        for (var i = 0; i < length; ++i) {
                            if ((i + offset >= dst.length) || (i >= src.length)) break
                            dst[i + offset] = src[i]
                        }
                        return i
                    }

                    // ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
                    // the `instanceof` check but they should be treated as of that type.
                    // See: https://github.com/feross/buffer/issues/166
                    function isInstance(obj, type) {
                        return obj instanceof type ||
                            (obj != null && obj.constructor != null && obj.constructor.name != null &&
                                obj.constructor.name === type.name)
                    }
                    function numberIsNaN(obj) {
                        // For IE11 support
                        return obj !== obj // eslint-disable-line no-self-compare
                    }

                }).call(this)
            }).call(this, require("buffer").Buffer)
        }, { "base64-js": 2, "buffer": 6, "ieee754": 7 }], 7: [function (require, module, exports) {
            /*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
            exports.read = function (buffer, offset, isLE, mLen, nBytes) {
                var e, m
                var eLen = (nBytes * 8) - mLen - 1
                var eMax = (1 << eLen) - 1
                var eBias = eMax >> 1
                var nBits = -7
                var i = isLE ? (nBytes - 1) : 0
                var d = isLE ? -1 : 1
                var s = buffer[offset + i]

                i += d

                e = s & ((1 << (-nBits)) - 1)
                s >>= (-nBits)
                nBits += eLen
                for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) { }

                m = e & ((1 << (-nBits)) - 1)
                e >>= (-nBits)
                nBits += mLen
                for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) { }

                if (e === 0) {
                    e = 1 - eBias
                } else if (e === eMax) {
                    return m ? NaN : ((s ? -1 : 1) * Infinity)
                } else {
                    m = m + Math.pow(2, mLen)
                    e = e - eBias
                }
                return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
            }

            exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
                var e, m, c
                var eLen = (nBytes * 8) - mLen - 1
                var eMax = (1 << eLen) - 1
                var eBias = eMax >> 1
                var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
                var i = isLE ? 0 : (nBytes - 1)
                var d = isLE ? 1 : -1
                var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

                value = Math.abs(value)

                if (isNaN(value) || value === Infinity) {
                    m = isNaN(value) ? 1 : 0
                    e = eMax
                } else {
                    e = Math.floor(Math.log(value) / Math.LN2)
                    if (value * (c = Math.pow(2, -e)) < 1) {
                        e--
                        c *= 2
                    }
                    if (e + eBias >= 1) {
                        value += rt / c
                    } else {
                        value += rt * Math.pow(2, 1 - eBias)
                    }
                    if (value * c >= 2) {
                        e++
                        c /= 2
                    }

                    if (e + eBias >= eMax) {
                        m = 0
                        e = eMax
                    } else if (e + eBias >= 1) {
                        m = ((value * c) - 1) * Math.pow(2, mLen)
                        e = e + eBias
                    } else {
                        m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
                        e = 0
                    }
                }

                for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) { }

                e = (e << mLen) | m
                eLen += mLen
                for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) { }

                buffer[offset + i - d] |= s * 128
            }

        }, {}], 8: [function (require, module, exports) {
            "use strict";
            Object.defineProperty(exports, "__esModule", { value: true });
            exports.utils = exports.decode = exports.encode = void 0;
            /**
             * RLP Encoding based on https://eth.wiki/en/fundamentals/rlp
             * This function takes in data, converts it to Uint8Array if not,
             * and adds a length for recursion.
             * @param input Will be converted to Uint8Array
             * @returns Uint8Array of encoded data
             **/
            function encode(input) {
                if (Array.isArray(input)) {
                    const output = [];
                    for (let i = 0; i < input.length; i++) {
                        output.push(encode(input[i]));
                    }
                    const buf = concatBytes(...output);
                    return concatBytes(encodeLength(buf.length, 192), buf);
                }
                const inputBuf = toBytes(input);
                if (inputBuf.length === 1 && inputBuf[0] < 128) {
                    return inputBuf;
                }
                return concatBytes(encodeLength(inputBuf.length, 128), inputBuf);
            }
            exports.encode = encode;
            /**
             * Slices a Uint8Array, throws if the slice goes out-of-bounds of the Uint8Array.
             * E.g. `safeSlice(hexToBytes('aa'), 1, 2)` will throw.
             * @param input
             * @param start
             * @param end
             */
            function safeSlice(input, start, end) {
                if (end > input.length) {
                    throw new Error('invalid RLP (safeSlice): end slice of Uint8Array out-of-bounds');
                }
                return input.slice(start, end);
            }
            /**
             * Parse integers. Check if there is no leading zeros
             * @param v The value to parse
             */
            function decodeLength(v) {
                if (v[0] === 0) {
                    throw new Error('invalid RLP: extra zeros');
                }
                return parseHexByte(bytesToHex(v));
            }
            function encodeLength(len, offset) {
                if (len < 56) {
                    return Uint8Array.from([len + offset]);
                }
                const hexLength = numberToHex(len);
                const lLength = hexLength.length / 2;
                const firstByte = numberToHex(offset + 55 + lLength);
                return Uint8Array.from(hexToBytes(firstByte + hexLength));
            }
            function decode(input, stream = false) {
                if (!input || input.length === 0) {
                    return Uint8Array.from([]);
                }
                const inputBytes = toBytes(input);
                const decoded = _decode(inputBytes);
                if (stream) {
                    return decoded;
                }
                if (decoded.remainder.length !== 0) {
                    throw new Error('invalid RLP: remainder must be zero');
                }
                return decoded.data;
            }
            exports.decode = decode;
            /** Decode an input with RLP */
            function _decode(input) {
                let length, llength, data, innerRemainder, d;
                const decoded = [];
                const firstByte = input[0];
                if (firstByte <= 0x7f) {
                    // a single byte whose value is in the [0x00, 0x7f] range, that byte is its own RLP encoding.
                    return {
                        data: input.slice(0, 1),
                        remainder: input.slice(1),
                    };
                }
                else if (firstByte <= 0xb7) {
                    // string is 0-55 bytes long. A single byte with value 0x80 plus the length of the string followed by the string
                    // The range of the first byte is [0x80, 0xb7]
                    length = firstByte - 0x7f;
                    // set 0x80 null to 0
                    if (firstByte === 0x80) {
                        data = Uint8Array.from([]);
                    }
                    else {
                        data = safeSlice(input, 1, length);
                    }
                    if (length === 2 && data[0] < 0x80) {
                        throw new Error('invalid RLP encoding: invalid prefix, single byte < 0x80 are not prefixed');
                    }
                    return {
                        data: data,
                        remainder: input.slice(length),
                    };
                }
                else if (firstByte <= 0xbf) {
                    // string is greater than 55 bytes long. A single byte with the value (0xb7 plus the length of the length),
                    // followed by the length, followed by the string
                    llength = firstByte - 0xb6;
                    if (input.length - 1 < llength) {
                        throw new Error('invalid RLP: not enough bytes for string length');
                    }
                    length = decodeLength(safeSlice(input, 1, llength));
                    if (length <= 55) {
                        throw new Error('invalid RLP: expected string length to be greater than 55');
                    }
                    data = safeSlice(input, llength, length + llength);
                    return {
                        data: data,
                        remainder: input.slice(length + llength),
                    };
                }
                else if (firstByte <= 0xf7) {
                    // a list between 0-55 bytes long
                    length = firstByte - 0xbf;
                    innerRemainder = safeSlice(input, 1, length);
                    while (innerRemainder.length) {
                        d = _decode(innerRemainder);
                        decoded.push(d.data);
                        innerRemainder = d.remainder;
                    }
                    return {
                        data: decoded,
                        remainder: input.slice(length),
                    };
                }
                else {
                    // a list over 55 bytes long
                    llength = firstByte - 0xf6;
                    length = decodeLength(safeSlice(input, 1, llength));
                    if (length < 56) {
                        throw new Error('invalid RLP: encoded list too short');
                    }
                    const totalLength = llength + length;
                    if (totalLength > input.length) {
                        throw new Error('invalid RLP: total length is larger than the data');
                    }
                    innerRemainder = safeSlice(input, llength, totalLength);
                    while (innerRemainder.length) {
                        d = _decode(innerRemainder);
                        decoded.push(d.data);
                        innerRemainder = d.remainder;
                    }
                    return {
                        data: decoded,
                        remainder: input.slice(totalLength),
                    };
                }
            }
            const cachedHexes = Array.from({ length: 256 }, (_v, i) => i.toString(16).padStart(2, '0'));
            function bytesToHex(uint8a) {
                // Pre-caching chars with `cachedHexes` speeds this up 6x
                let hex = '';
                for (let i = 0; i < uint8a.length; i++) {
                    hex += cachedHexes[uint8a[i]];
                }
                return hex;
            }
            function parseHexByte(hexByte) {
                const byte = Number.parseInt(hexByte, 16);
                if (Number.isNaN(byte))
                    throw new Error('Invalid byte sequence');
                return byte;
            }
            // Caching slows it down 2-3x
            function hexToBytes(hex) {
                if (typeof hex !== 'string') {
                    throw new TypeError('hexToBytes: expected string, got ' + typeof hex);
                }
                if (hex.length % 2)
                    throw new Error('hexToBytes: received invalid unpadded hex');
                const array = new Uint8Array(hex.length / 2);
                for (let i = 0; i < array.length; i++) {
                    const j = i * 2;
                    array[i] = parseHexByte(hex.slice(j, j + 2));
                }
                return array;
            }
            /** Concatenates two Uint8Arrays into one. */
            function concatBytes(...arrays) {
                if (arrays.length === 1)
                    return arrays[0];
                const length = arrays.reduce((a, arr) => a + arr.length, 0);
                const result = new Uint8Array(length);
                for (let i = 0, pad = 0; i < arrays.length; i++) {
                    const arr = arrays[i];
                    result.set(arr, pad);
                    pad += arr.length;
                }
                return result;
            }
            function utf8ToBytes(utf) {
                return new TextEncoder().encode(utf);
            }
            /** Transform an integer into its hexadecimal value */
            function numberToHex(integer) {
                if (integer < 0) {
                    throw new Error('Invalid integer as argument, must be unsigned!');
                }
                const hex = integer.toString(16);
                return hex.length % 2 ? `0${hex}` : hex;
            }
            /** Pad a string to be even */
            function padToEven(a) {
                return a.length % 2 ? `0${a}` : a;
            }
            /** Check if a string is prefixed by 0x */
            function isHexPrefixed(str) {
                return str.length >= 2 && str[0] === '0' && str[1] === 'x';
            }
            /** Removes 0x from a given String */
            function stripHexPrefix(str) {
                if (typeof str !== 'string') {
                    return str;
                }
                return isHexPrefixed(str) ? str.slice(2) : str;
            }
            /** Transform anything into a Uint8Array */
            function toBytes(v) {
                if (v instanceof Uint8Array) {
                    return v;
                }
                if (typeof v === 'string') {
                    if (isHexPrefixed(v)) {
                        return hexToBytes(padToEven(stripHexPrefix(v)));
                    }
                    return utf8ToBytes(v);
                }
                if (typeof v === 'number' || typeof v === 'bigint') {
                    if (!v) {
                        return Uint8Array.from([]);
                    }
                    return hexToBytes(numberToHex(v));
                }
                if (v === null || v === undefined) {
                    return Uint8Array.from([]);
                }
                throw new Error('toBytes: received unsupported type ' + typeof v);
            }
            exports.utils = {
                bytesToHex,
                concatBytes,
                hexToBytes,
                utf8ToBytes,
            };
            const RLP = { encode, decode };
            exports.default = RLP;

        }, {}]
    }, {}, [1])(1)
});
