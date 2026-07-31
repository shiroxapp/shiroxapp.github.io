<script lang="ts">
/**
 * TEMP: background test, ported from a React/ogl component. Kept behind a
 * plain wrapper in +page.svelte for now — promote (restyle, wire to the
 * theme) or delete before this becomes permanent.
 *
 * ogl is a thin WebGL wrapper with no framework binding of its own, so the
 * render loop below is close to a 1:1 port; only the mount/teardown and
 * prop-reactivity are rewritten for Svelte's effect model. The context is
 * built once per visibility (via `untrack`, so a prop change alone doesn't
 * tear down and recreate the WebGL context); a second, lighter effect pushes
 * new prop values into the existing uniforms.
 */

import { Mesh, Program, Renderer, Triangle } from 'ogl';
import { untrack } from 'svelte';

type Origin = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

let {
	speed = 2.5,
	rayColor1 = '#ffffff',
	rayColor2 = '#8a8a8a',
	intensity = 2,
	spread = 2,
	origin = 'top-right',
	tilt = 0,
	saturation = 0.15,
	blend = 0.75,
	falloff = 2.0,
	opacity = 1.0,
	class: className = '',
}: {
	speed?: number;
	rayColor1?: string;
	rayColor2?: string;
	intensity?: number;
	spread?: number;
	origin?: Origin;
	tilt?: number;
	saturation?: number;
	blend?: number;
	falloff?: number;
	opacity?: number;
	class?: string;
} = $props();

const hexToRgb = (hex: string): [number, number, number] => {
	const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return m
		? [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255]
		: [1, 1, 1];
};

const originToFlip = (o: Origin): [number, number] => {
	switch (o) {
		case 'top-left':
			return [1, 0];
		case 'bottom-right':
			return [0, 1];
		case 'bottom-left':
			return [1, 1];
		default:
			return [0, 0];
	}
};

const vert = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const frag = `precision highp float;

uniform float iTime;
uniform vec2 iResolution;
uniform float iSpeed;
uniform vec3 iRayColor1;
uniform vec3 iRayColor2;
uniform float iIntensity;
uniform float iSpread;
uniform float iFlipX;
uniform float iFlipY;
uniform float iTilt;
uniform float iSaturation;
uniform float iBlend;
uniform float iFalloff;
uniform float iOpacity;

float rayStrength(vec2 raySource, vec2 rayRefDirection, vec2 coord, float seedA, float seedB, float speed, float refW) {
  vec2 sourceToCoord = coord - raySource;
  float cosAngle = dot(normalize(sourceToCoord), rayRefDirection);
  return clamp(
    (0.45 + 0.15 * sin(cosAngle * seedA + iTime * speed)) +
    (0.3 + 0.2 * cos(-cosAngle * seedB + iTime * speed)),
    0.0, 1.0) *
    clamp((refW - length(sourceToCoord)) / refW, 0.5, 1.0);
}

void main() {
  vec2 fragCoord = gl_FragCoord.xy;
  if (iFlipX > 0.5) fragCoord.x = iResolution.x - fragCoord.x;
  if (iFlipY > 0.5) fragCoord.y = iResolution.y - fragCoord.y;

  /* Every length below is measured in "unit" rather than in the viewport's own
     width and height, because those two swap roles between a desktop and a
     phone. The port placed the light 1.1 widths to the right and half a HEIGHT
     above the top, then divided the falloff by the height — so on a 0.46:1
     phone the vertical standoff grew while the horizontal one collapsed, and
     the distance field spanned only 0.50..1.58 units instead of the desktop's
     0.52..2.31. That left every pixel in the near field of the 1/distance^falloff
     curve: measured, 37% of a phone screen came out above 0.2 alpha against 11%
     of a desktop's, which is the wash that covered the whole screen.

     "unit" is the diagonal scaled to equal iResolution.y at REF_ASPECT, so the
     light's standoff now shrinks with the viewport and the field stays similar
     at any shape. At REF_ASPECT itself it IS iResolution.y, which keeps the
     tuning below (and the intensity/falloff pairs the page passes in) meaning
     exactly what it meant when they were chosen on a 16:10 screen. */
  const float REF_ASPECT = 1.6;
  float unit = length(iResolution) / sqrt(REF_ASPECT * REF_ASPECT + 1.0);
  float refW = REF_ASPECT * unit;

  vec2 coord = vec2(fragCoord.x, iResolution.y - fragCoord.y);
  vec2 rayPos = vec2(iResolution.x + 0.1 * refW, -0.5 * unit);

  float tiltRad = iTilt * 3.14159265 / 180.0;
  float cs = cos(tiltRad);
  float sn = sin(tiltRad);
  vec2 rel = coord - rayPos;
  vec2 tiltedCoord = vec2(rel.x * cs - rel.y * sn, rel.x * sn + rel.y * cs) + rayPos;

  float halfSpread = iSpread * 0.275;
  vec2 rayRefDir1 = normalize(vec2(cos(0.785398 + halfSpread), sin(0.785398 + halfSpread)));
  vec2 rayRefDir2 = normalize(vec2(cos(0.785398 - halfSpread), sin(0.785398 - halfSpread)));

  vec4 rays1 = vec4(iRayColor1, 1.0) * rayStrength(rayPos, rayRefDir1, tiltedCoord, 36.2214, 21.11349, iSpeed, refW);
  vec4 rays2 = vec4(iRayColor2, 1.0) * rayStrength(rayPos, rayRefDir2, tiltedCoord, 22.3991, 18.0234, iSpeed * 0.2, refW);

  vec4 color = rays1 * (1.0 - iBlend) * 0.9 + rays2 * iBlend * 0.9;

  float distanceToLight = length(fragCoord.xy - vec2(rayPos.x, iResolution.y - rayPos.y)) / unit;
  float brightness = iIntensity * 0.4 / pow(max(distanceToLight, 0.001), iFalloff);
  color.rgb *= brightness;

  float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
  color.rgb = mix(vec3(gray), color.rgb, iSaturation);

  color.a = max(color.r, max(color.g, color.b)) * iOpacity;
  gl_FragColor = color;
}`;

type Uniforms = Record<string, { value: number | number[] }>;

let container: HTMLDivElement | undefined = $state();
let visible = $state(false);
/** Flips true once the first frame has actually rendered, so the canvas
	    fades in over its content rather than popping in the instant the WebGL
	    context finishes setting up. */
let ready = $state(false);
let uniforms: Uniforms | null = null;

$effect(() => {
	if (!container) return;
	const observer = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting), {
		threshold: 0.1,
	});
	observer.observe(container);
	return () => observer.disconnect();
});

$effect(() => {
	if (!visible || !container) return;
	const target = container;

	return untrack(() => {
		const renderer = new Renderer({ dpr: Math.min(window.devicePixelRatio, 2), alpha: true });
		const gl = renderer.gl;
		gl.canvas.style.width = '100%';
		gl.canvas.style.height = '100%';

		while (target.firstChild) target.removeChild(target.firstChild);
		target.appendChild(gl.canvas);

		const [flipX, flipY] = originToFlip(origin);
		const localUniforms: Uniforms = {
			iTime: { value: 0 },
			iResolution: { value: [1, 1] },
			iSpeed: { value: speed },
			iRayColor1: { value: hexToRgb(rayColor1) },
			iRayColor2: { value: hexToRgb(rayColor2) },
			iIntensity: { value: intensity },
			iSpread: { value: spread },
			iFlipX: { value: flipX },
			iFlipY: { value: flipY },
			iTilt: { value: tilt },
			iSaturation: { value: saturation },
			iBlend: { value: blend },
			iFalloff: { value: falloff },
			iOpacity: { value: opacity },
		};
		uniforms = localUniforms;

		const geometry = new Triangle(gl);
		const program = new Program(gl, { vertex: vert, fragment: frag, uniforms: localUniforms });
		const mesh = new Mesh(gl, { geometry, program });

		let frame = 0;
		let stopped = false;

		const updateSize = () => {
			renderer.dpr = Math.min(window.devicePixelRatio, 2);
			const { clientWidth: w, clientHeight: h } = target;
			renderer.setSize(w, h);
			localUniforms.iResolution.value = [w * renderer.dpr, h * renderer.dpr];
		};

		const loop = (t: number) => {
			if (stopped) return;
			localUniforms.iTime.value = t * 0.001;
			renderer.render({ scene: mesh });
			ready = true;
			frame = requestAnimationFrame(loop);
		};

		window.addEventListener('resize', updateSize);
		updateSize();
		frame = requestAnimationFrame(loop);

		return () => {
			stopped = true;
			uniforms = null;
			ready = false;
			cancelAnimationFrame(frame);
			window.removeEventListener('resize', updateSize);
			const loseContext = gl.getExtension('WEBGL_lose_context');
			loseContext?.loseContext();
			gl.canvas.remove();
		};
	});
});

/** Pushes prop changes into the running context without tearing it down. */
$effect(() => {
	if (!uniforms) return;
	const [flipX, flipY] = originToFlip(origin);
	uniforms.iSpeed.value = speed;
	uniforms.iRayColor1.value = hexToRgb(rayColor1);
	uniforms.iRayColor2.value = hexToRgb(rayColor2);
	uniforms.iIntensity.value = intensity;
	uniforms.iSpread.value = spread;
	uniforms.iFlipX.value = flipX;
	uniforms.iFlipY.value = flipY;
	uniforms.iTilt.value = tilt;
	uniforms.iSaturation.value = saturation;
	uniforms.iBlend.value = blend;
	uniforms.iFalloff.value = falloff;
	uniforms.iOpacity.value = opacity;
});
</script>

<div
	bind:this={container}
	class="fade pointer-events-none relative h-full w-full overflow-hidden {className}"
	style="opacity: {ready ? 1 : 0};"
></div>

<style>
	.fade {
		transition: opacity 1.2s var(--ease, ease-out);
	}

	@media (prefers-reduced-motion: reduce) {
		.fade {
			transition: none;
		}
	}
</style>
