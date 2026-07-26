(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=document.getElementById(`canvas`),t=e.getContext(`webgl2`);if(!t)throw Error(`WebGL2 is not supported.`);var n=new Float32Array([{position:[0,.5],color:[1,0,0]},{position:[-.5,-.5],color:[0,1,0]},{position:[.5,-.5],color:[0,0,1]}].flatMap(e=>[...e.position,...e.color])),r=t.createBuffer();t.bindBuffer(t.ARRAY_BUFFER,r),t.bufferData(t.ARRAY_BUFFER,n,t.STATIC_DRAW);var i=`#version 300 es
precision mediump float;

in vec2 vertexPosition;
in vec3 vertexColor;

// This gets passed forward to the fragment shader
out vec3 color;

// Shared value used to correct aspect ratio
uniform float uAspect;

void main() {
  vec2 pos = vertexPosition;
  pos.x /= uAspect;

  color = vertexColor;

  // Since we are working in 2D z = 0
  // w = 1.0 is standard for orthographic rendering
  gl_Position = vec4(pos, 0.0, 1.0);
}`,a=`#version 300 es
precision mediump float;

// Matches the vertex shader's "out vec3 color"
in vec3 color;

// Output a final pixel color (RGBA)
out vec4 outputColor;

void main() {
  outputColor = vec4(color, 1.0);
}`;function o(e,t,n){let r=e.createShader(t);if(e.shaderSource(r,n),e.compileShader(r),!e.getShaderParameter(r,e.COMPILE_STATUS)){let t=e.getShaderInfoLog(r);throw e.deleteShader(r),Error(t)}return r}var s=o(t,t.VERTEX_SHADER,i),c=o(t,t.FRAGMENT_SHADER,a),l=t.createProgram();if(t.attachShader(l,s),t.attachShader(l,c),t.linkProgram(l),!t.getProgramParameter(l,t.LINK_STATUS))throw Error(t.getProgramInfoLog(l));var u=t.createVertexArray();t.bindVertexArray(u),t.bindBuffer(t.ARRAY_BUFFER,r);var d=5*Float32Array.BYTES_PER_ELEMENT,f=t.getAttribLocation(l,`vertexPosition`);if(f<0)throw Error(`Failed to get attrib location for vertexPosition`);t.enableVertexAttribArray(f),t.vertexAttribPointer(f,2,t.FLOAT,!1,d,0);var p=t.getAttribLocation(l,`vertexColor`);if(p<0)throw Error(`Failed to get attrib location for vertexColor`);t.enableVertexAttribArray(p),t.vertexAttribPointer(p,3,t.FLOAT,!1,d,2*Float32Array.BYTES_PER_ELEMENT),t.bindVertexArray(null),t.clearColor(.1,.1,.1,1);var m=t.getUniformLocation(l,`uAspect`);function h(){t.clear(t.COLOR_BUFFER_BIT),t.useProgram(l),t.uniform1f(m,e.width/e.height),t.bindVertexArray(u),t.drawArrays(t.TRIANGLES,0,3),t.bindVertexArray(null),requestAnimationFrame(h)}h();function g(){e.width=window.innerWidth,e.height=window.innerHeight,t.viewport(0,0,e.width,e.height)}window.addEventListener(`resize`,g),g();