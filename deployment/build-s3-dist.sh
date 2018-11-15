#!/bin/bash
# Check to see if input has been provided:
if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Please provide the base source bucket name and version (subfolder) where the lambda code will eventually reside."
    echo "For example: ./build-s3-dist.sh solutions v1.0.0"
    exit 1
fi

[ -e dist ] && rm -r dist
echo "== mkdir -p dist"
mkdir -p dist
ls -lh
#TEMPALTE
echo "==cp video-on-demand-on-aws.yaml dist/video-on-demand-on-aws.template"
cp video-on-demand-on-aws.yaml dist/video-on-demand-on-aws.template
echo "==update CODEBUCKET in template with $1"
replace="s/CODEBUCKET/$1/g"
sed -i -e $replace dist/video-on-demand-on-aws.template
echo "==update CODEVERSION in template with $2"
replace="s/CODEVERSION/$2/g"
sed -i -e $replace dist/video-on-demand-on-aws.template
# remove tmp file for MACs
[ -e dist/video-on-demand-on-aws.template-e ] && rm -r dist/video-on-demand-on-aws.template-e

#SOURCE CODE
echo "== zip and copy lambda deployment pacages to dist/"
cd ../source/

echo "== chmod +x ./mediainfo/bin/mediainfo"
chmod +x ./mediainfo/bin/mediainfo

for folder in */ ; do
    cd "$folder"
		echo "==creating deployment package ${PWD##*/}"
    rm -rf node_modules/
    npm install --production
    zip -q -r9 ../../deployment/dist/${PWD##*/}.zip *
    cd ../
done
cd ../deployment/
echo "== s3 files in dist/:"
ls -lh dist/
