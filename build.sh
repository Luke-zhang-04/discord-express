#!/bin/sh

rm -rf dist
mkdir dist

cp -rv src tsconfig.json dist

cd dist || exit 1

../node_modules/.bin/tsc -p ./tsconfig.json --outDir . --incremental false --tsBuildInfoFile null
../node_modules/.bin/tsc -p ./tsconfig.json --outDir ./cjs --module commonjs --incremental false --tsBuildInfoFile null

rm -rf tsconfig.json

cd .. || exit 1

# for f in dist/cjs/*.js; do
#     mv -- "$f" "${f%.js}.cjs"
# done

cp -v LICENSE package.json README.md dist
echo '{"private": false, "type": "commonjs"}' > dist/cjs/package.json

node scripts/generatePackageExports.mjs
