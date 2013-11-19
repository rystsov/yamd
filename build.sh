#!/bin/bash

rm -rf target
mkdir -p target/yamd
cp -r tasks target/yamd/
cp boilerplate.js target/yamd/
cp package.json target/yamd/
cp yamd.js target/yamd/
cp yamd.core.js target/yamd/


pushd target > /dev/null
tar czf yamd.tar.gz yamd
popd > /dev/null
