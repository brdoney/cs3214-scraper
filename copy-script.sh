#!/bin/bash

DIR=~/thesis/disdoc/source_documents/

echo "Copying files to $DIR"
mkdir -p $DIR
rsync -lrv --exclude-from='./exclude.txt' ./out/ $DIR

