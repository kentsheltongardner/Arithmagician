// // Create given shader code, a canvas, and uniforms, apply a shader

// export default class Shader {
//     private _fragmentProgram: string
//     constructor(fragmentProgram: string) {
//         this._fragmentProgram = fragmentProgram
//     }
// }

// function compileShader(gl, type, source) {
//     const shader = gl.createShader(type);
//     gl.shaderSource(shader, source);
//     gl.compileShader(shader);

//     if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
//         console.error(`Shader compilation error (${type === gl.VERTEX_SHADER ? 'vertex' : 'fragment'} shader):`, gl.getShaderInfoLog(shader));
//         gl.deleteShader(shader);
//         return null;
//     }

//     return shader;
// }

// function linkProgram(gl, vertexShader, fragmentShader) {
//     const program = gl.createProgram();
//     gl.attachShader(program, vertexShader);
//     gl.attachShader(program, fragmentShader);
//     gl.linkProgram(program);

//     if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
//         console.error('Shader program linking error:', gl.getProgramInfoLog(program));
//         gl.deleteProgram(program);
//         return null;
//     }

//     return program;
// }

// function executeFragmentShader(program, canvas, uniforms = {}) {
//     const gl = canvas.getContext('webgl');

//     if (!gl) {
//         console.error('WebGL not supported, unable to initialize.');
//         return;
//     }

//     gl.useProgram(program);

//     // Set uniforms here if needed
//     // ...

//     // Set up buffers, attributes, and draw as before
//     // ...

//     // Example: Clear the canvas
//     gl.viewport(0, 0, canvas.width, canvas.height);
//     gl.clear(gl.COLOR_BUFFER_BIT);

//     // Draw the vertices
//     gl.drawArrays(gl.POINTS, 0, 1);
// }

// // Example usage
// const vertexShaderCode = `
//     void main(void) {
//         gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
//     }
// `;

// const fragmentShaderCode = `
//     precision mediump float;
//     uniform float u_time;
//     void main(void) {
//         gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0) * sin(u_time);
//     }
// `;

// const canvas = document.getElementById('myCanvas');

// const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderCode);
// const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderCode);

// if (vertexShader && fragmentShader) {
//     const program = linkProgram(gl, vertexShader, fragmentShader);
    
//     if (program) {
//         const uniforms = { u_time: Math.sin(Date.now() * 0.001) };
//         executeFragmentShader(program, canvas, uniforms);
//     }
// }













// function executeFragmentShader(fragmentShaderCode, canvas) {
//     // Get the WebGL context
//     const gl = canvas.getContext("webgl");

//     // Check if WebGL is available
//     if (!gl) {
//         console.error("WebGL not supported, unable to initialize.");
//         return;
//     }

//     // Create a vertex shader program
//     const vertexShaderCode = `
//         void main(void) {
//             gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
//         }
//     `;
//     const vertexShader = gl.createShader(gl.VERTEX_SHADER);
//     gl.shaderSource(vertexShader, vertexShaderCode);
//     gl.compileShader(vertexShader);

//     if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
//         console.error("Vertex shader compilation error:", gl.getShaderInfoLog(vertexShader));
//         return;
//     }

//     // Create a fragment shader program
//     const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
//     gl.shaderSource(fragmentShader, fragmentShaderCode);
//     gl.compileShader(fragmentShader);

//     if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
//         console.error("Fragment shader compilation error:", gl.getShaderInfoLog(fragmentShader));
//         return;
//     }

//     // Create a shader program
//     const shaderProgram = gl.createProgram();
//     gl.attachShader(shaderProgram, vertexShader);
//     gl.attachShader(shaderProgram, fragmentShader);
//     gl.linkProgram(shaderProgram);

//     if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
//         console.error("Shader program linking error:", gl.getProgramInfoLog(shaderProgram));
//         return;
//     }

//     gl.useProgram(shaderProgram);

//     // Create a buffer and set the vertices
//     const vertexBuffer = gl.createBuffer();
//     gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
//     const vertices = new Float32Array([0.0, 0.0, 0.0, 1.0]);
//     gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

//     // Get the attribute location and enable it
//     const position = gl.getAttribLocation(shaderProgram, "a_position");
//     gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
//     gl.enableVertexAttribArray(position);

//     // Set the canvas size and clear the canvas
//     gl.viewport(0, 0, canvas.width, canvas.height);
//     gl.clear(gl.COLOR_BUFFER_BIT);

//     // Draw the vertices
//     gl.drawArrays(gl.POINTS, 0, 1);
// }
// You can use this function by passing your fragment shader code and the canvas element:

// javascript
// Copy code
// const fragmentShaderCode = `
//     precision mediump float;

//     void main(void) {
//         gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); // Red color
//     }
// `;

// const canvas = document.getElementById("myCanvas");
// executeFragmentShader(fragmentShaderCode, canvas);








// function executeFragmentShader(fragmentShaderCode, canvas, uniforms = {}) {
//     // Get the WebGL context
//     const gl = canvas.getContext("webgl");

//     // ... (Same as before)

//     // Get the uniform locations and set their values
//     Object.keys(uniforms).forEach((uniformName) => {
//         const location = gl.getUniformLocation(shaderProgram, uniformName);
//         if (location !== null) {
//             const value = uniforms[uniformName];
//             if (typeof value === "number") {
//                 gl.uniform1f(location, value);
//             } else if (value instanceof Float32Array) {
//                 switch (value.length) {
//                     case 1:
//                         gl.uniform1fv(location, value);
//                         break;
//                     case 2:
//                         gl.uniform2fv(location, value);
//                         break;
//                     case 3:
//                         gl.uniform3fv(location, value);
//                         break;
//                     case 4:
//                         gl.uniform4fv(location, value);
//                         break;
//                     default:
//                         console.warn(`Unsupported uniform array length: ${value.length}`);
//                 }
//             }
//         }
//     });

//     // ... (Same as before)
// }

// // Example usage with a uniform value
// const fragmentShaderCode = `
//     precision mediump float;
//     uniform float u_time;

//     void main(void) {
//         gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0) * sin(u_time); // Red color modulated by sine of time
//     }
// `;

// const canvas = document.getElementById("myCanvas");
// const uniforms = { u_time: Math.sin(Date.now() * 0.001) }; // Example value, you can update it dynamically
// executeFragmentShader(fragmentShaderCode, canvas, uniforms);


// Compile a shader
// 


// class WebGLRenderer {
//     private gl:         WebGLRenderingContext;
//     private program:    WebGLProgram;
//     private uniforms:   { [key: string]: any } = {};
//     private textures:   WebGLTexture[] = [];
  
//     constructor(
//       fragmentShaderSource: string,
//       uniforms: { [key: string]: any },
//       textures: WebGLTexture[],
//       canvas: HTMLCanvasElement
//     ) {
//       this.gl = this.setupWebGL(canvas);
//       this.program = this.createShaderProgram(fragmentShaderSource);
//       this.uniforms = uniforms;
//       this.textures = textures;
  
//       this.bindTextures();
//       this.setUniforms();
//       this.render();
//     }
  
//     private setupWebGL(canvas: HTMLCanvasElement): WebGLRenderingContext {
//       const gl = canvas.getContext("webgl");
//       if (!gl) {
//         throw new Error("Unable to initialize WebGL. Your browser may not support it.");
//       }
//       return gl;
//     }
  
//     private createShaderProgram(fragmentShaderSource: string): WebGLProgram {
//       const vertexShaderSource = `
//         void main(void) {
//           gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
//         }
//       `;
  
//       const vertexShader = this.compileShader(vertexShaderSource, this.gl.VERTEX_SHADER);
//       const fragmentShader = this.compileShader(fragmentShaderSource, this.gl.FRAGMENT_SHADER);
  
//       const program = this.gl.createProgram();
//       if (!program) {
//         throw new Error("Unable to create shader program.");
//       }
  
//       this.gl.attachShader(program, vertexShader);
//       this.gl.attachShader(program, fragmentShader);
//       this.gl.linkProgram(program);
  
//       if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
//         throw new Error("Unable to initialize the shader program: " + this.gl.getProgramInfoLog(program));
//       }
  
//       return program;
//     }
  
//     private compileShader(source: string, type: number): WebGLShader {
//       const shader = this.gl.createShader(type);
//       if (!shader) {
//         throw new Error("Unable to create shader.");
//       }
  
//       this.gl.shaderSource(shader, source);
//       this.gl.compileShader(shader);
  
//       if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
//         throw new Error("An error occurred compiling the shaders: " + this.gl.getShaderInfoLog(shader));
//       }
  
//       return shader;
//     }
  
//     private bindTextures() {
//       this.textures.forEach((texture, index) => {
//         this.gl.activeTexture(this.gl.TEXTURE0 + index);
//         this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
//       });
//     }
  
//     private setUniforms() {
//       this.gl.useProgram(this.program);
  
//       for (const [name, value] of Object.entries(this.uniforms)) {
//         const uniformLocation = this.gl.getUniformLocation(this.program, name);
//         if (uniformLocation !== null) {
//           if (Array.isArray(value)) {
//             // If it's an array, assuming it's a vector (vec2, vec3, vec4)
//             this.gl["uniform" + value.length + "fv"](uniformLocation, value);
//           } else if (value instanceof WebGLTexture) {
//             // If it's a texture
//             this.gl.uniform1i(uniformLocation, this.textures.indexOf(value));
//           } else {
//             // Otherwise, assuming it's a single value
//             this.gl["uniform1f"](uniformLocation, value);
//           }
//         }
//       }
//     }
  
//     private render() {
//       this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);
//     }
//   }
  
//   // Example usage:
//   const canvas = document.getElementById("myCanvas") as HTMLCanvasElement;
//   const fragmentShaderSource = `
//     precision mediump float;
  
//     uniform vec4 color;
  
//     void main(void) {
//       gl_FragColor = color;
//     }
//   `;
//   const uniforms = { color: [1.0, 0.0, 0.0, 1.0] };
//   const textures: WebGLTexture[] = [];
  
//   const webGLRenderer = new WebGLRenderer(fragmentShaderSource, uniforms, textures, canvas);


