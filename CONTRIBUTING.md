# Contributing

## Issues

Please use an appropriate template for your issue if possible.

For a bug report, it is important to clearly specify the expected behavior and the actual behavior. Also, provide steps to reproduce the bug and screenshots to illustrate the problem. Before opening a new issue, please check if it has already been reported to avoid duplicates.

For a feature request, it is important to describe the proposed feature in detail and explain why it is needed.

## Pull requests

If you are making a sizable contribution, please open an issue first to discuss it. If it's a small change or a bugfix, then it's okay to just create a pull request.

### Code

If you are making any changes to the code, please make sure that your new/modified code fits the general style of the codebase. Use `npm run eslint` to check for linting errors.

### Textures

This project uses the [PBR](https://en.wikipedia.org/wiki/Physically_based_rendering) approach to achieve realistic shading. This means that most objects that are rendered on the map need several textures from this set:

- albedo map (color without shading);
- normal map;
- roughness map;
- metalness map;
- color mask that describes which areas of an object get tinted (multiplied by a color);
- emission map.

Different kinds of objects require different sets of textures. Albedo map and normal map get separate RGB(A) textures while roughness, metalness, and color mask are packed in a single RGB texture in the respective order.

Use [edge padding](http://wiki.polycount.com/wiki/Edge_padding) for all textures. It doesn't need to be perfect; you can just make an approximation by hand.

If the albedo map has transparent areas, please make sure that meaningful RGB values are still present in such areas. This is required for correct mipmap generation. Most image editing programs optimize out the color values of transparent pixels by default, so you may need to disable this.