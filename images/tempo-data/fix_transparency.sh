# loop over all the images and fix the transparency using 
# convert filename -channel alpha -threshold 1% filename

# files may be in subdirectories, so use find
# find . -name "*.png" -exec convert {} -channel alpha -threshold 1% {} \;

# use a for loop and print out the paths as we go
for file in $(find . -name "*.png") ; do
    echo $file
    convert $file -channel alpha -threshold 1% $file
done