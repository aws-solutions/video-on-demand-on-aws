'use strict'

// load dependencies
const Aws = require('aws-sdk');
const EventEmitter = require('events');
const PATH = require('path');

//
// class ResourceS3
//
class ResourceS3 extends EventEmitter {
  constructor(params) {
    super();

    this.$s3Instance = new Aws.S3({apiVersion: '2006-03-01'});
    this.$s3Bucket = params.s3Bucket;
    this.$s3ObjectKeys = Array.isArray(params.s3ObjectKey)
                      ? params.s3ObjectKey
                      : [ params.s3ObjectKey ];
    this.$preSignedUrlExpiredInDays = params.preSignedUrlExpiredInDays || 3;
  }

  notify(name, data, timeout) {
    var seconds = timeout || 0;
    var bindNotify = this.emit.bind(this, name, data);
    return setTimeout(() => { bindNotify(); }, seconds * 1000);
  }

  error(err) {
    return this.notify('error', err);
  }

  get s3() { return this.$s3Instance; }

  getSignedURL() {
    var signedList = [];

    // rescursively process s3Object
    this.on('$getSignedURL', (request) => {
      var item = request.pop();
      if (item === undefined)
        return this.notify('$getSignedURLCompleted', signedList);

      var params = {
        Bucket: this.$s3Bucket,
        Key: item,
        Expires: this.$preSignedUrlExpiredInDays * 24 * 60
      };

      this.s3.getSignedUrl('getObject', params, (err, data) => {
        if (err) {
          err.message += ` (getSignedUrl: ${item})`;
          return this.error(err);
        }

        signedList.push(data);
        return this.notify('$getSignedURL', request);
      });
    });

    var s3ObjectList = this.$s3ObjectKeys.slice(0); // make a copy of the array
    return this.notify('$getSignedURL', s3ObjectList);
  }

  setContentType() {
    var processedList = [];

    // rescursively process s3Object
    this.on('$setContentType', (request) => {
      var item = request.pop();
      if (item === undefined)
        return this.notify('$setContentTypeCompleted', processedList);

      var params = {
        Bucket: this.$s3Bucket,
        Key: item,
        CopySource: `${PATH.join(this.$s3Bucket, item)}`,
        ContentType: 'video/mp4',
        ContentDisposition: 'attachment',
        Metadata: {
          'provider': 'elemental'
        },
        MetadataDirective: 'REPLACE'
      };

      this.s3.copyObject(params, (err, data) => {
        if (err) {
          err.message += ` (copyObject: ${item})`;
          return this.error(err);
        }

        processedList.push(item);
        return this.notify('$setContentType', request);
      });
    });

    var s3ObjectList = this.$s3ObjectKeys.slice(0);
    return this.notify('$setContentType', s3ObjectList);
  }
}


//
// main function
//
exports.getURL = (event, context, cb) => {
  var s3 = new ResourceS3(event);

  s3.on('error', (err) => {
    console.log(`exports.getURL\nerr:\n${err.message}\nstack:\n${err.stack}`);
    return cb(err);
  });

  s3.on('$getSignedURLCompleted', (data) => {
    return cb(null, data);
  });

  s3.getSignedURL();
}

exports.setContentType = (event, context, cb) => {
  var s3 = new ResourceS3(event);

  s3.on('error', (err) => {
    console.log(`exports.setContentType\nerr:\n${err.message}\nstack:\n${err.stack}`);
    return cb(err);
  });

  s3.on('$setContentTypeCompleted', (data) => {
    return cb(null, data);
  });

  s3.setContentType();
}
