# Smooth Image transition

This project showcases an interactive WebGL experience using @react-three/fiber and custom GLSL shaders. It creates a smooth image transition effect with displacement mapping controlled by scroll events.

## Demo
[Live here](https://smooth-image-transition.vercel.app/)

## Features

- Smooth transitions between two images.
Displacement mapping for image distortion.
Scroll-triggered animations using gsap.
Custom vertex and fragment shaders.
- Scroll the mouse wheel to see the transition

## Project Structure

Experience.js: Main React component handling the Three.js scene and shaders.
Shaders:
vertex.glsl: Vertex shader for geometry manipulation.
fragment3.glsl: Fragment shader implementing image mixing and distortion.

## Assets:

Two images (1.jpg and 2.jpg) for transition.
One displacement map (1.png) for distortion.

## Installation
Clone the repository:
```bash
npm install
```
Start the development server:
```bash
npm dev
```
## Usage

### Main Component: Experience.js

This component sets up the Three.js scene using @react-three/fiber, applies textures, and handles animations. Key features include:

**Textures:** Loaded with THREE.TextureLoader and applied to a ShaderMaterial.

**Uniforms**: Pass parameters to GLSL shaders for dynamic interactions.

**GSAP Animations**: Smoothly animate between textures and distortion levels on scroll.

### Shaders
**vertex.glsl:**
Basic vertex shader that passes UV coordinates to the fragment shader for further manipulation.

**fragment3.glsl:** Handles mixing between two textures based on the uMixValue uniform.
Displacement mapping for distortion controlled by the uDisplacementTexture.
Interaction
Scroll up or down to trigger image transitions and distortion effects. The direction of the scroll determines which image appears.

## File Structure
```.
├── public/
│   ├── 1.jpg                  # First image
│   ├── 2.jpg                  # Second image
│   ├── displacement/
│   │   └── 1.png              # Displacement texture
├── src/
│   ├── shaders/
│   │   ├── vertex.glsl        # Vertex shader
│   │   └── fragment3.glsl     # Fragment shader
│   ├── components/
│   │   └── Experience.js      # Main component
│   ├── index.js               # Entry point
├── package.json
└── README.md
```

## Dependencies
- React
- @react-three/fiber
- Three.js
- gsap

## How to Customize
Change Images: Replace 1.jpg and 2.jpg in the public/ directory with your own images.
Adjust Distortion: Modify uIntensity1, uIntensity2, uAngle1, and uAngle2 in the uniforms object.
Experiment with Shaders: Update the fragment3.glsl and vertex.glsl files to create unique effects.

## Known Issues
Ensure all images and displacement textures are correctly linked and accessible from the public/ directory.
Check compatibility of gsap animations with the Three.js rendering loop.

## License
This project is open-source and available under the MIT License.

# Acknowledgments
- [hover effect library](https://github.com/robin-dela/hover-effect)
- [Robin dela](https://github.com/robin-dela) - Author of the hover effect library. I drew some inspiration from his code
- Three.js
- React Three Fiber
- GSAP
