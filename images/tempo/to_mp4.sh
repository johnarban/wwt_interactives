#!/bin/bash

# Directory containing PNG files
input_dir="."

# Output MP4 file
output_file="sorted_output.mp4"

# Loop through all PNG files in the directory
for file in "$input_dir"/*.png; do
    # Extract filename without extension
    filename=$(basename -- "$file")
    filename="${filename%.*}"
    
    # Annotate the image with the filename
    # Note: This step assumes you have a tool like ImageMagick installed and available in your PATH
    mogrify -gravity center -pointsize 18 -fill white -draw "text 0,0 '$filename'" "$file"
    
    # Process the annotated image with FFmpeg
    ffmpeg -i "$file" -vf "scale=-1:720" -c:v libx264 -preset ultrafast -crf 28 -pix_fmt yuv420p -update 1 "${filename}_annotated.png"
done

# Corrected approach: Iterate over each annotated PNG file and call FFmpeg for each one
ffmpeg -i *annot* -c:v libx264 -preset ultrafast -crf 28 -pix_fmt yuv420p -vf "scale=-1:720" sorted_out.mp4
