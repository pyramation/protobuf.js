"use strict";

/**
 * Various utility functions.
 * @namespace
 */
var util = exports;

util.asPromise = require("@protobufjs/aspromise");
util.codegen   = require("@protobufjs/codegen");
util.fetch     = require("@protobufjs/fetch");
util.fs        = require("@protobufjs/fs");

/**
 * Converts an object's values to an array.
 * @param {Object.<string,*>} object Object to convert
 * @returns {Array.<*>} Converted array
 */
util.toArray = function toArray(object) {
    if (!object)
        return [];
    var names = Object.keys(object),
        length = names.length;
    var array = new Array(length);
    for (var i = 0; i < length; ++i)
        array[i] = object[names[i]];
    return array;
};

/**
 * Creates a type error.
 * @param {string} name Argument name
 * @param {string} [description="a string"] Expected argument descripotion
 * @returns {TypeError} Created type error
 * @private
 */
util._TypeError = function(name, description) {
    return TypeError(name + " must be " + (description || "a string"));
};

/**
 * Tests if the specified path is absolute.
 * @memberof util
 * @param {string} path Path to test
 * @returns {boolean} `true` if path is absolute
 */
function isAbsolutePath(path) {
    return /^(?:\/|[a-zA-Z0-9]+:)/.test(path);
}

util.isAbsolutePath = isAbsolutePath;

/**
 * Normalizes the specified path.
 * @memberof util
 * @param {string} path Path to normalize
 * @returns {string} Normalized path
 */
function normalizePath(path) {
    path = path.replace(/\\/g, "/")
               .replace(/\/{2,}/g, "/");
    var parts = path.split("/");
    var abs = isAbsolutePath(path);
    var prefix = "";
    if (abs)
        prefix = parts.shift() + "/";
    for (var i = 0; i < parts.length;) {
        if (parts[i] === "..") {
            if (i > 0)
                parts.splice(--i, 2);
            else if (abs)
                parts.splice(i, 1);
            else
                ++i;
        } else if (parts[i] === ".")
            parts.splice(i, 1);
        else
            ++i;
    }
    return prefix + parts.join("/");
}

util.normalizePath = normalizePath;

/**
 * Resolves the specified include path against the specified origin path.
 * @param {string} originPath Path that was used to fetch the origin file
 * @param {string} importPath Import path specified in the origin file
 * @param {boolean} [alreadyNormalized] `true` if both paths are already known to be normalized
 * @returns {string} Path to the imported file
 */
util.resolvePath = function resolvePath(originPath, importPath, alreadyNormalized) {
    if (!alreadyNormalized)
        importPath = normalizePath(importPath);
    if (isAbsolutePath(importPath))
        return importPath;
    if (!alreadyNormalized)
        originPath = normalizePath(originPath);
    originPath = originPath.replace(/(?:\/|^)[^/]+$/, "");
    return originPath.length ? normalizePath(originPath + "/" + importPath) : importPath;
};

/**
 * Merges the properties of the source object into the destination object.
 * @param {Object} dst Destination object
 * @param {Object} src Source object
 * @param {boolean} [ifNotSet=false] Merges only if the key is not already set
 * @returns {Object} Destination object
 */
util.merge = function merge(dst, src, ifNotSet) {
    if (src) {
        var keys = Object.keys(src);
        for (var i = 0; i < keys.length; ++i)
            if (dst[keys[i]] === undefined || !ifNotSet)
                dst[keys[i]] = src[keys[i]];
    }
    return dst;
};

/**
 * Returns a safe property accessor for the specified properly name.
 * @param {string} prop Property name
 * @returns {string} Safe accessor
 */
util.safeProp = function safeProp(prop) {
    return "[\"" + prop.replace(/\\/g, "\\\\").replace(/"/g, "\\\"") + "\"]";
};

/**
 * Converts a string to camel case notation.
 * @param {string} str String to convert
 * @returns {string} Converted string
 */
util.camelCase = function camelCase(str) {
    return str.substring(0,1)
         + str.substring(1)
               .replace(/_([a-z])(?=[a-z]|$)/g, function($0, $1) { return $1.toUpperCase(); });
};

/**
 * Converts a string to underscore notation.
 * @param {string} str String to convert
 * @returns {string} Converted string
 */
util.underScore = function underScore(str) {
    return str.substring(0,1)
         + str.substring(1)
               .replace(/([A-Z])(?=[a-z]|$)/g, function($0, $1) { return "_" + $1.toLowerCase(); });
};

/**
 * Creates a new buffer of whatever type supported by the environment.
 * @param {number} [size=0] Buffer size
 * @returns {Uint8Array} Buffer
 */
util.newBuffer = function newBuffer(size) {
    size = size || 0;
    return util.Buffer
        ? util.Buffer.allocUnsafe && util.Buffer.allocUnsafe(size) || new util.Buffer(size)
        : new (typeof Uint8Array !== "undefined" && Uint8Array || Array)(size);
};

var runtime = require("./util/runtime");

util.EventEmitter = require("@protobufjs/eventemitter");

// Merge in runtime utility
util.merge(util, runtime);

util._configure = function configure() {
    runtime.Long = util.Long;
};