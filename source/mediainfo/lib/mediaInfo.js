/*******************************************************************************
* Copyright 2019 Amazon.com, Inc. and its affiliates. All Rights Reserved.
*
* Licensed under the Amazon Software License (the "License").
* You may not use this file except in compliance with the License.
* A copy of the License is located at
*
*   http://aws.amazon.com/asl/
*
* or in the "license" file accompanying this file. This file is distributed
* on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
* express or implied. See the License for the specific language governing
* permissions and limitations under the License.
*
********************************************************************************/
'use strict';
const OS = require('os');
const FS = require('fs');
const URL = require('url');
const PATH = require('path');
const CHILD = require('child_process');

const { S3 } = require('aws-sdk');
const { Parser } = require('xml2js');

const CMD_OPTIONS = [
  '--Full',
  '--Output=XML',
];

/**
 *
 * @class MediaInfo
 *
 * @description run mediainfo command to gather file information
 *
 * @param {object} AWS S3 options for presign-ing S3 object [optional]
 *
 */
class MediaInfo {
  constructor(options) {
    this.$executable = null;
    this.$s3Options = null;

    /* parsed mediainfo */
    this.$url = null;
    this.$version = null;
    this.$container = {};
    this.$videoES = [];
    this.$audioES = [];
    this.$textES = [];
    this.$rawData = null;

    this.initialize(options);
  }

  /**
   *
   * @function initialize
   *
   * @param {string} file name
   */
  initialize(options) {
    if (options) { this.$s3Options = options; }

    this.$executable = (OS.platform() === 'darwin')
      ? 'mediainfo'
      : PATH.join(__dirname, '../bin', 'mediainfo');
  }

  get executable() { return this.$executable; }

  get s3Options() { return this.$s3Options; }

  get url() { return this.$url; }

  get version() { return this.$version; }

  get container() { return this.$container; }

  get videoES() { return this.$videoES; }

  get audioES() { return this.$audioES; }

  get textES() { return this.$textES; }

  get raw() { return this.$rawData; }

  get metadata() {
    const params = {};

    params.filename = this.url;
    params.container = this.container;
    if (this.videoES.length > 0) { params.video = this.videoES; }
    if (this.audioES.length > 0) { params.audio = this.audioES; }
    if (this.textES.length > 0) { params.text = this.textES; }

    return params;
  }

  set url(val) { this.$url = val; }

  set version(val) { this.$version = val; }

  set container(val) { this.$container = val; }

  set rawData(val) { this.$rawData = val; }

  toJSON() {
    return this.metadata;
  }

  /**
   *
   * @function compact
   *
   * @description remove any attribute that is null or undefined
   *
   * @param {object} attributes
   */
  static compact(attributes) {
    Object.keys(attributes).forEach((x) => {
      if (attributes[x] === null || attributes[x] === undefined) { delete attributes[x]; }
    });
    return attributes;
  }

  /**
   *
   * @static
   * @function findString
   *
   * @param {object} str
   */
  static findString(str) {
    if (!str) { return null; }

    if (typeof str === 'string') { return str; }

    if (Array.isArray(str)) { return str[0]; }

    return str[Object.keys(str).shift()];
  }

  /**
   *
   * @static
   * @function findNumber
   *
   * @param {object} num
   */
  static findNumber(num) {
    if (num === undefined || num === null) { return null; }

    if (typeof num === 'string' || typeof num === 'number') { return Number(num); }

    if (Array.isArray(num)) {
      const n = num.filter(x => x.match(/^-?\d+\.?\d*$/) !== null).shift();
      return (n) ? Number(n) : null;
    }

    return null;
  }


  /**
   *
   * @function parseGeneralAttributes
   *
   * @param {object} track object
   */
  static parseGeneralAttributes(track) {
    const attributes = {};

    attributes.format = MediaInfo.findString(track.Format);
    attributes.mimeType = track.Internet_media_type;
    attributes.fileSize = MediaInfo.findNumber(track.File_size);
    attributes.duration = MediaInfo.findNumber(track.Duration);
    attributes.totalBitrate = MediaInfo.findNumber(track.Overall_bit_rate);

    return MediaInfo.compact(attributes);
  }

  /**
   *
   * @function parseCommonAttributes
   *
   * @param {object} track object
   */
  static parseCommonAttributes(track) {
    const attributes = {};

    attributes.codec = MediaInfo.findString(track.Format);
    attributes.profile = MediaInfo.findString(track.Codec_profile);
    attributes.bitrate = MediaInfo.findNumber(track.Bit_rate);
    attributes.duration = MediaInfo.findNumber(track.Duration);
    attributes.frameCount = MediaInfo.findNumber(track.Frame_count);

    return attributes;
  }

  /**
   *
   * @function parseVideoAttributes
   *
   * @param {object} track object
   */
  static parseVideoAttributes(track) {
    const attributes = MediaInfo.parseCommonAttributes(track);

    /* video-specific attributes */
    attributes.width = MediaInfo.findNumber(track.Width);
    attributes.height = MediaInfo.findNumber(track.Height);
    attributes.framerate = MediaInfo.findNumber(track.Frame_rate);
    attributes.scanType = MediaInfo.findString(track.Scan_type);
    attributes.aspectRatio = track.Display_aspect_ratio.filter(x => x.match(/:/)).shift();
    attributes.bitDepth = MediaInfo.findNumber(track.Bit_depth);
    attributes.colorSpace = `${MediaInfo.findString(track.Color_space)} ${MediaInfo.findString(track.Chroma_subsampling)}`;

    return MediaInfo.compact(attributes);
  }

  /**
   *
   * @function parseAudioAttributes
   *
   * @param {object} track object
   */
  static parseAudioAttributes(track) {
    const attributes = MediaInfo.parseCommonAttributes(track);

    /* audio-specific attributes */
    attributes.bitrateMode = MediaInfo.findString(track.Bit_rate_mode);
    attributes.language = MediaInfo.findString(track.Language);
    attributes.channels = MediaInfo.findNumber(track.Channel_s_);
    attributes.samplingRate = MediaInfo.findNumber(track.Sampling_rate);
    attributes.samplePerFrame = MediaInfo.findNumber(track.Samples_per_frame);

    return MediaInfo.compact(attributes);
  }

  /**
   *
   * @function parseTextAttributes
   *
   * @param {object} track object
   */
  static parseTextAttributes(track) {
    const attributes = {};

    attributes.id = MediaInfo.findString(track.ID);
    attributes.format = MediaInfo.findString(track.Format);
    attributes.duration = MediaInfo.findNumber(track.Duration);
    attributes.frameCount = MediaInfo.findNumber(track.Count);
    attributes.captionServiceName = MediaInfo.findNumber(track.CaptionServiceName);

    return MediaInfo.compact(attributes);
  }

  /**
   * @function parseXml
   * @param {string} xmlstr
   */
  async parseXml(xmlstr) {
    return new Promise((resolve, reject) => {
      const xParser = new Parser({ explicitArray: false });
      xParser.parseString(xmlstr, (err, result) => {
        try {
          if (err) {
            throw err;
          }
          const { Mediainfo } = result;
          if (!Mediainfo) {
            throw new Error('Mediainfo element not found');
          }
          const { File } = Mediainfo;
          if (!File) {
            throw new Error('Mediainfo.File element not found');
          }
          const { track } = File;
          if (!track) {
            throw new Error('Mediainfo.File.track element not found');
          }
          resolve(result);
        } catch (e) {
          e.message = `MediaInfo.parseXml: ${this.file} - ${e.message}`;
          reject(e);
        }
      });
    });
  }

  /**
   * @static
   * @function escapeS3Character
   * @description escape S3 special character if and only if
   * it is 'http' or 'https' and NOT a signed URL
   */
  static escapeS3Character(path) {
    const url = URL.parse(path, true);
    const {
      query: { AWSAccessKeyId, Signature },
    } = url;
    /* if is signed url, nothing to do */
    if (AWSAccessKeyId && Signature) {
      return path;
    }
    /* replacing '+' with space character */
    url.pathname = encodeURI(decodeURI(url.pathname).replace(/\s/g, '+'));
    return URL.format(url);
  }

  /**
   * @static
   * @function isHttpProto
   * @param {string} path
   */
  static isHttpProto(path) {
    return (path.indexOf('https:') === 0 || path.indexOf('http:') === 0);
  }

  /**
   * @static
   * @function unescapeS3Character
   * @description convert '+' back to space character
   * @param {string} key - object key
   */
  static unescapeS3Character(key) {
    return key.replace(/\+/g, ' ');
  }

  /**
   * @function presign
   * @param {object|string} params
   */
  async presign(params) {
    return new Promise(async (resolve, reject) => {
      try {
        if (!params) {
          throw new Error('missing params');
        }
        if (typeof params === 'string') {
          if (MediaInfo.isHttpProto(params)) {
            resolve(MediaInfo.escapeS3Character(params));
            return;
          }
          /* local: check file existence */
          if (FS.existsSync(params)) {
            resolve(params);
            return;
          }
          throw new Error(`invalid file name, ${params}`);
        }
        /* must be S3 Object */
        const { Bucket, Key } = params;
        if (!Bucket || !Key) {
          throw new Error(`missing Bucket or Key params, ${JSON.stringify(params)}`);
        }
        const options = Object.assign({ apiVersion: '2006-03-01' }, this.s3Options);
        const s3 = new S3(options);
        await s3.headObject({ Bucket, Key }).promise();
        const signedUrl = s3.getSignedUrl('getObject', {
          Bucket,
          Key: MediaInfo.unescapeS3Character(Key),
          Expires: 60 * 60 * 2,
        });
        resolve(signedUrl);
      } catch (e) {
        const { code = '', statusCode = 500 } = e;
        e.message = `MediaInfo.presign: ${statusCode} ${code} ${JSON.stringify(params)} ${e.message}`;
        reject(e);
      }
    });
  }

  /**
   * @function command
   * @description run mediainfo command
   * @param {string} url
   */
  async command(url) {
    return new Promise((resolve, reject) => {
      const cmdline = `${this.executable} ${CMD_OPTIONS.join(' ')} '${url}'`;
      const child = CHILD.exec(cmdline, (err, stdout, stderr) => {
        try {
          if (err) {
            throw err;
          }
          if (stderr) {
            throw new Error(stderr);
          }
        } catch (e) {
          e.message = `MediaInfo.command: ${url} - ${e.message}`;
          reject(e);
          return;
        }
        resolve(stdout);
      });
      child.once('error', (e) => {
        e.message = `MediaInfo.command: ${url} - ${e.message}`;
        reject(e);
      });
    });
  }

  /**
   * @function analyze
   * @param {object|string} params
   */
  async analyze(params) {
    try {
      this.url = await this.presign(params);
      const xmlstr = await this.command(this.url);
      const parsed = await this.parseXml(xmlstr);
      const {
        Mediainfo: {
          $: { version },
          File: { track: tracks },
        },
      } = parsed;

      this.rawData = parsed;
      this.version = version;

      tracks.forEach((track) => {
        switch (track.$.type) {
          case 'General':
            this.container = MediaInfo.parseGeneralAttributes(track);
            break;
          case 'Video':
            this.videoES.push(MediaInfo.parseVideoAttributes(track));
            break;
          case 'Audio':
            this.audioES.push(MediaInfo.parseAudioAttributes(track));
            break;
          case 'Text':
            this.textES.push(MediaInfo.parseTextAttributes(track));
            break;
          default:
            console.log(`Unsupported: ${track.$.type} = ${JSON.stringify(track, null, 2)}`);
            break;
        }
      });
      return this.toJSON();
    } catch (e) {
      throw e;
    }
  }

  /**
   * @function run
   * @alias analyze
   * @param {object|string} s3object
   */
  async run(params) {
    const response = await this.analyze(params);
    return response;
  }
}

module.exports.MediaInfo = MediaInfo;
