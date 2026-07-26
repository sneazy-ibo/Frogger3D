(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=typeof Float32Array<`u`?Float32Array:Array;Math.PI/180,180/Math.PI;function t(){var t=new e(16);return e!=Float32Array&&(t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[6]=0,t[7]=0,t[8]=0,t[9]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0),t[0]=1,t[5]=1,t[10]=1,t[15]=1,t}function n(e){return e[0]=1,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=1,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[10]=1,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,e}function r(e,t,n){var r=Math.sin(n),i=Math.cos(n),a=t[4],o=t[5],s=t[6],c=t[7],l=t[8],u=t[9],d=t[10],f=t[11];return t!==e&&(e[0]=t[0],e[1]=t[1],e[2]=t[2],e[3]=t[3],e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15]),e[4]=a*i+l*r,e[5]=o*i+u*r,e[6]=s*i+d*r,e[7]=c*i+f*r,e[8]=l*i-a*r,e[9]=u*i-o*r,e[10]=d*i-s*r,e[11]=f*i-c*r,e}function i(e,t,n){var r=Math.sin(n),i=Math.cos(n),a=t[0],o=t[1],s=t[2],c=t[3],l=t[8],u=t[9],d=t[10],f=t[11];return t!==e&&(e[4]=t[4],e[5]=t[5],e[6]=t[6],e[7]=t[7],e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15]),e[0]=a*i-l*r,e[1]=o*i-u*r,e[2]=s*i-d*r,e[3]=c*i-f*r,e[8]=a*r+l*i,e[9]=o*r+u*i,e[10]=s*r+d*i,e[11]=c*r+f*i,e}function a(e,t,n,r,i){var a=1/Math.tan(t/2);if(e[0]=a/n,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=a,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[11]=-1,e[12]=0,e[13]=0,e[15]=0,i!=null&&i!==1/0){var o=1/(r-i);e[10]=(i+r)*o,e[14]=2*i*r*o}else e[10]=-1,e[14]=-2*r;return e}var o=a;function s(e,t,r,i){var a,o,s,c,l,u,d,f,p,m,h=t[0],g=t[1],_=t[2],v=i[0],y=i[1],b=i[2],x=r[0],S=r[1],C=r[2];return Math.abs(h-x)<1e-6&&Math.abs(g-S)<1e-6&&Math.abs(_-C)<1e-6?n(e):(d=h-x,f=g-S,p=_-C,m=1/Math.sqrt(d*d+f*f+p*p),d*=m,f*=m,p*=m,a=y*p-b*f,o=b*d-v*p,s=v*f-y*d,m=Math.sqrt(a*a+o*o+s*s),m?(m=1/m,a*=m,o*=m,s*=m):(a=0,o=0,s=0),c=f*s-p*o,l=p*a-d*s,u=d*o-f*a,m=Math.sqrt(c*c+l*l+u*u),m?(m=1/m,c*=m,l*=m,u*=m):(c=0,l=0,u=0),e[0]=a,e[1]=c,e[2]=d,e[3]=0,e[4]=o,e[5]=l,e[6]=f,e[7]=0,e[8]=s,e[9]=u,e[10]=p,e[11]=0,e[12]=-(a*h+o*g+s*_),e[13]=-(c*h+l*g+u*_),e[14]=-(d*h+f*g+p*_),e[15]=1,e)}function c(e,t,n){let r=e.createShader(t);if(e.shaderSource(r,n),e.compileShader(r),!e.getShaderParameter(r,e.COMPILE_STATUS)){let t=e.getShaderInfoLog(r);throw e.deleteShader(r),Error(t)}return r}function l(e,t,n){let r=c(e,e.VERTEX_SHADER,t),i=c(e,e.FRAGMENT_SHADER,n),a=e.createProgram();if(e.attachShader(a,r),e.attachShader(a,i),e.linkProgram(a),!e.getProgramParameter(a,e.LINK_STATUS))throw Error(e.getProgramInfoLog(a));return e.deleteShader(r),e.deleteShader(i),a}function u(e,t,n){let r=e.getAttribLocation(t,n);if(r<0)throw Error(`Failed to get attrib location for ${n}`);return r}function d(e,t,n){let r=e.getUniformLocation(t,n);if(r===null)throw Error(`Failed to get uniform location for ${n}`);return r}var f=[-.5,-.5,.5,.5,-.5,.5,.5,.5,.5,-.5,-.5,.5,.5,.5,.5,-.5,.5,.5,.5,-.5,-.5,-.5,-.5,-.5,-.5,.5,-.5,.5,-.5,-.5,-.5,.5,-.5,.5,.5,-.5,-.5,-.5,-.5,-.5,-.5,.5,-.5,.5,.5,-.5,-.5,-.5,-.5,.5,.5,-.5,.5,-.5,.5,-.5,.5,.5,-.5,-.5,.5,.5,-.5,.5,-.5,.5,.5,.5,-.5,.5,.5,.5,-.5,.5,.5,.5,.5,.5,.5,.5,-.5,-.5,.5,.5,.5,.5,-.5,-.5,.5,-.5,-.5,-.5,-.5,.5,-.5,-.5,.5,-.5,.5,-.5,-.5,-.5,.5,-.5,.5,-.5,-.5,.5],p=[[1,.3,.3],[.3,1,.3],[.3,.3,1],[1,1,.3],[1,.3,1],[.3,1,1]];function m(){let e=[];for(let t=0;t<6;t++){let n=p[t];for(let r=0;r<6;r++){let i=(t*6+r)*3;e.push(f[i],f[i+1],f[i+2],n[0],n[1],n[2])}}return new Float32Array(e)}var h=`#version 300 es
precision mediump float;

in vec3 vertexPosition;
in vec3 vertexColor;

// This gets passed forward to the fragment shader
out vec3 color;

// Standard MVP trio:
// model = object -> world
// view = world -> camera,
// projection = camera -> clip space (perspective + aspect)
uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;

void main() {
  color = vertexColor;

  gl_Position = uProjection * uView * uModel * vec4(vertexPosition, 1.0);
}`,g=`#version 300 es
precision mediump float;

// Matches the vertex shader's "out vec3 color"
in vec3 color;

// Output a final pixel color (RGBA)
out vec4 outputColor;

void main() {
  outputColor = vec4(color, 1.0);
}`,_=document.getElementById(`canvas`),v=_.getContext(`webgl2`);if(!v)throw Error(`WebGL2 is not supported.`);var y=m(),b=v.createBuffer();v.bindBuffer(v.ARRAY_BUFFER,b),v.bufferData(v.ARRAY_BUFFER,y,v.STATIC_DRAW);var x=l(v,h,g),S=u(v,x,`vertexPosition`),C=u(v,x,`vertexColor`),w=d(v,x,`uModel`),T=d(v,x,`uView`),E=d(v,x,`uProjection`),D=v.createVertexArray();v.bindVertexArray(D),v.bindBuffer(v.ARRAY_BUFFER,b);var O=6*Float32Array.BYTES_PER_ELEMENT;v.enableVertexAttribArray(S),v.vertexAttribPointer(S,3,v.FLOAT,!1,O,0),v.enableVertexAttribArray(C),v.vertexAttribPointer(C,3,v.FLOAT,!1,O,3*Float32Array.BYTES_PER_ELEMENT),v.bindVertexArray(null),v.clearColor(.1,.1,.1,1),v.enable(v.DEPTH_TEST);var k=t(),A=t();s(A,[0,1.5,4],[0,0,0],[0,1,0]);var j=t();function M(){o(j,60*Math.PI/180,_.width/_.height,.1,100)}function N(e){let t=e*.001;v.clear(v.COLOR_BUFFER_BIT|v.DEPTH_BUFFER_BIT),n(k),i(k,k,t),r(k,k,t*.6),v.useProgram(x),v.uniformMatrix4fv(w,!1,k),v.uniformMatrix4fv(T,!1,A),v.uniformMatrix4fv(E,!1,j),v.bindVertexArray(D),v.drawArrays(v.TRIANGLES,0,36),v.bindVertexArray(null),requestAnimationFrame(N)}requestAnimationFrame(N);function P(){_.width=window.innerWidth,_.height=window.innerHeight,v.viewport(0,0,_.width,_.height),M()}window.addEventListener(`resize`,P),P();