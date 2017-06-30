/*********************************************************************************************************************
 *  Copyright 2016 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           *
 *                                                                                                                    *
 *  Licensed under the Amazon Software License (the "License"). You may not use this file except in compliance        *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://aws.amazon.com/asl/                                                                                    *
 *                                                                                                                    *
 *  or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/

/**
 * @author Solution Builders
 */


'use strict';

const OS = require('os');
const FS = require('fs');
const PATH = require('path');
const CHILD = require('child_process');
const XML2JS = require('xml2js');
const BaseNotifier = require('./baseNotifier').BaseNotifier;


//
// class MediaInfoCommand
//
class MediaInfoCommand extends BaseNotifier {
  constructor(fileName) {
    super();

    this.$fileName = fileName || null;
    this.$cmdOptions = [ '--Full', '--Output=XML' ];

    // parsed paramteres
    this.$version = null;
    this.$container = {};
    this.$videoES = [];
    this.$audioES = [];
    this.$textES = [];
    this.$rawData = null;

    this.$xmlParserInstance = new XML2JS.Parser({ explicitArray: false });
  }

  get container() { return this.$container; }
  get videoES() { return this.$videoES; }
  get audioES() { return this.$audioES; }
  get textES() { return this.$textES; }
  get raw() { return this.$rawData; }

  get metadata() {
    var params = {};

    params.container = this.container;
    if (this.videoES.length > 0)
      params.video = this.videoES;
    if (this.audioES.length > 0)
      params.audio = this.audioES;
    if (this.textES.length > 0)
      params.text  = this.textES;
    return params;
  }

  //
  // parse xml result
  parseResult(xmlStr) {

    this.$xmlParserInstance.parseString(xmlStr, (err, result) => {
      if (err)
        return this.error(err);

      if (!result.Mediainfo || !result.Mediainfo.File || !result.Mediainfo.File.track || result.Mediainfo.File.track.length <= 0)
        return this.error(new Error(`mediainfo fails to find any track.`));

      this.$version = result.Mediainfo.$.version;

      result.Mediainfo.File.track.forEach((trk) => {
        switch (trk.$.type) {
        case 'General':
          parseGeneralTrack.call(this, trk);
          break;
        case 'Video':
          parseVideoTrack.call(this, trk);
          break;
        case 'Audio':
          parseAudioTrack.call(this, trk);
          break;
        case 'Text':
          parseTextTrack.call(this, trk);
          break;
        default:
          console.log(`${trk.$.type} Not Parsed!\n${JSON.stringify(trk, null, 2)}`);
          break;
        }
      });

      return this.notify('$parseResultCompleted', result);
    });

    function findNumber(num) {
      if (num === undefined || num === null)
        return null;

      if (typeof num === 'string' || typeof num === 'number')
        return Number(num);

      if (Array.isArray(num))
        return Number(num.filter((x) => { return x.match(/^-?\d+\.?\d*$/) !== null; })[0]) || null;

      return null;
    }

    function findString(str) {
      if (str === undefined || str === null)
        return null;

      if (typeof str === 'string')
        return str;

      if (Array.isArray(str))
        return str[0];

      return str[Object.keys(str)[0]];
    }

    function compact(data) {
      Object.keys(data).forEach((x) => { if (data[x] === null) delete data[x]; });
      return data;
    }

    function parseGeneralTrack(track) {
      return this.$container = {
        format: findString(track.Format),
        mimeType: track.Internet_media_type,
        fileSize: findNumber(track.File_size),
        duration: findNumber(track.Duration),
        totalBitrate: findNumber(track.Overall_bit_rate)
      };
    }

    function parseVideoTrack(track) {
      var info = {
        codec: findString(track.Format),
        width: findNumber(track.Width),
        height: findNumber(track.Height),
        profile: findString(track.Codec_profile),
        bitrate: findNumber(track.Bit_rate),
        duration: findNumber(track.Duration),
        framerate: findNumber(track.Frame_rate),
        frameCount: findNumber(track.Frame_count),
        aspectRatio: track.Frame_rate.filter((x) => { return x.match(/:/); })[0],
        scanType: findString(track.Scan_type),
      };
      return this.$videoES.push(compact(info));
    }

    function parseAudioTrack(track) {
      var info = {
        codec: findString(track.Format),
        profile: findString(track.Format_profile),
        bitrate: findNumber(track.Bit_rate),
        bitrateMode: findString(track.Bit_rate_mode),
        duration: findNumber(track.Duration),
        language: findString(track.Language),
        channels: findNumber(track.Channel_s_),
        frameCount: findNumber(track.Frame_count),
        samplingRate: findNumber(track.Sampling_rate),
        samplePerFrame: findNumber(track.Samples_per_frame)
      };
      return this.$audioES.push(compact(info));
    }

    function parseTextTrack(track) {
      var info = {
        id: findString(track.ID),
        format: findString(track.Format),
        duration: findNumber(track.Duration),
        frameCount: findNumber(track.Count),
        captionServiceName: findString(track.CaptionServiceName)
      };
      return this.$textES.push(compact(info));
    }
  }

  //
  // run
  //
  run(fileName) {
    if (fileName)
      this.$fileName = fileName;

    this.on('$parseResultCompleted', (result) => {
      // save off the raw data just in case anyone is interested...
      this.$rawData = result;
      return this.notify('$runCompleted', this);
    });

    var exec = PATH.join(process.cwd(), 'bin', 'mediainfo');
    //exec = 'mediainfo';
    var child = CHILD.exec(`${exec} ${this.$cmdOptions.join(' ')} '${this.$fileName}'`, (err, stdout, stderr) => {
      if (err)
        return this.error(err);

      if (stderr)
        return this.error(new Error(`${stderr}`));

      this.parseResult(stdout);
    });

    child.on('error', (err) => {
      return this.error(err);
    });
  }
}

module.exports.MediaInfoCommand = MediaInfoCommand;
