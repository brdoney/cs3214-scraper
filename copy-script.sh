#!/bin/bash

mkdir -p ~/Thesis/chroma-bot/source_documents/

echo "Copying files"
rsync -lrv --exclude-from='./exclude.txt' ./out/ ~/Thesis/chroma-bot/source_documents/

