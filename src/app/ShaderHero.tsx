'use client';

import React, { useEffect, useRef } from 'react';

interface ShaderHeroProps {
  isDarkMode: boolean;
}

export default function ShaderHero({ isDarkMode }: ShaderHeroProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl') || (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);
    if (!gl) return;

    // Vertex Shader
    const vsSource = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    // Fragment Shader: Elegant fluid organic mesh waves
    const fsSource = `
      precision highp float;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform vec2 u_mouse;
      uniform float u_dark;

      // Simplex-like hash & noise
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                            0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                           -0.577350269189626,  // -1.0 + 2.0 * C.x
                            0.024390243902439); // 1.0 / 41.0
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m ;
        m = m*m ;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      void main() {
        vec2 st = gl_FragCoord.xy / u_resolution.xy;
        st.x *= u_resolution.x / u_resolution.y;

        vec2 mouse = u_mouse / u_resolution.xy;
        mouse.x *= u_resolution.x / u_resolution.y;

        float t = u_time * 0.18;

        // Fluid displacement
        float n1 = snoise(st * 1.8 + vec2(t * 0.3, t * 0.2));
        float n2 = snoise(st * 2.5 - vec2(t * 0.2, -t * 0.3) + vec2(n1 * 0.5));
        float n3 = snoise(st * 3.5 + vec2(n2 * 0.6, t * 0.1));

        // Interactive ripple from mouse
        float dist = distance(st, mouse);
        float mouseWave = sin(dist * 12.0 - u_time * 2.0) * exp(-dist * 3.5) * 0.25;

        float f = n1 * 0.5 + n2 * 0.3 + n3 * 0.2 + mouseWave;
        f = (f + 1.0) * 0.5; // normalise [0, 1]

        // Smooth color palettes
        // Dark theme: deep indigo/violet nebula + cyan highlights
        vec3 darkBg = vec3(0.045, 0.065, 0.10);
        vec3 darkAccent1 = vec3(0.18, 0.12, 0.35); // deep purple
        vec3 darkAccent2 = vec3(0.08, 0.35, 0.55); // vibrant cyan-blue
        vec3 darkHighlight = vec3(0.40, 0.65, 1.0);

        vec3 darkColor = mix(darkBg, darkAccent1, smoothstep(0.1, 0.6, f));
        darkColor = mix(darkColor, darkAccent2, smoothstep(0.4, 0.85, f));
        darkColor += darkHighlight * pow(f, 4.0) * 0.4;

        // Light theme: soft ambient pearl, indigo mist, ethereal sky
        vec3 lightBg = vec3(0.98, 0.985, 1.0);
        vec3 lightAccent1 = vec3(0.88, 0.92, 0.99); // soft cool blue
        vec3 lightAccent2 = vec3(0.93, 0.88, 0.97); // soft lavender
        vec3 lightHighlight = vec3(0.70, 0.82, 0.98);

        vec3 lightColor = mix(lightBg, lightAccent1, smoothstep(0.1, 0.6, f));
        lightColor = mix(lightColor, lightAccent2, smoothstep(0.4, 0.85, f));
        lightColor = mix(lightColor, lightHighlight, pow(f, 3.5) * 0.5);

        vec3 finalColor = mix(lightColor, darkColor, u_dark);

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    function createShader(glCtx: WebGLRenderingContext, type: number, source: string) {
      const shader = glCtx.createShader(type);
      if (!shader) return null;
      glCtx.shaderSource(shader, source);
      glCtx.compileShader(shader);
      if (!glCtx.getShaderParameter(shader, glCtx.COMPILE_STATUS)) {
        console.error('Shader compile error:', glCtx.getShaderInfoLog(shader));
        glCtx.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Quad geometry
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Uniforms
    const resLoc = gl.getUniformLocation(program, 'u_resolution');
    const timeLoc = gl.getUniformLocation(program, 'u_time');
    const mouseLoc = gl.getUniformLocation(program, 'u_mouse');
    const darkLoc = gl.getUniformLocation(program, 'u_dark');

    let mouseX = window.innerWidth * 0.5;
    let mouseY = window.innerHeight * 0.5;
    let currentMouseX = mouseX;
    let currentMouseY = mouseY;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = rect.height - (e.clientY - rect.top);
    };

    window.addEventListener('mousemove', handleMouseMove);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;
      if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
        gl.viewport(0, 0, canvas.width, canvas.height);
      }
    };

    resize();
    window.addEventListener('resize', resize);

    let animationFrameId: number;
    const startTime = performance.now();

    const render = () => {
      resize();
      const currentTime = (performance.now() - startTime) * 0.001;

      // Smooth mouse interpolation
      currentMouseX += (mouseX - currentMouseX) * 0.05;
      currentMouseY += (mouseY - currentMouseY) * 0.05;

      gl.uniform2f(resLoc, canvas.width, canvas.height);
      gl.uniform1f(timeLoc, currentTime);
      gl.uniform2f(mouseLoc, currentMouseX * (canvas.width / canvas.clientWidth), currentMouseY * (canvas.height / canvas.clientHeight));
      gl.uniform1f(darkLoc, isDarkMode ? 1.0 : 0.0);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
      if (program) gl.deleteProgram(program);
    };
  }, [isDarkMode]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-auto opacity-80 dark:opacity-90 transition-opacity duration-700"
    />
  );
}
